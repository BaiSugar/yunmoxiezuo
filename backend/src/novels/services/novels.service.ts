import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Novel } from '../entities/novel.entity';
import { CreateNovelDto } from '../dto/create-novel.dto';
import { UpdateNovelDto } from '../dto/update-novel.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class NovelsService {
  constructor(
    @InjectRepository(Novel)
    private readonly novelRepository: Repository<Novel>,
  ) {}

  /**
   * 创建作品
   */
  async create(userId: number, createNovelDto: CreateNovelDto): Promise<Novel> {
    const novel = this.novelRepository.create({
      ...createNovelDto,
      userId,
    });
    return await this.novelRepository.save(novel);
  }

  /**
   * 获取用户的所有作品（支持分页）
   */
  async findAllByUser(
    userId: number,
    paginationDto?: PaginationDto,
  ): Promise<PaginatedResult<Novel> | Novel[]> {
    // 如果没有传分页参数，返回所有数据（向后兼容）
    if (!paginationDto || (!paginationDto.page && !paginationDto.pageSize)) {
      const novels = await this.novelRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
      return novels;
    }

    // 分页查询
    const { page = 1, pageSize = 20 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const [data, total] = await this.novelRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: pageSize,
      skip,
    });

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取作品详情
   */
  async findOne(id: number, userId: number): Promise<Novel> {
    const novel = await this.novelRepository.findOne({
      where: { id },
      relations: ['volumes', 'characters', 'worldSettings', 'memos'],
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
   * 更新作品
   */
  async update(id: number, userId: number, updateNovelDto: UpdateNovelDto): Promise<Novel> {
    const novel = await this.findOne(id, userId);
    Object.assign(novel, updateNovelDto);
    return await this.novelRepository.save(novel);
  }

  /**
   * 删除作品（软删除）
   */
  async remove(id: number, userId: number): Promise<void> {
    const novel = await this.findOne(id, userId);
    await this.novelRepository.softRemove(novel);
  }

  /**
   * 更新作品总字数
   */
  async updateTotalWordCount(id: number): Promise<void> {
    const novel = await this.novelRepository.findOne({
      where: { id },
      relations: ['volumes', 'volumes.chapters'],
    });

    if (novel) {
      const totalWordCount = novel.volumes.reduce((sum, volume) => {
        return sum + volume.chapters.reduce((chapterSum, chapter) => {
          return chapterSum + chapter.wordCount;
        }, 0);
      }, 0);

      novel.totalWordCount = totalWordCount;
      await this.novelRepository.save(novel);
    }
  }

  /**
   * 获取Dashboard统计数据
   */
  async getDashboardStats(userId: number): Promise<{
    totalNovels: number;
    totalWords: number;
    todayWords: number;
    consecutiveDays: number;
  }> {
    // 获取所有作品
    const novels = await this.novelRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });

    // 总作品数
    const totalNovels = novels.length;

    // 总字数
    const totalWords = novels.reduce((sum, novel) => sum + (novel.totalWordCount || 0), 0);

    // 今日字数（根据今天更新的作品计算）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayWords = novels
      .filter(novel => {
        const updatedAt = new Date(novel.updatedAt);
        updatedAt.setHours(0, 0, 0, 0);
        return updatedAt.getTime() === today.getTime();
      })
      .reduce((sum, novel) => sum + (novel.totalWordCount || 0), 0);

    // 计算连续创作天数
    const consecutiveDays = await this.calculateConsecutiveDays(userId);

    return {
      totalNovels,
      totalWords,
      todayWords,
      consecutiveDays,
    };
  }

  /**
   * 计算连续创作天数
   * 从今天开始往前数，每天都有更新记录则算连续
   */
  private async calculateConsecutiveDays(userId: number): Promise<number> {
    // 获取所有作品的更新日期（去重）
    const novels = await this.novelRepository
      .createQueryBuilder('novel')
      .select('DATE(novel.updatedAt)', 'date')
      .where('novel.userId = :userId', { userId })
      .groupBy('DATE(novel.updatedAt)')
      .orderBy('DATE(novel.updatedAt)', 'DESC')
      .getRawMany();

    if (novels.length === 0) {
      return 0;
    }

    // 转换为日期数组
    const updateDates = novels.map(item => {
      const date = new Date(item.date);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    });

    // 从今天开始检查连续性
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    // 如果今天没有更新，返回0
    if (!updateDates.includes(todayTime)) {
      return 0;
    }

    // 计算连续天数
    let consecutiveDays = 1; // 今天算1天
    let checkDate = new Date(today);
    
    for (let i = 1; i < 365; i++) { // 最多检查365天
      checkDate.setDate(checkDate.getDate() - 1);
      const checkTime = checkDate.getTime();
      
      if (updateDates.includes(checkTime)) {
        consecutiveDays++;
      } else {
        break; // 中断了，停止计算
      }
    }

    return consecutiveDays;
  }
}
