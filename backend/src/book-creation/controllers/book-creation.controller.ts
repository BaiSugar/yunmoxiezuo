import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BookCreationService } from '../services/book-creation.service';
import { StageExecutorService } from '../services/stage-executor.service';
import { OutlineBuilderService } from '../services/outline-builder.service';
import { ContentGeneratorService } from '../services/content-generator.service';
import { ReviewOptimizerService } from '../services/review-optimizer.service';
import { StepByStepGeneratorService } from '../services/step-by-step-generator.service';
import {
  CreateBookTaskDto,
  ExecuteStageDto,
  OptimizeStageDto,
  BatchGenerateChaptersDto,
  GetTasksQueryDto,
  UpdateOutlineNodeDto,
  RegenerateChapterDto,
  OptimizeChapterDto,
  UpdatePromptConfigDto,
  GenerateNextChapterDto,
  UpdateTitleSynopsisDto,
} from '../dto';
import { StageType } from '../enums';

/**
 * 一键成书控制器
 * 提供所有成书相关的API接口
 */
@ApiTags('一键成书')
@ApiBearerAuth()
@Controller('api/v1/book-creation')
@UseGuards(JwtAuthGuard)
export class BookCreationController {
  constructor(
    private readonly bookCreationService: BookCreationService,
    private readonly stageExecutorService: StageExecutorService,
    private readonly outlineBuilderService: OutlineBuilderService,
    private readonly contentGeneratorService: ContentGeneratorService,
    private readonly reviewOptimizerService: ReviewOptimizerService,
    private readonly stepByStepGeneratorService: StepByStepGeneratorService,
  ) {}

  // ==================== 任务管理 ====================

  /**
   * 1. 创建成书任务
   */
  @Post('tasks')
  @ApiOperation({ summary: '创建成书任务' })
  @ApiResponse({ status: 201, description: '任务创建成功' })
  @ApiResponse({ status: 400, description: '参数错误或余额不足' })
  async createTask(
    @CurrentUser('id') userId: number,
    @Body() createDto: CreateBookTaskDto,
  ) {
    return await this.bookCreationService.createTask(userId, createDto);
  }

  /**
   * 2. 获取任务详情
   */
  @Get('tasks/:taskId')
  @ApiOperation({ summary: '获取任务详情和进度' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async getTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.bookCreationService.getTask(taskId, userId);
  }

  /**
   * 3. 获取任务列表
   */
  @Get('tasks')
  @ApiOperation({ summary: '获取用户的成书任务列表' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTasks(
    @CurrentUser('id') userId: number,
    @Query() query: GetTasksQueryDto,
  ) {
    return await this.bookCreationService.getTasks(userId, query);
  }

  /**
   * 4. 执行阶段（非流式）
   */
  @Post('tasks/:taskId/execute-stage')
  @ApiOperation({ summary: '执行任务的下一个阶段（非流式）' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '阶段执行成功' })
  @ApiResponse({ status: 400, description: '阶段执行失败' })
  async executeStage(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: ExecuteStageDto,
  ) {
    return await this.bookCreationService.executeStage(
      taskId,
      userId,
      dto.stageType,
    );
  }

  /**
   * 4-2. 执行阶段（流式）
   */
  @Post('tasks/:taskId/execute-stage/stream')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '执行任务的下一个阶段（流式输出）',
    description: '实时流式输出AI生成内容，适用于一键成书的阶段1和阶段2'
  })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ 
    status: 200, 
    description: '流式执行成功',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example: 'data: {"content":"生成的文本..."}\n\n',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  async executeStageStream(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: ExecuteStageDto,
    @Res() res: Response,
  ): Promise<void> {
    console.log('[Controller] executeStageStream 接收到参数:', {
      taskId,
      userId,
      dto,
    });

    // 获取任务信息
    const task = await this.bookCreationService.getTask(taskId, userId);

    // 确定要执行的阶段（类型断言为 StageType）
    const stageType = (dto.stageType || task.currentStage) as StageType;

    // 调用流式执行方法
    return await this.stageExecutorService.executeStageStream(
      task,
      stageType,
      res,
    );
  }

  /**
   * 5. 暂停任务
   */
  @Post('tasks/:taskId/pause')
  @ApiOperation({ summary: '暂停任务' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '暂停成功' })
  async pauseTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.bookCreationService.pauseTask(taskId, userId);
    return { message: '任务已暂停' };
  }

