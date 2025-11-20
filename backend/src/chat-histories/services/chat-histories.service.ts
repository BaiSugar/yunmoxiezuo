import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { ChatHistory } from '../entities';
import { CreateChatDto, UpdateChatDto, QueryChatsDto } from '../dto';

/**
 * 聊天历史管理服务
 */
@Injectable()
export class ChatHistoriesService {
  constructor(
    @InjectRepository(ChatHistory)
    private readonly chatRepository: Repository<ChatHistory>,
  ) {}

  /**
   * 创建聊天
   */
  async create(userId: number, dto: CreateChatDto): Promise<ChatHistory> {
    const chat = this.chatRepository.create({
      userId,
      chatName: dto.chatName,
      novelId: dto.novelId,  // AI写作场景
      characterCardId: dto.characterCardId,  // 角色扮演场景
      categoryId: dto.categoryId,  // 创意工坊场景
      characterName: dto.characterName,
      userPersonaName: dto.userPersonaName,
      chatMetadata: dto.chatMetadata || {},
      messageCount: 0,
    });

    return await this.chatRepository.save(chat);
  }

  /**
   * 查询用户的聊天列表（分页、筛选、排序）
   */
  async findAll(
    userId: number,
    query: QueryChatsDto,
  ): Promise<{ data: ChatHistory[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20, novelId, characterCardId, categoryId, search } = query;

    const queryBuilder = this.chatRepository
      .createQueryBuilder('chat')
      .where('chat.userId = :userId', { userId });

    // 按小说ID筛选（AI写作场景 - 普通对话）
    if (novelId !== undefined) {
      queryBuilder.andWhere('chat.novelId = :novelId', {
        novelId,
      });
      
      // 如果没有指定 categoryId，则排除创意工坊对话（只显示普通对话）
      if (categoryId === undefined) {
        queryBuilder.andWhere('chat.categoryId IS NULL');
      }
    }

    // 按角色卡筛选（角色扮演场景）
    if (characterCardId !== undefined) {
      queryBuilder.andWhere('chat.characterCardId = :characterCardId', {
        characterCardId,
      });
    }

    // 按提示词分类筛选（创意工坊场景）
    if (categoryId !== undefined) {
      queryBuilder.andWhere('chat.categoryId = :categoryId', {
        categoryId,
      });
    }

    // 搜索
    if (search) {
      queryBuilder.andWhere(
        '(chat.chatName LIKE :search OR chat.characterName LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 排序（最后消息时间降序，MySQL中NULL值默认在最后）
    queryBuilder.orderBy('chat.lastMessageAt', 'DESC');

    // 分页
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取聊天详情（包含消息）
   */
  async findOne(userId: number, chatId: number): Promise<ChatHistory> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: ['messages'],  // 加载消息
    });

    if (!chat) {
      throw new NotFoundException('聊天不存在');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('无权访问此聊天');
    }

    // 按mesId排序消息（保证顺序）
    if (chat.messages) {
      chat.messages.sort((a, b) => a.mesId - b.mesId);
    }

    return chat;
  }

  /**
   * 更新聊天
   */
  async update(
    userId: number,
    chatId: number,
    dto: UpdateChatDto,
  ): Promise<ChatHistory> {
    const chat = await this.findOne(userId, chatId);

    Object.assign(chat, dto);

    return await this.chatRepository.save(chat);
  }

  /**
   * 删除聊天
   */
  async delete(userId: number, chatId: number): Promise<void> {
    const chat = await this.findOne(userId, chatId);
    await this.chatRepository.remove(chat);
  }

  /**
   * 批量删除聊天
   */
  async batchDelete(userId: number, chatIds: number[]): Promise<void> {
    // 验证所有聊天的所有权
    const chats = await this.chatRepository.find({
      where: chatIds.map((id) => ({ id, userId })),
    });

    if (chats.length !== chatIds.length) {
      throw new ForbiddenException('部分聊天不存在或无权删除');
    }

    await this.chatRepository.remove(chats);
  }

  /**
   * 获取用户的聊天统计
   */
  async getStats(userId: number): Promise<{
    totalChats: number;
    totalMessages: number;
    charactersUsed: number;
  }> {
    const result = await this.chatRepository
      .createQueryBuilder('chat')
      .select('COUNT(DISTINCT chat.id)', 'totalChats')
      .addSelect('SUM(chat.messageCount)', 'totalMessages')
      .addSelect('COUNT(DISTINCT chat.characterCardId)', 'charactersUsed')
      .where('chat.userId = :userId', { userId })
      .getRawOne();

    return {
      totalChats: parseInt(result.totalChats) || 0,
      totalMessages: parseInt(result.totalMessages) || 0,
      charactersUsed: parseInt(result.charactersUsed) || 0,
    };
  }
}
