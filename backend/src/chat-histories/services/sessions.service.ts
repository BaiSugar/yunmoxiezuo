import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatHistory, GroupChat, Message } from '../entities';

/**
 * 会话信息接口
 */
export interface SessionInfo {
  id: number;
  type: 'chat' | 'group';
  name: string;
  characterName?: string;
  characterCardId?: number;
  avatarUrl?: string | null;
  messageCount: number;
  lastMessageAt: Date;
  lastMessage?: string;
  createdAt: Date;
}

/**
 * 会话管理服务
 * 处理跨聊天和群聊的高级功能：最近会话、搜索等
 */
@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(ChatHistory)
    private readonly chatRepository: Repository<ChatHistory>,
    @InjectRepository(GroupChat)
    private readonly groupChatRepository: Repository<GroupChat>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  /**
   * 获取最近的会话列表（包含聊天和群聊）
   */
  async getRecentSessions(userId: number, limit: number = 10): Promise<SessionInfo[]> {
    // 获取最近的普通聊天
    const recentChats = await this.chatRepository
      .createQueryBuilder('chat')
      .where('chat.userId = :userId', { userId })
      .andWhere('chat.lastMessageAt IS NOT NULL')
      .orderBy('chat.lastMessageAt', 'DESC')
      .limit(limit)
      .getMany();

    // 获取最近的群聊
    const recentGroups = await this.groupChatRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.members', 'members')
      .where('group.userId = :userId', { userId })
      .andWhere('group.lastMessageAt IS NOT NULL')
      .orderBy('group.lastMessageAt', 'DESC')
      .addOrderBy('members.displayOrder', 'ASC')
      .limit(limit)
      .getMany();

    // 获取每个会话的最后一条消息
    const chatSessions: SessionInfo[] = await Promise.all(
      recentChats.map(async (chat) => {
        const lastMsg = await this.getLastMessage(chat.id, null);
        return {
          id: chat.id,
          type: 'chat' as const,
          name: chat.chatName || `与${chat.characterName}的对话`,
          characterName: chat.characterName,
          characterCardId: chat.characterCardId,
          avatarUrl: null, // 可以从角色卡获取
          messageCount: chat.messageCount,
          lastMessageAt: chat.lastMessageAt,
          lastMessage: lastMsg,
          createdAt: chat.createdAt,
        };
      }),
    );

    const groupSessions: SessionInfo[] = await Promise.all(
      recentGroups.map(async (group) => {
        const lastMsg = await this.getLastMessage(null, group.id);
        return {
          id: group.id,
          type: 'group' as const,
          name: group.groupName,
          avatarUrl: group.avatarUrl,
          messageCount: group.messageCount,
          lastMessageAt: group.lastMessageAt,
          lastMessage: lastMsg,
          createdAt: group.createdAt,
        };
      }),
    );

    // 合并并按时间排序
    const allSessions = [...chatSessions, ...groupSessions].sort((a, b) => {
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    });

    return allSessions.slice(0, limit);
  }

  /**
   * 获取最后一条消息内容（预览）
   */
  private async getLastMessage(chatId: number | null, groupChatId: number | null): Promise<string> {
    const query = this.messageRepository
      .createQueryBuilder('message')
      .select('message.mes')
      .orderBy('message.sendDate', 'DESC')
      .limit(1);

    if (chatId) {
      query.where('message.chatId = :chatId', { chatId });
    } else if (groupChatId) {
      query.where('message.groupChatId = :groupChatId', { groupChatId });
    }

    const message = await query.getOne();

    if (!message) {
      return '';
    }

    // 截取最后400个字符作为预览
    const maxLength = 400;
    const content = message.mes;
    if (content.length > maxLength) {
      return '...' + content.substring(content.length - maxLength);
    }
    return content;
  }

  /**
   * 全局搜索会话（包含聊天和群聊）
   */
  async searchSessions(userId: number, query: string): Promise<SessionInfo[]> {
    if (!query || query.trim().length === 0) {
      return this.getRecentSessions(userId, 20);
    }

    const searchTerm = `%${query}%`;

    // 搜索普通聊天
    const chats = await this.chatRepository
      .createQueryBuilder('chat')
      .where('chat.userId = :userId', { userId })
      .andWhere(
        '(chat.chatName LIKE :search OR chat.characterName LIKE :search)',
        { search: searchTerm },
      )
      .orderBy('chat.lastMessageAt', 'DESC', 'NULLS LAST')
      .limit(20)
      .getMany();

    // 搜索群聊
    const groups = await this.groupChatRepository
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.members', 'members')
      .where('group.userId = :userId', { userId })
      .andWhere(
        '(group.groupName LIKE :search OR group.description LIKE :search)',
        { search: searchTerm },
      )
      .orderBy('group.lastMessageAt', 'DESC', 'NULLS LAST')
      .addOrderBy('members.displayOrder', 'ASC')
      .limit(20)
      .getMany();

    const chatSessions: SessionInfo[] = chats.map((chat) => ({
      id: chat.id,
      type: 'chat' as const,
      name: chat.chatName || `与${chat.characterName}的对话`,
      characterName: chat.characterName,
      characterCardId: chat.characterCardId,
      messageCount: chat.messageCount,
      lastMessageAt: chat.lastMessageAt,
      createdAt: chat.createdAt,
    }));

    const groupSessions: SessionInfo[] = groups.map((group) => ({
      id: group.id,
      type: 'group' as const,
      name: group.groupName,
      avatarUrl: group.avatarUrl,
      messageCount: group.messageCount,
      lastMessageAt: group.lastMessageAt,
      createdAt: group.createdAt,
    }));

    return [...chatSessions, ...groupSessions].sort((a, b) => {
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    });
  }

  /**
   * 获取会话统计信息
   */
  async getSessionStats(userId: number): Promise<{
    totalChats: number;
    totalGroups: number;
    totalMessages: number;
    activeSessions: number;
  }> {
    // 普通聊天统计
    const chatStats = await this.chatRepository
      .createQueryBuilder('chat')
      .select('COUNT(chat.id)', 'totalChats')
      .addSelect('SUM(chat.messageCount)', 'totalMessages')
      .addSelect(
        'COUNT(CASE WHEN chat.lastMessageAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END)',
        'activeChats',
      )
      .where('chat.userId = :userId', { userId })
      .getRawOne();

    // 群聊统计
    const groupStats = await this.groupChatRepository
      .createQueryBuilder('group')
      .select('COUNT(group.id)', 'totalGroups')
      .addSelect('SUM(group.messageCount)', 'totalGroupMessages')
      .addSelect(
        'COUNT(CASE WHEN group.lastMessageAt >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END)',
        'activeGroups',
      )
      .where('group.userId = :userId', { userId })
      .getRawOne();

    return {
      totalChats: parseInt(chatStats.totalChats) || 0,
      totalGroups: parseInt(groupStats.totalGroups) || 0,
      totalMessages:
        (parseInt(chatStats.totalMessages) || 0) + (parseInt(groupStats.totalGroupMessages) || 0),
      activeSessions:
        (parseInt(chatStats.activeChats) || 0) + (parseInt(groupStats.activeGroups) || 0),
    };
  }
}