  /**
   * 6. 恢复任务
   */
  @Post('tasks/:taskId/resume')
  @ApiOperation({ summary: '恢复任务' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '恢复成功' })
  async resumeTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.bookCreationService.resumeTask(taskId, userId);
    return { message: '任务已恢复' };
  }

  /**
   * 7. 取消任务
   */
  @Delete('tasks/:taskId')
  @ApiOperation({ summary: '取消/删除任务' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '取消成功' })
  async cancelTask(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    await this.bookCreationService.cancelTask(taskId, userId);
    return { message: '任务已取消' };
  }

  /**
   * 8. 更新提示词配置
   */
  @Patch('tasks/:taskId/prompt-config')
  @ApiOperation({ summary: '更新任务的提示词配置（仅允许更新单个提示词，不允许更改提示词组）' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 400, description: '使用提示词组的任务不能更改单个提示词配置' })
  async updatePromptConfig(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdatePromptConfigDto,
  ) {
    return await this.bookCreationService.updatePromptConfig(taskId, userId, dto);
  }

  /**
   * 8-2. 更新书名和简介
   */
  @Patch('tasks/:taskId/title-synopsis')
  @ApiOperation({ summary: '更新书名和简介（阶段2完成后）' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateTitleSynopsis(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateTitleSynopsisDto,
  ) {
    return await this.bookCreationService.updateTitleSynopsis(
      taskId,
      userId,
      dto.title,
      dto.synopsis,
    );
  }

  // ==================== 阶段优化 ====================

  /**
   * 9. 优化阶段产出（非流式）
   */
  @Post('tasks/:taskId/stages/:stageType/optimize')
  @ApiOperation({ summary: '优化某个阶段的产出' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiParam({ name: 'stageType', description: '阶段类型' })
  @ApiResponse({ status: 200, description: '优化成功' })
  async optimizeStage(
    @Param('taskId') rawTaskId: string,
    @Param('stageType') stageType: StageType,
    @CurrentUser('id') userId: number,
    @Body() dto: OptimizeStageDto,
  ) {
    // 添加详细日志
    console.log('[Controller] optimizeStage 接收到参数:', {
      rawTaskId,
      rawTaskIdType: typeof rawTaskId,
      stageType,
      userId,
      dto,
    });
    
    // 手动转换并验证 taskId
    const taskId = parseInt(rawTaskId);
    console.log('[Controller] 转换后的 taskId:', taskId, 'isNaN:', isNaN(taskId));
    
    if (isNaN(taskId)) {
      throw new BadRequestException(`无效的任务ID参数: ${rawTaskId}`);
    }
    
    return await this.bookCreationService.optimizeStage(
      taskId,
      userId,
      stageType,
      dto,
    );
  }

  /**
   * 9-2. 优化阶段产出（流式）
   */
  @Post('tasks/:taskId/stages/:stageType/optimize/stream')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: '优化某个阶段的产出（流式输出）',
    description: '实时流式输出AI生成内容，适用于一键成书的阶段优化'
  })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiParam({ name: 'stageType', description: '阶段类型' })
  @ApiResponse({ 
    status: 200, 
    description: '流式优化成功',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example: 'data: {"content":"生成的文本..."}\n\n',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '参数错误' })
  async optimizeStageStream(
    @Param('taskId') rawTaskId: string,
    @Param('stageType') stageType: StageType,
    @CurrentUser('id') userId: number,
    @Body() dto: OptimizeStageDto,
    @Res() res: Response,
  ): Promise<void> {
    console.log('[Controller] optimizeStageStream 接收到参数:', {
      rawTaskId,
      stageType,
      userId,
      dto,
    });
    
    // 手动转换并验证 taskId
    const taskId = parseInt(rawTaskId);
    if (isNaN(taskId)) {
      throw new BadRequestException(`无效的任务ID参数: ${rawTaskId}`);
    }

    // 获取任务信息
    const task = await this.bookCreationService.getTask(taskId, userId);

    // 调用流式优化方法
    return await this.stageExecutorService.optimizeStageStream(
      task,
      stageType,
      dto.userFeedback,
      res,
    );
  }

  // ==================== 大纲管理 ====================

  /**
   * 10. 获取大纲树
   */
  @Get('tasks/:taskId/outline')
  @ApiOperation({ summary: '获取任务的完整大纲树' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getOutline(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    // 验证权限
    await this.bookCreationService.getTask(taskId, userId);

    // 获取大纲树
    const outlineTree = await this.outlineBuilderService.getOutlineTree(taskId);
    return { nodes: outlineTree };
  }

  /**
   * 11. 编辑大纲节点
   */
  @Patch('tasks/:taskId/outline-nodes/:nodeId')
  @ApiOperation({ summary: '手动编辑大纲节点' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiParam({ name: 'nodeId', description: '节点ID' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateOutlineNode(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('nodeId', ParseIntPipe) nodeId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: UpdateOutlineNodeDto,
  ) {
    // 验证权限
    await this.bookCreationService.getTask(taskId, userId);

    // TODO: 实现节点更新逻辑
    return { message: '节点更新成功', nodeId, updates: dto };
  }

  /**
   * 12. 同步大纲到作品
   */
  @Post('tasks/:taskId/outline/sync-to-novel')
  @ApiOperation({ summary: '将大纲同步到作品' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '同步成功' })
  async syncOutlineToNovel(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    const task = await this.bookCreationService.getTask(taskId, userId);

    // TODO: 实现同步逻辑
    return { message: '大纲已同步到作品', novelId: task.novelId };
  }

  // ==================== 内容生成 ====================

  /**
   * 13. 批量生成章节
   */
  @Post('tasks/:taskId/generate-chapters')
  @ApiOperation({ summary: '批量生成章节正文' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '生成成功' })
  async generateChapters(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: BatchGenerateChaptersDto,
  ) {
    const task = await this.bookCreationService.getTask(taskId, userId);

    if (dto.generateAll) {
      // 生成所有章节
      return await this.contentGeneratorService.batchGenerateAllChapters(task);
    } else if (dto.chapterIds && dto.chapterIds.length > 0) {
      // 生成指定章节
      return await this.contentGeneratorService.batchGenerateChapters(
        task,
        dto.chapterIds,
      );
    } else {
      return { message: '请指定要生成的章节' };
    }
  }

  /**
   * 13-2. 步进式生成单章（新功能 - 人工干预模式）
   * 流程：生成 → 梗概 → 审稿 → ⏸️暂停等待人工确认
   */
  @Post('tasks/:taskId/generate-next-chapter')
  @ApiOperation({
    summary: '步进式生成单章（人工干预模式）',
    description: '生成一章后暂停：正文生成 → 梗概提取 → AI审稿 → 返回审稿报告 → ⏸️等待人工查看和确认',
  })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '章节生成成功，返回审稿报告' })
  @ApiResponse({ status: 400, description: '参数错误' })
  async generateNextChapter(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: GenerateNextChapterDto,
  ) {
    const task = await this.bookCreationService.getTask(taskId, userId);
    return await this.stepByStepGeneratorService.generateNextChapter(
      task,
      dto.chapterOrder,
    );
  }

  /**
   * 13-3. 继续下一章（人工确认后调用）
   */
  @Post('tasks/:taskId/continue-next-chapter')
  @ApiOperation({
    summary: '继续生成下一章',
    description: '人工确认当前章节满意后，调用此接口继续生成下一章',
  })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '下一章生成成功' })
  async continueNextChapter(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    const task = await this.bookCreationService.getTask(taskId, userId);
    return await this.stepByStepGeneratorService.continueToNextChapter(task);
  }

  /**
   * 14. 重新生成章节
   */
  @Post('tasks/:taskId/chapters/:chapterId/regenerate')
  @ApiOperation({ summary: '重新生成单个章节' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiParam({ name: 'chapterId', description: '章节ID' })
  @ApiResponse({ status: 200, description: '重新生成成功' })
  async regenerateChapter(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: RegenerateChapterDto,
  ) {
    const task = await this.bookCreationService.getTask(taskId, userId);

    // TODO: 实现重新生成逻辑
    return {
      message: '章节重新生成成功',
      chapterId,
      feedback: dto.userFeedback,
    };
  }

  // ==================== 审稿优化 ====================

  /**
   * 15. 审稿章节
   */
  @Post('tasks/:taskId/chapters/:chapterId/review')
  @ApiOperation({ summary: '审稿单个章节' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiParam({ name: 'chapterId', description: '章节ID' })
  @ApiResponse({ status: 200, description: '审稿成功' })
  async reviewChapter(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @CurrentUser('id') userId: number,
  ) {
    const task = await this.bookCreationService.getTask(taskId, userId);

    const reviewReport = await this.reviewOptimizerService.reviewChapter(
      task,
      chapterId,
    );

    return {
      success: true,
      reviewReport,
    };
  }

  /**
   * 16. 优化章节
   */
  @Post('tasks/:taskId/chapters/:chapterId/optimize')
  @ApiOperation({ summary: '根据审稿意见优化章节' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiParam({ name: 'chapterId', description: '章节ID' })
  @ApiResponse({ status: 200, description: '优化成功' })
  async optimizeChapter(
    @Param('taskId', ParseIntPipe) taskId: number,
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @CurrentUser('id') userId: number,
    @Body() dto: OptimizeChapterDto,
  ) {
    const task = await this.bookCreationService.getTask(taskId, userId);

    // 如果没有传审稿报告，先执行审稿
    let reviewReport;
    if (!dto.reviewReport) {
      reviewReport = await this.reviewOptimizerService.reviewChapter(
        task,
        chapterId,
      );
    } else {
      // 确保 reviewReport 包含 chapterId（强制类型）
      reviewReport = {
        chapterId,
        score: dto.reviewReport.score,
        issues: dto.reviewReport.issues,
        suggestions: dto.reviewReport.suggestions,
        strengths: dto.reviewReport.strengths,
      };
    }

    // 执行优化
    const optimizedChapter = await this.reviewOptimizerService.optimizeWithContext(
      task,
      chapterId,
      reviewReport,
    );

    return {
      success: true,
      message: '章节优化成功',
      chapter: optimizedChapter,
    };
  }

  // ==================== 获取任务进度 ====================

  /**
   * 17. 获取任务进度
   */
  @Get('tasks/:taskId/progress')
  @ApiOperation({ summary: '获取任务进度详情' })
  @ApiParam({ name: 'taskId', description: '任务ID' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getTaskProgress(
    @Param('taskId', ParseIntPipe) taskId: number,
    @CurrentUser('id') userId: number,
  ) {
    return await this.bookCreationService.getTaskProgress(taskId, userId);
  }
}

