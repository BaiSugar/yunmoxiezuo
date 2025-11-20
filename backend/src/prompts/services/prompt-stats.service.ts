import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Prompt } from '../entities/prompt.entity';
import { PromptLike } from '../entities/prompt-like.entity';
import { PromptFavorite } from '../entities/prompt-favorite.entity';

@Injectable()
export class PromptStatsService {
  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    @InjectRepository(PromptLike)
    private readonly promptLikeRepository: Repository<PromptLike>,
    @InjectRepository(PromptFavorite)
    private readonly promptFavoriteRepository: Repository<PromptFavorite>,
  ) {}

  async incrementViewCount(promptId: number, userId?: number): Promise<void> {
    // 如果提供了userId，检查是否是作者访问
    if (userId) {
      const prompt = await this.promptRepository.findOne({
        where: { id: promptId },
        select: ['id', 'authorId'],
      });
      
      // 作者访问自己的提示词，不计入浏览量
      if (prompt && prompt.authorId === userId) {
        return;
      }
    }
    
    await this.promptRepository.increment({ id: promptId }, 'viewCount', 1);
    await this.updateHotValue(promptId);
  }

  async incrementUseCount(promptId: number): Promise<void> {
    await this.promptRepository.increment({ id: promptId }, 'useCount', 1);
    await this.updateHotValue(promptId);
  }

  async likePrompt(promptId: number, userId: number): Promise<void> {
    // 检查是否已点赞
    const existingLike = await this.promptLikeRepository.findOne({
      where: { promptId, userId },
    });

    if (existingLike) {
      throw new BadRequestException('已经点赞过了');
    }

    // 创建点赞记录
    const like = this.promptLikeRepository.create({ promptId, userId });
    await this.promptLikeRepository.save(like);

    // 增加点赞计数
    await this.promptRepository.increment({ id: promptId }, 'likeCount', 1);
    await this.updateHotValue(promptId);
  }

  async unlikePrompt(promptId: number, userId: number): Promise<void> {
    // 查找点赞记录
    const like = await this.promptLikeRepository.findOne({
      where: { promptId, userId },
    });

    if (!like) {
      throw new BadRequestException('还未点赞');
    }

    // 删除点赞记录
    await this.promptLikeRepository.remove(like);

    // 减少点赞计数
    await this.promptRepository.decrement({ id: promptId }, 'likeCount', 1);
    await this.updateHotValue(promptId);
  }

  async isLikedByUser(promptId: number, userId: number): Promise<boolean> {
    const like = await this.promptLikeRepository.findOne({
      where: { promptId, userId },
    });
    return !!like;
  }

  async favoritePrompt(promptId: number, userId: number): Promise<void> {
    // 检查是否已收藏
    const existingFavorite = await this.promptFavoriteRepository.findOne({
      where: { promptId, userId },
    });

    if (existingFavorite) {
      throw new BadRequestException('已经收藏过了');
    }

    // 创建收藏记录
    const favorite = this.promptFavoriteRepository.create({ promptId, userId });
    await this.promptFavoriteRepository.save(favorite);
  }

  async unfavoritePrompt(promptId: number, userId: number): Promise<void> {
    // 查找收藏记录
    const favorite = await this.promptFavoriteRepository.findOne({
      where: { promptId, userId },
    });

    if (!favorite) {
      throw new BadRequestException('还未收藏');
    }

    // 删除收藏记录
    await this.promptFavoriteRepository.remove(favorite);
  }

  async isFavoritedByUser(promptId: number, userId: number): Promise<boolean> {
    const favorite = await this.promptFavoriteRepository.findOne({
      where: { promptId, userId },
    });
    return !!favorite;
  }

  /**
   * 批量查询用户对多个提示词的点赞状态
   */
  async getBatchLikedStatus(promptIds: number[], userId: number): Promise<Map<number, boolean>> {
    if (promptIds.length === 0) {
      return new Map();
    }

    const likes = await this.promptLikeRepository.find({
      where: { 
        promptId: In(promptIds),
        userId 
      },
      select: ['promptId']
    });

    const likedMap = new Map<number, boolean>();
    promptIds.forEach(id => likedMap.set(id, false));
    likes.forEach(like => likedMap.set(like.promptId, true));
    
    return likedMap;
  }

  /**
   * 批量查询用户对多个提示词的收藏状态
   */
  async getBatchFavoritedStatus(promptIds: number[], userId: number): Promise<Map<number, boolean>> {
    if (promptIds.length === 0) {
      return new Map();
    }

    const favorites = await this.promptFavoriteRepository.find({
      where: { 
        promptId: In(promptIds),
        userId 
      },
      select: ['promptId']
    });

    const favoritedMap = new Map<number, boolean>();
    promptIds.forEach(id => favoritedMap.set(id, false));
    favorites.forEach(fav => favoritedMap.set(fav.promptId, true));
    
    return favoritedMap;
  }

  private async updateHotValue(promptId: number): Promise<void> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
      select: ['id', 'viewCount', 'useCount', 'likeCount'],
    });

    if (!prompt) {
      return;
    }

    const hotValue = this.calculateHotValue(
      prompt.viewCount,
      prompt.useCount,
      prompt.likeCount,
    );

    await this.promptRepository.update(promptId, { hotValue });
  }

  private calculateHotValue(viewCount: number, useCount: number, likeCount: number): number {
    // 热度值计算公式：浏览×0.5 + 使用×8 + 点赞×15
    // 降低浏览权重，提高点赞权重，使用次数次之
    return viewCount * 0.2 + useCount * 4 + likeCount * 15;
  }

  async getPromptStats(promptId: number): Promise<{
    viewCount: number;
    useCount: number;
    likeCount: number;
    hotValue: number;
  }> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
      select: ['viewCount', 'useCount', 'likeCount', 'hotValue'],
    });

    if (!prompt) {
      return {
        viewCount: 0,
        useCount: 0,
        likeCount: 0,
        hotValue: 0,
      };
    }

    return {
      viewCount: prompt.viewCount,
      useCount: prompt.useCount,
      likeCount: prompt.likeCount,
      hotValue: prompt.hotValue,
    };
  }
}
