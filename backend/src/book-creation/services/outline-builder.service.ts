import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookCreationTask, OutlineNode } from '../entities';
import { Novel } from '../../novels/entities/novel.entity';
import { Volume } from '../../novels/entities/volume.entity';
import { Chapter } from '../../novels/entities/chapter.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { OutlineNodeStatus, StageType } from '../enums';
import { StageResult } from '../interfaces';
import { WritingGenerationService } from '../../generation/services/writing-generation.service';
import { WebSocketGateway } from '../../websocket/websocket.gateway';
import { CharacterWorldviewExtractorService } from './character-worldview-extractor.service';

/**
 * 大纲构建服务
 * 负责构建和管理三级大纲结构
 */
@Injectable()
export class OutlineBuilderService {
  private readonly logger = new Logger(OutlineBuilderService.name);
  
  // 提示词缓存
  private readonly promptCache = new Map<number, Prompt>();

  constructor(
    @InjectRepository(OutlineNode)
    private readonly outlineNodeRepository: Repository<OutlineNode>,
    @InjectRepository(Novel)
    private readonly novelRepository: Repository<Novel>,
    @InjectRepository(Volume)
    private readonly volumeRepository: Repository<Volume>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    private readonly writingGenerationService: WritingGenerationService,
    @Inject(forwardRef(() => WebSocketGateway))
    private readonly webSocketGateway: WebSocketGateway,
    private readonly characterWorldviewExtractor: CharacterWorldviewExtractorService,
  ) {}

  /**
   * 构建完整的大纲（三级结构）
   */
  async buildCompleteOutline(task: BookCreationTask): Promise<StageResult> {
    this.logger.log(`Building complete outline for task ${task.id}`);

    let totalCharactersConsumed = 0;

    // 第1步：生成主大纲（level 1）
    this.emitProgress(task, {
      event: 'stage_progress',
      stage: StageType.STAGE_3_OUTLINE,
      data: { message: '正在生成主大纲...' },
    });
    const mainOutlineNodes = await this.buildMainOutline(task);
    totalCharactersConsumed += 2000; // 预估消耗

    // 第2步：为每个主大纲生成卷纲（level 2）
    for (let i = 0; i < mainOutlineNodes.length; i++) {
      const mainNode = mainOutlineNodes[i];
      this.emitProgress(task, {
        event: 'stage_progress',
        stage: StageType.STAGE_3_OUTLINE,
        data: {
          message: `正在生成卷纲 ${i + 1}/${mainOutlineNodes.length}...`,
        },
      });
      const volumeNodes = await this.generateVolumeOutlines(task, mainNode);
      totalCharactersConsumed += 1500; // 预估消耗

      // 第3步：为每个卷纲生成细纲（level 3）
      for (const volumeNode of volumeNodes) {
        await this.generateChapterOutlines(task, volumeNode);
        totalCharactersConsumed += 1000; // 预估消耗
      }
    }

    // 第4步：同步大纲到Novel
    await this.syncToNovel(task.id, task.novelId);

    // 第5步：提取人物卡和世界观（新增）
    try {
      this.emitProgress(task, {
        event: 'stage_progress',
        stage: StageType.STAGE_3_OUTLINE,
        data: { message: '正在提取人物卡和世界观...' },
      });
      const extractResult = await this.characterWorldviewExtractor.extractFromOutline(task);
      this.logger.log(
        `提取完成: ${extractResult.charactersCreated} 个人物卡, ${extractResult.worldSettingsCreated} 个世界观`,
      );
    } catch (error) {
      this.logger.error(`提取人物卡和世界观失败: ${error.message}`);
      // 不阻塞流程，只记录错误
    }

    return {
      success: true,
      stage: StageType.STAGE_3_OUTLINE,
      data: {
        mainOutlineCount: mainOutlineNodes.length,
        message: '大纲生成完成',
      },
      charactersConsumed: isNaN(totalCharactersConsumed) ? 0 : totalCharactersConsumed,
      message: '大纲生成成功',
    };
  }

  /**
   * 构建主大纲（level 1）
   */
  private async buildMainOutline(
    task: BookCreationTask,
  ): Promise<OutlineNode[]> {
    const promptId = task.promptConfig?.mainOutlinePromptId;
    if (!promptId) {
      throw new Error('请配置主大纲生成提示词（mainOutlinePromptId）');
    }

    const prompt = await this.getPromptById(promptId);

    // 准备生成参数
    const generateOptions: any = {
      promptId: prompt.id,
      parameters: {
        书名: task.processedData?.selectedTitle || '',
        简介: task.processedData?.synopsis || '',
        脑洞: task.processedData?.brainstorm || '',
      },
    };
    
    // 阶段3执行时，Novel应该已创建（阶段2创建），但做个保护
    if (task.novelId) {
      generateOptions.novelId = task.novelId;
    }

    const result = await this.writingGenerationService.generate(
      generateOptions,
      task.userId,
    );

    const mainOutlineData = JSON.parse(result.content);
    const nodes: OutlineNode[] = [];

    for (const [index, nodeData] of mainOutlineData.entries()) {
      const node = this.outlineNodeRepository.create({
        taskId: task.id,
        novelId: task.novelId,
        level: 1,
        title: nodeData.title,
        content: nodeData.content,
        order: index,
        status: OutlineNodeStatus.DRAFT,
      });

      const savedNode = await this.outlineNodeRepository.save(node);
      nodes.push(savedNode);
    }

    return nodes;
  }

