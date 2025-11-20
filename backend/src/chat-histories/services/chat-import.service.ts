import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatHistory, Message, Swipe } from '../entities';
import { ImportSource, MessageType } from '../enums';
import { ChatHistoriesService } from './chat-histories.service';
import { MessagesService } from './messages.service';

/**
 * 聊天导入服务
 */
@Injectable()
export class ChatImportService {
  constructor(
    @InjectRepository(ChatHistory)
    private readonly chatRepository: Repository<ChatHistory>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Swipe)
    private readonly swipeRepository: Repository<Swipe>,
    private readonly chatHistoriesService: ChatHistoriesService,
  ) {}

  /**
   * 导入聊天
   */
  async import(
    userId: number,
    data: string,
    source: ImportSource,
    characterCardId?: number,
  ): Promise<ChatHistory> {
    switch (source) {
      case ImportSource.SILLYTAVERN:
        return await this.importFromSillyTavern(userId, data, characterCardId);

      case ImportSource.OOBA:
        return await this.importFromOoba(userId, data, characterCardId);

      case ImportSource.CAI_TOOLS:
        return await this.importFromCAITools(userId, data, characterCardId);

      default:
        throw new BadRequestException(`不支持的导入来源: ${source}`);
    }
  }

  /**
   * 从SillyTavern JSONL格式导入
   */
  private async importFromSillyTavern(
    userId: number,
    data: string,
    characterCardId?: number,
  ): Promise<ChatHistory> {
    const lines = data.split('\n').filter((line) => line.trim());

    if (lines.length < 1) {
      throw new BadRequestException('JSONL文件为空');
    }

    // 解析第一行（Header）
    let header: any;
    try {
      header = JSON.parse(lines[0]);
    } catch (error) {
      throw new BadRequestException('无效的JSONL格式');
    }

    // 创建聊天
    const chat = await this.chatRepository.save(
      this.chatRepository.create({
        userId,
        characterCardId,
        characterName: header.character_name,
        userPersonaName: header.user_name,
        chatMetadata: header.chat_metadata || {},
        messageCount: 0,
      }),
    );

    // 导入消息
    for (let i = 1; i < lines.length; i++) {
      try {
        const messageData = JSON.parse(lines[i]);
        await this.importMessage(chat.id, messageData, i - 1);
      } catch (error) {
        console.error(`导入消息失败（第${i + 1}行）:`, error);
        // 继续导入其他消息
      }
    }

    // 更新聊天统计
    const messageCount = await this.messageRepository.count({
      where: { chatId: chat.id },
    });

    const lastMessage = await this.messageRepository.findOne({
      where: { chatId: chat.id },
      order: { mesId: 'DESC' },
    });

    chat.messageCount = messageCount;
    chat.lastMessageAt = lastMessage
      ? new Date(lastMessage.sendDate)
      : chat.createdAt;

    await this.chatRepository.save(chat);

    return chat;
  }

  /**
   * 导入单条消息（SillyTavern格式）
   */
  private async importMessage(
    chatId: number,
    data: any,
    mesId: number,
  ): Promise<Message> {
    // 创建消息
    const message = await this.messageRepository.save(
      this.messageRepository.create({
        chatId,
        mesId,
        name: data.name,
        isUser: data.is_user,
        mes: data.mes,
        sendDate: data.send_date,
        messageType: data.is_system ? MessageType.SYSTEM : MessageType.NORMAL,
        isSystem: data.is_system || false,
        isName: data.is_name || false,
        forceAvatar: data.force_avatar,
        swipeId: data.swipe_id || 0,
        genStarted: data.gen_started,
        genFinished: data.gen_finished,
        genId: data.gen_id,
        api: data.api,
        model: data.model,
        extra: data.extra || {},
      }),
    );

    // 导入Swipes
    if (data.swipes && Array.isArray(data.swipes)) {
      for (let i = 0; i < data.swipes.length; i++) {
        const swipeInfo = data.swipe_info?.[i] || {};
        await this.swipeRepository.save(
          this.swipeRepository.create({
            messageId: message.id,
            swipeIndex: i,
            content: data.swipes[i],
            sendDate: swipeInfo.send_date || data.send_date,
            genStarted: swipeInfo.gen_started,
            genFinished: swipeInfo.gen_finished,
            genId: swipeInfo.gen_id,
            extra: swipeInfo.extra || {},
          }),
        );
      }
    } else {
      // 创建默认Swipe
      await this.swipeRepository.save(
        this.swipeRepository.create({
          messageId: message.id,
          swipeIndex: 0,
          content: data.mes,
          sendDate: data.send_date,
          genStarted: data.gen_started,
          genFinished: data.gen_finished,
          genId: data.gen_id,
          extra: data.extra || {},
        }),
      );
    }

    return message;
  }

  /**
   * 从Ooba格式导入
   * Ooba格式：[[用户消息, 角色消息], [用户消息, 角色消息], ...]
   */
  private async importFromOoba(
    userId: number,
    data: string,
    characterCardId?: number,
  ): Promise<ChatHistory> {
    let messages: string[][];
    try {
      messages = JSON.parse(data);
    } catch (error) {
      throw new BadRequestException('无效的Ooba格式');
    }

    if (!Array.isArray(messages)) {
      throw new BadRequestException('Ooba格式必须是二维数组');
    }

    // 创建聊天
    const chat = await this.chatRepository.save(
      this.chatRepository.create({
        userId,
        characterCardId,
        characterName: '导入的角色',
        userPersonaName: '用户',
        messageCount: 0,
      }),
    );

    // 导入消息
    let mesId = 0;
    for (const [userMsg, charMsg] of messages) {
      // 用户消息
      if (userMsg) {
        await this.importMessage(
          chat.id,
          {
            name: '用户',
            is_user: true,
            mes: userMsg,
            send_date: Date.now() - (messages.length - mesId) * 60000,
          },
          mesId++,
        );
      }

      // 角色消息
      if (charMsg) {
        await this.importMessage(
          chat.id,
          {
            name: '角色',
            is_user: false,
            mes: charMsg,
            send_date: Date.now() - (messages.length - mesId) * 60000,
          },
          mesId++,
        );
      }
    }

    // 更新统计
    chat.messageCount = mesId;
    await this.chatRepository.save(chat);

    return chat;
  }

  /**
   * 从CAI Tools格式导入
   */
  private async importFromCAITools(
    userId: number,
    data: string,
    characterCardId?: number,
  ): Promise<ChatHistory> {
    let caiData: any;
    try {
      caiData = JSON.parse(data);
    } catch (error) {
      throw new BadRequestException('无效的CAI Tools格式');
    }

    if (!caiData.history || !Array.isArray(caiData.history)) {
      throw new BadRequestException('CAI Tools格式必须包含history数组');
    }

    // 创建聊天
    const chat = await this.chatRepository.save(
      this.chatRepository.create({
        userId,
        characterCardId,
        characterName: caiData.character_name || '导入的角色',
        userPersonaName: caiData.user_name || '用户',
        messageCount: 0,
      }),
    );

    // 导入消息
    for (let i = 0; i < caiData.history.length; i++) {
      const msg = caiData.history[i];
      await this.importMessage(
        chat.id,
        {
          name: msg.is_user ? caiData.user_name || '用户' : caiData.character_name || '角色',
          is_user: msg.is_user,
          mes: msg.text || msg.message,
          send_date: msg.timestamp || Date.now() - (caiData.history.length - i) * 60000,
        },
        i,
      );
    }

    // 更新统计
    chat.messageCount = caiData.history.length;
    await this.chatRepository.save(chat);

    return chat;
  }
}
