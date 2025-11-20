import { Injectable, Logger, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import { BookCreationTask, BookCreationStage } from '../entities';
import { Novel } from '../../novels/entities/novel.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { StageType, StageStatus, TaskStatus } from '../enums';
import { StageResult } from '../interfaces';
import { OutlineBuilderService } from './outline-builder.service';
import { ContentGeneratorService } from './content-generator.service';
import { ReviewOptimizerService } from './review-optimizer.service';
import { WritingGenerationService } from '../../generation/services/writing-generation.service';
import { TokenBalancesService } from '../../token-balances/services/token-balances.service';
import { ConsumptionSource } from '../../token-balances/entities/token-consumption-record.entity';
import { WebSocketGateway } from '../../websocket/websocket.gateway';

/**
 * 阶段执行器服务
 * 负责执行各个阶段的具体逻辑
 */
@Injectable()
export class StageExecutorService {
  private readonly logger = new Logger(StageExecutorService.name);
  
  // 提示词缓存（避免重复查询数据库）
  private readonly promptCache = new Map<number, Prompt>();

  constructor(
    @InjectRepository(BookCreationTask)
    private readonly taskRepository: Repository<BookCreationTask>,
    @InjectRepository(BookCreationStage)
    private readonly stageRepository: Repository<BookCreationStage>,
    @InjectRepository(Novel)
    private readonly novelRepository: Repository<Novel>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    private readonly outlineBuilderService: OutlineBuilderService,
    private readonly contentGeneratorService: ContentGeneratorService,
    private readonly reviewOptimizerService: ReviewOptimizerService,
    private readonly writingGenerationService: WritingGenerationService,
    private readonly tokenBalancesService: TokenBalancesService,
    @Inject(forwardRef(() => WebSocketGateway))
    private readonly webSocketGateway: WebSocketGateway,
  ) {}

  /**
   * 执行阶段
   */
  async executeStage(
    task: BookCreationTask,
    stageType: StageType,
  ): Promise<StageResult> {
    this.logger.log(`Executing stage ${stageType} for task ${task.id}`);

    // 发送阶段开始事件
    this.emitProgress(task.id, task.userId, {
      event: 'stage_started',
      stage: stageType,
      data: { message: `开始执行${this.getStageName(stageType)}` },
    });

    try {
      let result: StageResult;

      switch (stageType) {
        case StageType.STAGE_1_IDEA:
          result = await this.executeStage1(task);
          break;
        case StageType.STAGE_2_TITLE:
          result = await this.executeStage2(task);
          break;
        case StageType.STAGE_3_OUTLINE:
          result = await this.executeStage3(task);
          break;
        case StageType.STAGE_4_CONTENT:
          result = await this.executeStage4(task);
          break;
        case StageType.STAGE_5_REVIEW:
          result = await this.executeStage5(task);
          break;
        default:
          throw new BadRequestException(`未知的阶段类型: ${stageType}`);
      }

      // 发送阶段完成事件
      this.emitProgress(task.id, task.userId, {
        event: 'stage_completed',
        stage: stageType,
        data: {
          message: `${this.getStageName(stageType)}完成`,
          result: result.data,
        },
      });

      return result;
    } catch (error) {
      this.logger.error(`Stage ${stageType} failed for task ${task.id}:`, error);

      // 发送错误事件
      this.emitProgress(task.id, task.userId, {
        event: 'error',
        stage: stageType,
        data: { error: error.message },
      });

      throw error;
    }
  }

  /**
   * 优化阶段产出（非流式）
   */
  async optimizeStage(
    task: BookCreationTask,
    stageType: StageType,
    userFeedback: string,
  ): Promise<StageResult> {
    this.logger.log(`Optimizing stage ${stageType} for task ${task.id}`);

    // 目前只支持阶段1的优化（脑洞优化）
    if (stageType === StageType.STAGE_1_IDEA) {
      return await this.optimizeStage1(task, userFeedback);
    }

    throw new BadRequestException(`阶段${stageType}暂不支持优化`);
  }

  /**
   * 优化阶段产出（流式）
   */
  async optimizeStageStream(
    task: BookCreationTask,
    stageType: StageType,
    userFeedback: string,
    res: Response,
  ): Promise<void> {
    this.logger.log(`[流式] Optimizing stage ${stageType} for task ${task.id}`);

    // 目前只支持阶段1的优化（脑洞优化）
    if (stageType === StageType.STAGE_1_IDEA) {
      return await this.optimizeStage1Stream(task, userFeedback, res);
    }

    throw new BadRequestException(`阶段${stageType}暂不支持流式优化`);
  }

  /**
   * 流式执行阶段
   */
  async executeStageStream(
    task: BookCreationTask,
    stageType: StageType,
    res: Response,
  ): Promise<void> {
    this.logger.log(`[流式] Executing stage ${stageType} for task ${task.id}`);

    // 在流式执行开始时，根据阶段类型更新任务状态
    const statusMap = {
      [StageType.STAGE_1_IDEA]: TaskStatus.IDEA_GENERATING,
      [StageType.STAGE_2_TITLE]: TaskStatus.TITLE_GENERATING,
      [StageType.STAGE_3_OUTLINE]: TaskStatus.OUTLINE_GENERATING,
      [StageType.STAGE_4_CONTENT]: TaskStatus.CONTENT_GENERATING,
      [StageType.STAGE_5_REVIEW]: TaskStatus.REVIEW_OPTIMIZING,
    };
    const newStatus = statusMap[stageType] || TaskStatus.IDEA_GENERATING;
    
    await this.taskRepository.update(task.id, {
      status: newStatus,
    });
    this.logger.log(`[流式] 任务状态已更新为 ${newStatus}: ${task.id}`);

    // 发送阶段开始事件
    this.emitProgress(task.id, task.userId, {
      event: 'stage_started',
      stage: stageType,
      data: { message: `开始执行${this.getStageName(stageType)}` },
    });

    try {
      let charactersConsumed = 0;
      
      switch (stageType) {
        case StageType.STAGE_1_IDEA:
          charactersConsumed = await this.executeStage1Stream(task, res);
          break;
        case StageType.STAGE_2_TITLE:
          charactersConsumed = await this.executeStage2Stream(task, res);
          break;
        case StageType.STAGE_3_OUTLINE:
          // 阶段3暂不支持流式（因为涉及多步骤生成）
          throw new BadRequestException('阶段3（大纲生成）暂不支持流式执行');
        case StageType.STAGE_4_CONTENT:
          // 阶段4暂不支持流式（因为是批量生成）
          throw new BadRequestException('阶段4（正文生成）暂不支持流式执行');
        case StageType.STAGE_5_REVIEW:
          // 阶段5暂不支持流式（因为是批量审稿）
          throw new BadRequestException('阶段5（审稿优化）暂不支持流式执行');
        default:
          throw new BadRequestException(`未知的阶段类型: ${stageType}`);
      }

      // 发送阶段完成事件（包含字数消耗信息）
      this.emitProgress(task.id, task.userId, {
        event: 'stage_completed',
        stage: stageType,
        data: {
          message: `${this.getStageName(stageType)}完成`,
          charactersConsumed,
        },
      });
    } catch (error) {
      this.logger.error(`[流式] Stage ${stageType} failed for task ${task.id}:`, error);

      // 发送错误事件
      this.emitProgress(task.id, task.userId, {
        event: 'error',
        stage: stageType,
        data: { error: error.message },
      });

      // 如果响应还没结束，发送错误信息
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }

      throw error;
    }
  }

  // ============ 各阶段具体执行方法 ============

  /**
   * 执行阶段1: 想法扩展
   */
  private async executeStage1(task: BookCreationTask): Promise<StageResult> {
    this.logger.log(`\n========== 开始执行阶段1（脑洞生成）==========`);
    this.logger.log(`Task ID: ${task.id}, User ID: ${task.userId}`);
    
    const stageRecord = await this.createStageRecord(
      task.id,
      StageType.STAGE_1_IDEA,
    );
    this.logger.log(`✓ 阶段记录已创建: ${stageRecord.id}`);

    try {
      // 1. 获取用户配置的提示词ID
      const promptId = task.promptConfig?.ideaPromptId;
      this.logger.log(`提示词配置: ${JSON.stringify(task.promptConfig)}`);
      this.logger.log(`脑洞提示词ID: ${promptId}`);
      
      if (!promptId) {
        throw new BadRequestException(
          '请配置脑洞生成提示词（ideaPromptId）',
        );
      }

      const prompt = await this.getPromptById(promptId);
      this.logger.log(`✓ 提示词加载成功: ${prompt.name} (ID: ${prompt.id})`);

      // 2. 准备参数：从任务的processedData中读取用户参数
      const userParameters = task.processedData?.userParameters || {};
      this.logger.log(`用户填写的参数: ${JSON.stringify(userParameters)}`);

      // 3. 调用AI生成（传递用户参数和模型配置）
      const generateOptions: any = {
        promptId: prompt.id,
        parameters: userParameters,
      };

      // 传递模型配置（直接传递数据库ID，WritingGenerationService会负责转换）
      if (task.modelId) {
        generateOptions.modelId = task.modelId.toString();
        this.logger.log(`使用模型ID: ${task.modelId}`);
      }
      
      if (task.taskConfig?.temperature !== undefined) {
        generateOptions.temperature = task.taskConfig.temperature;
        this.logger.log(`温度参数: ${task.taskConfig.temperature}`);
      }
      if (task.taskConfig?.historyMessageLimit !== undefined) {
        generateOptions.historyMessageLimit = task.taskConfig.historyMessageLimit;
        this.logger.log(`历史消息限制: ${task.taskConfig.historyMessageLimit}`);
      }

      this.logger.log(`\n>>> 调用AI生成服务，参数:`);
      this.logger.log(JSON.stringify(generateOptions, null, 2));

      // 检查参数是否为空对象（可能导致生成失败）
      if (Object.keys(userParameters).length === 0) {
        this.logger.warn(`⚠️ 警告：用户参数为空，提示词可能需要参数！`);
      }

      const result = await this.writingGenerationService.generate(
        generateOptions,
        task.userId,
      );
      
      this.logger.log(`✓ AI生成完成，返回内容长度: ${result.content?.length || 0}`);
      this.logger.log(`字数消耗: ${result.consumption?.totalCost || 0}`);

      // 3. 记录字数消耗
      const charactersConsumed = Number(result.consumption?.totalCost) || 0;
      await this.recordConsumption(
        task.userId,
        charactersConsumed,
        '成书任务-阶段1:脑洞生成',
        task.id,
      );

      // 4. 更新阶段记录
      await this.updateStageRecord(stageRecord.id, {
        status: StageStatus.COMPLETED,
        outputData: { brainstorm: result.content },
        charactersConsumed: isNaN(charactersConsumed) ? 0 : charactersConsumed,
        completedAt: new Date(),
      });

      return {
        success: true,
        stage: StageType.STAGE_1_IDEA,
        data: { brainstorm: result.content },
        charactersConsumed,
        message: '脑洞生成成功',
      };
    } catch (error) {
      await this.handleStageError(stageRecord.id, error);
      throw error;
    }
  }

  /**
   * 优化阶段1: 脑洞优化（非流式）
   */
  private async optimizeStage1(
    task: BookCreationTask,
    userFeedback: string,
  ): Promise<StageResult> {
    // 1. 获取用户配置的提示词ID
    const promptId = task.promptConfig?.ideaOptimizePromptId;
    if (!promptId) {
      throw new BadRequestException(
        '请配置脑洞优化提示词（ideaOptimizePromptId）',
      );
    }

    const prompt = await this.getPromptById(promptId);

    // 2. 准备生成参数
    const generateOptions: any = {
      promptId: prompt.id,
      parameters: {
        原始脑洞: task.processedData?.brainstorm || '',
        用户反馈: userFeedback,
      },
    };
    
    // 传递模型配置（直接传递数据库ID）
    if (task.modelId) {
      generateOptions.modelId = task.modelId.toString();
    }
    
    // 只在阶段1之后（已创建Novel）才传递 novelId
    if (task.novelId) {
      generateOptions.novelId = task.novelId;
    }

    // 3. 调用AI生成
    const result = await this.writingGenerationService.generate(
      generateOptions,
      task.userId,
    );

    // 3. 记录字数消耗
    const charactersConsumed = Number(result.consumption?.totalCost) || 0;
    await this.recordConsumption(
      task.userId,
      charactersConsumed,
      '成书任务-阶段1:脑洞优化',
      task.id,
    );

    // 4. 更新任务数据
    const safeCharactersConsumed = (isNaN(charactersConsumed) || !isFinite(charactersConsumed)) ? 0 : charactersConsumed;
    const currentTotal = Number(task.totalCharactersConsumed) || 0;
    const totalSum = currentTotal + safeCharactersConsumed;
    const safeTotalConsumed = (isNaN(totalSum) || !isFinite(totalSum)) ? 0 : totalSum;
    
    // 验证 task.id
    const taskId = Number(task.id);
    if (isNaN(taskId) || !isFinite(taskId)) {
      this.logger.error(`Invalid task.id: ${task.id}, type: ${typeof task.id}`);
      throw new Error('Invalid task ID');
    }
    
    this.logger.log(`更新任务 ${taskId}: totalCharactersConsumed = ${safeTotalConsumed}`);
    
    await this.taskRepository.update(taskId, {
      processedData: {
        ...(task.processedData || {}),
        brainstorm: result.content,
      } as any,
      totalCharactersConsumed: safeTotalConsumed,
    });

    return {
      success: true,
      stage: StageType.STAGE_1_IDEA,
      data: { brainstorm: result.content },
      charactersConsumed: safeCharactersConsumed,
      message: '脑洞优化成功',
    };
  }

  /**
   * 优化阶段1: 脑洞优化（流式）
   */
  private async optimizeStage1Stream(
    task: BookCreationTask,
    userFeedback: string,
    res: Response,
  ): Promise<void> {
    this.logger.log(`[流式] 开始脑洞优化 - Task ID: ${task.id}`);

    // 发送开始事件（通过 WebSocket）
    this.emitProgress(task.id, task.userId, {
      event: 'stage_started',
      stage: StageType.STAGE_1_IDEA,
      data: { message: '开始脑洞优化' },
    });

    try {
      // 1. 获取用户配置的提示词ID
      const promptId = task.promptConfig?.ideaOptimizePromptId;
      if (!promptId) {
        throw new BadRequestException(
          '请配置脑洞优化提示词（ideaOptimizePromptId）',
        );
      }

      const prompt = await this.getPromptById(promptId);

      // 2. 准备生成参数
      const generateOptions: any = {
        promptId: prompt.id,
        parameters: {
          原始脑洞: task.processedData?.brainstorm || '',
          用户反馈: userFeedback,
        },
      };
      
      // 传递模型配置（直接传递数据库ID）
      if (task.modelId) {
        generateOptions.modelId = task.modelId.toString();
      }
      
      // 只在阶段1之后（已创建Novel）才传递 novelId
      if (task.novelId) {
        generateOptions.novelId = task.novelId;
      }

      // 3. 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // 4. 调用流式生成服务（带元数据返回）
      const metadata = await this.writingGenerationService.generateStreamWithMetadata(
        generateOptions,
        task.userId,
        res,
      );

      // 5. 计算字数消耗（使用流式生成返回的元数据）
      // 注意：流式生成已经扣费了，这里只需要更新任务记录
      const totalCost = metadata.inputChars + metadata.outputChars;
      const charactersConsumed = totalCost;

      this.logger.log(`[流式] 生成完成 - 输入: ${metadata.inputChars}字符, 输出: ${metadata.outputChars}字符, 总消耗: ${totalCost}字符`);

      // 6. 记录字数消耗（仅记录日志，实际扣费已在generateStreamWithMetadata中完成）
      await this.recordConsumption(
        task.userId,
        charactersConsumed,
        '成书任务-阶段1:脑洞优化',
        task.id,
      );

      // 7. 更新任务数据
      const safeCharactersConsumed = (isNaN(charactersConsumed) || !isFinite(charactersConsumed)) ? 0 : charactersConsumed;
      const currentTotal = Number(task.totalCharactersConsumed) || 0;
      const totalSum = currentTotal + safeCharactersConsumed;
      const safeTotalConsumed = (isNaN(totalSum) || !isFinite(totalSum)) ? 0 : totalSum;
      
      const taskId = Number(task.id);
      if (isNaN(taskId) || !isFinite(taskId)) {
        this.logger.error(`Invalid task.id: ${task.id}, type: ${typeof task.id}`);
        throw new Error('Invalid task ID');
      }
      
      this.logger.log(`更新任务 ${taskId}: totalCharactersConsumed = ${safeTotalConsumed}`);
      
      await this.taskRepository.update(taskId, {
        processedData: {
          ...(task.processedData || {}),
          brainstorm: metadata.content,
        } as any,
        totalCharactersConsumed: safeTotalConsumed,
        // 优化完成后不自动设置为paused，保持原状态
      });

      this.logger.log(`[流式] 脑洞优化完成 - Task ID: ${task.id}`);
      this.logger.log(`[流式] 准备发送 WebSocket 完成事件`);

      // 发送完成事件（通过 WebSocket）
      this.emitProgress(task.id, task.userId, {
        event: 'stage_completed',
        stage: StageType.STAGE_1_IDEA,
        data: { 
          message: '脑洞优化完成',
          result: { brainstorm: metadata.content },
          charactersConsumed: safeCharactersConsumed,
        },
      });

      this.logger.log(`[流式] WebSocket 完成事件已发送`);

    } catch (error) {
      this.logger.error(`[流式] 脑洞优化失败 - Task ID: ${task.id}:`, error);

      // 发送错误事件
      this.emitProgress(task.id, task.userId, {
        event: 'error',
        stage: StageType.STAGE_1_IDEA,
        data: { error: error.message },
      });

      // 如果响应还没结束，发送错误信息
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }

      throw error;
    }
  }

  /**
   * 执行阶段2: 书名简介生成
   */
  private async executeStage2(task: BookCreationTask): Promise<StageResult> {
    const stageRecord = await this.createStageRecord(
      task.id,
      StageType.STAGE_2_TITLE,
    );

    try {
      const promptId = task.promptConfig?.titlePromptId;
      if (!promptId) {
        throw new BadRequestException(
          '请配置书名简介生成提示词（titlePromptId）',
        );
      }

      const prompt = await this.getPromptById(promptId);

      // 准备生成参数
      const generateOptions: any = {
        promptId: prompt.id,
        parameters: { 脑洞内容: task.processedData?.brainstorm || '' },
      };
      
      // 传递模型配置（直接传递数据库ID）
      if (task.modelId) {
        generateOptions.modelId = task.modelId.toString();
      }
      
      // 只在已创建Novel后才传递 novelId（阶段2会创建Novel）
      if (task.novelId) {
        generateOptions.novelId = task.novelId;
      }

      const result = await this.writingGenerationService.generate(
        generateOptions,
        task.userId,
      );

      // 解析JSON结果
      const parsed = JSON.parse(result.content);
      const { titles, synopsis } = parsed;

      // 阶段2完成后，不自动选择书名，等待用户手动选择
      // 暂时不设置 selectedTitle，等用户通过 updateTitleSynopsis API 确认后再设置

      // 创建Novel实体，但书名暂时使用第一个候选书名，用户选择后会更新
      const novel = this.novelRepository.create({
        userId: task.userId,
        name: titles[0] || '待命名作品', // 临时使用第一个书名，用户选择后会更新
        synopsis: synopsis || '',
      });
      const savedNovel = await this.novelRepository.save(novel);

      // 记录字数消耗
      const charactersConsumed = Number(result.consumption?.totalCost) || 0;
      await this.recordConsumption(
        task.userId,
        charactersConsumed,
        '成书任务-阶段2:书名简介',
        task.id,
      );

      // 更新阶段记录（不设置 selectedTitle，等待用户选择）
      await this.updateStageRecord(stageRecord.id, {
        status: StageStatus.COMPLETED,
        outputData: { titles, synopsis, novelId: savedNovel.id }, // 不包含 selectedTitle
        charactersConsumed: isNaN(charactersConsumed) ? 0 : charactersConsumed,
        completedAt: new Date(),
      });

      const taskId = Number(task.id);
      if (isNaN(taskId) || !isFinite(taskId)) {
        this.logger.error(`Invalid task.id in stage2: ${task.id}`);
        throw new Error('Invalid task ID');
      }
      
      await this.taskRepository.update(taskId, {
        novelId: savedNovel.id,
      });

      return {
        success: true,
        stage: StageType.STAGE_2_TITLE,
        data: { titles, synopsis, novelId: savedNovel.id }, // 不包含 selectedTitle
        charactersConsumed,
        message: '书名简介生成成功，请选择书名',
      };
    } catch (error) {
      await this.handleStageError(stageRecord.id, error);
      throw error;
    }
  }

  /**
   * 执行阶段1: 想法扩展（流式）
   */
  private async executeStage1Stream(
    task: BookCreationTask,
    res: Response,
  ): Promise<number> {
    this.logger.log(`\n[流式] ========== 开始执行阶段1（脑洞生成）==========`);
    this.logger.log(`Task ID: ${task.id}, User ID: ${task.userId}`);
    
    const stageRecord = await this.createStageRecord(
      task.id,
      StageType.STAGE_1_IDEA,
    );
    this.logger.log(`✓ 阶段记录已创建: ${stageRecord.id}`);

    try {
      // 1. 获取用户配置的提示词ID
      const promptId = task.promptConfig?.ideaPromptId;
      this.logger.log(`提示词配置: ${JSON.stringify(task.promptConfig)}`);
      this.logger.log(`脑洞提示词ID: ${promptId}`);
      
      if (!promptId) {
        throw new BadRequestException(
          '请配置脑洞生成提示词（ideaPromptId）',
        );
      }

      const prompt = await this.getPromptById(promptId);
      this.logger.log(`✓ 提示词加载成功: ${prompt.name} (ID: ${prompt.id})`);

      // 2. 准备参数：从任务的processedData中读取用户参数
      const userParameters = task.processedData?.userParameters || {};
      this.logger.log(`用户填写的参数: ${JSON.stringify(userParameters)}`);

      // 3. 调用AI生成（传递用户参数和模型配置）
      const generateOptions: any = {
        promptId: prompt.id,
        parameters: userParameters,
      };

      // 传递模型配置（直接传递数据库ID，WritingGenerationService会负责转换）
      if (task.modelId) {
        generateOptions.modelId = task.modelId.toString();
        this.logger.log(`使用模型ID: ${task.modelId}`);
      }
      
      if (task.taskConfig?.temperature !== undefined) {
        generateOptions.temperature = task.taskConfig.temperature;
        this.logger.log(`温度参数: ${task.taskConfig.temperature}`);
      }
      if (task.taskConfig?.historyMessageLimit !== undefined) {
        generateOptions.historyMessageLimit = task.taskConfig.historyMessageLimit;
        this.logger.log(`历史消息限制: ${task.taskConfig.historyMessageLimit}`);
      }

      this.logger.log(`\n>>> 调用AI流式生成服务，参数:`);
      this.logger.log(JSON.stringify(generateOptions, null, 2));

      // 4. 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // 5. 调用流式生成服务（带元数据返回）
      const metadata = await this.writingGenerationService.generateStreamWithMetadata(
        generateOptions,
        task.userId,
        res,
      );
      
      this.logger.log(`✓ AI流式生成完成，返回内容长度: ${metadata.content?.length || 0}`);
      this.logger.log(`[流式] 元数据: ${JSON.stringify(metadata)}`);
      
      const inputChars = Number(metadata.inputChars) || 0;
      const outputChars = Number(metadata.outputChars) || 0;
      const totalCost = inputChars + outputChars;
      this.logger.log(`字数消耗: ${totalCost} (输入: ${inputChars}, 输出: ${outputChars})`);

      // 6. 记录字数消耗
      const charactersConsumed = totalCost;
      await this.recordConsumption(
        task.userId,
        charactersConsumed,
        '成书任务-阶段1:脑洞生成',
        task.id,
      );

      // 7. 更新阶段记录
      await this.updateStageRecord(stageRecord.id, {
        status: StageStatus.COMPLETED,
        outputData: { brainstorm: metadata.content },
        charactersConsumed: isNaN(charactersConsumed) ? 0 : charactersConsumed,
        completedAt: new Date(),
      });

      // 8. 更新任务状态（不设置为paused，而是继续执行）
      const safeCharactersConsumed = (isNaN(charactersConsumed) || !isFinite(charactersConsumed)) ? 0 : charactersConsumed;
      const currentTotal = Number(task.totalCharactersConsumed) || 0;
      const totalSum = currentTotal + safeCharactersConsumed;
      const safeTotalConsumed = (isNaN(totalSum) || !isFinite(totalSum)) ? 0 : totalSum;
      
      const taskId = Number(task.id);
      if (isNaN(taskId) || !isFinite(taskId)) {
        this.logger.error(`Invalid task.id: ${task.id}, type: ${typeof task.id}`);
        throw new Error('Invalid task ID');
      }
      
      this.logger.log(`更新任务 ${taskId}: totalCharactersConsumed = ${safeTotalConsumed}`);
      
      // 更新阶段记录的字数消耗
      this.logger.log(`[流式] 开始更新阶段记录...`);
      await this.updateStageRecord(stageRecord.id, {
        charactersConsumed: safeCharactersConsumed,
        status: StageStatus.COMPLETED,
        completedAt: new Date(),
      });
      this.logger.log(`[流式] 阶段记录已更新`);
      
      this.logger.log(`[流式] 开始更新任务状态...`);
      await this.taskRepository.update(taskId, {
        processedData: {
          ...(task.processedData || {}),
          brainstorm: metadata.content,
        } as any,
        totalCharactersConsumed: safeTotalConsumed,
        currentStage: StageType.STAGE_2_TITLE, // 自动进入下一阶段
        status: TaskStatus.PAUSED, // 流式执行完成后，设置为 PAUSED，前端显示“继续下一阶段”按钮
      });
      this.logger.log(`[流式] 任务状态已更新为 PAUSED`);

      this.logger.log(`[流式] 阶段1执行完成 - Task ID: ${task.id}, 任务状态已设置为 PAUSED, 阶段字数消耗: ${safeCharactersConsumed}`);
      
      // 返回字数消耗
      return safeCharactersConsumed;

    } catch (error) {
      this.logger.error(`[流式] 阶段1执行失败 - Task ID: ${task.id}:`, error);
      await this.handleStageError(stageRecord.id, error);

      // 如果响应还没结束，发送错误信息
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }

      throw error;
    }
  }

  /**
   * 执行阶段2: 书名简介生成（流式）
   */
  private async executeStage2Stream(
    task: BookCreationTask,
    res: Response,
  ): Promise<number> {
    this.logger.log(`\n[流式] ========== 开始执行阶段2（书名简介生成）==========`);
    this.logger.log(`Task ID: ${task.id}, User ID: ${task.userId}`);
    
    const stageRecord = await this.createStageRecord(
      task.id,
      StageType.STAGE_2_TITLE,
    );

    try {
      const promptId = task.promptConfig?.titlePromptId;
      if (!promptId) {
        throw new BadRequestException(
          '请配置书名简介生成提示词（titlePromptId）',
        );
      }

      const prompt = await this.getPromptById(promptId);
      this.logger.log(`✓ 提示词加载成功: ${prompt.name} (ID: ${prompt.id})`);

      // 准备生成参数
      const generateOptions: any = {
        promptId: prompt.id,
        parameters: { 脑洞内容: task.processedData?.brainstorm || '' },
      };
      
      // 传递模型配置（直接传递数据库ID）
      if (task.modelId) {
        generateOptions.modelId = task.modelId.toString();
      }
      
      // 只在已创建Novel后才传递 novelId（阶段2会创建Novel）
      if (task.novelId) {
        generateOptions.novelId = task.novelId;
      }

      // 设置 SSE 响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      // 调用流式生成服务（带元数据返回）
      const metadata = await this.writingGenerationService.generateStreamWithMetadata(
        generateOptions,
        task.userId,
        res,
      );

      this.logger.log(`✓ AI流式生成完成，返回内容长度: ${metadata.content?.length || 0}`);

      // 解析JSON结果（处理 markdown 代码块）
      let jsonContent = metadata.content;
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1].trim();
      }
      
      const parsed = JSON.parse(jsonContent);
      const { titles, synopsis } = parsed;

      // 阶段2完成后，不自动选择书名，等待用户手动选择
      // 暂时不设置 selectedTitle，等用户通过 updateTitleSynopsis API 确认后再设置

      // 创建Novel实体（如果还没有创建），但书名暂时为空，等用户选择后再更新
      let savedNovel;
      if (!task.novelId) {
        const novel = this.novelRepository.create({
          userId: task.userId,
          name: titles[0] || '待命名作品', // 临时使用第一个书名，用户选择后会更新
          synopsis: synopsis || '',
        });
        savedNovel = await this.novelRepository.save(novel);
        this.logger.log(`✓ Novel实体已创建: ${savedNovel.id}（书名待用户选择）`);
      } else {
        // 如果已存在，暂时不更新书名，等用户选择
        savedNovel = await this.novelRepository.findOne({ where: { id: task.novelId } });
        this.logger.log(`✓ Novel实体已存在: ${task.novelId}（书名待用户选择）`);
      }

      // 记录字数消耗
      this.logger.log(`[流式] 元数据: ${JSON.stringify(metadata)}`);
      
      const inputChars = Number(metadata.inputChars) || 0;
      const outputChars = Number(metadata.outputChars) || 0;
      const totalCost = inputChars + outputChars;
      const charactersConsumed = totalCost;
      this.logger.log(`字数消耗: ${totalCost} (输入: ${inputChars}, 输出: ${outputChars})`);
      await this.recordConsumption(
        task.userId,
        charactersConsumed,
        '成书任务-阶段2:书名简介',
        task.id,
      );

      // 更新阶段记录（不设置 selectedTitle，等待用户选择）
      await this.updateStageRecord(stageRecord.id, {
        status: StageStatus.COMPLETED,
        outputData: { titles, synopsis, novelId: savedNovel.id }, // 不包含 selectedTitle
        charactersConsumed: isNaN(charactersConsumed) ? 0 : charactersConsumed,
        completedAt: new Date(),
      });

      // 更新任务
      const safeCharactersConsumed = (isNaN(charactersConsumed) || !isFinite(charactersConsumed)) ? 0 : charactersConsumed;
      const currentTotal = Number(task.totalCharactersConsumed) || 0;
      const totalSum = currentTotal + safeCharactersConsumed;
      const safeTotalConsumed = (isNaN(totalSum) || !isFinite(totalSum)) ? 0 : totalSum;

      const taskId = Number(task.id);
      if (isNaN(taskId) || !isFinite(taskId)) {
        this.logger.error(`Invalid task.id in stage2 stream: ${task.id}`);
        throw new Error('Invalid task ID');
      }
      
      await this.taskRepository.update(taskId, {
        novelId: savedNovel.id,
        processedData: {
          ...(task.processedData || {}),
          titles,
          synopsis,
          // 不设置 selectedTitle，等待用户通过 updateTitleSynopsis API 选择
        } as any,
        totalCharactersConsumed: safeTotalConsumed,
        currentStage: StageType.STAGE_2_TITLE, // 保持当前阶段，等待用户选择书名
        status: TaskStatus.WAITING_NEXT_STAGE, // 等待用户选择书名后继续
      });

      // 更新阶段记录的字数消耗
      await this.updateStageRecord(stageRecord.id, {
        charactersConsumed: safeCharactersConsumed,
        status: StageStatus.COMPLETED,
        completedAt: new Date(),
      });

      // 发送阶段完成事件，包含 titles 数据，供前端显示书名选择器
      this.emitProgress(task.id, task.userId, {
        event: 'stage_completed',
        stage: StageType.STAGE_2_TITLE,
        data: {
          message: '书名简介生成完成，请选择书名',
          result: { titles, synopsis }, // 包含 titles 供前端显示选择器
          charactersConsumed: safeCharactersConsumed,
        },
      });

      this.logger.log(`[流式] 阶段2执行完成 - Task ID: ${task.id}, 任务状态已设置为 WAITING_NEXT_STAGE, 等待用户选择书名, 阶段字数消耗: ${safeCharactersConsumed}`);
      
      // 返回字数消耗
      return safeCharactersConsumed;

    } catch (error) {
      this.logger.error(`[流式] 阶段2执行失败 - Task ID: ${task.id}:`, error);
      await this.handleStageError(stageRecord.id, error);

      // 如果响应还没结束，发送错误信息
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }

      throw error;
    }
  }

  /**
   * 执行阶段3: 大纲生成
   */
  private async executeStage3(task: BookCreationTask): Promise<StageResult> {
    const stageRecord = await this.createStageRecord(
      task.id,
      StageType.STAGE_3_OUTLINE,
    );

    try {
      // 委托给OutlineBuilderService处理
      const result = await this.outlineBuilderService.buildCompleteOutline(task);

      const charactersConsumed = Number(result.charactersConsumed) || 0;
      await this.updateStageRecord(stageRecord.id, {
        status: StageStatus.COMPLETED,
        outputData: result.data,
        charactersConsumed: isNaN(charactersConsumed) ? 0 : charactersConsumed,
        completedAt: new Date(),
      });

      return result;
    } catch (error) {
      await this.handleStageError(stageRecord.id, error);
      throw error;
    }
  }

  /**
   * 执行阶段4: 正文生成
   */
  private async executeStage4(task: BookCreationTask): Promise<StageResult> {
    const stageRecord = await this.createStageRecord(
      task.id,
      StageType.STAGE_4_CONTENT,
    );

    try {
      // 委托给ContentGeneratorService处理
      const result = await this.contentGeneratorService.batchGenerateAllChapters(
        task,
      );

      const charactersConsumed = Number(result.charactersConsumed) || 0;
      await this.updateStageRecord(stageRecord.id, {
        status: StageStatus.COMPLETED,
        outputData: result.data,
        charactersConsumed: isNaN(charactersConsumed) ? 0 : charactersConsumed,
        completedAt: new Date(),
      });

      return result;
    } catch (error) {
      await this.handleStageError(stageRecord.id, error);
      throw error;
    }
  }

  /**
   * 执行阶段5: 正文优化
   */
  private async executeStage5(task: BookCreationTask): Promise<StageResult> {
    const stageRecord = await this.createStageRecord(
      task.id,
      StageType.STAGE_5_REVIEW,
    );

    try {
      // 委托给ReviewOptimizerService处理
      const result = await this.reviewOptimizerService.batchReview(task);

      const charactersConsumed = Number(result.charactersConsumed) || 0;
      await this.updateStageRecord(stageRecord.id, {
        status: StageStatus.COMPLETED,
        outputData: result.data,
        charactersConsumed: isNaN(charactersConsumed) ? 0 : charactersConsumed,
        completedAt: new Date(),
      });

      return result;
    } catch (error) {
      await this.handleStageError(stageRecord.id, error);
      throw error;
    }
  }

  // ============ 辅助方法 ============

  /**
   * 创建阶段记录
   */
  private async createStageRecord(
    taskId: number,
    stageType: StageType,
  ): Promise<BookCreationStage> {
    const stage = this.stageRepository.create({
      taskId,
      stageType,
      status: StageStatus.PROCESSING,
      inputData: {},
      outputData: {},
      retryCount: 0,
    });

    return await this.stageRepository.save(stage);
  }

  /**
   * 更新阶段记录
   */
  private async updateStageRecord(
    stageId: number,
    updates: Partial<BookCreationStage>,
  ): Promise<void> {
    // 验证 stageId
    const safeStageId = Number(stageId);
    if (isNaN(safeStageId) || !isFinite(safeStageId)) {
      this.logger.error(`Invalid stageId: ${stageId}, type: ${typeof stageId}`);
      throw new Error('Invalid stage ID');
    }
    
    // 验证和清理数值字段
    const safeUpdates = { ...updates };
    
    if ('charactersConsumed' in safeUpdates && safeUpdates.charactersConsumed !== undefined) {
      const value = Number(safeUpdates.charactersConsumed) || 0;
      safeUpdates.charactersConsumed = (isNaN(value) || !isFinite(value)) ? 0 : value;
    }
    
    await this.stageRepository.update(safeStageId, safeUpdates);
  }

  /**
   * 处理阶段错误
   */
  private async handleStageError(stageId: number, error: any): Promise<void> {
    const safeStageId = Number(stageId);
    if (isNaN(safeStageId) || !isFinite(safeStageId)) {
      this.logger.error(`Invalid stageId in handleStageError: ${stageId}`);
      return; // 无法更新，直接返回
    }
    
    await this.stageRepository.update(safeStageId, {
      status: StageStatus.FAILED,
      errorMessage: error.message || '未知错误',
    });
  }

  /**
   * 根据ID查找提示词（带缓存）
   */
  private async getPromptById(id: number): Promise<Prompt> {
    // 验证 ID
    const safeId = Number(id);
    if (isNaN(safeId) || !isFinite(safeId) || safeId <= 0) {
      this.logger.error(`Invalid prompt id: ${id}, type: ${typeof id}`);
      throw new BadRequestException(`无效的提示词ID: ${id}`);
    }
    
    // 先检查缓存
    if (this.promptCache.has(safeId)) {
      this.logger.debug(`提示词 ${safeId} 命中缓存`);
      return this.promptCache.get(safeId)!;
    }

    // 查询数据库
    const prompt = await this.promptRepository.findOne({ where: { id: safeId } });
    if (!prompt) {
      throw new BadRequestException(`未找到提示词ID: ${safeId}`);
    }

    // 缓存提示词
    this.promptCache.set(safeId, prompt);
    this.logger.debug(`提示词 ${safeId} 已缓存`);
    
    return prompt;
  }

  /**
   * 清除提示词缓存（可选，用于更新后刷新缓存）
   */
  clearPromptCache(promptId?: number): void {
    if (promptId) {
      this.promptCache.delete(promptId);
    } else {
      this.promptCache.clear();
    }
  }

  /**
   * 记录字数消耗
   */
  private async recordConsumption(
    userId: number,
    characters: number,
    description: string,
    relatedId: number,
  ): Promise<void> {
    // 确保 characters 是有效数字
    const safeCharacters = Number(characters) || 0;
    if (isNaN(safeCharacters) || !isFinite(safeCharacters) || safeCharacters < 0) {
      this.logger.warn(
        `Invalid characters value: ${characters}, using 0 instead`,
      );
      return;
    }

    // 注意：这里需要调用tokenBalancesService的consume方法
    // 但由于WritingGenerationService已经处理了消耗，这里可能需要调整
    this.logger.log(
      `Consumption recorded: ${safeCharacters} chars for ${description}`,
    );
  }

  /**
   * 发送WebSocket进度事件
   */
  private emitProgress(taskId: number, userId: number, data: any): void {
    try {
      this.logger.log(`📡 准备推送WebSocket消息 - Task: ${taskId}, User: ${userId}, Event: ${data.event}`);
      this.logger.log(`消息内容: ${JSON.stringify(data)}`);
      this.logger.log(`WebSocket Gateway 是否存在: ${!!this.webSocketGateway}`);
      
      if (!this.webSocketGateway) {
        this.logger.error('❌ WebSocket Gateway 不存在！');
        return;
      }
      
      this.webSocketGateway.emitBookCreationProgress(taskId, data);
      this.logger.log(`✓ WebSocket消息已推送到房间: book-creation-${taskId}`);
    } catch (error) {
      this.logger.error('❌ WebSocket推送失败:', error);
      this.logger.error(error.stack);
    }
  }

  /**
   * 获取阶段名称
   */
  private getStageName(stageType: StageType): string {
    const names: Record<StageType, string> = {
      [StageType.STAGE_1_IDEA]: '想法扩展',
      [StageType.STAGE_2_TITLE]: '书名简介生成',
      [StageType.STAGE_3_OUTLINE]: '大纲生成',
      [StageType.STAGE_4_CONTENT]: '正文生成',
      [StageType.STAGE_5_REVIEW]: '正文优化',
    };
    return names[stageType] || stageType;
  }
}

