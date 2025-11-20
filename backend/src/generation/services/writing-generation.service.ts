import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';

// 实体
import { Prompt } from '../../prompts/entities/prompt.entity';
import { PromptContent, PromptContentType, PromptRole } from '../../prompts/entities/prompt-content.entity';
import { Character } from '../../novels/entities/character.entity';
import { WorldSetting } from '../../novels/entities/world-setting.entity';
import { Memo } from '../../novels/entities/memo.entity';
import { Chapter } from '../../novels/entities/chapter.entity';

// 服务
import { ChatCompletionService } from '../../ai-models/services/chat-completion.service';
import { AiModelsService } from '../../ai-models/services/ai-models.service';
import { MacroReplacerService } from '../../macros/services/macro-replacer.service';
import { UserModelPreferencesService } from '../../user-model-preferences/user-model-preferences.service';
import { TokenConsumptionService } from '../../token-balances/services/token-consumption.service';
import { CharacterCounterService, LanguageType } from '../../token-balances/services/character-counter.service';
import { ConsumptionSource } from '../../token-balances/entities/token-consumption-record.entity';
import { PromptPermissionService } from '../../prompts/services/prompt-permission.service';
import { PromptStatsService } from '../../prompts/services/prompt-stats.service';
import { PermissionType } from '../../prompts/entities/prompt-permission.entity';
import { PromptInjectionGuard } from '../../prompts/guards/prompt-injection.guard';
import { getAntiInjectionPrompt } from '../../prompts/guards/anti-injection-prompt.constant';
import { RiskLevel } from '../../prompts/guards/injection-detection.types';

// DTO 和接口
import { WritingGenerationDto } from '../dto/writing-generation.dto';
import { GenerationResponseDto } from '../dto/generation-response.dto';
import { ResolvedContent } from '../interfaces/resolved-content.interface';
import { MacroContext } from '../../macros/interfaces/macro-context.interface';
import { IChatCompletionResponse, MessageRole } from '../../ai-models/types';

/**
 * AI写作生成服务
 * 
 * 功能：
 * 1. 从提示词构建完整的AI输入
 * 2. 解析和加载引用的人物卡、世界观
 * 3. 参数替换和宏处理
 * 4. Token预算控制
 * 5. 调用AI生成
 */
