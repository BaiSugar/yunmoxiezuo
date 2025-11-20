import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, LessThan } from 'typeorm';
import { Chapter } from '../entities/chapter.entity';
import { ChapterVersion } from '../entities/chapter-version.entity';
import { Volume } from '../entities/volume.entity';
import { Novel } from '../entities/novel.entity';
import { CreateChapterDto } from '../dto/create-chapter.dto';
import { UpdateChapterDto } from '../dto/update-chapter.dto';

@Injectable()
export class ChaptersService {
  // 最多保留10个历史版本
  private readonly MAX_VERSIONS = 10;
  // 自动保存间隔：1分钟（毫秒）
  private readonly AUTO_SAVE_INTERVAL = 60000;

  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(ChapterVersion)
    private readonly versionRepository: Repository<ChapterVersion>,
    @InjectRepository(Volume)
    private readonly volumeRepository: Repository<Volume>,
    @InjectRepository(Novel)
    private readonly novelRepository: Repository<Novel>,
  ) {}

  /**
   * 计算字数（中英文混合）
   * 从HTML中提取纯文本后计算
   */
  private countWords(text: string): number {
    if (!text) return 0;
    
    // 从HTML中提取纯文本
    let plainText = text;
    
    // 如果包含HTML标签，提取纯文本
    if (text.includes('<') && text.includes('>')) {
      // 移除HTML标签
      plainText = text.replace(/<[^>]*>/g, '');
      // 解码HTML实体
      plainText = plainText
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    }
    
    // 移除空格、换行和标点
    const cleanText = plainText.replace(/[\s\n\r\t,。，！!？?；;：:、""''《》<>（）()【】\[\]]/g, '');
    return cleanText.length;
  }

  /**
   * 检查用户是否有权限访问此分卷
   */
  private async checkVolumeAccess(volumeId: number, userId: number): Promise<Volume> {
    const volume = await this.volumeRepository.findOne({
      where: { id: volumeId },
      relations: ['novel'],
    });

    if (!volume) {
      throw new NotFoundException('分卷不存在');
    }

    if (volume.novel.userId !== userId) {
      throw new ForbiddenException('无权访问此分卷');
    }

    return volume;
  }

  /**
   * 创建章节
   */
  async create(userId: number, createChapterDto: CreateChapterDto): Promise<Chapter> {
    // 验证novelId权限（所有章节都需要验证）
    const novel = await this.novelRepository.findOne({
      where: { id: createChapterDto.novelId },
    });

    if (!novel) {
      throw new NotFoundException('作品不存在');
    }

    if (novel.userId !== userId) {
      throw new ForbiddenException('无权为此作品创建章节');
    }

    // 验证权限（如果是分卷内章节，额外验证分卷是否属于该作品）
    if (createChapterDto.volumeId) {
      const volume = await this.volumeRepository.findOne({
        where: { id: createChapterDto.volumeId },
      });

      if (!volume) {
        throw new NotFoundException('分卷不存在');
      }

      if (volume.novelId !== createChapterDto.novelId) {
        throw new ForbiddenException('分卷不属于该作品');
      }
    }

    // 计算字数
    const wordCount = this.countWords(createChapterDto.content);

    const chapter = this.chapterRepository.create({
      ...createChapterDto,
      wordCount,
    });

    const savedChapter = await this.chapterRepository.save(chapter);

    // 创建初始版本
    await this.createVersion(savedChapter.id, savedChapter.title, savedChapter.content, '初始版本');

    // 更新分卷字数（如果属于分卷）
    if (savedChapter.volumeId) {
      await this.updateVolumeWordCount(savedChapter.volumeId);
    }
    
    // 更新作品总字数
    await this.updateNovelWordCount(savedChapter.novelId);

    return savedChapter;
  }

  /**
   * 获取分卷的所有章节
   */
  async findAllByVolume(volumeId: number, userId: number): Promise<Chapter[]> {
    await this.checkVolumeAccess(volumeId, userId);

    return await this.chapterRepository.find({
      where: { volumeId },
      order: { order: 'ASC' },
    });
  }

  /**
   * 获取章节详情
   */
  async findOne(id: number, userId: number): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
      relations: ['volume'],
    });

    if (!chapter) {
      throw new NotFoundException('章节不存在');
    }

    // 验证权限：通过 novelId 查询作品
    const novel = await this.novelRepository.findOne({
      where: { id: chapter.novelId },
    });

    if (!novel) {
      throw new NotFoundException('作品不存在');
    }

    if (novel.userId !== userId) {
      throw new ForbiddenException('无权访问此章节');
    }

    return chapter;
  }

  /**
   * 更新章节
   */
  async update(id: number, userId: number, updateChapterDto: UpdateChapterDto): Promise<Chapter> {
    const chapter = await this.findOne(id, userId);

    // 只在修改内容时才检查版本（优化性能）
    const hasContentUpdate = updateChapterDto.content !== undefined;
    const shouldCreateVersion = hasContentUpdate ? await this.shouldCreateVersion(id) : false;

    // 更新字数
    if (updateChapterDto.content) {
      updateChapterDto['wordCount'] = this.countWords(updateChapterDto.content);
    }

    // 处理volumeId变更时的globalOrder和order（快速路径）
    // 只有当仅更新volumeId且没有其他字段更新时才走快速路径
    if ('volumeId' in updateChapterDto && !hasContentUpdate && !updateChapterDto.title && updateChapterDto.summary === undefined) {
      const updateData: any = {};
      
      if (updateChapterDto.volumeId === null) {
        // 移动到独立章节
        updateData.volumeId = null;
        if (!updateChapterDto.globalOrder) {
          const maxGlobalOrder = await this.getMaxGlobalOrder(chapter.novelId);
          updateData.globalOrder = maxGlobalOrder + 1;
        } else {
          updateData.globalOrder = updateChapterDto.globalOrder;
        }
      } else {
        // 移动到分卷内
        updateData.volumeId = updateChapterDto.volumeId;
        updateData.globalOrder = null;
        if (!updateChapterDto.order) {
          const chaptersInVolume = await this.chapterRepository.count({
            where: { volumeId: updateChapterDto.volumeId },
          });
          updateData.order = chaptersInVolume + 1;
        } else {
          updateData.order = updateChapterDto.order;
        }
      }
      
      // 一次性更新所有字段并立即返回（跳过版本检查）
      await this.chapterRepository.update(chapter.id, updateData);
      Object.assign(chapter, updateData);
      return chapter;
    }

    // 处理其他字段的更新
    const otherUpdates: any = {};
    if (updateChapterDto.title !== undefined) {
      otherUpdates.title = updateChapterDto.title;
    }
    if (updateChapterDto.content !== undefined) {
      otherUpdates.content = updateChapterDto.content;
    }
    if (updateChapterDto.summary !== undefined) {
      otherUpdates.summary = updateChapterDto.summary;
    }
    if (updateChapterDto['wordCount'] !== undefined) {
      otherUpdates.wordCount = updateChapterDto['wordCount'];
    }
    // 处理排序字段（修复移动端排序失败的问题）
    if (updateChapterDto.order !== undefined) {
      otherUpdates.order = updateChapterDto.order;
    }
    if (updateChapterDto.globalOrder !== undefined) {
      otherUpdates.globalOrder = updateChapterDto.globalOrder;
    }
    
    // 如果有其他字段需要更新
    if (Object.keys(otherUpdates).length > 0) {
      Object.assign(chapter, otherUpdates);
      await this.chapterRepository.save(chapter);
    }
    
    const savedChapter = chapter;

    // 如果需要，创建历史版本
    if (shouldCreateVersion) {
      await this.createVersion(id, savedChapter.title, savedChapter.content, '自动保存');
    }

    // 更新分卷字数（如果属于分卷）
    if (savedChapter.volumeId) {
      await this.updateVolumeWordCount(savedChapter.volumeId);
    }
    
    // 更新作品总字数
    await this.updateNovelWordCount(savedChapter.novelId);

    return savedChapter;
  }

  /**
   * 获取作品中最大的globalOrder（优化版本）
   */
  private async getMaxGlobalOrder(novelId: number): Promise<number> {
    // 使用子查询一次性获取最大值，性能更优
    const maxChapterOrder = await this.chapterRepository
      .createQueryBuilder('chapter')
      .where('chapter.novelId = :novelId', { novelId })
      .andWhere('chapter.volumeId IS NULL')
      .andWhere('chapter.globalOrder IS NOT NULL')
      .select('MAX(chapter.globalOrder)', 'max')
      .getRawOne();

    const maxVolumeOrder = await this.volumeRepository
      .createQueryBuilder('volume')
      .where('volume.novelId = :novelId', { novelId })
      .andWhere('volume.globalOrder IS NOT NULL')
      .select('MAX(volume.globalOrder)', 'max')
      .getRawOne();

    const chapterMax = maxChapterOrder?.max || 0;
    const volumeMax = maxVolumeOrder?.max || 0;

    return Math.max(chapterMax, volumeMax);
  }

  /**
   * 删除章节（软删除）
   */
  async remove(id: number, userId: number): Promise<void> {
    const chapter = await this.findOne(id, userId);
    const novelId = chapter.novelId;
    const volumeId = chapter.volumeId;
    
    await this.chapterRepository.softRemove(chapter);
    
    // 更新分卷字数（如果属于分卷）
    if (volumeId) {
      await this.updateVolumeWordCount(volumeId);
    }
    
    // 更新作品总字数
    await this.updateNovelWordCount(novelId);
  }

  /**
   * 判断是否应该创建新版本
   * 规则：距离上次版本创建超过1分钟
   */
  private async shouldCreateVersion(chapterId: number): Promise<boolean> {
    const latestVersion = await this.versionRepository.findOne({
      where: { chapterId },
      order: { createdAt: 'DESC' },
    });

    if (!latestVersion) {
      return true;
    }

    const timeDiff = Date.now() - latestVersion.createdAt.getTime();
    return timeDiff >= this.AUTO_SAVE_INTERVAL;
  }

  /**
   * 创建章节历史版本
   */
  private async createVersion(
    chapterId: number,
    title: string,
    content: string,
    note?: string,
  ): Promise<void> {
    // 获取最新版本号
    const latestVersion = await this.versionRepository.findOne({
      where: { chapterId },
      order: { version: 'DESC' },
    });

    const newVersionNumber = latestVersion ? latestVersion.version + 1 : 1;

    // 创建新版本
    const version = this.versionRepository.create({
      chapterId,
      version: newVersionNumber,
      title,
      content,
      wordCount: this.countWords(content),
      note,
    });

    await this.versionRepository.save(version);

    // 清理旧版本，只保留最新的10个
    await this.cleanupOldVersions(chapterId);
  }

  /**
   * 清理旧版本，只保留最新的10个
   */
  private async cleanupOldVersions(chapterId: number): Promise<void> {
    const versions = await this.versionRepository.find({
      where: { chapterId },
      order: { version: 'DESC' },
    });

    if (versions.length > this.MAX_VERSIONS) {
      const versionsToDelete = versions.slice(this.MAX_VERSIONS);
      await this.versionRepository.remove(versionsToDelete);
    }
  }

  /**
   * 获取章节的所有历史版本
   */
  async getVersions(chapterId: number, userId: number): Promise<ChapterVersion[]> {
    await this.findOne(chapterId, userId);

    return await this.versionRepository.find({
      where: { chapterId },
      order: { version: 'DESC' },
    });
  }

  /**
   * 获取特定版本详情
   */
  async getVersion(chapterId: number, versionNumber: number, userId: number): Promise<ChapterVersion> {
    await this.findOne(chapterId, userId);

    const version = await this.versionRepository.findOne({
      where: { chapterId, version: versionNumber },
    });

    if (!version) {
      throw new NotFoundException('版本不存在');
    }

    return version;
  }

  /**
   * 恢复到某个历史版本
   */
  async restoreVersion(chapterId: number, versionNumber: number, userId: number): Promise<Chapter> {
    const chapter = await this.findOne(chapterId, userId);
    const version = await this.getVersion(chapterId, versionNumber, userId);

    // 先保存当前版本到历史
    await this.createVersion(chapterId, chapter.title, chapter.content, `恢复前的版本`);

    // 恢复到指定版本
    chapter.title = version.title;
    chapter.content = version.content;
    chapter.wordCount = version.wordCount;

    const savedChapter = await this.chapterRepository.save(chapter);

    // 创建恢复记录
    await this.createVersion(chapterId, version.title, version.content, `从版本${versionNumber}恢复`);

    return savedChapter;
  }

  /**
   * 获取作品的所有章节（包括独立章节）
   */
  async findAllByNovel(novelId: number, userId: number): Promise<Chapter[]> {
    // 验证用户是否有权限访问此作品
    const novel = await this.novelRepository.findOne({
      where: { id: novelId },
    });

    if (!novel) {
      throw new NotFoundException('作品不存在');
    }

    if (novel.userId !== userId) {
      throw new ForbiddenException('无权访问此作品');
    }

    // 直接通过 novelId 查询所有章节（包括独立章节）
    const chapters = await this.chapterRepository.find({
      where: { novelId },
      order: {
        globalOrder: 'ASC',
        order: 'ASC',
      },
    });

    return chapters;
  }

  /**
   * 批量更新章节顺序
   */
  async batchUpdate(
    updates: Array<{
      id: number;
      order?: number;
      globalOrder?: number | null;
      volumeId?: number | null;
    }>,
    userId: number,
  ): Promise<void> {
    // 验证所有章节的访问权限
    for (const update of updates) {
      const chapter = await this.chapterRepository.findOne({
        where: { id: update.id },
      });

      if (!chapter) {
        throw new NotFoundException(`章节ID ${update.id} 不存在`);
      }

      // 通过novelId验证权限
      const novel = await this.novelRepository.findOne({
        where: { id: chapter.novelId },
      });

      if (!novel || novel.userId !== userId) {
        throw new ForbiddenException(`无权修改章节ID ${update.id}`);
      }

      // 如果要移动到另一个分卷，需要检查目标分卷权限
      if (update.volumeId !== undefined && update.volumeId !== null) {
        await this.checkVolumeAccess(update.volumeId, userId);
      }
    }

    // 批量更新
    await this.chapterRepository.manager.transaction(async (manager) => {
      for (const update of updates) {
        const chapter = await manager.findOne(Chapter, { where: { id: update.id } });
        if (chapter) {
          if (update.order !== undefined) chapter.order = update.order;
          if (update.globalOrder !== undefined) chapter.globalOrder = update.globalOrder;
          if (update.volumeId !== undefined) chapter.volumeId = update.volumeId;
          await manager.save(chapter);
        }
      }
    });
  }

  /**
   * 更新分卷的总字数
   * 统计该分卷下所有章节的字数总和
   */
  private async updateVolumeWordCount(volumeId: number): Promise<void> {
    // 统计该分卷下所有章节的总字数
    const result = await this.chapterRepository
      .createQueryBuilder('chapter')
      .select('SUM(chapter.wordCount)', 'total')
      .where('chapter.volumeId = :volumeId', { volumeId })
      .andWhere('chapter.deletedAt IS NULL') // 排除软删除的章节
      .getRawOne();

    const totalWordCount = parseInt(result?.total || '0', 10);

    // 更新分卷的总字数
    await this.volumeRepository.update(volumeId, { wordCount: totalWordCount });
  }

  /**
   * 更新作品的总字数
   * 统计该作品下所有章节的字数总和
   */
  private async updateNovelWordCount(novelId: number): Promise<void> {
    // 统计该作品下所有章节的总字数
    const result = await this.chapterRepository
      .createQueryBuilder('chapter')
      .select('SUM(chapter.wordCount)', 'total')
      .where('chapter.novelId = :novelId', { novelId })
      .andWhere('chapter.deletedAt IS NULL') // 排除软删除的章节
      .getRawOne();

    const totalWordCount = parseInt(result?.total || '0', 10);

    // 更新作品的总字数
    await this.novelRepository.update(novelId, { totalWordCount });
  }
}
