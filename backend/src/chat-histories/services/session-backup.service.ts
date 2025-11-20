import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatHistory, GroupChat, Message, Swipe } from '../entities';
import * as crypto from 'crypto';

/**
 * 备份数据接口
 */
export interface BackupData {
  version: string;
  type: 'chat' | 'group';
  timestamp: number;
  integrity: string;
  data: {
    chat?: ChatHistory;
    group?: GroupChat;
    messages: Message[];
    swipes: Swipe[];
  };
}

/**
 * 会话备份服务
 */
@Injectable()
export class SessionBackupService {
  private readonly BACKUP_VERSION = '1.0.0';

  constructor(
    @InjectRepository(ChatHistory)
    private readonly chatRepository: Repository<ChatHistory>,
    @InjectRepository(GroupChat)
    private readonly groupChatRepository: Repository<GroupChat>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Swipe)
    private readonly swipeRepository: Repository<Swipe>,
  ) {}

  /**
   * 备份普通聊天
   */
  async backupChat(userId: number, chatId: number): Promise<BackupData> {
    // 获取聊天
    const chat = await this.chatRepository.findOne({
      where: { id: chatId, userId },
    });

    if (!chat) {
      throw new NotFoundException('聊天不存在');
    }

    // 获取所有消息
    const messages = await this.messageRepository.find({
      where: { chatId },
      order: { sendDate: 'ASC' },
    });

    // 获取所有Swipes
    const messageIds = messages.map((m) => m.id);
    const swipes = await this.swipeRepository.find({
      where: messageIds.map((id) => ({ messageId: id })),
      order: { swipeIndex: 'ASC' },
    });

    const backup: BackupData = {
      version: this.BACKUP_VERSION,
      type: 'chat',
      timestamp: Date.now(),
      integrity: '',
      data: {
        chat,
        messages,
        swipes,
      },
    };

    // 生成完整性校验
    backup.integrity = this.generateIntegrity(backup);

    return backup;
  }

  /**
   * 备份群聊
   */
  async backupGroupChat(userId: number, groupId: number): Promise<BackupData> {
    // 获取群聊
    const group = await this.groupChatRepository.findOne({
      where: { id: groupId, userId },
      relations: ['members'],
    });

    if (!group) {
      throw new NotFoundException('群聊不存在');
    }

    // 获取所有消息
    const messages = await this.messageRepository.find({
      where: { groupChatId: groupId },
      order: { sendDate: 'ASC' },
    });

    // 获取所有Swipes
    const messageIds = messages.map((m) => m.id);
    const swipes = await this.swipeRepository.find({
      where: messageIds.map((id) => ({ messageId: id })),
      order: { swipeIndex: 'ASC' },
    });

    const backup: BackupData = {
      version: this.BACKUP_VERSION,
      type: 'group',
      timestamp: Date.now(),
      integrity: '',
      data: {
        group,
        messages,
        swipes,
      },
    };

    // 生成完整性校验
    backup.integrity = this.generateIntegrity(backup);

    return backup;
  }

  /**
   * 验证备份完整性
   */
  verifyIntegrity(backup: BackupData): boolean {
    const originalIntegrity = backup.integrity;
    const calculatedIntegrity = this.generateIntegrity(backup);
    return originalIntegrity === calculatedIntegrity;
  }

  /**
   * 从备份恢复聊天（创建新聊天）
   */
  async restoreFromBackup(userId: number, backup: BackupData): Promise<number> {
    // 验证完整性
    if (!this.verifyIntegrity(backup)) {
      throw new Error('备份数据完整性校验失败');
    }

    if (backup.type === 'chat') {
      return await this.restoreChat(userId, backup);
    } else {
      return await this.restoreGroupChat(userId, backup);
    }
  }

  /**
   * 恢复普通聊天
   */
  private async restoreChat(userId: number, backup: BackupData): Promise<number> {
    const { chat, messages, swipes } = backup.data;

    if (!chat) {
      throw new Error('备份数据缺少聊天信息');
    }

    // 创建新聊天（不使用原ID）
    const newChat = this.chatRepository.create({
      userId,
      chatName: chat.chatName + ' (恢复)',
      characterCardId: chat.characterCardId,
      characterName: chat.characterName,
      userPersonaName: chat.userPersonaName,
      chatMetadata: chat.chatMetadata,
      messageCount: chat.messageCount,
      lastMessageAt: chat.lastMessageAt,
    });

    const savedChat = await this.chatRepository.save(newChat);

    // 恢复消息
    if (messages && messages.length > 0) {
      const newMessages = messages.map((msg) =>
        this.messageRepository.create({
          chatId: savedChat.id,
          mesId: msg.mesId,
          name: msg.name,
          isUser: msg.isUser,
          mes: msg.mes,
          sendDate: msg.sendDate,
          messageType: msg.messageType,
          isSystem: msg.isSystem,
          isName: msg.isName,
          forceAvatar: msg.forceAvatar,
          swipeId: msg.swipeId,
          genStarted: msg.genStarted,
          genFinished: msg.genFinished,
          genId: msg.genId,
          api: msg.api,
          model: msg.model,
          extra: msg.extra,
        }),
      );

      const savedMessages = await this.messageRepository.save(newMessages);

      // 恢复Swipes
      if (swipes && swipes.length > 0) {
        // 创建原消息ID到新消息ID的映射
        const messageIdMap = new Map<number, number>();
        messages.forEach((oldMsg, index) => {
          messageIdMap.set(oldMsg.id, savedMessages[index].id);
        });

        const newSwipes = swipes
          .filter((swipe) => messageIdMap.has(swipe.messageId))
          .map((swipe) =>
            this.swipeRepository.create({
              messageId: messageIdMap.get(swipe.messageId),
              swipeIndex: swipe.swipeIndex,
              content: swipe.content,
              sendDate: swipe.sendDate,
              genStarted: swipe.genStarted,
              genFinished: swipe.genFinished,
              genId: swipe.genId,
              extra: swipe.extra,
            }),
          );

        await this.swipeRepository.save(newSwipes);
      }
    }

    return savedChat.id;
  }

  /**
   * 恢复群聊
   */
  private async restoreGroupChat(userId: number, backup: BackupData): Promise<number> {
    const { group, messages, swipes } = backup.data;

    if (!group) {
      throw new Error('备份数据缺少群聊信息');
    }

    // 创建新群聊（不使用原ID）
    const newGroup = this.groupChatRepository.create({
      userId,
      groupName: group.groupName + ' (恢复)',
      description: group.description,
      avatarUrl: group.avatarUrl,
      groupMetadata: group.groupMetadata,
      messageCount: group.messageCount,
      lastMessageAt: group.lastMessageAt,
    });

    const savedGroup = await this.groupChatRepository.save(newGroup);

    // 恢复消息（逻辑同普通聊天）
    if (messages && messages.length > 0) {
      const newMessages = messages.map((msg) =>
        this.messageRepository.create({
          groupChatId: savedGroup.id,
          mesId: msg.mesId,
          name: msg.name,
          isUser: msg.isUser,
          mes: msg.mes,
          sendDate: msg.sendDate,
          messageType: msg.messageType,
          isSystem: msg.isSystem,
          isName: msg.isName,
          forceAvatar: msg.forceAvatar,
          swipeId: msg.swipeId,
          genStarted: msg.genStarted,
          genFinished: msg.genFinished,
          genId: msg.genId,
          api: msg.api,
          model: msg.model,
          extra: msg.extra,
        }),
      );

      const savedMessages = await this.messageRepository.save(newMessages);

      // 恢复Swipes
      if (swipes && swipes.length > 0) {
        const messageIdMap = new Map<number, number>();
        messages.forEach((oldMsg, index) => {
          messageIdMap.set(oldMsg.id, savedMessages[index].id);
        });

        const newSwipes = swipes
          .filter((swipe) => messageIdMap.has(swipe.messageId))
          .map((swipe) =>
            this.swipeRepository.create({
              messageId: messageIdMap.get(swipe.messageId),
              swipeIndex: swipe.swipeIndex,
              content: swipe.content,
              sendDate: swipe.sendDate,
              genStarted: swipe.genStarted,
              genFinished: swipe.genFinished,
              genId: swipe.genId,
              extra: swipe.extra,
            }),
          );

        await this.swipeRepository.save(newSwipes);
      }
    }

    return savedGroup.id;
  }

  /**
   * 生成备份完整性校验码
   */
  private generateIntegrity(backup: BackupData): string {
    const dataToHash = JSON.stringify({
      version: backup.version,
      type: backup.type,
      timestamp: backup.timestamp,
      data: backup.data,
    });

    return crypto.createHash('sha256').update(dataToHash).digest('hex');
  }
}
