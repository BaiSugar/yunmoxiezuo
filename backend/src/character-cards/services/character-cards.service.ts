import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { CharacterCard, CharacterCardStatus } from '../entities/character-card.entity';
import { CharacterCardLike } from '../entities/character-card-like.entity';
import { CharacterCardFavorite } from '../entities/character-card-favorite.entity';
import {
  CreateCharacterCardDto,
  UpdateCharacterCardDto,
  QueryCharacterCardDto,
} from '../dto';

/**
 * 角色卡服务
 * 负责角色卡的 CRUD 操作
 */
@Injectable()
export class CharacterCardsService {
  constructor(
    @InjectRepository(CharacterCard)
    private readonly characterCardRepository: Repository<CharacterCard>,
    @InjectRepository(CharacterCardLike)
    private readonly likeRepository: Repository<CharacterCardLike>,
    @InjectRepository(CharacterCardFavorite)
    private readonly favoriteRepository: Repository<CharacterCardFavorite>,
  ) {}

  /**
   * 创建角色卡
   */
  async create(createDto: CreateCharacterCardDto, authorId: number): Promise<CharacterCard> {
    const characterCard = this.characterCardRepository.create({
      ...createDto,
      authorId,
      status: CharacterCardStatus.DRAFT,
    });

    return await this.characterCardRepository.save(characterCard);
  }

  /**
   * 查询角色卡列表（分页）
   */
  async findAll(queryDto: QueryCharacterCardDto, userId?: number) {
    const {
      keyword,
      tags,
      category,
      authorId,
      status,
      publicOnly,
      sortBy,
      sortOrder,
      page,
      pageSize,
    } = queryDto;

    const queryBuilder = this.characterCardRepository
      .createQueryBuilder('card')
      .leftJoinAndSelect('card.author', 'author');

    // 关键词搜索
    if (keyword) {
      queryBuilder.andWhere(
        '(card.name LIKE :keyword OR card.description LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    // 标签筛选
    if (tags) {
      const tagArray = tags.split(',').map(t => t.trim());
      queryBuilder.andWhere('card.tags && :tags', { tags: tagArray });
    }

    // 分类筛选
    if (category) {
      queryBuilder.andWhere('card.category = :category', { category });
    }

    // 作者筛选
    if (authorId) {
      queryBuilder.andWhere('card.authorId = :authorId', { authorId });
    }

    // 状态筛选
    if (status) {
      queryBuilder.andWhere('card.status = :status', { status });
    }

    // 公开性筛选
    if (publicOnly) {
      queryBuilder.andWhere('card.isPublic = :isPublic', { isPublic: true });
      queryBuilder.andWhere('card.status = :status', {
        status: CharacterCardStatus.PUBLISHED,
      });
    } else if (userId) {
      // 如果提供了 userId，显示公开的或自己的
      queryBuilder.andWhere(
        '(card.isPublic = :isPublic OR card.authorId = :userId)',
        { isPublic: true, userId },
      );
    }

    // 排序
    const validSortFields = ['createdAt', 'updatedAt', 'viewCount', 'useCount', 'likeCount', 'downloadCount'];
    const sortField = sortBy && validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`card.${sortField}`, sortOrder || 'DESC');

    // 分页
    const currentPage = page || 1;
    const currentPageSize = pageSize || 20;
    const skip = (currentPage - 1) * currentPageSize;
    queryBuilder.skip(skip).take(currentPageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page: currentPage,
      pageSize: currentPageSize,
      totalPages: Math.ceil(total / currentPageSize),
    };
  }

  /**
   * 获取单个角色卡
   */
  async findOne(id: number, userId?: number): Promise<CharacterCard> {
    const card = await this.characterCardRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!card) {
      throw new NotFoundException('角色卡不存在');
    }

    // 权限检查：如果不是公开的，必须是作者本人
    if (!card.isPublic && card.authorId !== userId) {
      throw new ForbiddenException('无权访问此角色卡');
    }

    // 增加浏览次数
    await this.incrementViewCount(id);

    return card;
  }

