import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { BookCreationTask, BookCreationStage } from '../entities';
import { CreateBookTaskDto, ExecuteStageDto, OptimizeStageDto, GetTasksQueryDto, UpdatePromptConfigDto, UpdateTitleSynopsisDto } from '../dto';
import { TaskStatus, StageType } from '../enums';
import { StageResult, TaskProgress } from '../interfaces';
import { StageExecutorService } from './stage-executor.service';
import { TokenBalancesService } from '../../token-balances/services/token-balances.service';
import { PromptGroup } from '../../prompt-groups/entities/prompt-group.entity';
import { STAGE_TYPE_TO_CONFIG_FIELD } from '../../prompt-groups/constants/stage-types.constant';

/**
 * 一键成书主服务
 * 负责任务管理和流程编排
 */
@Injectable()
export class BookCreationService {
  private readonly logger = new Logger(BookCreationService.name);

  // 最多同时进行的任务数
  private readonly MAX_CONCURRENT_TASKS = 3;

  // 预估每个任务的最低字数消耗
  private readonly ESTIMATED_MIN_CONSUMPTION = 50000; // 5万字

  constructor(
    @InjectRepository(BookCreationTask)
    private readonly taskRepository: Repository<BookCreationTask>,
    @InjectRepository(BookCreationStage)
    private readonly stageRepository: Repository<BookCreationStage>,
    @InjectRepository(PromptGroup)
    private readonly promptGroupRepository: Repository<PromptGroup>,
    private readonly stageExecutorService: StageExecutorService,
    private readonly tokenBalancesService: TokenBalancesService,
  ) {
    this.logger.log('🔧 BookCreationService initialized - NaN Fix Version 3.0');
  }

  /**
   * 创建成书任务
   */
  async createTask(
    userId: number,
    createDto: CreateBookTaskDto,
  ): Promise<BookCreationTask> {
    // 1. 检查用户同时进行的任务数量
    const activeTasks = await this.taskRepository.count({
      where: {
        userId,
        status: In([
          TaskStatus.IDEA_GENERATING,
          TaskStatus.TITLE_GENERATING,
          TaskStatus.OUTLINE_GENERATING,
          TaskStatus.CONTENT_GENERATING,
          TaskStatus.REVIEW_OPTIMIZING,
          TaskStatus.PAUSED,
        ]),
      },
    });

    if (activeTasks >= this.MAX_CONCURRENT_TASKS) {
      throw new BadRequestException(
        `最多同时进行${this.MAX_CONCURRENT_TASKS}个成书任务`,
      );
    }

    // 3. 检查字数包余额
    const balance = await this.tokenBalancesService.getBalance(userId);
    const availableBalance = Number(balance.totalTokens) - Number(balance.usedTokens) - Number(balance.frozenTokens);
    if (availableBalance < this.ESTIMATED_MIN_CONSUMPTION) {
      throw new BadRequestException(
        `字数包余额不足，预计需要至少${this.ESTIMATED_MIN_CONSUMPTION}字，当前余额${availableBalance}字`,
      );
    }

    // 4. 如果使用提示词组，验证提示词组是否存在并加载提示词配置
    let finalPromptConfig = {};
    if (createDto.promptGroupId) {
      const promptGroup = await this.promptGroupRepository.findOne({
        where: { id: createDto.promptGroupId },
        relations: ['items', 'items.prompt'],
      });

      if (!promptGroup) {
        throw new NotFoundException('提示词组不存在');
      }

      // 从提示词组加载提示词配置
      finalPromptConfig = this.buildPromptConfigFromGroup(promptGroup);
      this.logger.log(`Loaded prompt config from group ${promptGroup.name}`);
    }
    // 如果不使用提示词组，创建空配置，用户需在执行阶段前配置单个提示词

    // 5. 创建任务（应用默认配置）
    const defaultTaskConfig = {
      enableReview: true,
      concurrencyLimit: 5,
    };

    // 准备processedData，包含用户提供的参数
    const processedData: any = {};
    if (createDto.parameters) {
      processedData.userParameters = createDto.parameters;
      this.logger.log(`User parameters: ${JSON.stringify(createDto.parameters)}`);
    }

    const task = this.taskRepository.create({
      userId,
      promptGroupId: createDto.promptGroupId,
      modelId: createDto.modelId,
      status: createDto.autoExecute ? TaskStatus.IDEA_GENERATING : TaskStatus.PAUSED,
      currentStage: StageType.STAGE_1_IDEA,
      processedData,
      promptConfig: finalPromptConfig,
      taskConfig: {
        ...defaultTaskConfig,
        ...createDto.taskConfig, // 用户配置覆盖默认值
      },
      totalCharactersConsumed: 0,
    });

    const savedTask = await this.taskRepository.save(task);
    this.logger.log(`Created task ${savedTask.id} for user ${userId}`);
    this.logger.log(`autoExecute = ${createDto.autoExecute}`);

    // 6. 如果autoExecute为true，立即执行第一阶段
    if (createDto.autoExecute) {
      this.logger.log(`🚀 开始自动执行阶段1...`);
      // 异步执行，不阻塞响应
      this.executeStage(savedTask.id, userId, StageType.STAGE_1_IDEA).catch(
        (error) => {
          this.logger.error(
            `❌ Auto-execute stage 1 failed for task ${savedTask.id}:`,
            error.stack || error,
          );
        },
      );
    } else {
      this.logger.log(`ℹ️ autoExecute = false，跳过自动执行`);
    }

    return savedTask;
  }

