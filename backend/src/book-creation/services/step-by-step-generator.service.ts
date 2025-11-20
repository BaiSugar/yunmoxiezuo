import { Injectable, Logger, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookCreationTask } from '../entities';
import { Chapter } from '../../novels/entities/chapter.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { StageType } from '../enums';
import { ReviewReport } from '../interfaces';
import { ContentGeneratorService } from './content-generator.service';
import { ReviewOptimizerService } from './review-optimizer.service';
import { WebSocketGateway } from '../../websocket/websocket.gateway';

/**
 * 步进式生成服务（人工干预模式）
 * 
 * 工作流：
 * 1. 生成一章正文
 * 2. 自动生成梗概
 * 3. AI审稿 → 返回审稿报告
 * 4. ⏸️ 暂停，等待人工决策（查看报告、手动修改、或让AI优化）
 * 5. 人工确认满意后，调用"继续下一章"接口
 * 
 * 这是一个 Human-in-the-loop 的半自动工作流
 */
@Injectable()
export class StepByStepGeneratorService {
  private readonly logger = new Logger(StepByStepGeneratorService.name);

  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(BookCreationTask)
    private readonly taskRepository: Repository<BookCreationTask>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    private readonly contentGeneratorService: ContentGeneratorService,
    private readonly reviewOptimizerService: ReviewOptimizerService,
    @Inject(forwardRef(() => WebSocketGateway))
    private readonly webSocketGateway: WebSocketGateway,
  ) {}

  /**
   * 生成单章（生成 → 梗概 → 审稿 → 返回报告，等待人工确认）
   * 
   * @param task 成书任务
   * @param chapterOrder 章节序号（从1开始），不传则生成下一章
   * @returns 生成结果和审稿报告
   */
  async generateNextChapter(
    task: BookCreationTask,
    chapterOrder?: number,
  ): Promise<{
    success: boolean;
    chapter: {
      id: number;
      order: number;
      title: string;
      content: string;
      summary: string;
      wordCount: number;
    };
    reviewReport: ReviewReport;
    nextChapterOrder: number | null;
    charactersConsumed: number;
    message: string;
  }> {
    this.logger.log(`Generating next chapter for task ${task.id}, order: ${chapterOrder || 'auto'}`);

    // 1. 确定要生成的章节
    const targetChapter = await this.getTargetChapter(task, chapterOrder);

    if (!targetChapter) {
      throw new BadRequestException('没有可生成的章节，请先创建大纲');
    }

    let totalCharactersConsumed = 0;

    try {
      // 推送进度：开始生成
      this.emitProgress(task, {
        event: 'chapter_generation_started',
        data: {
          chapterId: targetChapter.id,
          chapterOrder: targetChapter.order + 1,
          chapterTitle: targetChapter.title,
          message: `开始生成第${targetChapter.order + 1}章：${targetChapter.title}`,
        },
      });

      // 步骤1：生成章节正文
      this.emitProgress(task, {
        event: 'step_progress',
        data: {
          chapterId: targetChapter.id,
          step: 'generating',
          message: `正在生成第${targetChapter.order + 1}章正文...`,
        },
      });

      const generationResult = await this.contentGeneratorService['generateChapterContent'](
        task,
        targetChapter.id,
      );
      totalCharactersConsumed += generationResult.charactersConsumed || 0;

      // 重新加载章节以获取最新内容
      let chapter = await this.chapterRepository.findOne({
        where: { id: targetChapter.id },
      });

      if (!chapter) {
        throw new Error(`Chapter ${targetChapter.id} not found after generation`);
      }

      // 步骤2：生成章节梗概
      this.emitProgress(task, {
        event: 'step_progress',
        data: {
          chapterId: targetChapter.id,
          step: 'summarizing',
          message: `正在生成第${targetChapter.order + 1}章的梗概...`,
        },
      });

      const summary = await this.reviewOptimizerService.generateChapterSummary(
        task,
        targetChapter.id,
      );
      chapter.summary = summary;
      await this.chapterRepository.save(chapter);
      totalCharactersConsumed += 500; // 预估梗概生成消耗

      // 步骤3：AI审稿
      this.emitProgress(task, {
        event: 'step_progress',
        data: {
          chapterId: targetChapter.id,
          step: 'reviewing',
          message: `正在审稿第${targetChapter.order + 1}章...`,
        },
      });

      const reviewReport = await this.reviewOptimizerService.reviewChapter(
        task,
        targetChapter.id,
      );
      totalCharactersConsumed += 1000; // 预估审稿消耗

      // 步骤4：保存当前章节序号到任务
      await this.updateTaskCurrentChapter(task.id, targetChapter.order + 1);

      // 获取下一章信息
      const nextChapter = await this.getNextChapter(task, targetChapter.order + 1);

      // 推送完成事件（包含审稿报告）
      this.emitProgress(task, {
        event: 'chapter_generation_completed',
        data: {
          chapterId: targetChapter.id,
          chapterOrder: targetChapter.order + 1,
          chapterTitle: targetChapter.title,
          reviewReport,
          hasNextChapter: !!nextChapter,
          nextChapterOrder: nextChapter ? nextChapter.order + 1 : null,
          message: `第${targetChapter.order + 1}章生成完成，等待人工确认`,
        },
      });

      return {
        success: true,
        chapter: {
          id: chapter.id,
          order: chapter.order + 1, // 转换为从1开始
          title: chapter.title,
          content: chapter.content,
          summary: chapter.summary,
          wordCount: chapter.wordCount,
        },
        reviewReport,
        nextChapterOrder: nextChapter ? nextChapter.order + 1 : null,
        charactersConsumed: isNaN(totalCharactersConsumed) ? 0 : totalCharactersConsumed,
        message: `第${targetChapter.order + 1}章生成完成，请查看审稿报告`,
      };

    } catch (error) {
      this.logger.error(
        `Failed to generate chapter ${targetChapter.id}:`,
        error.message,
      );

      // 推送错误事件
      this.emitProgress(task, {
        event: 'chapter_generation_failed',
        data: {
          chapterId: targetChapter.id,
          chapterOrder: targetChapter.order + 1,
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * 继续生成下一章
   * 这是一个快捷接口，人工确认当前章节满意后调用
   */
  async continueToNextChapter(task: BookCreationTask): Promise<any> {
    // 从任务中获取当前章节序号
    const currentChapterOrder = task.processedData?.currentChapterOrder as number;

    if (!currentChapterOrder) {
      // 如果没有记录，默认从第一章开始
      return this.generateNextChapter(task, 1);
    }

    // 生成下一章
    const nextChapterOrder = currentChapterOrder + 1;
    return this.generateNextChapter(task, nextChapterOrder);
  }

  /**
   * 获取目标章节
   * @param task 任务
   * @param chapterOrder 指定的章节序号（从1开始），不传则自动确定
   */
  private async getTargetChapter(
    task: BookCreationTask,
    chapterOrder?: number,
  ): Promise<Chapter | null> {
    if (chapterOrder) {
      // 指定章节序号（从1开始，需要转换为从0开始的索引）
      return await this.chapterRepository.findOne({
        where: {
          novelId: task.novelId,
          order: chapterOrder - 1,
        },
      });
    }

    // 自动确定：查找下一个未生成的章节
    const currentChapterOrder = task.processedData?.currentChapterOrder as number;

    if (currentChapterOrder) {
      // 有记录，生成下一章
      return await this.chapterRepository.findOne({
        where: {
          novelId: task.novelId,
          order: currentChapterOrder, // currentChapterOrder已经是从0开始的
        },
      });
    }

    // 没有记录，从第一章开始
    return await this.chapterRepository.findOne({
      where: { novelId: task.novelId, order: 0 },
      order: { order: 'ASC' },
    });
  }

  /**
   * 获取下一章
   */
  private async getNextChapter(
    task: BookCreationTask,
    currentOrder: number,
  ): Promise<Chapter | null> {
    return await this.chapterRepository.findOne({
      where: {
        novelId: task.novelId,
        order: currentOrder, // currentOrder已经是从0开始的索引
      },
    });
  }

  /**
   * 更新任务的当前章节序号
   */
  private async updateTaskCurrentChapter(
    taskId: number,
    chapterOrder: number,
  ): Promise<void> {
    await this.taskRepository
      .createQueryBuilder()
      .update(BookCreationTask)
      .set({
        processedData: () => `JSON_SET(processed_data, '$.currentChapterOrder', ${chapterOrder})`,
      })
      .where('id = :taskId', { taskId })
      .execute();
  }

  /**
   * 发送WebSocket进度事件
   */
  private emitProgress(task: BookCreationTask, data: any): void {
    try {
      this.webSocketGateway.emitBookCreationProgress(task.id, {
        taskId: task.id,
        timestamp: new Date().toISOString(),
        ...data,
      });
    } catch (error) {
      this.logger.error('Failed to emit progress:', error);
    }
  }
}

