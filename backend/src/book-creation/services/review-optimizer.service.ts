import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookCreationTask } from '../entities';
import { Chapter } from '../../novels/entities/chapter.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { StageType } from '../enums';
import { StageResult, ReviewReport } from '../interfaces';
import { WritingGenerationService } from '../../generation/services/writing-generation.service';
import { WebSocketGateway } from '../../websocket/websocket.gateway';

/**
 * 审稿优化服务
 * 负责章节审稿和优化
 */
@Injectable()
export class ReviewOptimizerService {
  private readonly logger = new Logger(ReviewOptimizerService.name);
  
  // 提示词缓存
  private readonly promptCache = new Map<number, Prompt>();

  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    private readonly writingGenerationService: WritingGenerationService,
    @Inject(forwardRef(() => WebSocketGateway))
    private readonly webSocketGateway: WebSocketGateway,
  ) {}

  /**
   * 批量审稿和优化
   */
  async batchReview(task: BookCreationTask): Promise<StageResult> {
    // 检查是否启用审稿
    if (task.taskConfig?.enableReview === false) {
      this.logger.log(`Review disabled for task ${task.id}, skipping...`);
      return {
        success: true,
        stage: StageType.STAGE_5_REVIEW,
        data: { message: '审稿已跳过（用户配置）' },
        charactersConsumed: 0,
        message: '审稿功能已禁用',
      };
    }

    this.logger.log(`Batch reviewing chapters for task ${task.id}`);

    // 获取所有章节
    const chapters = await this.chapterRepository.find({
      where: { novelId: task.novelId },
      order: { order: 'ASC' },
    });

    let totalReviewed = 0;
    let totalOptimized = 0;
    let totalFailed = 0;
    let totalScore = 0;
    let totalCharactersConsumed = 0;

    for (let i = 0; i < chapters.length; i++) {
      const chapter = chapters[i];
      try {
        // 步骤1: 生成章节梗概（如果还没有）
        if (!chapter.summary || chapter.summary.length < 20) {
          const summary = await this.generateChapterSummary(task, chapter.id);
          chapter.summary = summary;
          await this.chapterRepository.save(chapter);
        }

        // 步骤2: 审稿
        const reviewReport = await this.reviewChapter(task, chapter.id);
        totalReviewed++;
        totalScore += reviewReport.score;

        // 步骤3: 如果有高或中严重度问题，进行优化
        const hasIssues = reviewReport.issues.some(
          (issue) => issue.severity === 'high' || issue.severity === 'medium',
        );

        if (hasIssues) {
          await this.optimizeWithContext(task, chapter.id, reviewReport);
          totalOptimized++;
        }

        totalCharactersConsumed += 3000; // 预估每章消耗3000字

        // 推送实时进度
        const currentTotal = totalReviewed + totalFailed;
        this.emitProgress(task, {
          event: 'stage_progress',
          stage: StageType.STAGE_5_REVIEW,
          data: {
            current: currentTotal,
            total: chapters.length,
            percentage: (currentTotal / chapters.length) * 100,
            message: `正在审稿优化第${currentTotal}/${chapters.length}章...`,
          },
        });
      } catch (error) {
        this.logger.error(
          `Failed to review chapter ${chapter.id}:`,
          error.message,
        );
        totalFailed++;
      }
    }

    const averageScore = totalReviewed > 0 ? totalScore / totalReviewed : 0;

    return {
      success: true,
      stage: StageType.STAGE_5_REVIEW,
      data: {
        totalChapters: chapters.length,
        reviewed: totalReviewed,
        optimized: totalOptimized,
        failed: totalFailed,
        averageScore,
      },
      charactersConsumed: isNaN(totalCharactersConsumed) ? 0 : totalCharactersConsumed,
      message: `审稿完成，平均评分${averageScore.toFixed(1)}分`,
    };
  }

  /**
   * 审稿单个章节
   */
  async reviewChapter(
    task: BookCreationTask,
    chapterId: number,
  ): Promise<ReviewReport> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new Error(`Chapter ${chapterId} not found`);
    }

    const promptId = task.promptConfig?.reviewPromptId;
    if (!promptId) {
      throw new Error('请配置章节审稿提示词（reviewPromptId）');
    }

    const prompt = await this.getPromptById(promptId);

    // 准备生成参数
    const generateOptions: any = {
      promptId: prompt.id,
      parameters: {
        章节标题: chapter.title,
        章节正文: chapter.content,
      },
    };
    
    if (task.novelId) {
      generateOptions.novelId = task.novelId;
    }

    const result = await this.writingGenerationService.generate(
      generateOptions,
      task.userId,
    );

    // 解析审稿报告
    const report = JSON.parse(result.content);

    return {
      chapterId,
      score: report.score || 0,
      issues: report.issues || [],
      suggestions: report.suggestions || [],
      strengths: report.strengths || [],
    };
  }

  /**
   * 生成章节梗概
   */
  async generateChapterSummary(
    task: BookCreationTask,
    chapterId: number,
  ): Promise<string> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new Error(`Chapter ${chapterId} not found`);
    }

    const promptId = task.promptConfig?.summaryPromptId;
    if (!promptId) {
      throw new Error('请配置章节梗概生成提示词（summaryPromptId）');
    }

    const prompt = await this.getPromptById(promptId);

    // 准备生成参数
    const generateOptions: any = {
      promptId: prompt.id,
      parameters: {
        章节标题: chapter.title,
        章节正文: chapter.content,
      },
    };
    
    if (task.novelId) {
      generateOptions.novelId = task.novelId;
    }

    const result = await this.writingGenerationService.generate(
      generateOptions,
      task.userId,
    );

    return result.content.trim();
  }

  /**
   * 根据审稿报告优化章节
   */
  async optimizeWithContext(
    task: BookCreationTask,
    chapterId: number,
    reviewReport: ReviewReport,
  ): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new Error(`Chapter ${chapterId} not found`);
    }

    // 获取前文梗概
    const previousChapters = await this.chapterRepository.find({
      where: { novelId: task.novelId },
      order: { order: 'ASC' },
    });

    const previousSummaries = previousChapters
      .filter((c) => c.order < chapter.order && c.summary)
      .map((c) => `第${c.order + 1}章: ${c.summary}`);

    const promptId = task.promptConfig?.reviewPromptId;
    if (!promptId) {
      throw new Error('请配置章节审稿提示词（reviewPromptId）');
    }

    const prompt = await this.getPromptById(promptId);

    // 准备生成参数
    const generateOptions: any = {
      promptId: prompt.id,
      parameters: {
        章节标题: chapter.title,
        章节正文: chapter.content,
        审稿报告JSON: JSON.stringify(reviewReport),
        前面章节的梗概: previousSummaries.join('\n'),
      },
    };
    
    if (task.novelId) {
      generateOptions.novelId = task.novelId;
    }

    const result = await this.writingGenerationService.generate(
      generateOptions,
      task.userId,
    );

    // 更新章节内容
    chapter.content = result.content;
    chapter.wordCount = result.content.replace(/\s+/g, '').length;
    await this.chapterRepository.save(chapter);

    return chapter;
  }

  /**
   * 根据ID查找提示词（带缓存）
   */
  private async getPromptById(id: number): Promise<Prompt> {
    // 验证 ID
    const safeId = Number(id);
    if (isNaN(safeId) || !isFinite(safeId) || safeId <= 0) {
      this.logger.error(`Invalid prompt id: ${id}, type: ${typeof id}`);
      throw new Error(`无效的提示词ID: ${id}`);
    }
    
    if (this.promptCache.has(safeId)) {
      return this.promptCache.get(safeId)!;
    }

    const prompt = await this.promptRepository.findOne({ where: { id: safeId } });
    if (!prompt) {
      throw new Error(`未找到提示词ID: ${safeId}`);
    }

    this.promptCache.set(safeId, prompt);
    return prompt;
  }

  /**
   * 发送WebSocket进度事件
   */
  private emitProgress(task: BookCreationTask, data: any): void {
    try {
      this.webSocketGateway.emitBookCreationProgress(task.id, data);
    } catch (error) {
      this.logger.error('Failed to emit progress:', error);
    }
  }
}

