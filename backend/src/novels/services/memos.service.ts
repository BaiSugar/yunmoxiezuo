import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Memo } from '../entities/memo.entity';
import { Novel } from '../entities/novel.entity';
import { CreateMemoDto } from '../dto/create-memo.dto';
import { UpdateMemoDto } from '../dto/update-memo.dto';

@Injectable()
export class MemosService {
  constructor(
    @InjectRepository(Memo)
    private readonly memoRepository: Repository<Memo>,
    @InjectRepository(Novel)
    private readonly novelRepository: Repository<Novel>,
  ) {}

  private async checkNovelAccess(novelId: number, userId: number): Promise<void> {
    const novel = await this.novelRepository.findOne({ where: { id: novelId } });
    if (!novel) throw new NotFoundException('作品不存在');
    if (novel.userId !== userId) throw new ForbiddenException('无权访问此作品');
  }

  async create(novelId: number, userId: number, dto: CreateMemoDto): Promise<Memo> {
    await this.checkNovelAccess(novelId, userId);
    const memo = this.memoRepository.create({
      novelId,
      title: dto.title,
      content: dto.content,
      color: dto.color,
      isPinned: dto.isPinned,
      reminderAt: dto.reminderAt ? new Date(dto.reminderAt) : undefined,
    });
    return await this.memoRepository.save(memo);
  }

  async findAllByNovel(novelId: number, userId: number): Promise<Memo[]> {
    await this.checkNovelAccess(novelId, userId);
    
    // 使用QueryBuilder强制使用优化索引
    return await this.memoRepository
      .createQueryBuilder('memo')
      .where('memo.novel_id = :novelId', { novelId })
      .orderBy('memo.is_pinned', 'DESC')
      .addOrderBy('memo.updated_at', 'DESC')
      .getMany();
  }

  async findOne(id: number, userId: number): Promise<Memo> {
    const memo = await this.memoRepository.findOne({
      where: { id },
      relations: ['novel'],
    });
    if (!memo) throw new NotFoundException('备忘录不存在');
    if (memo.novel.userId !== userId) throw new ForbiddenException('无权访问');
    return memo;
  }

  async update(id: number, userId: number, dto: UpdateMemoDto): Promise<Memo> {
    // 不加载关联，直接查询备忘录
    const memo = await this.memoRepository.findOne({ where: { id } });
    if (!memo) throw new NotFoundException('备忘录不存在');
    
    // 验证权限
    await this.checkNovelAccess(memo.novelId, userId);
    
    // 更新字段
    Object.assign(memo, dto);
    if (dto.reminderAt) {
      memo.reminderAt = new Date(dto.reminderAt);
    }
    return await this.memoRepository.save(memo);
  }

  async remove(id: number, userId: number): Promise<void> {
    const memo = await this.findOne(id, userId);
    await this.memoRepository.softRemove(memo);
  }
}