  /**
   * 更新角色卡
   */
  async update(
    id: number,
    updateDto: UpdateCharacterCardDto,
    userId: number,
  ): Promise<CharacterCard> {
    const card = await this.characterCardRepository.findOne({ where: { id } });

    if (!card) {
      throw new NotFoundException('角色卡不存在');
    }

    // 权限检查：只有作者可以修改
    if (card.authorId !== userId) {
      throw new ForbiddenException('无权修改此角色卡');
    }

    Object.assign(card, updateDto);
    return await this.characterCardRepository.save(card);
  }

  /**
   * 删除角色卡（软删除）
   */
  async remove(id: number, userId: number): Promise<void> {
    const card = await this.characterCardRepository.findOne({ where: { id } });

    if (!card) {
      throw new NotFoundException('角色卡不存在');
    }

    // 权限检查：只有作者可以删除
    if (card.authorId !== userId) {
      throw new ForbiddenException('无权删除此角色卡');
    }

    await this.characterCardRepository.softDelete(id);
  }

  /**
   * 发布角色卡
   */
  async publish(id: number, userId: number): Promise<CharacterCard> {
    const card = await this.characterCardRepository.findOne({ where: { id } });

    if (!card) {
      throw new NotFoundException('角色卡不存在');
    }

    if (card.authorId !== userId) {
      throw new ForbiddenException('无权发布此角色卡');
    }

    card.status = CharacterCardStatus.PUBLISHED;
    return await this.characterCardRepository.save(card);
  }

  /**
   * 归档角色卡
   */
  async archive(id: number, userId: number): Promise<CharacterCard> {
    const card = await this.characterCardRepository.findOne({ where: { id } });

    if (!card) {
      throw new NotFoundException('角色卡不存在');
    }

    if (card.authorId !== userId) {
      throw new ForbiddenException('无权归档此角色卡');
    }

    card.status = CharacterCardStatus.ARCHIVED;
    return await this.characterCardRepository.save(card);
  }

  /**
   * 点赞角色卡
   */
  async like(id: number, userId: number): Promise<void> {
    const card = await this.characterCardRepository.findOne({ where: { id } });

    if (!card) {
      throw new NotFoundException('角色卡不存在');
    }

    // 检查是否已点赞
    const existingLike = await this.likeRepository.findOne({
      where: { characterCardId: id, userId },
    });

    if (existingLike) {
      throw new BadRequestException('已经点赞过了');
    }

    // 创建点赞记录
    const like = this.likeRepository.create({ characterCardId: id, userId });
    await this.likeRepository.save(like);

    // 增加点赞计数
    await this.characterCardRepository.increment({ id }, 'likeCount', 1);
  }

  /**
   * 取消点赞
   */
  async unlike(id: number, userId: number): Promise<void> {
    const like = await this.likeRepository.findOne({
      where: { characterCardId: id, userId },
    });

    if (!like) {
      throw new BadRequestException('尚未点赞');
    }

    await this.likeRepository.remove(like);
    await this.characterCardRepository.decrement({ id }, 'likeCount', 1);
  }

  /**
   * 收藏角色卡
   */
  async favorite(id: number, userId: number): Promise<void> {
    const card = await this.characterCardRepository.findOne({ where: { id } });

    if (!card) {
      throw new NotFoundException('角色卡不存在');
    }

    // 检查是否已收藏
    const existingFavorite = await this.favoriteRepository.findOne({
      where: { characterCardId: id, userId },
    });

    if (existingFavorite) {
      throw new BadRequestException('已经收藏过了');
    }

    const favorite = this.favoriteRepository.create({ characterCardId: id, userId });
    await this.favoriteRepository.save(favorite);
  }

  /**
   * 取消收藏
   */
  async unfavorite(id: number, userId: number): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { characterCardId: id, userId },
    });

    if (!favorite) {
      throw new BadRequestException('尚未收藏');
    }

    await this.favoriteRepository.remove(favorite);
  }

  /**
   * 增加浏览次数
   */
  private async incrementViewCount(id: number): Promise<void> {
    await this.characterCardRepository.increment({ id }, 'viewCount', 1);
  }

  /**
   * 增加使用次数
   */
  async incrementUseCount(id: number): Promise<void> {
    await this.characterCardRepository.increment({ id }, 'useCount', 1);
  }

  /**
   * 增加下载次数
   */
  async incrementDownloadCount(id: number): Promise<void> {
    await this.characterCardRepository.increment({ id }, 'downloadCount', 1);
  }
}