@Injectable()
export class WritingGenerationService {
  private readonly logger = new Logger(WritingGenerationService.name);

  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    @InjectRepository(PromptContent)
    private readonly contentRepository: Repository<PromptContent>,
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    @InjectRepository(WorldSetting)
    private readonly worldSettingRepository: Repository<WorldSetting>,
    @InjectRepository(Memo)
    private readonly memoRepository: Repository<Memo>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    private readonly chatCompletionService: ChatCompletionService,
    private readonly aiModelsService: AiModelsService,
    private readonly macroReplacer: MacroReplacerService,
    private readonly userModelPreferencesService: UserModelPreferencesService,
    private readonly tokenConsumptionService: TokenConsumptionService,
    private readonly characterCounterService: CharacterCounterService,
    private readonly promptPermissionService: PromptPermissionService,
    private readonly promptStatsService: PromptStatsService,
    private readonly injectionGuard: PromptInjectionGuard,
  ) {}

  /**
   * AI写作生成（非流式）
   */
  async generate(
    dto: WritingGenerationDto,
    userId: number,
  ): Promise<GenerationResponseDto> {
    this.logger.log(`\n${'█'.repeat(80)}`);
    this.logger.log(`[步骤 0] 开始AI生成 - 用户=${userId}, 提示词=${dto.promptId}, 模型=${dto.modelId}`);
    this.logger.log(`[步骤 0] novelId=${dto.novelId}, 参数数量=${Object.keys(dto.parameters || {}).length}`);
    this.logger.log(`${'█'.repeat(80)}\n`);
    
    const startTime = Date.now();

    let processedContents: ResolvedContent[] = [];

    // === 注入防护：判断是否需要启用 ===
    let shouldProtect = false;
    let promptAuthorId: number | null = null;
    
    if (dto.promptId) {
      // 验证 promptId
      const safePromptId = Number(dto.promptId);
      if (isNaN(safePromptId) || !isFinite(safePromptId) || safePromptId <= 0) {
        this.logger.error(`Invalid promptId in generate: ${dto.promptId}`);
        throw new BadRequestException(`无效的提示词ID: ${dto.promptId}`);
      }
      
      // 加载提示词获取作者信息
      const promptInfo = await this.promptRepository.findOne({
        where: { id: safePromptId },
        select: ['id', 'authorId'],
      });
      if (promptInfo) {
        promptAuthorId = promptInfo.authorId;
        // 重要：只有使用系统提示词（非自己的提示词）时才启用防护
        shouldProtect = promptInfo.authorId !== userId;
        
        if (shouldProtect) {
          this.logger.log(`启用注入防护 - 提示词ID=${safePromptId}, 作者=${promptAuthorId}, 用户=${userId}`);
        }
      }
    }

    // 0. 先对参数值进行宏替换（处理参数值中的{{@::}}引用）
    let processedParameters: Record<string, string> = {};
    if (dto.parameters) {
      this.logger.debug(`开始处理参数宏替换，novelId: ${dto.novelId}`);
      for (const [key, value] of Object.entries(dto.parameters)) {
        try {
          this.logger.debug(`处理参数 "${key}": ${value}`);
          // 对每个参数值应用宏替换
          processedParameters[key] = await this.macroReplacer.replace(
            value,
            {
              userId,
              novelId: dto.novelId,
              variables: {}, // 参数值中不支持嵌套{{变量}}引用
            },
          );
          this.logger.debug(`参数 "${key}" 替换后: ${processedParameters[key].substring(0, 200)}...`);
        } catch (error) {
          this.logger.error(`参数"${key}"宏替换失败: ${error.message}`, error.stack);
          processedParameters[key] = value; // 失败则使用原始值
        }
      }
      
      // === 注入防护：保护参数（仅在使用系统提示词时） ===
      if (shouldProtect) {
        this.logger.debug('对参数进行注入防护...');
        processedParameters = await this.injectionGuard.protectParameters(processedParameters);
      }
    }

    // 1-3. 如果有提示词，加载并处理
    if (dto.promptId) {
      this.logger.log(`[步骤 2] 开始加载提示词 ID=${dto.promptId}`);
      // 1. 加载提示词及其内容
      const prompt = await this.loadPromptWithContents(dto.promptId, userId);
      this.logger.log(`[步骤 2] 提示词加载完成，内容数量=${prompt.contents?.length || 0}`);

      // 1.5. 验证必填参数
      this.logger.log(`[步骤 3] 验证必填参数`);
      this.validateRequiredParameters(prompt.contents!, processedParameters);
      this.logger.log(`[步骤 3] 参数验证通过`);

      // 2. 解析和加载引用的人物卡、世界观（支持插槽填充）
      this.logger.log(`[步骤 4] 开始解析内容引用（人物卡/世界观）`);
      const resolvedContents = await this.resolveContentReferences(
        prompt.contents!,
        processedParameters, // 使用已替换的参数
        userId,
      );
      this.logger.log(`[步骤 4] 内容引用解析完成，内容数量=${resolvedContents.length}`);

      // 3. 宏替换（参数占位符）
      this.logger.log(`[步骤 5] 开始应用宏替换`);
      processedContents = await this.applyMacros(
        resolvedContents,
        processedParameters, // 使用已替换的参数
        userId,
        dto.novelId,
      );
      this.logger.log(`[步骤 5] 宏替换完成`);
    }

    // 4. 处理 @ 引用的内容（添加到用户输入前）
    this.logger.log(`[步骤 6] 开始加载@引用内容`);
    const mentionedContent = await this.loadMentionedContent(dto, userId);
    this.logger.log(`[步骤 6] @引用内容加载完成，长度=${mentionedContent.length}`);
    let finalUserInput = mentionedContent 
      ? mentionedContent + (dto.userInput ? '\n\n' + dto.userInput : '')
      : dto.userInput;

    // === 注入防护：保护用户输入（仅在使用系统提示词时） ===
    let inputRiskLevel: RiskLevel = RiskLevel.SAFE;
    if (shouldProtect && finalUserInput) {
      this.logger.debug('对用户输入进行注入防护...');
      const protectedInput = await this.injectionGuard.protectUserInput(finalUserInput, {
        markBoundaries: true,
        sanitizeHighRisk: true,
      });
      
      finalUserInput = protectedInput.protected;
      inputRiskLevel = protectedInput.risk.level;
      
      if (protectedInput.modified) {
        this.logger.warn(`用户输入被修改 - 风险=${inputRiskLevel}, 原长度=${protectedInput.original.length}, 新长度=${finalUserInput.length}`);
      }
    }

    // 5. 获取用户模型偏好设置（在构建消息之前）
    const modelId = dto.modelId || 'gemini-2.5-pro';
    const userPref = await this.userModelPreferencesService.getPreferenceForGeneration(
      userId,
      modelId,
    );
    // 历史消息数量限制：请求参数 > 用户偏好 > 默认值 10
    // userPref.historyMessageLimit 总是有值（至少是默认值 10），但请求参数优先级最高
    const historyMessageLimit = dto.historyMessageLimit ?? userPref.historyMessageLimit;
    
    // 保存模型的数据库ID（用于后续余额检查和扣费）
    // 重要：如果 userPref 中没有模型 ID，主动从 AiModelsService 查询
    let modelDatabaseId = userPref.modelDatabaseId;
    if (!modelDatabaseId) {
      this.logger.warn(`[步骤 5] userPref 中没有模型 ID，尝试从 AiModelsService 查询`);
      try {
        const model = await this.aiModelsService.findByModelId(modelId, userId);
        modelDatabaseId = model.id;
        this.logger.log(`[步骤 5] 从 AiModelsService 查询到模型 ID: ${modelDatabaseId}`);
      } catch (error) {
        this.logger.warn(`[步骤 5] 从 AiModelsService 查询模型失败: ${error.message}`);
      }
    }

    // 5. 构建消息数组（支持无提示词场景）
    this.logger.log(`[步骤 8] 开始构建消息数组`);
    const messages = await this.buildMessages(processedContents, finalUserInput, dto.history, userId, dto.novelId, historyMessageLimit);
    this.logger.log(`[步骤 8] 消息数组构建完成，消息数=${messages.length}`);

    // === 注入防护：添加防御性系统提示（仅在使用系统提示词时） ===
    if (shouldProtect) {
      // 根据风险等级选择合适的防御提示词
      const antiInjectionPrompt = getAntiInjectionPrompt(inputRiskLevel);
      
      // 添加到消息数组开头（最优先）
      messages.unshift({
        role: MessageRole.SYSTEM,
        content: antiInjectionPrompt,
      });
      
      this.logger.debug(`已添加防御性系统提示 - 风险等级=${inputRiskLevel}`);
    }

    // 应用三层优先级：前端传入 > 用户偏好 > 系统默认
    const temperature = dto.temperature ?? userPref.temperature ?? 1.0;

    // 6. 预检查余额（在调用AI前）
    this.logger.log(`[步骤 9] 开始余额检查`);
    // 重要：必须计算所有发送给大模型的内容，包括历史上下文
    const inputText = messages.map(m => m.content).join('');
    const inputChars = this.characterCounterService.countChars(inputText);
    this.logger.debug(`[步骤 9] 输入字符数=${inputChars}`);
    // 预估输出字数（使用最大token数或默认值）
    const estimatedOutputChars = (dto.maxTokens || 2048) * 2; // 保守估计：1 token ≈ 2 字符
    this.logger.debug(`[步骤 9] 预估输出字符数=${estimatedOutputChars}`);
    
    // 使用从 userPref 获取的模型数据库ID
    if (!modelDatabaseId) {
      this.logger.warn(`[步骤 9] ⚠️ 模型 ${modelId} 不存在，跳过余额检查`);
      // 如果找不到模型，跳过余额检查（让后续流程处理）
    } else {
      this.logger.debug(`[步骤 9] 使用模型数据库ID: ${modelDatabaseId}`);
      
      // 预估消耗
      this.logger.debug(`[步骤 9] 准备调用 estimateCost，modelId=${modelDatabaseId}, inputChars=${inputChars}, outputChars=${estimatedOutputChars}`);
      const estimatedCost = await this.tokenConsumptionService.estimateCost(
        modelDatabaseId,
        inputChars,
        estimatedOutputChars,
        userId,
      );
      this.logger.debug(`[步骤 9] estimateCost 完成，预估消耗=${estimatedCost}`);
      
      // 检查余额
      this.logger.debug(`[步骤 9] 准备检查余额`);
      const hasEnoughBalance = await this.tokenConsumptionService.checkBalance(
        userId,
        estimatedCost,
      );
      this.logger.debug(`[步骤 9] 余额检查完成，是否充足=${hasEnoughBalance}`);
      
      if (!hasEnoughBalance) {
        this.logger.error(`[步骤 9] ❌ 余额不足！`);
        throw new BadRequestException('字数余额不足，请充值！');
      }
    }
    
    this.logger.log(`[步骤 9] ✅ 余额检查通过`);

    // 记录发送给大模型的完整消息
    this.logger.log(`[步骤 10] 准备调用AI模型`);
    this.logger.log(`\n${'='.repeat(80)}`);
    this.logger.log(`发送给大模型的完整提示词 (共${messages.length}条消息)`);
    this.logger.log(`模型: ${modelId}, 温度: ${temperature}`);
    this.logger.log(`${'='.repeat(80)}`);
    messages.forEach((msg, index) => {
      this.logger.log(`\n[消息 ${index + 1}] 角色: ${msg.role}`);
      this.logger.log(`内容:\n${msg.content}`);
      this.logger.log(`${'-'.repeat(80)}`);
    });
    this.logger.log(`${'='.repeat(80)}\n`);

    // 8. 调用AI生成（使用流式API避免first token timeout）
    this.logger.log(`[步骤 11] 开始调用AI生成（流式）`);
    let response: IChatCompletionResponse;
    let fullContent = '';
    
    try {
      const stream = this.chatCompletionService.completeStream(
        {
          model: modelId,
          messages,
          temperature,
          stream: true,
        },
        userId,
      );

      // 收集所有流式块
      let chunkCount = 0;
      for await (const chunk of stream) {
        chunkCount++;
        const delta = chunk.choices?.[0]?.delta?.content || '';
        fullContent += delta;
        
        // 每收到10个chunk记录一次日志
        if (chunkCount % 10 === 0) {
          this.logger.debug(`已接收 ${chunkCount} 个chunk，当前内容长度: ${fullContent.length}`);
        }
      }
      
      this.logger.log(`[步骤 11] ✅ AI生成完成，共接收 ${chunkCount} 个chunk，总长度: ${fullContent.length}`);
      
      // 构造完整响应对象（模拟非流式响应格式）
      response = {
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: fullContent,
            },
            finish_reason: 'stop',
          },
        ],
        // 注意：流式API通常不返回usage，需要手动统计
        usage: undefined,
      } as IChatCompletionResponse;
      
    } catch (error) {
      this.logger.error(`[步骤 11] ❌ 流式AI生成失败: ${error.message}`);
      throw error;
    }

    // 9. 计算字数消耗
    this.logger.log(`[步骤 12] 开始计算字数消耗`);
    let consumption: any = undefined;
    try {
      const apiUsage = (response as IChatCompletionResponse).usage;
      let inputChars: number;
      let outputChars: number;

      // 优先使用 API 返回的 token 数（更准确，包含所有输出如推理过程）
      if (apiUsage && apiUsage.prompt_tokens && apiUsage.completion_tokens) {
        this.logger.debug(
          `使用API返回的token数: prompt_tokens=${apiUsage.prompt_tokens}, completion_tokens=${apiUsage.completion_tokens}`
        );
        
        // 将 token 数转换为字符数（用于系统的字数计费）
        inputChars = this.characterCounterService.tokenToChars(
          apiUsage.prompt_tokens,
          LanguageType.MIXED
        );
        outputChars = this.characterCounterService.tokenToChars(
          apiUsage.completion_tokens,  // 包含 thinking/reasoning 等所有输出
          LanguageType.MIXED
        );
        
        this.logger.debug(
          `转换后字符数: inputChars=${inputChars}, outputChars=${outputChars}`
        );
      } else {
        // 降级方案：流式API通常不返回usage，使用文本字符数统计
        this.logger.log('流式API未返回usage信息，使用文本字符数统计');
        
        const inputText = messages.map(m => m.content).join('');
        const outputText = fullContent || (response as IChatCompletionResponse).choices?.[0]?.message?.content || '';
        
        inputChars = this.characterCounterService.countChars(inputText);
        outputChars = this.characterCounterService.countChars(
          typeof outputText === 'string' ? outputText : JSON.stringify(outputText)
        );
        
        this.logger.debug(
          `统计字符数: inputChars=${inputChars}, outputChars=${outputChars}`
        );
      }

      // 使用从 userPref 获取的模型数据库ID
      if (!modelDatabaseId) {
        this.logger.warn(`⚠️ 模型 ${modelId} 不存在，无法计算消耗，跳过扣费`);
        // 跳过扣费，但不影响响应
      } else {
        // 调用消耗服务
        const consumptionResult = await this.tokenConsumptionService.calculateAndConsume({
          userId,
          modelId: modelDatabaseId,
        inputChars,
        outputChars,
          source: ConsumptionSource.GENERATION,
          relatedId: dto.promptId,
        });

        consumption = {
          totalCost: consumptionResult.totalCost,
          inputCost: consumptionResult.inputCost,
          outputCost: consumptionResult.outputCost,
          usedDailyFree: consumptionResult.usedDailyFree,
          usedPaid: consumptionResult.usedPaid,
          memberBenefitApplied: consumptionResult.memberBenefitApplied,
        };
      }
    } catch (error) {
      // 字数扣费失败记录日志，但不影响返回结果
      this.logger.error(`字数扣费失败: ${error.message}`, error.stack);
      // 如果是余额不足等业务异常，需要抛出
      if (error.message?.includes('余额不足') || error.message?.includes('必须大于0')) {
        throw error;
      }
    }

    // 10. 增加提示词使用次数（无论扣费是否成功）
    if (dto.promptId) {
      try {
        await this.promptStatsService.incrementUseCount(dto.promptId);
        this.logger.log(
          `提示词使用次数已更新 - 提示词ID: ${dto.promptId}, 用户: ${userId}`
        );
      } catch (error) {
        this.logger.error(
          `提示词使用次数更新失败 - 提示词ID: ${dto.promptId}: ${error.message}`,
          error.stack
        );
        // 使用记录失败不影响响应
      }
    }

    // 11. 构建响应
    this.logger.log(`[步骤 13] 构建响应`);
    const duration = Date.now() - startTime;
    const result = this.buildResponse(response as IChatCompletionResponse, duration, consumption);
    
    this.logger.log(`\n${'█'.repeat(80)}`);
    this.logger.log(`[完成] AI生成成功 - 耗时=${duration}ms, 消耗=${consumption?.totalCost || 0}字`);
    this.logger.log(`${'█'.repeat(80)}\n`);
    
    return result;
  }

  /**
   * AI写作生成（流式，带元数据返回）
   * 用于一键成书等需要获取生成结果元数据的场景
   */
  async generateStreamWithMetadata(
    dto: WritingGenerationDto,
    userId: number,
    res: Response,
  ): Promise<{ content: string; inputChars: number; outputChars: number; modelId: number | null }> {
    return new Promise(async (resolve, reject) => {
      let metadata: any = null;
      let fullContent = ''; // 收集完整的流式内容
      let hasError = false;

      // 拦截 res.write 方法来捕获元数据和内容，但仍然要调用原始的 write
      const originalWrite = res.write.bind(res);
      (res as any).write = function (chunk: any, ...args: any[]): boolean {
        // 先调用原始的 write，确保数据发送出去
        const result = originalWrite(chunk, ...args);
        
        // 然后尝试解析数据
        try {
          const chunkStr = chunk.toString();
          if (chunkStr.startsWith('data: ')) {
            const dataStr = chunkStr.substring(6).trim();
            if (dataStr !== '[DONE]' && dataStr !== ''){
              try {
                const data = JSON.parse(dataStr);
                // 收集流式内容
                if (data.content && !data.type) {
                  fullContent += data.content;
                }
                // 捕获元数据
                if (data.type === 'metadata') {
                  metadata = data;
                }
              } catch (e) {
                // 不是 JSON，忽略
              }
            }
          }
        } catch (e) {
          // 忽略解析错误
        }
        
        return result;
      };

      // 拦截 res.end 方法来返回元数据
      const originalEnd = res.end.bind(res);
      (res as any).end = function (...args: any[]): any {
        const result = originalEnd(...args);
        
        // 在 nextTick 中 resolve，确保响应已经完全发送
        process.nextTick(() => {
          if (!hasError && metadata) {
            resolve({
              content: fullContent, // 使用收集的流式内容，而不是元数据中的 content
              inputChars: metadata.inputChars || 0,
              outputChars: metadata.outputChars || 0,
              modelId: metadata.modelId || null,
            });
          } else if (!hasError) {
            // 如果没有元数据，返回收集的内容
            resolve({
              content: fullContent,
              inputChars: 0,
              outputChars: 0,
              modelId: null,
            });
          }
        });
        
        return result;
      };

      try {
        await this.generateStream(dto, userId, res);
      } catch (error) {
        hasError = true;
        reject(error);
      }
    });
  }

  /**
   * AI写作生成（流式）
   */
  async generateStream(
    dto: WritingGenerationDto,
    userId: number,
    res: Response,
  ): Promise<void> {
    this.logger.log(`开始流式AI写作生成 - 提示词ID: ${dto.promptId || '无'}, 用户ID: ${userId}`);

    let processedContents: ResolvedContent[] = [];

    // === 注入防护：判断是否需要启用 ===
    let shouldProtect = false;
    let promptAuthorId: number | null = null;
    
    if (dto.promptId) {
      // 验证 promptId
      const safePromptId = Number(dto.promptId);
      if (isNaN(safePromptId) || !isFinite(safePromptId) || safePromptId <= 0) {
        this.logger.error(`[流式] Invalid promptId: ${dto.promptId}`);
        throw new BadRequestException(`无效的提示词ID: ${dto.promptId}`);
      }
      
      // 加载提示词获取作者信息
      const promptInfo = await this.promptRepository.findOne({
        where: { id: safePromptId },
        select: ['id', 'authorId'],
      });
      if (promptInfo) {
        promptAuthorId = promptInfo.authorId;
        // 重要：只有使用系统提示词（非自己的提示词）时才启用防护
        shouldProtect = promptInfo.authorId !== userId;
        
        if (shouldProtect) {
          this.logger.log(`[流式] 启用注入防护 - 提示词ID=${safePromptId}, 作者=${promptAuthorId}, 用户=${userId}`);
        }
      }
    }

    // 0. 先对参数值进行宏替换（处理参数值中的{{@::}}引用）
    let processedParameters: Record<string, string> = {};
    if (dto.parameters) {
      this.logger.debug(`开始处理参数宏替换，novelId: ${dto.novelId}`);
      for (const [key, value] of Object.entries(dto.parameters)) {
        try {
          this.logger.debug(`处理参数 "${key}": ${value}`);
          // 对每个参数值应用宏替换
          processedParameters[key] = await this.macroReplacer.replace(
            value,
            {
              userId,
              novelId: dto.novelId,
              variables: {}, // 参数值中不支持嵌套{{变量}}引用
            },
          );
          this.logger.debug(`参数 "${key}" 替换后: ${processedParameters[key].substring(0, 200)}...`);
        } catch (error) {
          this.logger.error(`参数"${key}"宏替换失败: ${error.message}`, error.stack);
          processedParameters[key] = value; // 失败则使用原始值
        }
      }
      
      // === 注入防护：保护参数（仅在使用系统提示词时） ===
      if (shouldProtect) {
        this.logger.debug('[流式] 对参数进行注入防护...');
        processedParameters = await this.injectionGuard.protectParameters(processedParameters);
      }
    }

    // 1-3. 如果有提示词，加载并处理
    if (dto.promptId) {
      const prompt = await this.loadPromptWithContents(dto.promptId, userId);
      
      // 验证必填参数
      this.validateRequiredParameters(prompt.contents!, processedParameters);
      
      const resolvedContents = await this.resolveContentReferences(
        prompt.contents!,
        processedParameters, // 使用已替换的参数
        userId,
        dto.characterIds,  // 用户选择的人物卡用于填充插槽
        dto.worldSettingIds,  // 用户选择的世界观用于填充插槽
      );
      processedContents = await this.applyMacros(
        resolvedContents,
        processedParameters, // 使用已替换的参数
        userId,
        dto.novelId,
      );
    }

    // 4. 处理 @ 引用的内容（添加到用户输入前）
    const mentionedContent = await this.loadMentionedContent(dto, userId);
    let finalUserInput = mentionedContent 
      ? mentionedContent + (dto.userInput ? '\n\n' + dto.userInput : '')
      : dto.userInput;

    // === 注入防护：保护用户输入（仅在使用系统提示词时） ===
    let inputRiskLevel: RiskLevel = RiskLevel.SAFE;
    if (shouldProtect && finalUserInput) {
      this.logger.debug('[流式] 对用户输入进行注入防护...');
      const protectedInput = await this.injectionGuard.protectUserInput(finalUserInput, {
        markBoundaries: true,
        sanitizeHighRisk: true,
      });
      
      finalUserInput = protectedInput.protected;
      inputRiskLevel = protectedInput.risk.level;
      
      if (protectedInput.modified) {
        this.logger.warn(`[流式] 用户输入被修改 - 风险=${inputRiskLevel}, 原长度=${protectedInput.original.length}, 新长度=${finalUserInput.length}`);
      }
    }

    // 5. 获取用户模型偏好设置（在构建消息之前）
    const modelId = dto.modelId || 'gemini-2.5-pro';
    const userPref = await this.userModelPreferencesService.getPreferenceForGeneration(
      userId,
      modelId,
    );
    // 历史消息数量限制：请求参数 > 用户偏好 > 默认值 10
    // userPref.historyMessageLimit 总是有值（至少是默认值 10），但请求参数优先级最高
    const historyMessageLimit = dto.historyMessageLimit ?? userPref.historyMessageLimit;
    
    // 保存模型的数据库ID（用于后续余额检查和扣费）
    // 重要：如果 userPref 中没有模型 ID，主动从 AiModelsService 查询
    let modelDatabaseId = userPref.modelDatabaseId;
    if (!modelDatabaseId) {
      this.logger.warn(`[流式] [步骤 5] userPref 中没有模型 ID，尝试从 AiModelsService 查询`);
      try {
        const model = await this.aiModelsService.findByModelId(modelId, userId);
        modelDatabaseId = model.id;
        this.logger.log(`[流式] [步骤 5] 从 AiModelsService 查询到模型 ID: ${modelDatabaseId}`);
      } catch (error) {
        this.logger.warn(`[流式] [步骤 5] 从 AiModelsService 查询模型失败: ${error.message}`);
      }
    }

    // 5. 构建消息数组
    const messages = await this.buildMessages(processedContents, finalUserInput, dto.history, userId, dto.novelId, historyMessageLimit);

    // === 注入防护：添加防御性系统提示（仅在使用系统提示词时） ===
    if (shouldProtect) {
      // 根据风险等级选择合适的防御提示词
      const antiInjectionPrompt = getAntiInjectionPrompt(inputRiskLevel);
      
      // 添加到消息数组开头（最优先）
      messages.unshift({
        role: MessageRole.SYSTEM,
        content: antiInjectionPrompt,
      });
      
      this.logger.debug(`[流式] 已添加防御性系统提示 - 风险等级=${inputRiskLevel}`);
    }

    // 应用三层优先级：前端传入 > 用户偏好 > 系统默认
    const temperature = dto.temperature ?? userPref.temperature ?? 0.7;
    
    // 记录流式生成的完整消息
    this.logger.log(`\n${'='.repeat(80)}`);
    this.logger.log(`[流式] 发送给大模型的完整提示词 (共${messages.length}条消息)`);
    this.logger.log(`模型: ${modelId}, 温度: ${temperature}`);
    this.logger.log(`${'='.repeat(80)}`);
    messages.forEach((msg, index) => {
      this.logger.log(`\n[消息 ${index + 1}] 角色: ${msg.role}`);
      this.logger.log(`内容:\n${msg.content}`);
      this.logger.log(`${'-'.repeat(80)}`);
    });
    this.logger.log(`${'='.repeat(80)}\n`);

    // 6. 预检查余额（在调用AI前）
    // 重要：必须计算所有发送给大模型的内容，包括历史上下文
    const inputText = messages.map(m => m.content).join('');
    const inputChars = this.characterCounterService.countChars(inputText);
    // 预估输出字数（流式生成通常更长，使用更大的估计值）
    const estimatedOutputChars = 4096 * 2; // 保守估计：最大输出
    
    // 使用从 userPref 获取的模型数据库ID
    if (!modelDatabaseId) {
      this.logger.warn(`[流式] ⚠️ 模型 ${modelId} 不存在，跳过余额检查`);
      // 如果找不到模型，跳过余额检查（让后续流程处理）
    } else {
      this.logger.debug(`[流式] 使用模型数据库ID: ${modelDatabaseId}`);
      
      // 预估消耗
      const estimatedCost = await this.tokenConsumptionService.estimateCost(
        modelDatabaseId,
        inputChars,
        estimatedOutputChars,
        userId,
      );
      
      // 检查余额
      const hasEnoughBalance = await this.tokenConsumptionService.checkBalance(
        userId,
        estimatedCost,
      );
      
      if (!hasEnoughBalance) {
        throw new BadRequestException('字数余额不足，请充值！');
      }
    }
    // 7. 设置SSE响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 记录生成状态（用于 finally 块中扣费）
    let fullResponseContent = '';  // 收集完整响应内容用于字数统计
    let streamStarted = false;     // 是否开始生成

    try {
      // 8. 调用流式生成
      const stream = this.chatCompletionService.completeStream(
        {
          model: modelId,
          messages,
          temperature,
          stream: true,
        },
        userId,
      );

      streamStarted = true;

      // 9. 迭代流式响应并发送给前端
      for await (const chunk of stream) {
        // 提取文本内容
        const content = chunk.choices?.[0]?.delta?.content || '';
        
        if (content) {
          fullResponseContent += content;  // 累积响应内容
          // 发送SSE格式数据
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // 10. 计算字数消耗（用于返回给调用方）
      const inputText = messages.map(m => m.content).join('');
      const inputChars = this.characterCounterService.countChars(inputText);
      const outputChars = this.characterCounterService.countChars(fullResponseContent);
      
      // 发送完成信号（仅包含元数据，不包含 content 以不会重覆流式发送的内容）
      res.write(`data: ${JSON.stringify({ 
        type: 'metadata',
        inputChars,
        outputChars,
        modelId: modelDatabaseId
      })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      
      this.logger.log(`[流式] 流式生成完成 - 用户: ${userId}, 输出字符数: ${fullResponseContent.length}, inputChars=${inputChars}, outputChars=${outputChars}`);
      
    } catch (error) {
      // 如果是用户取消或连接中断，记录为 info 日志而不是 error
      const errorMsg = error.message || '';
      const errorCode = error.code || '';
      
      const isCanceled = 
        errorMsg === 'canceled' || 
        errorMsg.includes('canceled') ||
        errorMsg.includes('aborted') ||
        errorCode === 'ECONNRESET';
      
      if (isCanceled) {
        this.logger.log(`流式生成已中断 - 用户: ${userId}, 已生成字符数: ${fullResponseContent.length}`);
      } else {
        this.logger.error('流式生成失败:', error);
      }
      
      // 发送错误信息（取消/中断操作不发送错误，其他错误才发送）
      if (!res.writableEnded && !isCanceled) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
      
      // 不要 throw，让 finally 块执行扣费
    } finally {
      // 11. 字数扣除 + 提示词使用记录（无论成功、失败还是中断，都要处理）
      // 只要开始生成就处理，按实际生成的字数计算
      if (streamStarted) {
        // 11.1 字数扣除
        try {
          const inputText = messages.map(m => m.content).join('');
          const outputText = fullResponseContent;
          
          // 使用文本字符数统计
          const inputChars = this.characterCounterService.countChars(inputText);
          const outputChars = this.characterCounterService.countChars(outputText);
          
          this.logger.debug(
            `流式生成字数统计 - 用户: ${userId}, ` +
            `输入: ${inputChars}字符, 输出: ${outputChars}字符 ` +
            `(${outputText.length === 0 ? '未生成内容' : '已生成部分内容'})`
          );

          // 只有当输出字数大于0时才扣费（避免预检查失败也扣费）
          if (outputChars > 0 || inputChars > 0) {
            // 使用从 userPref 获取的模型数据库ID
            if (!modelDatabaseId) {
              this.logger.warn(`[流式] ⚠️ 模型 ${modelId} 不存在，无法计算消耗，跳过扣费`);
              // 跳过扣费，但不影响响应
            } else {
              // 调用消耗服务
              const consumptionResult = await this.tokenConsumptionService.calculateAndConsume({
                userId,
                modelId: modelDatabaseId,
              inputChars,
              outputChars,
                source: ConsumptionSource.GENERATION,
                relatedId: dto.promptId,
              });
              
              this.logger.log(
                `流式生成字数扣除成功 - 用户: ${userId}, ` +
                `总消耗: ${consumptionResult.totalCost}字, ` +
                `输入: ${consumptionResult.inputCost}字, ` +
                `输出: ${consumptionResult.outputCost}字 ` +
                `(${fullResponseContent.length === 0 ? '中途停止' : '正常完成'})`
              );
            }
          } else {
            this.logger.warn(`流式生成未产生内容，跳过扣费 - 用户: ${userId}`);
          }
        } catch (error) {
          this.logger.error(
            `流式生成字数扣费失败 - 用户: ${userId}: ${error.message}`,
            error.stack
          );
          // 扣费失败不影响响应（用户已收到内容）
        }

        // 11.2 增加提示词使用次数（无论生成是否成功、中断还是停止）
        if (dto.promptId) {
          try {
            await this.promptStatsService.incrementUseCount(dto.promptId);
            this.logger.log(
              `提示词使用次数已更新 - 提示词ID: ${dto.promptId}, 用户: ${userId}`
            );
          } catch (error) {
            this.logger.error(
              `提示词使用次数更新失败 - 提示词ID: ${dto.promptId}: ${error.message}`,
              error.stack
            );
            // 使用记录失败不影响响应
          }
        }
      }
    }
  }

  /**
   * 加载提示词及其内容
   */
  private async loadPromptWithContents(
    promptId: number,
    userId: number,
  ): Promise<Prompt> {
    const safePromptId = this.validateId(promptId, '提示词ID');
    
    const prompt = await this.promptRepository.findOne({
      where: { id: safePromptId },
      relations: ['contents'],
    });

    if (!prompt) {
      throw new NotFoundException(`提示词 ID=${promptId} 不存在`);
    }

    // 验证 contents 中的 referenceId，防止 NaN 导致 TypeORM 关联查询出错
    if (prompt.contents && Array.isArray(prompt.contents)) {
      for (const content of prompt.contents) {
        if (content.referenceId !== null && content.referenceId !== undefined) {
          const safeRefId = Number(content.referenceId);
          if (isNaN(safeRefId) || !isFinite(safeRefId) || safeRefId <= 0) {
            this.logger.warn(`PromptContent ${content.id} has invalid referenceId: ${content.referenceId}, setting to null`);
            (content as any).referenceId = null; // 设置为 null 以避免关联查询出错
          }
        }
      }
    }

    // 权限检查
    // 1. 检查提示词是否需要审核（作者也不能使用）
    if (prompt.needsReview) {
      throw new BadRequestException('该提示词因违规被下架，正在等待管理员审核，暂时无法使用。请修改后提交审核或联系管理员');
    }

    // 2. 检查提示词是否被封禁（作者也不能使用）
    if (prompt.isBanned) {
      throw new BadRequestException('此提示词已被封禁，无法使用');
    }

    // 3. 作者始终有权限（除了上述两种情况）
    if (prompt.authorId === userId) {
      this.logger.debug(`提示词 ID=${promptId} - 作者访问`);
      return prompt;
    }

    // 3. 检查提示词是否需要申请
    if (prompt.requireApplication) {
      // 需要申请：检查用户是否有使用权限
      const hasPermission = await this.promptPermissionService.checkPermission(
        promptId,
        userId,
        PermissionType.USE,
      );
      if (!hasPermission) {
        throw new BadRequestException('无权使用此提示词，请先申请使用权限');
      }
      this.logger.debug(`提示词 ID=${promptId} - 已授权使用`);
    } else {
      // 不需要申请：检查是否公开
      if (!prompt.isPublic) {
        throw new BadRequestException('此提示词未公开，无法使用');
      }
      this.logger.debug(`提示词 ID=${promptId} - 公开访问`);
    }

    // 检查是否为AI写作类提示词
    if (prompt.roleplayConfig) {
      this.logger.warn(`提示词 ID=${promptId} 包含角色扮演配置，建议使用角色扮演模式`);
    }

    return prompt;
  }

  /**
   * 解析内容引用（人物卡、世界观）
   * 支持插槽填充：当 referenceId 为 null 时，从用户选择中填充
   */
  private async resolveContentReferences(
    contents: PromptContent[],
    parameters?: Record<string, string>,
    userId?: number,
    userSelectedCharIds?: number[],
    userSelectedWorldIds?: number[],
  ): Promise<ResolvedContent[]> {
    this.logger.debug(`[resolveContentReferences] 开始处理 ${contents.length} 个提示词内容`);
    const resolved: ResolvedContent[] = [];

    for (const content of contents) {
      // 跳过禁用的内容
      if (!content.isEnabled) {
        this.logger.debug(`跳过禁用内容: ${content.name}`);
        continue;
      }

      let finalContent = content.content || '';

      // 处理人物卡
      if (content.type === PromptContentType.CHARACTER) {
        if (content.referenceId) {
          // 有引用ID：直接加载指定的人物卡
          const safeCharId = this.validateId(content.referenceId, '人物卡ID');
          // 先加载不包含 relations 的实体，检查 novelId 是否有效
          const characterWithoutRelations = await this.characterRepository.findOne({
            where: { id: safeCharId },
            select: ['id', 'novelId', 'name', 'fields', 'order'],
          });
          
          if (!characterWithoutRelations) {
            continue;
          }
          
          // 验证 novelId
          const safeNovelId = Number(characterWithoutRelations.novelId);
          this.logger.debug(`[人物卡查询] charId=${safeCharId}, novelId=${characterWithoutRelations.novelId}, safeNovelId=${safeNovelId}, isNaN=${isNaN(safeNovelId)}`);
          if (isNaN(safeNovelId) || !isFinite(safeNovelId) || safeNovelId <= 0) {
            this.logger.warn(`Character ${safeCharId} has invalid novelId: ${characterWithoutRelations.novelId}`);
            continue;
          }
          
          // novelId 有效，再加载完整关系
          this.logger.debug(`[人物卡查询] 准备查询: id=${safeCharId}, novelId=${safeNovelId}`);
          const character = await this.characterRepository.findOne({
            where: { id: safeCharId, novelId: safeNovelId },
            relations: ['novel'],
          });
          this.logger.debug(`[人物卡查询] 查询完成: 找到=${!!character}`);
          
          if (character && character.novel && character.novel.userId === userId) {
            finalContent = this.buildCharacterPrompt(character);
          }
        } else if (userSelectedCharIds && userSelectedCharIds.length > 0) {
          // 插槽：加载所有用户选择的人物卡（合并显示）
          const characterContents: string[] = [];
          for (const charId of userSelectedCharIds) {
            const safeCharId = this.validateId(charId, '人物卡ID');
            // 先检查 novelId 是否有效
            const characterWithoutRelations = await this.characterRepository.findOne({
              where: { id: safeCharId },
              select: ['id', 'novelId', 'name', 'fields', 'order'],
            });
            
            if (!characterWithoutRelations) {
              continue;
            }
            
            const safeNovelId = Number(characterWithoutRelations.novelId);
            this.logger.debug(`[人物卡插槽] charId=${safeCharId}, novelId=${characterWithoutRelations.novelId}, safeNovelId=${safeNovelId}, isNaN=${isNaN(safeNovelId)}`);
            if (isNaN(safeNovelId) || !isFinite(safeNovelId) || safeNovelId <= 0) {
              this.logger.warn(`Character ${safeCharId} has invalid novelId: ${characterWithoutRelations.novelId}`);
              continue;
            }
            
            // novelId 有效，再加载完整关系
            this.logger.debug(`[人物卡插槽] 准备查询: id=${safeCharId}, novelId=${safeNovelId}`);
            const character = await this.characterRepository.findOne({
              where: { id: safeCharId, novelId: safeNovelId },
              relations: ['novel'],
            });
            this.logger.debug(`[人物卡插槽] 查询完成: 找到=${!!character}`);
            
            if (character && character.novel && character.novel.userId === userId) {
              characterContents.push(this.buildCharacterPrompt(character));
            }
          }
          finalContent = characterContents.join('\n\n');
        }
      }
      // 处理世界观
      else if (content.type === PromptContentType.WORLDVIEW) {
        if (content.referenceId) {
          // 有引用ID：直接加载指定的世界观
          const safeWorldId = this.validateId(content.referenceId, '世界观ID');
          // 先加载不包含 relations 的实体，检查 novelId 是否有效
          const worldviewWithoutRelations = await this.worldSettingRepository.findOne({
            where: { id: safeWorldId },
            select: ['id', 'novelId', 'name', 'fields', 'order'],
          });
          
          if (!worldviewWithoutRelations) {
            continue;
          }
          
          // 验证 novelId
          const safeNovelId = Number(worldviewWithoutRelations.novelId);
          this.logger.debug(`[世界观查询] worldId=${safeWorldId}, novelId=${worldviewWithoutRelations.novelId}, safeNovelId=${safeNovelId}, isNaN=${isNaN(safeNovelId)}`);
          if (isNaN(safeNovelId) || !isFinite(safeNovelId) || safeNovelId <= 0) {
            this.logger.warn(`WorldSetting ${safeWorldId} has invalid novelId: ${worldviewWithoutRelations.novelId}`);
            continue;
          }
          
          // novelId 有效，再加载完整关系
          this.logger.debug(`[世界观查询] 准备查询: id=${safeWorldId}, novelId=${safeNovelId}`);
          const worldview = await this.worldSettingRepository.findOne({
            where: { id: safeWorldId, novelId: safeNovelId },
            relations: ['novel'],
          });
          this.logger.debug(`[世界观查询] 查询完成: 找到=${!!worldview}`);
          
          if (worldview && worldview.novel && worldview.novel.userId === userId) {
            finalContent = this.buildWorldviewPrompt(worldview);
          }
        } else if (userSelectedWorldIds && userSelectedWorldIds.length > 0) {
          // 插槽：加载所有用户选择的世界观（合并显示）
          const worldContents: string[] = [];
          for (const worldId of userSelectedWorldIds) {
            const safeWorldId = this.validateId(worldId, '世界观ID');
            // 先检查 novelId 是否有效
            const worldSettingWithoutRelations = await this.worldSettingRepository.findOne({
              where: { id: safeWorldId },
              select: ['id', 'novelId', 'name', 'fields', 'order'],
            });
            
            if (!worldSettingWithoutRelations) {
              continue;
            }
            
            const safeNovelId = Number(worldSettingWithoutRelations.novelId);
            this.logger.debug(`[世界观插槽] worldId=${safeWorldId}, novelId=${worldSettingWithoutRelations.novelId}, safeNovelId=${safeNovelId}, isNaN=${isNaN(safeNovelId)}`);
            if (isNaN(safeNovelId) || !isFinite(safeNovelId) || safeNovelId <= 0) {
              this.logger.warn(`WorldSetting ${safeWorldId} has invalid novelId: ${worldSettingWithoutRelations.novelId}`);
              continue;
            }
            
            // novelId 有效，再加载完整关系
            this.logger.debug(`[世界观插槽] 准备查询: id=${safeWorldId}, novelId=${safeNovelId}`);
            const worldSetting = await this.worldSettingRepository.findOne({
              where: { id: safeWorldId, novelId: safeNovelId },
              relations: ['novel'],
            });
            this.logger.debug(`[世界观插槽] 查询完成: 找到=${!!worldSetting}`);
            
            if (worldSetting && worldSetting.novel && worldSetting.novel.userId === userId) {
              worldContents.push(this.buildWorldviewPrompt(worldSetting));
            }
          }
          finalContent = worldContents.join('\n\n');
        }
      }

      resolved.push({
        role: content.role,
        content: finalContent,
        order: content.order,
        sourceId: content.id,
        type: content.type === PromptContentType.TEXT ? 'prompt' : 
              content.type === PromptContentType.CHARACTER ? 'character' : 'worldview',
      });
    }

    // 按 order 排序
    resolved.sort((a, b) => a.order - b.order);

    this.logger.debug(`[resolveContentReferences] ✅ 完成，返回 ${resolved.length} 个解析后的内容`);
    return resolved;
  }

  /**
   * 构建人物卡提示词
   */
  private buildCharacterPrompt(character: Character): string {
    const fields = character.fields || {};
    
    let prompt = `【人物卡：${character.name}】\n`;
    // 遍历所有自定义字段
    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        prompt += `${key}: ${value}\n`;
      }
    }
    return prompt.trim();
  }

  /**
   * 构建世界观提示词
   */
  private buildWorldviewPrompt(worldview: WorldSetting): string {
    const fields = worldview.fields || {};
    
    let prompt = `【世界观：${worldview.name}】\n`;
    // 遍历所有自定义字段
    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        prompt += `${key}: ${value}\n`;
      }
    }
    return prompt.trim();
  }

  /**
   * 构建备忘录提示词
   */
  private buildMemoPrompt(memo: Memo): string {
    let prompt = `【备忘录：${memo.title}】\n`;
    prompt += `${memo.content}\n`;
    return prompt.trim();
  }

  /**
   * 清理HTML标签并转换换行
   */
  private cleanHtmlContent(html: string): string {
    if (!html) return '';
    
    // 移除HTML标签
    let text = html.replace(/<[^>]*>/g, '');
    
    // 解码HTML实体
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"');
    
    // 将HTML换行（<br>, <br/>, <br />, </p>, </div>等）转换为 \n
    // 先处理块级元素的结束标签
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n');
    text = text.replace(/<\/li>/gi, '\n');
    
    // 处理br标签（行内换行）
    text = text.replace(/<br\s*\/?>/gi, '\n');
    
    // 统一多个连续换行为单个换行，但保留段落间的空行
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
  }

  /**
   * 构建章节提示词
   * @param chapter 章节对象
   * @param useSummary 是否使用梗概（true: 使用梗概, false: 使用全文）
   */
  private buildChapterPrompt(chapter: Chapter, useSummary: boolean = false): string {
    if (useSummary) {
      // 使用梗概
      let prompt = `【章节梗概：${chapter.title}】\n`;
      
      if (chapter.summary && chapter.summary.trim()) {
        const cleanSummary = this.cleanHtmlContent(chapter.summary);
        prompt += `${cleanSummary}\n`;
      } else {
        // 理论上不应该到这里（前端已过滤），但提供降级方案
        this.logger.warn(`章节"${chapter.title}"请求梗概但梗概为空，使用前500字全文`);
        const contentPreview = chapter.content 
          ? (chapter.content.length > 500 
              ? chapter.content.substring(0, 500) + '...'
              : chapter.content)
          : '';
        const cleanPreview = this.cleanHtmlContent(contentPreview);
        prompt += `（无梗概，使用前500字）\n${cleanPreview}\n`;
      }
      
      return prompt.trim();
    } else {
      // 使用全文
      let prompt = `【章节：${chapter.title}】\n`;
      const cleanContent = this.cleanHtmlContent(chapter.content || '');
      prompt += `${cleanContent}\n`;
      
      return prompt.trim();
    }
  }

  /**
   * 加载用户通过@符号引用的内容
   */
  private async loadMentionedContent(
    dto: WritingGenerationDto,
    userId: number,
  ): Promise<string> {
    this.logger.debug(`[loadMentionedContent] 开始加载@引用内容`);
    const parts: string[] = [];

    // 加载@引用的人物卡
    if (dto.mentionedCharacterIds && dto.mentionedCharacterIds.length > 0) {
      this.logger.debug(`[@引用] 准备加载 ${dto.mentionedCharacterIds.length} 个人物卡`);
      for (const charId of dto.mentionedCharacterIds) {
        const safeCharId = this.validateId(charId, '@引用人物卡ID');
        // 先加载不包含 relations 的实体，检查 novelId 是否有效
        this.logger.debug(`[@引用人物卡] 第一次查询 charId=${safeCharId}`);
        const characterWithoutRelations = await this.characterRepository.findOne({
          where: { id: safeCharId },
          select: ['id', 'novelId', 'name', 'fields', 'order'],
        });
        
        if (!characterWithoutRelations) {
          this.logger.debug(`[@引用人物卡] 未找到 charId=${safeCharId}`);
          continue;
        }
        
        // 验证 novelId
        const safeNovelId = Number(characterWithoutRelations.novelId);
        this.logger.debug(`[@引用人物卡] charId=${safeCharId}, novelId=${characterWithoutRelations.novelId}, safeNovelId=${safeNovelId}, isNaN=${isNaN(safeNovelId)}`);
        if (isNaN(safeNovelId) || !isFinite(safeNovelId) || safeNovelId <= 0) {
          this.logger.warn(`Character ${safeCharId} has invalid novelId: ${characterWithoutRelations.novelId}`);
          continue;
        }
        
        // novelId 有效，再加载完整关系
        this.logger.debug(`[@引用人物卡] 准备第二次查询: id=${safeCharId}, novelId=${safeNovelId}`);
        const character = await this.characterRepository.findOne({
          where: { id: safeCharId, novelId: safeNovelId },
          relations: ['novel'],
        });
        this.logger.debug(`[@引用人物卡] 第二次查询完成: 找到=${!!character}`);
        
        if (character && character.novel && character.novel.userId === userId) {
          parts.push(this.buildCharacterPrompt(character));
        }
      }
    }

    // 加载@引用的世界观
    if (dto.mentionedWorldSettingIds && dto.mentionedWorldSettingIds.length > 0) {
      this.logger.debug(`[@引用] 准备加载 ${dto.mentionedWorldSettingIds.length} 个世界观`);
      for (const worldId of dto.mentionedWorldSettingIds) {
        const safeWorldId = this.validateId(worldId, '@引用世界观ID');
        // 先加载不包含 relations 的实体，检查 novelId 是否有效
        this.logger.debug(`[@引用世界观] 第一次查询 worldId=${safeWorldId}`);
        const worldSettingWithoutRelations = await this.worldSettingRepository.findOne({
          where: { id: safeWorldId },
          select: ['id', 'novelId', 'name', 'fields', 'order'],
        });
        
        if (!worldSettingWithoutRelations) {
          this.logger.debug(`[@引用世界观] 未找到 worldId=${safeWorldId}`);
          continue;
        }
        
        // 验证 novelId
        const safeNovelId = Number(worldSettingWithoutRelations.novelId);
        this.logger.debug(`[@引用世界观] worldId=${safeWorldId}, novelId=${worldSettingWithoutRelations.novelId}, safeNovelId=${safeNovelId}, isNaN=${isNaN(safeNovelId)}`);
        if (isNaN(safeNovelId) || !isFinite(safeNovelId) || safeNovelId <= 0) {
          this.logger.warn(`WorldSetting ${safeWorldId} has invalid novelId: ${worldSettingWithoutRelations.novelId}`);
          continue;
        }
        
        // novelId 有效，再加载完整关系
        this.logger.debug(`[@引用世界观] 准备第二次查询: id=${safeWorldId}, novelId=${safeNovelId}`);
        const worldSetting = await this.worldSettingRepository.findOne({
          where: { id: safeWorldId, novelId: safeNovelId },
          relations: ['novel'],
        });
        this.logger.debug(`[@引用世界观] 第二次查询完成: 找到=${!!worldSetting}`);
        
        if (worldSetting && worldSetting.novel && worldSetting.novel.userId === userId) {
          parts.push(this.buildWorldviewPrompt(worldSetting));
        }
      }
    }

    // 加载@引用的备忘录
    if (dto.mentionedMemoIds && dto.mentionedMemoIds.length > 0) {
      this.logger.debug(`[@引用] 准备加载 ${dto.mentionedMemoIds.length} 个备忘录`);
      for (const memoId of dto.mentionedMemoIds) {
        const safeMemoId = this.validateId(memoId, '@引用备忘录ID');
        // 先加载不包含 relations 的实体，检查 novelId 是否有效
        this.logger.debug(`[@引用备忘录] 第一次查询 memoId=${safeMemoId}`);
        const memoWithoutRelations = await this.memoRepository.findOne({
          where: { id: safeMemoId },
          select: ['id', 'novelId', 'title', 'content'],
        });
        
        if (!memoWithoutRelations) {
          this.logger.debug(`[@引用备忘录] 未找到 memoId=${safeMemoId}`);
          continue;
        }
        
        // 验证 novelId
        const safeNovelId = Number(memoWithoutRelations.novelId);
        this.logger.debug(`[@引用备忘录] memoId=${safeMemoId}, novelId=${memoWithoutRelations.novelId}, safeNovelId=${safeNovelId}, isNaN=${isNaN(safeNovelId)}`);
        if (isNaN(safeNovelId) || !isFinite(safeNovelId) || safeNovelId <= 0) {
          this.logger.warn(`Memo ${safeMemoId} has invalid novelId: ${memoWithoutRelations.novelId}`);
          continue;
        }
        
        // novelId 有效，再加载完整关系
        this.logger.debug(`[@引用备忘录] 准备第二次查询: id=${safeMemoId}, novelId=${safeNovelId}`);
        const memo = await this.memoRepository.findOne({
          where: { id: safeMemoId, novelId: safeNovelId },
          relations: ['novel'],
        });
        this.logger.debug(`[@引用备忘录] 第二次查询完成: 找到=${!!memo}`);
        
        if (memo && memo.novel && memo.novel.userId === userId) {
          parts.push(this.buildMemoPrompt(memo));
        }
      }
    }

    // 加载@引用的章节
    if (dto.mentionedChapters && dto.mentionedChapters.length > 0) {
      for (const chapterRef of dto.mentionedChapters) {
        const safeChapterId = this.validateId(chapterRef.chapterId, '@引用章节ID');
        const chapter = await this.chapterRepository.findOne({
          where: { id: safeChapterId },
        });
        if (chapter && chapter.novelId) {
          // 验证 novelId
          const safeNovelId = this.validateId(chapter.novelId, '章节所属作品ID');
          
          // 验证权限：检查章节所属作品的用户ID
          const novel: any = await this.chapterRepository.query(
            'SELECT user_id FROM novels WHERE id = ?',
            [safeNovelId]
          );
          if (novel && novel.length > 0 && novel[0].user_id === userId) {
            // 使用明确的类型字段（'summary' 表示梗概，'full' 表示全文）
            const useSummary = chapterRef.type === 'summary';
            parts.push(this.buildChapterPrompt(chapter, useSummary));
          }
        }
      }
    }

    const result = parts.join('\n\n');
    this.logger.debug(`[loadMentionedContent] ✅ 完成，总长度=${result.length}, 部分数=${parts.length}`);
    return result;
  }

  /**
   * 应用宏替换
   */
  private async applyMacros(
    contents: ResolvedContent[],
    parameters: Record<string, string>,
    userId: number,
    novelId?: number,
  ): Promise<ResolvedContent[]> {
    this.logger.debug(`[applyMacros] 开始应用宏替换，内容数=${contents.length}, novelId=${novelId}`);
    // 构建宏上下文
    const context: MacroContext = {
      userId,
      novelId,
      variables: parameters,
    };

    // 对每个内容应用宏替换
    for (const content of contents) {
      try {
        content.content = await this.macroReplacer.replace(
          content.content,
          context,
        );
      } catch (error) {
        this.logger.error(`宏替换失败: ${error.message}`, error.stack);
        // 继续使用原始内容
      }
    }

    this.logger.debug(`[applyMacros] ✅ 宏替换完成`);
    return contents;
  }

  /**
   * 转换 PromptRole 到 MessageRole
   */
  private convertToMessageRole(role: PromptRole): MessageRole {
    const roleMap: Record<PromptRole, MessageRole> = {
      [PromptRole.SYSTEM]: MessageRole.SYSTEM,
      [PromptRole.USER]: MessageRole.USER,
      [PromptRole.ASSISTANT]: MessageRole.ASSISTANT,
    };
    return roleMap[role] || MessageRole.USER;
  }

  /**
   * 构建消息数组
   * 
   * ⚠️ 核心策略：只使用当前提示词，历史对话仅作为上下文
   * 
   * 为什么不重建历史提示词？
   * 1. AI写作场景：用户可能会更换提示词，旧提示词内容会与新提示词冲突
   * 2. 历史对话的作用：提供上下文连贯性，而非重复规则
   * 3. 提示词的作用：定义生成规则，应该由最新的提示词统一控制
   * 
   * 消息结构：
   * [当前提示词 system 内容]  ← 系统规则（最新）
   * [当前提示词其他内容]       ← 角色、世界观等（最新）
   * [历史对话]                ← 纯净的 user/assistant 对话上下文
   * [新用户输入]              ← 当前请求
   * 
   * 支持场景：
   * 1. 有提示词 + 无历史：提示词内容 + 用户输入
   * 2. 有提示词 + 有历史：提示词内容 + 历史对话 + 用户输入
   * 3. 无提示词 + 有历史：历史对话 + 用户输入
   */
  private async buildMessages(
    contents: ResolvedContent[],
    userInput?: string,
    history?: Array<{ 
      role: 'user' | 'assistant'; 
      content: string; 
      promptId?: number;
      parameters?: Record<string, string>;
      characterIds?: number[];
      worldSettingIds?: number[];
    }>,
    userId?: number,
    novelId?: number,
    historyMessageLimit?: number,
  ): Promise<Array<{ role: MessageRole; content: string }>> {
    this.logger.debug(`[buildMessages] 开始构建消息数组，内容数=${contents.length}, 历史数=${history?.length || 0}`);
    const messages: Array<{ role: MessageRole; content: string }> = [];

    // 应用历史消息数量限制（保留最近N条消息）
    let limitedHistory = history;
    if (historyMessageLimit && historyMessageLimit > 0 && history && history.length > historyMessageLimit) {
      limitedHistory = history.slice(-historyMessageLimit);
      this.logger.log(`历史消息已限制为最近 ${historyMessageLimit} 条（原 ${history.length} 条）`);
    }

    // 1. 按角色分类当前提示词内容
    const systemPrompts: ResolvedContent[] = [];
    const nonSystemPrompts: ResolvedContent[] = [];
    
    for (const content of contents) {
      if (content.role === PromptRole.SYSTEM) {
        systemPrompts.push(content);
      } else {
        nonSystemPrompts.push(content);
      }
    }

    // 2. 添加所有 system 提示词（放在最前面）
    for (const content of systemPrompts) {
      messages.push({
        role: this.convertToMessageRole(content.role),
        content: content.content,
      });
    }

    // 3. 添加所有非 system 的提示词内容
    for (const content of nonSystemPrompts) {
      messages.push({
        role: this.convertToMessageRole(content.role),
        content: content.content,
      });
    }

    // 4. 添加历史对话（纯净的 user 和 assistant 对话，作为上下文）
    if (limitedHistory && limitedHistory.length > 0) {
      for (const msg of limitedHistory) {
        messages.push({
          role: msg.role as MessageRole,
          content: msg.content,
        });
      }
    }

    // 5. 添加用户新输入（放在最后）
    if (userInput) {
      messages.push({
        role: MessageRole.USER,
        content: userInput,
      });
    }

    // 特殊处理：如果没有任何消息，记录警告
    if (messages.length === 0) {
      this.logger.warn('构建消息数组时，没有任何内容可用');
    }

    this.logger.debug(`[buildMessages] ✅ 消息数组构建完成，最终消息数=${messages.length}`);
    return messages;
  }



  /**
   * 构建响应
   */
  private buildResponse(
    aiResponse: IChatCompletionResponse,
    duration: number,
    consumption?: any,
  ): GenerationResponseDto {
    // 处理 content，确保是字符串
    const content = aiResponse.choices?.[0]?.message?.content;
    const contentString = typeof content === 'string' 
      ? content 
      : Array.isArray(content) 
        ? JSON.stringify(content) 
        : '';

    return {
      content: contentString,
      generationId: aiResponse.id,
      model: aiResponse.model,
      usage: aiResponse.usage ? {
        promptTokens: aiResponse.usage.prompt_tokens,
        completionTokens: aiResponse.usage.completion_tokens,
        totalTokens: aiResponse.usage.total_tokens,
      } : undefined,
      finishReason: aiResponse.choices?.[0]?.finish_reason || undefined,
      duration,
      consumption,
    };
  }

  /**
   * 验证必填参数
   * 
   * 检查提示词中定义的所有必填参数是否都已提供
   * 如果有缺失的必填参数，抛出异常提示用户
   */
  private validateRequiredParameters(
    contents: PromptContent[],
    providedParameters: Record<string, string>,
  ): void {
    // 收集所有必填参数
    const requiredParams: Array<{
      name: string;
      description?: string;
      contentName: string; // 所属的内容名称（用于提示）
    }> = [];

    // 遍历所有启用的提示词内容
    for (const content of contents) {
      if (!content.isEnabled) {
        continue; // 跳过禁用的内容
      }

      // 检查是否有参数配置
      if (content.parameters && Array.isArray(content.parameters)) {
        for (const param of content.parameters) {
          if (param.required) {
            requiredParams.push({
              name: param.name,
              description: param.description,
              contentName: content.name,
            });
          }
        }
      }
    }

    // 如果没有必填参数，直接返回
    if (requiredParams.length === 0) {
      return;
    }

    // 检查缺失的必填参数
    const missingParams = requiredParams.filter(
      param => !providedParameters[param.name] || providedParameters[param.name].trim() === ''
    );

    // 如果有缺失的必填参数，抛出异常
    if (missingParams.length > 0) {
      const paramList = missingParams
        .map(p => {
          const desc = p.description ? `（${p.description}）` : '';
          return `  • ${p.name}${desc}`;
        })
        .join('\n');

      throw new BadRequestException(
        `请填写以下必填参数后再发送：\n${paramList}`
      );
    }

    this.logger.debug(`参数验证通过，所有必填参数已提供`);
  }

  /**
   * 验证 ID 参数是否有效
   */
  private validateId(id: any, paramName: string): number {
    const safeId = Number(id);
    if (isNaN(safeId) || !isFinite(safeId) || safeId <= 0) {
      this.logger.error(`Invalid ${paramName}: ${id}, type: ${typeof id}`);
      throw new BadRequestException(`无效的${paramName}: ${id}`);
    }
    return safeId;
  }
}
