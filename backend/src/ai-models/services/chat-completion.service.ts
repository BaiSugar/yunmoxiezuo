import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { AiProvidersService } from './ai-providers.service';
import { AiModelsService } from './ai-models.service';
import { AdapterFactory } from '../adapters/adapter.factory';
import { KeyRotationService } from './key-rotation.service';
import { ApiKeysService } from './api-keys.service';
import { ChatCompletionDto } from '../dto';
import { RotationStrategy } from '../types';
import {
  IChatCompletionRequest,
  IChatCompletionResponse,
  ProviderStatus,
} from '../types';

/**
 * 聊天补全服务
 */
@Injectable()
export class ChatCompletionService {
  // 重试配置
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1秒
  private readonly RETRY_MULTIPLIER = 2;

  // 请求超时配置
  private readonly REQUEST_TIMEOUT = 300000; // 300秒（5分钟）- 支持长文本生成

  // 浏览器 User-Agent（模拟 Chrome 浏览器）
  private readonly BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  constructor(
    private readonly providersService: AiProvidersService,
    private readonly modelsService: AiModelsService,
    private readonly adapterFactory: AdapterFactory,
    private readonly keyRotationService: KeyRotationService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  /**
   * 执行聊天补全（使用 OpenAI SDK）
   */
  async complete(
    dto: ChatCompletionDto,
    userId?: number,
  ): Promise<IChatCompletionResponse> {
    console.log('[ChatCompletion] ========== 开始执行 complete ==========');
    console.log('[ChatCompletion] 步骤 1: 查找模型配置, modelId=', dto.model);
    // 1. 查找模型配置
    const model = await this.findModel(dto.model, userId);
    console.log('[ChatCompletion] 步骤 1 完成: 模型找到, providerId=', model.provider.id);

    console.log('[ChatCompletion] 步骤 2: 验证提供商状态, status=', model.provider.status);
    // 2. 验证提供商状态
    if (model.provider.status !== ProviderStatus.ACTIVE) {
      throw new BadRequestException('提供商未激活');
    }

    console.log('[ChatCompletion] 步骤 3: 获取适配器, source=', model.provider.source);
    // 3. 获取适配器
    const adapter = this.adapterFactory.getAdapter(model.provider.source);

    console.log('[ChatCompletion] 步骤 4: 转换请求参数');
    // 4. 转换请求参数
    const request: IChatCompletionRequest = {
      ...dto,
      model: model.modelId,
    };

    const adaptedRequest = adapter.adaptRequest(request);
    console.log('[ChatCompletion] 步骤 4 完成: 请求参数已转换');

    console.log('[ChatCompletion] 步骤 5: 选择 API Key, providerId=', model.provider.id);
    // 5. 选择 API Key（优先使用模型的apiKey，否则使用轮询策略）
    let apiKey: string;
    if (model.apiKey) {
      // 使用模型自己的apiKey（已解密）
      apiKey = model.getDecryptedApiKey() || await this.selectApiKey(model.provider.id);
      console.log('[ChatCompletion] 使用模型的 API Key');
    } else {
      // 使用提供商的apiKey（轮询策略）
      apiKey = await this.selectApiKey(model.provider.id);
      console.log('[ChatCompletion] 使用提供商的 API Key（轮询）');
    }
    console.log('[ChatCompletion] 步骤 5 完成: API Key 已选择');

    // 优先使用模型的baseUrl，否则使用提供商的baseUrl
    const baseUrl = model.baseUrl || model.provider.config.baseUrl;
    console.log('[ChatCompletion] 步骤 6: 使用 OpenAI SDK 调用 API，baseUrl=', baseUrl);
    // 6. 使用 OpenAI SDK 调用 API
    const startTime = Date.now();
    try {
      // 创建 OpenAI 客户端
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl,
        timeout: this.REQUEST_TIMEOUT,
        maxRetries: this.MAX_RETRIES,
        defaultHeaders: {
          'User-Agent': this.BROWSER_USER_AGENT,
          ...(model.provider.config.headers || {}),
        },
      });

      console.log('[ChatCompletion] 发送请求参数:');
      console.log(`  - model: ${adaptedRequest.model}`);
      console.log(`  - messages: [${adaptedRequest.messages?.length || 0} 条消息]`);
      console.log(`  - temperature: ${adaptedRequest.temperature}`);
      console.log(`  - stream: ${adaptedRequest.stream}`);

      const response = await client.chat.completions.create(adaptedRequest as any);
      console.log('[ChatCompletion] 步骤 6 完成: API 调用成功');

      // 记录成功使用
      await this.recordKeyUsage(apiKey, true);

      console.log('[ChatCompletion] 步骤 7: 转换响应');
      // 7. 转换响应
      const result = adapter.adaptResponse(response);
      console.log('[ChatCompletion] ========== complete 完成 ==========');
      return result;
    } catch (error) {
      console.log('[ChatCompletion] ❌ API 调用失败:', error.message);
      // 记录失败使用
      await this.recordKeyUsage(apiKey, false, error.message);
      
      throw new InternalServerErrorException(
        `AI 服务调用失败: ${error.message}`,
      );
    }
  }

  /**
   * 流式聊天补全
   */
  async *completeStream(
    dto: ChatCompletionDto,
    userId?: number,
  ): AsyncGenerator<any> {
    // 1. 查找模型配置
    const model = await this.findModel(dto.model, userId);

    // 2. 验证提供商状态
    if (model.provider.status !== ProviderStatus.ACTIVE) {
      throw new BadRequestException('提供商未激活');
    }

    // 3. 验证模型是否支持流式
    if (!model.supportsStreaming) {
      throw new BadRequestException('该模型不支持流式输出');
    }

    // 4. 获取适配器
    const adapter = this.adapterFactory.getAdapter(model.provider.source);

    // 5. 转换请求参数
    const request: IChatCompletionRequest = {
      ...dto,
      model: model.modelId,
      stream: true,
    };

    const adaptedRequest = adapter.adaptRequest(request);

    // 6. 选择 API Key（优先使用模型的apiKey，否则使用轮询策略）
    let apiKey: string;
    if (model.apiKey) {
      // 使用模型自己的apiKey（已解密）
      apiKey = model.getDecryptedApiKey() || await this.selectApiKey(model.provider.id);
    } else {
      // 使用提供商的apiKey（轮询策略）
      apiKey = await this.selectApiKey(model.provider.id);
    }

    // 优先使用模型的baseUrl，否则使用提供商的baseUrl
    const baseUrl = model.baseUrl || model.provider.config.baseUrl;

    // 7. 使用 OpenAI SDK 调用流式 API
    try {
      // 创建 OpenAI 客户端
      const client = new OpenAI({
        apiKey: apiKey,
        baseURL: baseUrl,
        timeout: this.REQUEST_TIMEOUT,
        maxRetries: this.MAX_RETRIES,
        defaultHeaders: {
          'User-Agent': this.BROWSER_USER_AGENT,
          ...(model.provider.config.headers || {}),
        },
      });

      console.log('[ChatCompletion] 开始流式调用');
      console.log(`  - model: ${adaptedRequest.model}`);
      console.log(`  - messages: [${adaptedRequest.messages?.length || 0} 条消息]`);

      const stream = await client.chat.completions.create({
        ...adaptedRequest,
        stream: true,
      } as any);

      // 记录成功使用
      await this.recordKeyUsage(apiKey, true);

      // 8. 转换并返回流式响应
      for await (const chunk of stream as any) {
        const adaptedChunk = adapter.adaptStreamChunk(chunk);
        if (adaptedChunk) {
          yield adaptedChunk;
        }
      }
      
      console.log('[ChatCompletion] 流式调用完成');
    } catch (error) {
      // 如果是用户取消或连接中断（canceled、ECONNRESET等），不抛出错误，正常结束
      const errorMsg = error.message || '';
      const errorCode = error.code || '';
      
      const isCanceled = 
        errorMsg === 'canceled' || 
        errorMsg.includes('canceled') ||
        errorCode === 'ERR_CANCELED' ||
        errorCode === 'ECONNRESET' ||
        errorMsg.includes('aborted');
      
      if (isCanceled) {
        console.log('流式生成已中断（用户取消或连接断开）');
        return; // 正常退出，不抛出异常
      }

      // 其他错误才记录失败使用并抛出
      await this.recordKeyUsage(apiKey, false, error.message);
      
      throw new InternalServerErrorException(
        `AI 流式服务调用失败: ${error.message}`,
      );
    }
  }

  /**
   * 查找模型
   */
  private async findModel(modelIdentifier: string, userId?: number) {
    console.log('[findModel] 开始查找模型, identifier=', modelIdentifier);
    let model;

    // 尝试按ID查找
    if (/^\d+$/.test(modelIdentifier)) {
      console.log('[findModel] 按数字ID查找');
      model = await this.modelsService.findOne(
        parseInt(modelIdentifier),
        userId,
      );
    } else {
      console.log('[findModel] 按模型标识符查找');
      model = await this.modelsService.findByModelId(modelIdentifier, userId);
    }

    console.log('[findModel] 查找结果: model=', !!model, ', provider=', !!model?.provider);
    
    if (!model || !model.provider) {
      console.log('[findModel] ❌ 模型不存在');
      throw new BadRequestException('模型不存在');
    }

    console.log('[findModel] ✅ 模型找到');
    return model;
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(userId?: number) {
    return await this.modelsService.findActive(userId);
  }

  /**
   * 获取默认模型
   */
  async getDefaultModel(userId?: number) {
    const model = await this.modelsService.findDefault(userId);
    if (!model) {
      throw new BadRequestException('未设置默认模型');
    }
    return model;
  }

  /**
   * 选择 API Key（使用轮询策略）
   */
  private async selectApiKey(providerId: number): Promise<string> {
    console.log(`[selectApiKey] 开始选择 API Key, providerId=${providerId}`);
    // 检查提供商是否配置了多个 Keys
    const keysCount = await this.apiKeysService.countActive(providerId);
    console.log(`[selectApiKey] 可用 Keys 数量=${keysCount}`);

    if (keysCount === 0) {
      console.log(`[selectApiKey] 没有配置多个Keys，使用提供商自身的 API Key`);
      // 没有配置 Keys，使用提供商自身的 apiKey
      // 使用findOneInternal获取完整实体，保留实体方法
      const provider = await this.providersService.findOneInternal(providerId);
      console.log(`[selectApiKey] Provider 获取成功, name=${provider.name}`);
      
      // 使用解密后的API Key（数据库中是加密存储的）
      const decryptedKey = provider.getDecryptedApiKey();
      console.log(`[selectApiKey] 解密结果: 是否成功=${!!decryptedKey}, 长度=${decryptedKey?.length || 0}`);
      console.log(`[selectApiKey] 解密后的完整 Key: ${decryptedKey}`);
      if (!decryptedKey) {
        console.log(`[selectApiKey] ❌ API Key 解密失败或为空`);
        throw new BadRequestException(`提供商 ${providerId} 没有配置 API Key`);
      }
      console.log(`[selectApiKey] ✅ 使用 Provider API Key`);
      return decryptedKey;
    }

    console.log(`[selectApiKey] 使用轮询策略选择 Key`);
    // 使用轮询策略选择 Key
    const selection = await this.keyRotationService.selectKey(
      providerId,
      RotationStrategy.WEIGHTED, // 使用加权策略
    );
    console.log(`[selectApiKey] Key 选择完成, keyId=${selection.key.id}`);

    // 使用解密后的API Key（数据库中是加密存储的）
    const decryptedKey = selection.key.getDecryptedKey();
    console.log(`[selectApiKey] 解密结果: 是否成功=${!!decryptedKey}, 长度=${decryptedKey?.length || 0}`);
    console.log(`[selectApiKey] 解密后的完整 Key: ${decryptedKey}`);
    if (!decryptedKey) {
      console.log(`[selectApiKey] ❌ API Key ${selection.key.id} 解密失败`);
      throw new BadRequestException(`API Key ${selection.key.id} 解密失败`);
    }
    console.log(`[selectApiKey] ✅ 使用 API Key ${selection.key.id}`);
    return decryptedKey;
  }

  /**
   * 记录 Key 使用情况
   */
  private async recordKeyUsage(
    apiKey: string,
    success: boolean,
    errorMessage?: string,
  ): Promise<void> {
    // 查找对应的 Key ID
    // 注意：这里需要通过 key 值反查 ID，实际生产环境可能需要优化
    const keys = await this.apiKeysService.findAll();
    const keyEntity = keys.find(k => k.key === apiKey);

    if (!keyEntity) {
      // 如果找不到，说明是提供商自身的 key，不记录
      return;
    }

    await this.keyRotationService.recordUsage({
      keyId: keyEntity.id,
      success,
      errorMessage,
      timestamp: new Date(),
    });
  }
}