  /**
   * 生成卷纲（level 2）
   */
  private async generateVolumeOutlines(
    task: BookCreationTask,
    mainNode: OutlineNode,
  ): Promise<OutlineNode[]> {
    const promptId = task.promptConfig?.volumeOutlinePromptId;
    if (!promptId) {
      throw new Error('请配置卷纲生成提示词（volumeOutlinePromptId）');
    }

    const prompt = await this.getPromptById(promptId);

    // 准备生成参数
    const generateOptions: any = {
      promptId: prompt.id,
      parameters: {
        主大纲标题: mainNode.title,
        主大纲内容: mainNode.content,
      },
    };
    
    if (task.novelId) {
      generateOptions.novelId = task.novelId;
    }

    const result = await this.writingGenerationService.generate(
      generateOptions,
      task.userId,
    );

    const volumeOutlineData = JSON.parse(result.content);
    const nodes: OutlineNode[] = [];

    for (const [index, volData] of volumeOutlineData.entries()) {
      // 创建Volume实体
      const volume = this.volumeRepository.create({
        novelId: task.novelId,
        name: volData.title,
        description: volData.description,
        order: index,
      });
      const savedVolume = await this.volumeRepository.save(volume);

      // 创建OutlineNode
      const node = this.outlineNodeRepository.create({
        taskId: task.id,
        novelId: task.novelId,
        parentId: mainNode.id,
        level: 2,
        title: volData.title,
        content: volData.description,
        order: index,
        status: OutlineNodeStatus.DRAFT,
        volumeId: savedVolume.id,
      });

      const savedNode = await this.outlineNodeRepository.save(node);
      nodes.push(savedNode);
    }

    return nodes;
  }

  /**
   * 生成细纲（level 3）
   */
  private async generateChapterOutlines(
    task: BookCreationTask,
    volumeNode: OutlineNode,
  ): Promise<OutlineNode[]> {
    const promptId = task.promptConfig?.chapterOutlinePromptId;
    if (!promptId) {
      throw new Error('请配置细纲生成提示词（chapterOutlinePromptId）');
    }

    const prompt = await this.getPromptById(promptId);

    // 准备生成参数
    const generateOptions: any = {
      promptId: prompt.id,
      parameters: {
        卷标题: volumeNode.title,
        卷描述: volumeNode.content,
      },
    };
    
    if (task.novelId) {
      generateOptions.novelId = task.novelId;
    }

    const result = await this.writingGenerationService.generate(
      generateOptions,
      task.userId,
    );

    const chapterOutlineData = JSON.parse(result.content);
    const nodes: OutlineNode[] = [];

    for (const [index, chapterData] of chapterOutlineData.entries()) {
      // 创建Chapter实体（仅标题和梗概）
      const chapter = this.chapterRepository.create({
        novelId: task.novelId,
        volumeId: volumeNode.volumeId,
        title: chapterData.title,
        summary: chapterData.summary,
        content: '', // 正文在阶段4生成
        order: index,
      });
      const savedChapter = await this.chapterRepository.save(chapter);

      // 创建OutlineNode
      const node = this.outlineNodeRepository.create({
        taskId: task.id,
        novelId: task.novelId,
        parentId: volumeNode.id,
        level: 3,
        title: chapterData.title,
        content: JSON.stringify(chapterData),
        order: index,
        status: OutlineNodeStatus.DRAFT,
        chapterId: savedChapter.id,
      });

      const savedNode = await this.outlineNodeRepository.save(node);
      nodes.push(savedNode);
    }

    return nodes;
  }

  /**
   * 同步大纲到Novel
   */
  private async syncToNovel(taskId: number, novelId: number): Promise<void> {
    // 获取完整大纲树
    const outlineTree = await this.getOutlineTree(taskId);

    // 大纲数据已保存在 OutlineNode 表中，这里不需要额外保存到 Novel
    // 如果 Novel 表有 outlineData 字段，可以取消注释下面的代码
    // await this.novelRepository.update(novelId, {
    //   outlineData: outlineTree,
    // });
    
    this.logger.log(`Outline synced for novel ${novelId}, ${outlineTree.length} root nodes`);
  }

  /**
   * 获取完整大纲树
   */
  async getOutlineTree(taskId: number): Promise<any[]> {
    const allNodes = await this.outlineNodeRepository.find({
      where: { taskId },
      order: { level: 'ASC', order: 'ASC' },
    });

    // 构建树形结构
    const nodeMap = new Map();
    const rootNodes: any[] = [];

    // 第一遍：创建所有节点的映射
    for (const node of allNodes) {
      nodeMap.set(node.id, { ...node, children: [] });
    }

    // 第二遍：构建父子关系
    for (const node of allNodes) {
      const nodeWithChildren = nodeMap.get(node.id);
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children.push(nodeWithChildren);
        }
      } else {
        rootNodes.push(nodeWithChildren);
      }
    }

    return rootNodes;
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

