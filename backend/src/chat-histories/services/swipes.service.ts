import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Swipe, Message } from '../entities';
import { CreateSwipeDto } from '../dto';
import { TokenManagerService } from '../../prompts/builders/token-manager.service';

/**
 * Swipe管理服务
 * 负责多版本生成的管理
 */
@Injectable()
export class SwipesService {
  constructor(
    @InjectRepository(Swipe)
    private readonly swipeRepository: Repository<Swipe>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly tokenManager: TokenManagerService,
  ) {}

  /**
   * 为消息创建新的Swipe版本
   */
  async createSwipe(messageId: number, dto: CreateSwipeDto): Promise<Swipe> {
    // 查询消息
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['swipes'],
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    // 计算新Swipe的索引
    const swipeIndex = message.swipes ? message.swipes.length : 0;

    // 创建Swipe
    const swipe = this.swipeRepository.create({
      messageId,
      swipeIndex,
      content: dto.content,
      sendDate: dto.sendDate || Date.now(),
      genStarted: dto.genStarted,
      genFinished: dto.genFinished,
      genId: dto.genId,
      extra: dto.extra || {},
    });

    // 如果没有提供token_count，自动计算
    if (!swipe.extra.token_count) {
      swipe.extra.token_count = this.tokenManager.estimateTokens(dto.content);
    }

    return await this.swipeRepository.save(swipe);
  }

  /**
   * 获取消息的所有Swipe
   */
  async getSwipes(messageId: number): Promise<Swipe[]> {
    return await this.swipeRepository.find({
      where: { messageId },
      order: { swipeIndex: 'ASC' },
    });
  }

  /**
   * 切换到指定的Swipe版本
   */
  async switchSwipe(messageId: number, swipeIndex: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['swipes'],
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    const swipe = message.swipes.find((s) => s.swipeIndex === swipeIndex);
    if (!swipe) {
      throw new NotFoundException(`Swipe版本 ${swipeIndex} 不存在`);
    }

    // 更新消息内容和swipeId
    message.mes = swipe.content;
    message.swipeId = swipeIndex;
    message.sendDate = swipe.sendDate;
    message.genStarted = swipe.genStarted;
    message.genFinished = swipe.genFinished;
    message.genId = swipe.genId;

    // 合并extra信息
    message.extra = {
      ...message.extra,
      ...swipe.extra,
    };

    return await this.messageRepository.save(message);
  }

  /**
   * 删除指定的Swipe版本
   */
  async deleteSwipe(messageId: number, swipeIndex: number): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['swipes'],
    });

    if (!message) {
      throw new NotFoundException('消息不存在');
    }

    // 不能删除唯一的Swipe
    if (message.swipes.length <= 1) {
      throw new Error('不能删除最后一个Swipe版本');
    }

    const swipe = message.swipes.find((s) => s.swipeIndex === swipeIndex);
    if (!swipe) {
      throw new NotFoundException(`Swipe版本 ${swipeIndex} 不存在`);
    }

    // 删除Swipe
    await this.swipeRepository.remove(swipe);

    // 如果删除的是当前选中的Swipe，切换到索引0
    if (message.swipeId === swipeIndex) {
      await this.switchSwipe(messageId, 0);
    }

    // 重新排序剩余的Swipe索引
    const remainingSwipes = await this.getSwipes(messageId);
    for (let i = 0; i < remainingSwipes.length; i++) {
      if (remainingSwipes[i].swipeIndex !== i) {
        remainingSwipes[i].swipeIndex = i;
        await this.swipeRepository.save(remainingSwipes[i]);
      }
    }
  }
}