  /**
   * 执行指定阶段
   */
  async executeStage(
    taskId: number,
    userId: number,
    stageType?: StageType,
  ): Promise<StageResult> {
    this.logger.log(`\n🎬 ========== executeStage 被调用 ==========`);
    this.logger.log(`Task ID: ${taskId}, User ID: ${userId}, Stage: ${stageType}`);
    
    // 1. 获取任务并验证权限
    const task = await this.getTaskWithAuth(taskId, userId);
    this.logger.log(`✓ 任务加载成功，当前阶段: ${task.currentStage}`);

    // 2. 确定要执行的阶段
    const targetStage = stageType || this.getNextStage(task.currentStage);
    if (!targetStage) {
      throw new BadRequestException('没有可执行的下一阶段');
    }

    // 3. 验证阶段执行条件
    this.validateStageExecution(task, targetStage);

    // 4. 更新任务状态
    await this.updateTaskStatus(taskId, this.getTaskStatusByStage(targetStage));

    // 5. 委托给StageExecutorService执行
    try {
      const result = await this.stageExecutorService.executeStage(
        task,
        targetStage,
      );

      // 6. 执行成功后更新任务
      const charactersConsumed = Number(result.charactersConsumed) || 0;
      const safeCharactersConsumed = (isNaN(charactersConsumed) || !isFinite(charactersConsumed)) ? 0 : charactersConsumed;
      const currentTotal = Number(task.totalCharactersConsumed) || 0;
      const totalSum = currentTotal + safeCharactersConsumed;
      const safeTotalConsumed = (isNaN(totalSum) || !isFinite(totalSum)) ? 0 : totalSum;
      
      // 计算下一个阶段
      const stageSequence = [
        StageType.STAGE_1_IDEA,
        StageType.STAGE_2_TITLE,
        StageType.STAGE_3_OUTLINE,
        StageType.STAGE_4_CONTENT,
        StageType.STAGE_5_REVIEW,
      ];
      const currentIndex = stageSequence.indexOf(targetStage);
      const nextStage = currentIndex < stageSequence.length - 1 ? stageSequence[currentIndex + 1] : null;
      
      const updateData: any = {
        processedData: {
          ...(task.processedData || {}),
          ...result.data,
        } as any,
        totalCharactersConsumed: safeTotalConsumed,
      };

      // 阶段2完成后，不自动进入下一阶段，等待用户选择书名
      if (targetStage === StageType.STAGE_2_TITLE) {
        updateData.currentStage = StageType.STAGE_2_TITLE; // 保持当前阶段
        updateData.status = TaskStatus.WAITING_NEXT_STAGE; // 等待用户选择书名
      } else if (targetStage === StageType.STAGE_5_REVIEW) {
        // 最后一个阶段
        updateData.currentStage = targetStage;
        updateData.status = TaskStatus.COMPLETED;
        updateData.completedAt = new Date();
      } else {
        // 其他阶段正常进入下一阶段
        updateData.currentStage = nextStage || targetStage;
        updateData.status = TaskStatus.WAITING_NEXT_STAGE;
      }

      await this.taskRepository.update(taskId, updateData);
      
      this.logger.log(`✓ 任务已更新: status=${updateData.status}, currentStage=${targetStage}`);

      return result;
    } catch (error) {
      // 执行失败，更新任务状态
      await this.updateTaskStatus(taskId, TaskStatus.FAILED);
      throw error;
    }
  }

  /**
   * 获取任务进度
   */
  async getTaskProgress(taskId: number, userId: number): Promise<TaskProgress> {
    const task = await this.getTaskWithAuth(taskId, userId);

    // 获取所有已完成的阶段（使用已验证的 task.id）
    const completedStages = await this.stageRepository.find({
      where: { taskId: task.id, status: 'completed' as any },
      select: ['stageType'],
    });

    const completedStageTypes = completedStages.map((s) => s.stageType);

    // 计算总进度（每个阶段占20%）
    const overallProgress = completedStageTypes.length * 20;

    return {
      taskId: task.id,
      status: task.status,
      currentStage: task.currentStage,
      overallProgress,
      completedStages: completedStageTypes,
      totalCharactersConsumed: task.totalCharactersConsumed,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,
    };
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId: number, userId: number): Promise<void> {
    const task = await this.getTaskWithAuth(taskId, userId);

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
      throw new BadRequestException('无法暂停已完成或失败的任务');
    }

