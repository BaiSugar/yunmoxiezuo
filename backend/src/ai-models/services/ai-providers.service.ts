import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { AiProvider } from '../entities';
import { CreateProviderDto, UpdateProviderDto } from '../dto';
import { ProviderStatus, ChatCompletionSource } from '../types';
import axios, { AxiosError } from 'axios';

/**
 * AI 提供商服务
 */
@Injectable()
export class AiProvidersService {
  constructor(
    @InjectRepository(AiProvider)
    private readonly providerRepository: Repository<AiProvider>,
  ) {}

  /**
   * 创建提供商
   */
  async create(
    createDto: CreateProviderDto,
    userId?: number,
  ): Promise<any> {
    // 检查名称是否已存在
    const existing = await this.providerRepository.findOne({
      where: { name: createDto.name },
    });

    if (existing) {
      throw new ConflictException('提供商名称已存在');
    }

    // 如果设置为默认，取消其他默认提供商
    if (createDto.isDefault) {
      await this.clearDefaultProvider(userId);
    }

    const provider = this.providerRepository.create({
      ...createDto,
      userId,
    });

    const saved = await this.providerRepository.save(provider);
    
    // 返回脱敏后的数据
    return saved.toSafeObject();
  }

  /**
   * 查询所有提供商
   */
  async findAll(userId?: number): Promise<any[]> {
    const where = userId
      ? [{ userId }, { userId: IsNull() }]
      : { userId: IsNull() };

    const providers = await this.providerRepository.find({
      where,
      relations: ['models'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
    
    // 返回脱敏后的数据
    return providers.map(p => p.toSafeObject());
  }

  /**
   * 根据ID查询提供商
   */
  async findOne(id: number, userId?: number): Promise<any> {
    const provider = await this.findOneInternal(id, userId);
    // 返回脱敏后的数据
    return provider.toSafeObject();
  }

  /**
   * 根据名称查询提供商
   */
  async findByName(name: string, userId?: number): Promise<any> {
    const where: any = { name };
    if (userId) {
      where.userId = userId;
    }

    const provider = await this.providerRepository.findOne({
      where,
      relations: ['models'],
    });

    if (!provider) {
      throw new NotFoundException('提供商不存在');
    }

    // 返回脱敏后的数据
    return provider.toSafeObject();
  }

  /**
   * 获取默认提供商
   */
  async findDefault(userId?: number): Promise<any> {
    const where = userId
      ? [
          { isDefault: true, userId },
          { isDefault: true, userId: IsNull() },
        ]
      : { isDefault: true, userId: IsNull() };

    const provider = await this.providerRepository.findOne({
      where,
      relations: ['models'],
    });
    
    // 返回脱敏后的数据
    return provider ? provider.toSafeObject() : null;
  }

  /**
   * 获取活跃的提供商列表
   */
  async findActive(userId?: number): Promise<any[]> {
    const where = userId
      ? [
          { status: ProviderStatus.ACTIVE, userId },
          { status: ProviderStatus.ACTIVE, userId: IsNull() },
        ]
      : { status: ProviderStatus.ACTIVE, userId: IsNull() };

    const providers = await this.providerRepository.find({
      where,
      relations: ['models'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
    
    // 返回脱敏后的数据
    return providers.map(p => p.toSafeObject());
  }

  /**
   * 提供商实体查询（包含敏感信息，供内部使用）
   */
  async getProviderEntity(id: number, userId?: number): Promise<AiProvider> {
    return await this.findOneInternal(id, userId);
  }

  /**
   * 内部方法：查询单个提供商（返回完整实体）
   * 用于内部服务调用，保留实体方法（如getDecryptedApiKey）
   */
  async findOneInternal(id: number, userId?: number): Promise<AiProvider> {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const provider = await this.providerRepository.findOne({
      where,
      relations: ['models'],
    });

    if (!provider) {
      throw new NotFoundException('提供商不存在');
    }

    return provider;
  }

  /**
   * 更新提供商
   */
  async update(
    id: number,
    updateDto: UpdateProviderDto,
    userId?: number,
  ): Promise<any> {
    const provider = await this.findOneInternal(id, userId);

    // 检查用户是否有权限修改（系统级提供商只能管理员修改）
    if (provider.userId !== userId && provider.userId !== null) {
      throw new BadRequestException('无权修改此提供商');
    }

    // 如果修改名称，检查是否冲突
    if (updateDto.name && updateDto.name !== provider.name) {
      const existing = await this.providerRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existing) {
        throw new ConflictException('提供商名称已存在');
      }
    }

    // 如果设置为默认，取消其他默认提供商
    if (updateDto.isDefault && !provider.isDefault) {
      await this.clearDefaultProvider(userId);
    }

    Object.assign(provider, updateDto);
    const saved = await this.providerRepository.save(provider);
    
    // 返回脱敏后的数据
    return saved.toSafeObject();
  }

  /**
   * 删除提供商
   */
  async remove(id: number, userId?: number): Promise<void> {
    const provider = await this.findOneInternal(id, userId);

    // 检查用户是否有权限删除
    if (provider.userId !== userId && provider.userId !== null) {
      throw new BadRequestException('无权删除此提供商');
    }

    // 检查是否有关联的模型
    if (provider.models && provider.models.length > 0) {
      throw new BadRequestException(
        '该提供商下还有模型，请先删除或迁移这些模型',
      );
    }

    await this.providerRepository.remove(provider);
  }

  /**
   * 测试提供商连接
   */
  async testConnection(id: number, userId?: number): Promise<boolean> {
    const provider = await this.findOneInternal(id, userId);

    try {
      // 根据提供商类型选择测试端点
      const testEndpoint = this.getTestEndpoint(provider.source);
      const url = `${provider.config.baseUrl}${testEndpoint}`;

      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...provider.config.headers,
      };

      // 添加认证（使用解密后的Key）
      const decryptedKey = provider.getDecryptedApiKey();
      if (decryptedKey) {
        headers['Authorization'] = `Bearer ${decryptedKey}`;
      }

      // 发送测试请求
      const response = await axios.get(url, {
        headers,
        timeout: provider.config.timeout || 10000,
        validateStatus: (status) => status < 500, // 只有 5xx 才认为错误
      });

      // 检查响应状态
      if (response.status === 401 || response.status === 403) {
        throw new BadRequestException('认证失败：请检查 API Key 是否正确');
      }

      if (response.status === 404) {
        throw new BadRequestException('端点不存在：请检查 Base URL 是否正确');
      }

      if (response.status >= 400) {
        throw new BadRequestException(
          `请求失败：HTTP ${response.status} - ${response.data?.error?.message || response.statusText}`,
        );
      }

      // 验证响应数据格式
      if (!response.data) {
        throw new BadRequestException('响应数据为空');
      }

      // 对于 models 端点，验证是否返回了模型列表
      if (testEndpoint.includes('models')) {
        if (!response.data.data && !Array.isArray(response.data)) {
          throw new BadRequestException('无法获取模型列表');
        }
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        
        if (axiosError.code === 'ECONNREFUSED') {
          throw new BadRequestException('连接被拒绝：请检查 Base URL 是否正确');
        }
        
        if (axiosError.code === 'ETIMEDOUT' || axiosError.code === 'ECONNABORTED') {
          throw new BadRequestException('连接超时：请检查网络或增加超时时间');
        }

        if (axiosError.message.includes('getaddrinfo')) {
          throw new BadRequestException('域名解析失败：请检查 Base URL 是否正确');
        }

        throw new BadRequestException(
          `连接失败：${axiosError.message}`,
        );
      }

      throw new BadRequestException(
        `测试失败：${error.message || '未知错误'}`,
      );
    }
  }

  /**
   * 获取提供商的可用模型列表
   */
  async getAvailableModels(id: number, userId?: number): Promise<any[]> {
    const provider = await this.findOneInternal(id, userId);

    try {
      // 获取模型列表端点
      const modelsEndpoint = this.getModelsEndpoint(provider.source);
      const url = `${provider.config.baseUrl}${modelsEndpoint}`;

      // 准备请求头
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...provider.config.headers,
      };

      // 添加认证
      const decryptedKey = provider.getDecryptedApiKey();
      if (decryptedKey) {
        headers['Authorization'] = `Bearer ${decryptedKey}`;
      }

      // 发送请求获取模型列表
      const response = await axios.get(url, {
        headers,
        timeout: provider.config.timeout || 10000,
      });
      // 解析并标准化模型数据
      return this.parseModelsResponse(response.data, provider.source);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const errorData = axiosError.response?.data as any;
        throw new BadRequestException(
          `获取模型列表失败：${errorData?.error?.message || axiosError.message}`,
        );
      }
      throw new BadRequestException(
        `获取模型列表失败：${(error as any)?.message || '未知错误'}`,
      );
    }
  }

  /**
   * 获取模型列表端点
   */
  private getModelsEndpoint(source: ChatCompletionSource): string {
    switch (source) {
      case ChatCompletionSource.OPENROUTER:
        return '/api/v1/models';
      default:
        // OpenAI 兼容的提供商使用 /v1/models
        return '/models';
    }
  }

  /**
   * 解析并标准化模型响应数据
   */
  private parseModelsResponse(data: any, source: ChatCompletionSource): any[] {
    let models: any[] = [];

    // 提取模型数组
    if (Array.isArray(data)) {
      models = data;
    } else if (data.data && Array.isArray(data.data)) {
      models = data.data;
    } else {
      return [];
    }

    // 根据提供商类型标准化模型数据
    return models.map((model) => this.normalizeModelData(model, source));
  }

  /**
   * 标准化模型数据（简化版，前端使用统一配置）
   */
  private normalizeModelData(model: any, source: ChatCompletionSource): any {
    const modelId = model.id || model.model;
    return {
      id: modelId,
      displayName: this.getModelDisplayName(modelId),
      // 检测能力（前端可能需要显示）
      supportsTools: this.checkToolsSupport(modelId),
      supportsVision: this.checkVisionSupport(modelId),
      features: this.getModelFeatures(modelId),
    };
  }

  /**
   * 获取模型显示名称
   */
  private getModelDisplayName(modelId: string): string {
    // 简单处理：将 ID 转换为友好名称
    return modelId
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /**
   * 检查模型是否支持工具调用
   */
  private checkToolsSupport(modelId: string): boolean {
    const id = modelId.toLowerCase();
    return (
      id.includes('gpt-4') ||
      id.includes('gpt-3.5-turbo-1106') ||
      id.includes('claude-3')
    );
  }

  /**
   * 检查模型是否支持视觉
   */
  private checkVisionSupport(modelId: string): boolean {
    const id = modelId.toLowerCase();
    return (
      id.includes('gpt-4-turbo') ||
      id.includes('gpt-4-vision') ||
      id.includes('claude-3')
    );
  }

  /**
   * 获取模型特性标签
   */
  private getModelFeatures(modelId: string): string[] {
    const features: string[] = ['chat'];
    const id = modelId.toLowerCase();

    if (this.checkVisionSupport(id)) features.push('vision');
    if (this.checkToolsSupport(id)) features.push('tools');
    if (id.includes('turbo')) features.push('fast');
    if (id.includes('gpt-4') || id.includes('claude-3-opus')) features.push('advanced');

    return features;
  }

  /**
   * 根据提供商类型获取测试端点
   */
  private getTestEndpoint(source: ChatCompletionSource): string {
    switch (source) {
      case ChatCompletionSource.OPENAI:
      case ChatCompletionSource.AZURE_OPENAI:
      case ChatCompletionSource.DEEPSEEK:
      case ChatCompletionSource.GROQ:
      case ChatCompletionSource.XAI:
      case ChatCompletionSource.PERPLEXITY:
      case ChatCompletionSource.MISTRALAI:
      case ChatCompletionSource.MOONSHOT:
      case ChatCompletionSource.CUSTOM:
        // OpenAI 兼容的提供商使用 /v1/models
        return '/models';

      case ChatCompletionSource.CLAUDE:
        // Claude 没有 models 端点，使用 messages 端点测试
        return '/v1/messages';

      case ChatCompletionSource.OPENROUTER:
        return '/api/v1/models';

      case ChatCompletionSource.MAKERSUITE:
      case ChatCompletionSource.VERTEXAI:
        // Google AI 使用不同的端点
        return '/models';

      default:
        // 默认使用 OpenAI 风格
        return '/models';
    }
  }

  /**
   * 清除默认提供商标记
   */
  private async clearDefaultProvider(userId?: number): Promise<void> {
    // 查找需要更新的提供商
    const where = userId
      ? [{ isDefault: true, userId }, { isDefault: true, userId: IsNull() }]
      : { isDefault: true, userId: IsNull() };

    const providers = await this.providerRepository.find({ where });
    
    // 批量更新
    if (providers.length > 0) {
      await this.providerRepository.update(
        providers.map(p => p.id),
        { isDefault: false },
      );
    }
  }

  /**
   * 统计提供商数量
   */
  async count(userId?: number): Promise<number> {
    const where = userId
      ? [{ userId }, { userId: IsNull() }]
      : { userId: IsNull() };

    return await this.providerRepository.count({ where });
  }
}
