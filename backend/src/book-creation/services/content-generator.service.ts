import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookCreationTask } from '../entities';
import { Chapter } from '../../novels/entities/chapter.entity';
import { Character } from '../../novels/entities/character.entity';
import { WorldSetting } from '../../novels/entities/world-setting.entity';
import { Memo } from '../../novels/entities/memo.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { StageType } from '../enums';
import { StageResult, GenerationContext } from '../interfaces';
import { WritingGenerationService } from '../../generation/services/writing-generation.service';
import { WebSocketGateway } from '../../websocket/websocket.gateway';

/**
 * 内容生成服务
 * 负责批量生成章节正文
 */
@Injectable()
export class ContentGeneratorService {
  private readonly logger = new Logger(ContentGeneratorService.name);
  private readonly DEFAULT_CONCURRENCY_LIMIT = 5; // 默认并发限制
  
  // 提示词缓存
  private readonly promptCache = new Map<number, Prompt>();

  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    @InjectRepository(WorldSetting)
    private readonly worldSettingRepository: Repository<WorldSetting>,
    @InjectRepository(Memo)
    private readonly memoRepository: Repository<Memo>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    private readonly writingGenerationService: WritingGenerationService,
    @Inject(forwardRef(() => WebSocketGateway))
    private readonly webSocketGateway: WebSocketGateway,
  ) {}

  /**
   * 批量生成所有章节
   */
  async batchGenerateAllChapters(task: BookCreationTask): Promise<StageResult> {
    this.logger.log(`Batch generating all chapters for task ${task.id}`);

    // 获取所有待生成的章节
    const chapters = await this.chapterRepository.find({
      where: { novelId: task.novelId },
      order: { order: 'ASC' },
      relations: ['volume'],
    });

    const chapterIds = chapters.map((c) => c.id);
    const summary = await this.batchGenerateChapters(
      task,
      chapterIds,
    );

    return {
      success: true,
      stage: StageType.STAGE_4_CONTENT,
      data: {
        totalGenerated: summary.totalGenerated,
        totalFailed: summary.totalFailed,
        failedChapters: summary.failedChapters,
      },
      charactersConsumed: summary.charactersConsumed,
      message: `章节正文生成完成，成功${summary.totalGenerated}章，失败${summary.totalFailed}章`,
    };
  }

  /**
   * 批量生成章节
   */
  async batchGenerateChapters(
    task: BookCreationTask,
    chapterIds: number[],
  ): Promise<{
    totalGenerated: number;
    totalFailed: number;
    charactersConsumed: number;
    failedChapters: Array<{ chapterId: number; error: string }>;
  }> {
    let totalGenerated = 0;
    let totalFailed = 0;
    let totalCharactersConsumed = 0;
    const failedChapters: Array<{ chapterId: number; error: string }> = [];

    // 分批处理，使用用户配置的并发数
    const concurrencyLimit = task.taskConfig?.concurrencyLimit || this.DEFAULT_CONCURRENCY_LIMIT;
    const chunks = this.chunkArray(chapterIds, concurrencyLimit);

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map((chapterId) => this.generateChapterContent(task, chapterId)),
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          totalGenerated++;
          totalCharactersConsumed += result.value.charactersConsumed || 0;
        } else {
          totalFailed++;
          failedChapters.push({
            chapterId: chunk[index],
            error: result.reason?.message || '未知错误',
          });
        }

        // 推送实时进度
        const currentTotal = totalGenerated + totalFailed;
        this.emitProgress(task, {
          event: 'stage_progress',
          stage: StageType.STAGE_4_CONTENT,
          data: {
            current: currentTotal,
            total: chapterIds.length,
            percentage: (currentTotal / chapterIds.length) * 100,
            message: `正在生成第${currentTotal}/${chapterIds.length}章...`,
          },
        });
      });
    }

    return {
      totalGenerated,
      totalFailed,
      charactersConsumed: totalCharactersConsumed,
      failedChapters,
    };
  }

  /**
   * 生成单个章节内容
   */
  private async generateChapterContent(
    task: BookCreationTask,
    chapterId: number,
  ): Promise<{ chapter: Chapter; charactersConsumed: number }> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume'],
    });

    if (!chapter) {
      throw new Error(`Chapter ${chapterId} not found`);
    }

    // 构建生成上下文
    const context = await this.buildContext(task.novelId, chapterId);

    // 获取章节正文生成提示词（带缓存）
    const promptId = task.promptConfig?.contentPromptId;
    if (!promptId) {
      throw new Error('请配置章节正文生成提示词（contentPromptId）');
    }

    const prompt = await this.getPromptById(promptId);

    // 调用AI生成
    // 注意：所有数据都来自数据库（由AI在之前阶段生成或用户创建），只有 taskConfig 是用户配置
    const result = await this.writingGenerationService.generate(
      {
        promptId: prompt.id,
        novelId: task.novelId, // 用于关联加载人物卡和世界观（如果提示词使用插槽机制）
        parameters: {
          // 从数据库读取的AI生成内容（阶段3生成）
          章节标题: chapter.title,
          章节梗概: chapter.summary,
          前面章节的梗概: context.previousChaptersSummaries.join('\n'),
          
          // 从数据库读取的人物卡和世界观（AI生成或用户创建）
          人物卡列表: this.formatCharacters(context.characters),
          世界观列表: this.formatWorldSettings(context.worldSettings),
        },
        // 注意：如果提示词使用了 character_slot 和 worldview_slot 插槽，
        // 应该通过 characterIds 和 worldSettingIds 传递，而不是格式化后作为参数
        // 当前实现兼容两种方式：既支持插槽，也支持参数占位符
      },
      task.userId,
    );

    // 更新章节内容
    chapter.content = result.content;
    chapter.wordCount = this.countWords(result.content);
    await this.chapterRepository.save(chapter);

    const charactersConsumed = Number(result.consumption?.totalCost) || 0;

    return { chapter, charactersConsumed: isNaN(charactersConsumed) ? 0 : charactersConsumed };
  }

  /**
   * 构建生成上下文
   */
  private async buildContext(
    novelId: number,
    chapterId: number,
  ): Promise<GenerationContext> {
    // 1. 加载人物卡
    const characters = await this.characterRepository.find({
      where: { novelId },
      order: { order: 'ASC' },
    });

    // 2. 加载世界观
    const worldSettings = await this.worldSettingRepository.find({
      where: { novelId },
      order: { order: 'ASC' },
    });

    // 3. 加载备忘录（只加载置顶的）
    const memos = await this.memoRepository.find({
      where: { novelId, isPinned: true },
    });

    // 4. 加载当前章节及前文梗概
    const currentChapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
      relations: ['volume'],
    });

    if (!currentChapter) {
      throw new Error(`Chapter ${chapterId} not found`);
    }

    const previousChapters = await this.chapterRepository.find({
      where: { 
        novelId, 
        volumeId: currentChapter.volumeId || undefined,
      },
      order: { order: 'ASC' },
    });

    const previousSummaries = previousChapters
      .filter((c) => c.order < currentChapter.order && c.summary)
      .map((c) => `第${c.order + 1}章: ${c.summary}`);

    return {
      chapterOutline: currentChapter.summary,
      characters,
      worldSettings,
      memos,
      previousChaptersSummaries: previousSummaries,
    };
  }

  /**
   * 格式化人物卡
   */
  private formatCharacters(characters: Character[]): string {
    return characters
      .map((c) => {
        const description = c.fields?.description || c.fields?.简介 || '';
        return `【${c.name}】: ${description}`;
      })
      .join('\n');
  }

  /**
   * 格式化世界观
   */
  private formatWorldSettings(settings: WorldSetting[]): string {
    return settings
      .map((s) => {
        const description = s.fields?.description || s.fields?.描述 || '';
        return `【${s.name}】: ${description}`;
      })
      .join('\n');
  }

  /**
   * 统计字数
   */
  private countWords(text: string): number {
    // 简单实现：去除空格后的字符数
    return text.replace(/\s+/g, '').length;
  }

  /**
   * 将数组分块
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
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