    await this.updateTaskStatus(taskId, TaskStatus.PAUSED);
    this.logger.log(`Task ${taskId} paused`);
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskId: number, userId: number): Promise<void> {
    const task = await this.getTaskWithAuth(taskId, userId);

    if (task.status !== TaskStatus.PAUSED) {
      throw new BadRequestException('只能恢复已暂停的任务');
    }

    // 恢复到当前阶段对应的状态
    const resumeStatus = this.getTaskStatusByStage(task.currentStage);
    await this.updateTaskStatus(taskId, resumeStatus);
    this.logger.log(`Task ${taskId} resumed`);
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: number, userId: number): Promise<void> {
    const task = await this.getTaskWithAuth(taskId, userId);

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException('无法取消已完成的任务');
    }

    await this.updateTaskStatus(taskId, TaskStatus.CANCELLED);
    this.logger.log(`Task ${taskId} cancelled`);
  }

  /**
   * 优化阶段产出
   */
  async optimizeStage(
    taskId: number,
    userId: number,
    stageType: StageType,
    optimizeDto: OptimizeStageDto,
  ): Promise<StageResult> {
    this.logger.log(`[optimizeStage] 接收到参数 - taskId: ${taskId} (${typeof taskId}), userId: ${userId}, stageType: ${stageType}`);
    
    // 验证 taskId
    const safeTaskId = Number(taskId);
    if (isNaN(safeTaskId) || !isFinite(safeTaskId)) {
      this.logger.error(`Invalid taskId in optimizeStage: ${taskId}, type: ${typeof taskId}`);
      throw new BadRequestException('Invalid task ID');
    }
    
    this.logger.log(`[optimizeStage] 验证通过 - safeTaskId: ${safeTaskId}`);
    const task = await this.getTaskWithAuth(safeTaskId, userId);

    // 验证该阶段是否已经执行过
    const stage = await this.stageRepository.findOne({
      where: { taskId: safeTaskId, stageType },
    });

    if (!stage || stage.status !== 'completed') {
      throw new BadRequestException('该阶段尚未完成，无法优化');
    }

    // 委托给StageExecutorService执行优化
    return await this.stageExecutorService.optimizeStage(
      task,
      stageType,
      optimizeDto.userFeedback,
    );
  }

  /**
   * 获取任务列表
   */
  async getTasks(
    userId: number,
    query: GetTasksQueryDto,
  ): Promise<{
    data: BookCreationTask[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { status, page = 1, limit = 20 } = query;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    const [data, total] = await this.taskRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['novel'],
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取任务详情
   */
  async getTask(taskId: number, userId: number): Promise<BookCreationTask> {
    return await this.getTaskWithAuth(taskId, userId);
  }

  // ============ 私有辅助方法 ============

  /**
   * 获取任务并验证权限
   */
  private async getTaskWithAuth(
    taskId: number,
    userId: number,
  ): Promise<BookCreationTask> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['novel', 'stages', 'outlineNodes'],
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('无权访问此任务');
    }

    // 规范化数值字段，防止 NaN
    task.totalCharactersConsumed = Number(task.totalCharactersConsumed) || 0;
    if (isNaN(task.totalCharactersConsumed)) {
      task.totalCharactersConsumed = 0;
    }

    return task;
  }

  /**
   * 获取下一个阶段
   */
  private getNextStage(currentStage: string): StageType | null {
    const stages = [
      StageType.STAGE_1_IDEA,
      StageType.STAGE_2_TITLE,
      StageType.STAGE_3_OUTLINE,
      StageType.STAGE_4_CONTENT,
      StageType.STAGE_5_REVIEW,
    ];

    const currentIndex = stages.indexOf(currentStage as StageType);
    if (currentIndex === -1 || currentIndex === stages.length - 1) {
      return null;
    }

    return stages[currentIndex + 1];
  }

  /**
   * 根据阶段类型获取任务状态
   */
  private getTaskStatusByStage(stageType: string): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      [StageType.STAGE_1_IDEA]: TaskStatus.IDEA_GENERATING,
      [StageType.STAGE_2_TITLE]: TaskStatus.TITLE_GENERATING,
      [StageType.STAGE_3_OUTLINE]: TaskStatus.OUTLINE_GENERATING,
      [StageType.STAGE_4_CONTENT]: TaskStatus.CONTENT_GENERATING,
      [StageType.STAGE_5_REVIEW]: TaskStatus.REVIEW_OPTIMIZING,
    };

    return statusMap[stageType] || TaskStatus.IDEA_GENERATING;
  }

  /**
   * 验证阶段执行条件
   */
  private validateStageExecution(task: BookCreationTask, stageType: StageType): void {
    // 如果不是第一阶段，需要确保前一个阶段已完成
    const stages = [
      StageType.STAGE_1_IDEA,
      StageType.STAGE_2_TITLE,
      StageType.STAGE_3_OUTLINE,
      StageType.STAGE_4_CONTENT,
      StageType.STAGE_5_REVIEW,
    ];

    const stageIndex = stages.indexOf(stageType);
    if (stageIndex === -1) {
      throw new BadRequestException('无效的阶段类型');
    }

    // 第一阶段可以直接执行
    if (stageIndex === 0) {
      return;
    }

    // 检查前一个阶段是否已完成
    const currentStageIndex = stages.indexOf(task.currentStage as StageType);
    if (currentStageIndex < stageIndex - 1) {
      throw new BadRequestException('请先完成前置阶段');
    }
  }

  /**
   * 更新任务状态
   */
  private async updateTaskStatus(
    taskId: number,
    status: TaskStatus,
  ): Promise<void> {
    const safeTaskId = Number(taskId);
    if (isNaN(safeTaskId) || !isFinite(safeTaskId)) {
      this.logger.error(`Invalid taskId in updateTaskStatus: ${taskId}`);
      throw new BadRequestException('Invalid task ID');
    }
    await this.taskRepository.update(safeTaskId, { status });
  }

  /**
   * 从提示词组构建提示词配置
   */
  private buildPromptConfigFromGroup(promptGroup: PromptGroup): any {
    const config: any = {};
    
    for (const item of promptGroup.items) {
      const configField = STAGE_TYPE_TO_CONFIG_FIELD[item.stageType];
      if (configField) {
        config[configField] = item.promptId;
      }
    }
    
    return config;
  }

  /**
   * 更新任务的提示词配置（仅允许更新单个提示词，不允许更改提示词组）
   */
  async updatePromptConfig(
    taskId: number,
    userId: number,
    updateDto: UpdatePromptConfigDto,
  ): Promise<BookCreationTask> {
    const task = await this.getTaskWithAuth(taskId, userId);

    // 如果任务使用了提示词组，不允许更新提示词配置
    if (task.promptGroupId) {
      throw new BadRequestException(
        '使用提示词组的任务不能更改单个提示词配置',
      );
    }

    // 合并配置
    const updatedConfig = {
      ...task.promptConfig,
      ...updateDto,
    };

    const safeTaskId = Number(taskId);
    if (isNaN(safeTaskId) || !isFinite(safeTaskId)) {
      this.logger.error(`Invalid taskId in updatePromptConfig: ${taskId}`);
      throw new BadRequestException('Invalid task ID');
    }

    await this.taskRepository.update(safeTaskId, {
      promptConfig: updatedConfig as any,
    });

    this.logger.log(`Updated prompt config for task ${safeTaskId}`);

    return await this.getTask(safeTaskId, userId);
  }

  /**
   * 更新书名和简介（阶段2完成后）
   */
  async updateTitleSynopsis(
    taskId: number,
    userId: number,
    title: string,
    synopsis?: string,
  ): Promise<BookCreationTask> {
    const task = await this.getTaskWithAuth(taskId, userId);

    // 检查阶段2是否已完成
    if (!task.processedData?.titles) {
      throw new BadRequestException('请先完成阶段2（书名简介生成）');
    }

    // 更新processedData中的选定书名和简介
    const updatedProcessedData = {
      ...task.processedData,
      selectedTitle: title,
      synopsis: synopsis || task.processedData.synopsis,
    };

    const safeTaskId = Number(taskId);
    if (isNaN(safeTaskId) || !isFinite(safeTaskId)) {
      this.logger.error(`Invalid taskId in updateTitleSynopsis: ${taskId}`);
      throw new BadRequestException('Invalid task ID');
    }

    // 更新任务：设置书名、简介，并自动进入下一阶段（阶段3）
    await this.taskRepository.update(safeTaskId, {
      processedData: updatedProcessedData as any,
      currentStage: StageType.STAGE_3_OUTLINE, // 用户选择书名后，自动进入下一阶段
      status: TaskStatus.WAITING_NEXT_STAGE, // 等待执行阶段3
    });

    // 如果已创建Novel，同步更新Novel
    if (task.novelId) {
      const safeNovelId = Number(task.novelId);
      if (!isNaN(safeNovelId) && isFinite(safeNovelId)) {
        await this.taskRepository.manager.update(
          'novels',
          { id: safeNovelId },
          {
            name: title,
            synopsis: synopsis || task.processedData.synopsis,
          },
        );
      }
    }

    this.logger.log(`Updated title and synopsis for task ${safeTaskId}, 已进入阶段3`);

    return await this.getTask(safeTaskId, userId);
  }
}

