import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Volume } from '../entities/volume.entity';
import { Novel } from '../entities/novel.entity';
import { CreateVolumeDto } from '../dto/create-volume.dto';
import { UpdateVolumeDto } from '../dto/update-volume.dto';

@Injectable()
export class VolumesService {
  constructor(
    @InjectRepository(Volume)
    private readonly volumeRepository: Repository<Volume>,
    @InjectRepository(Novel)
    private readonly novelRepository: Repository<Novel>,
  ) {}

  /**
   * 检查用户是否有权限访问此作品
   */
  private async checkNovelAccess(novelId: number, userId: number): Promise<Novel> {
    const novel = await this.novelRepository.findOne({
      where: { id: novelId },
    });

    if (!novel) {
      throw new NotFoundException('作品不存在');
    }

    if (novel.userId !== userId) {
      throw new ForbiddenException('无权访问此作品');
    }

    return novel;
  }

  /**
   * 创建分卷
   */
  async create(novelId: number, userId: number, createVolumeDto: CreateVolumeDto): Promise<Volume> {
    await this.checkNovelAccess(novelId, userId);

    const volume = this.volumeRepository.create({
      ...createVolumeDto,
      novelId,
    });

    return await this.volumeRepository.save(volume);
  }

  /**
   * 获取作品的所有分卷
   */
  async findAllByNovel(novelId: number, userId: number): Promise<Volume[]> {
    await this.checkNovelAccess(novelId, userId);

    return await this.volumeRepository.find({
      where: { novelId },
      order: { order: 'ASC' },
      relations: ['chapters'],
    });
  }

  /**
   * 获取分卷详情
   */
  async findOne(id: number, userId: number): Promise<Volume> {
    const volume = await this.volumeRepository.findOne({
      where: { id },
      relations: ['novel', 'chapters'],
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
   * 更新分卷
   */
  async update(id: number, userId: number, updateVolumeDto: UpdateVolumeDto): Promise<Volume> {
    const volume = await this.findOne(id, userId);
    Object.assign(volume, updateVolumeDto);
    return await this.volumeRepository.save(volume);
  }

  /**
   * 删除分卷（软删除）
   */
  async remove(id: number, userId: number): Promise<void> {
    const volume = await this.findOne(id, userId);
    await this.volumeRepository.softRemove(volume);
  }

  /**
   * 更新分卷字数统计
   */
  async updateWordCount(id: number): Promise<void> {
    const volume = await this.volumeRepository.findOne({
      where: { id },
      relations: ['chapters'],
    });

    if (volume) {
      const wordCount = volume.chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);
      volume.wordCount = wordCount;
      await this.volumeRepository.save(volume);
    }
  }

  /**
   * 批量更新分卷顺序
   */
  async batchUpdate(
    updates: Array<{
      id: number;
      order?: number;
      globalOrder?: number;
    }>,
    userId: number,
  ): Promise<void> {
    // 验证所有分卷的访问权限
    for (const update of updates) {
      const volume = await this.volumeRepository.findOne({
        where: { id: update.id },
        relations: ['novel'],
      });

      if (!volume) {
        throw new NotFoundException(`分卷ID ${update.id} 不存在`);
      }

      if (volume.novel.userId !== userId) {
        throw new ForbiddenException(`无权修改分卷ID ${update.id}`);
      }
    }

    // 批量更新
    await this.volumeRepository.manager.transaction(async (manager) => {
      for (const update of updates) {
        const volume = await manager.findOne(Volume, { where: { id: update.id } });
        if (volume) {
          if (update.order !== undefined) volume.order = update.order;
          if (update.globalOrder !== undefined) volume.globalOrder = update.globalOrder;
          await manager.save(volume);
        }
      }
    });
  }
}
