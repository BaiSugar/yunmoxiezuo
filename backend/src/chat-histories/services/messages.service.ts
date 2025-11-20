import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, Swipe, ChatHistory } from '../entities';
import { CreateMessageDto, UpdateMessageDto, CreateSwipeDto } from '../dto';
import { TokenManagerService } from '../../prompts/builders/token-manager.service';
import { SwipesService } from './swipes.service';

/**
 * 消息管理服务
 */
@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Swipe)
    private readonly swipeRepository: Repository<Swipe>,
    @InjectRepository(ChatHistory)
    private readonly chatRepository: Repository<ChatHistory>,
    private readonly tokenManager: TokenManagerService,
    private readonly swipesService: SwipesService,
  ) {}

  /**
   * 创建消息
   */
  async create(userId: number, dto: CreateMessageDto): Promise<Message> {
    // 验证聊天所有权
    const chat = await this.chatRepository.findOne({
      where: { id: dto.chatId },
    });

    if (!chat) {
      throw new NotFoundException('聊天不存在');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('无权操作此聊天');
    }

    // 获取消息ID（在聊天内的索引）
    const mesId = chat.messageCount;

    // 创建消息
    const message = this.messageRepository.create({
      chatId: dto.chatId,
      mesId,
      name: dto.name,
      isUser: dto.isUser,
      mes: dto.mes,
      sendDate: dto.sendDate || Date.now(),
      messageType: dto.messageType,
      isSystem: dto.isSystem || false,
      isName: dto.isName || false,
      forceAvatar: dto.forceAvatar,
      genStarted: dto.genStarted,
      genFinished: dto.genFinished,
      genId: dto.genId,
      api: dto.api,
      model: dto.model,
      extra: dto.extra || {},
    });

    // 如果没有提供token_count，自动计算
    if (!message.extra.token_count) {
      message.extra.token_count = this.tokenManager.estimateTokens(
        `${dto.name}: ${dto.mes}`,
      );
    }

    // 保存消息
    const savedMessage = await this.messageRepository.save(message);

    // 创建第一个Swipe（默认版本）
    await this.swipeRepository.save(
      this.swipeRepository.create({
        messageId: savedMessage.id,
        swipeIndex: 0,
        content: dto.mes,
        sendDate: savedMessage.sendDate,
        genStarted: dto.genStarted,
        genFinished: dto.genFinished,
        genId: dto.genId,
        extra: message.extra,
      }),
    );

    // 更新聊天统计
    chat.messageCount += 1;
    chat.lastMessageAt = new Date(savedMessage.sendDate);
    await this.chatRepository.save(chat);

    return savedMessage;
  }

  /**
   * 批量创建消息
   */
  async batchCreate(
    userId: number,
    chatId: number,
    messages: Omit<CreateMessageDto, 'chatId'>[],
  ): Promise<Message[]> {
    // 验证聊天所有权
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('聊天不存在');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('无权操作此聊天');
    }

    const createdMessages: Message[] = [];
    let currentMesId = chat.messageCount;

    // 逐个创建消息
    for (const messageDto of messages) {
      const message = this.messageRepository.create({
        chatId,
        mesId: currentMesId,
        name: messageDto.name,
        isUser: messageDto.isUser,
        mes: messageDto.mes,
        sendDate: messageDto.sendDate || Date.now(),
        messageType: messageDto.messageType,
        isSystem: messageDto.isSystem || false,
        isName: messageDto.isName || false,
        forceAvatar: messageDto.forceAvatar,
        genStarted: messageDto.genStarted,
        genFinished: messageDto.genFinished,
        genId: messageDto.genId,
        api: messageDto.api,
        model: messageDto.model,
        extra: messageDto.extra || {},
      });

      // 自动计算token_count
      if (!message.extra.token_count) {
        message.extra.token_count = this.tokenManager.estimateTokens(
          `${messageDto.name}: ${messageDto.mes}`,
        );
      }

      // 保存消息
      const savedMessage = await this.messageRepository.save(message);

      // 创建默认Swipe
      await this.swipeRepository.save(
        this.swipeRepository.create({
          messageId: savedMessage.id,
          swipeIndex: 0,
          content: messageDto.mes,
          sendDate: savedMessage.sendDate,
          genStarted: messageDto.genStarted,
          genFinished: messageDto.genFinished,
          genId: messageDto.genId,
          extra: message.extra,
        }),
      );

      createdMessages.push(savedMessage);
      currentMesId++;
    }

    // 更新聊天统计
    chat.messageCount = currentMesId;
    if (createdMessages.length > 0) {
      const lastMessage = createdMessages[createdMessages.length - 1];
      chat.lastMessageAt = new Date(lastMessage.sendDate);
    }
    await this.chatRepository.save(chat);

    return createdMessages;
  }

  /**
   * 查询聊天的所有消息
   */
  async findByChatId(
    userId: number,
    chatId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ data: Message[]; total: number }> {
    // 验证聊天所有权
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('聊天不存在');
    }

    if (chat.userId !== userId) {
      throw new ForbiddenException('无权访问此聊天');
    }

    // 查询消息
    const [data, total] = await this.messageRepository.findAndCount({
      where: { chatId },
      relations: ['swipes'],
      order: { mesId: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  /**
   * 获取单条消息详情
   */
  async findOne(userId: number, messageId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['chat', 'swipes'],
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    if (message.chat.userId !== userId) {
      throw new ForbiddenException('无权访问此消息');
    }

    return message;
  }

  /**
   * 更新消息
   */
  async update(
    userId: number,
    messageId: number,
    dto: UpdateMessageDto,
  ): Promise<Message> {
    const message = await this.findOne(userId, messageId);

    // 更新消息字段
    Object.assign(message, dto);

    // 如果更新了内容，同时更新当前Swipe
    if (dto.mes !== undefined) {
      const swipes = await this.swipesService.getSwipes(messageId);
      const currentSwipe = swipes.find((s) => s.swipeIndex === message.swipeId);
      if (currentSwipe) {
        currentSwipe.content = dto.mes;
        await this.swipeRepository.save(currentSwipe);
      }

      // 重新计算token
      if (!dto.extra?.token_count) {
        message.extra = message.extra || {};
        message.extra.token_count = this.tokenManager.estimateTokens(
          `${message.name}: ${dto.mes}`,
        );
      }
    }

    return await this.messageRepository.save(message);
  }

  /**
   * 删除消息
   */
  async delete(userId: number, messageId: number): Promise<void> {
    const message = await this.findOne(userId, messageId);

    // 删除消息（级联删除Swipes）
    await this.messageRepository.remove(message);

    // 更新聊天统计
    const chat = await this.chatRepository.findOne({
      where: { id: message.chatId },
    });

    if (chat) {
      chat.messageCount = Math.max(0, chat.messageCount - 1);
      await this.chatRepository.save(chat);
    }
  }

  /**
   * 删除指定消息及之后的所有消息
   */
  async deleteFrom(userId: number, messageId: number): Promise<void> {
    const message = await this.findOne(userId, messageId);

    // 查找该消息及之后的所有消息
    const messages = await this.messageRepository.find({
      where: { chatId: message.chatId },
      order: { mesId: 'ASC' },
    });

    const toDelete = messages.filter((m) => m.mesId >= message.mesId);

    // 批量删除
    await this.messageRepository.remove(toDelete);

    // 更新聊天统计
    const chat = await this.chatRepository.findOne({
      where: { id: message.chatId },
    });

    if (chat) {
      chat.messageCount = Math.max(0, chat.messageCount - toDelete.length);

      // 查找新的最后消息时间
      const lastMessage = await this.messageRepository.findOne({
        where: { chatId: message.chatId },
        order: { mesId: 'DESC' },
      });

      chat.lastMessageAt = lastMessage
        ? new Date(lastMessage.sendDate)
        : chat.createdAt;

      await this.chatRepository.save(chat);
    }
  }

  /**
   * 为消息添加新的Swipe版本
   */
  async addSwipe(
    userId: number,
    messageId: number,
    dto: CreateSwipeDto,
  ): Promise<Message> {
    // 验证权限
    await this.findOne(userId, messageId);

    // 创建Swipe
    await this.swipesService.createSwipe(messageId, dto);

    // 返回更新后的消息
    return await this.findOne(userId, messageId);
  }

  /**
   * 切换Swipe版本
   */
  async switchSwipe(
    userId: number,
    messageId: number,
    swipeIndex: number,
  ): Promise<Message> {
    // 验证权限
    await this.findOne(userId, messageId);

    // 切换Swipe
    return await this.swipesService.switchSwipe(messageId, swipeIndex);
  }

  /**
   * 删除Swipe版本
   */
  async deleteSwipe(
    userId: number,
    messageId: number,
    swipeIndex: number,
  ): Promise<void> {
    // 验证权限
    await this.findOne(userId, messageId);

    // 删除Swipe
    await this.swipesService.deleteSwipe(messageId, swipeIndex);
  }
}
