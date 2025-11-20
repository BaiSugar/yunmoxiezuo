import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto, QueryNotificationDto } from './dto/notification.dto';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { WsMessage, WsMessageType } from '../websocket/interfaces/websocket-message.interface';

/**
 * 通知服务
 * 
 * 功能：
 * 1. 在线用户 → WebSocket实时推送 + 保存数据库
 * 2. 离线用户 → 保存到数据库
 * 3. 用户登录 → 推送未读通知
 */
@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly wsGateway: WebSocketGateway,
  ) {}

  /**
   * 模块初始化时，将自己注入到WebSocketGateway
   */
  onModuleInit() {
    this.wsGateway.setNotificationsService(this);
    this.logger.log('✅ NotificationsService已注入到WebSocketGateway');
  }

  /**
   * 创建并推送通知（智能推送）
   * - 用户在线：实时WebSocket推送 + 保存数据库
   * - 用户离线：仅保存数据库，登录时推送
   */
  async createAndPush(dto: CreateNotificationDto): Promise<Notification> {
    // 1. 保存到数据库
    const notification = this.notificationRepository.create(dto);
    const saved = await this.notificationRepository.save(notification);

    // 2. 尝试实时推送
    const isOnline = this.wsGateway.isUserOnline(dto.userId);
    
    if (isOnline) {
      // 用户在线，实时推送
      const message: WsMessage = {
        type: WsMessageType.NOTIFICATION_NEW,
        data: {
          id: saved.id.toString(),
          title: saved.title,
          content: saved.content,
          category: saved.category,
          level: saved.level,
          action: saved.action,
          extra: saved.extra,
          createdAt: saved.createdAt,
        },
        timestamp: Date.now(),
      };

      this.wsGateway.sendToUser(dto.userId, message);
      this.logger.log(`✅ 实时推送通知给用户 ${dto.userId}: ${dto.title}`);
    } else {
      // 用户离线，只保存到数据库
      this.logger.log(`💾 保存离线通知给用户 ${dto.userId}: ${dto.title}`);
    }

    return saved;
  }

  /**
   * 推送用户的未读通知（登录时调用）
   * @param userId 用户ID
   * @param pushedIds 已推送的通知ID集合（用于去重）
   */
  async pushUnreadNotifications(userId: number, pushedIds?: Set<string>): Promise<number> {
    const unreadNotifications = await this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
      take: 3, // 限制为3条，避免一次性推送过多
    });

    if (unreadNotifications.length === 0) {
      return 0;
    }

    // 过滤掉已推送的通知
    const filteredNotifications = pushedIds 
      ? unreadNotifications.filter(n => !pushedIds.has(n.id.toString()))
      : unreadNotifications;

    if (filteredNotifications.length === 0) {
      return 0;
    }

    // 延迟推送，避免一次性弹出太多
    for (let i = 0; i < filteredNotifications.length; i++) {
      const notification = filteredNotifications[i];
      
      // 记录已推送的通知ID
      if (pushedIds) {
        pushedIds.add(notification.id.toString());
      }
      
      // 延迟推送，每条通知间隔1秒
      setTimeout(() => {
        const message: WsMessage = {
          type: WsMessageType.NOTIFICATION_NEW,
          data: {
            id: notification.id.toString(),
            title: notification.title,
            content: notification.content,
            category: notification.category,
            level: notification.level,
            action: notification.action,
            extra: notification.extra,
            createdAt: notification.createdAt,
          },
          timestamp: Date.now(),
        };

        this.wsGateway.sendToUser(userId, message);
      }, i * 1000); // 每条通知延迟1秒
    }

    this.logger.log(`📬 推送了 ${filteredNotifications.length} 条未读通知给用户 ${userId}（延迟推送）`);
    return filteredNotifications.length;
  }

  /**
   * 查询用户的通知列表
   */
  async findByUser(userId: number, query: QueryNotificationDto) {
    const { page = 1, limit = 20, isRead, category } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (isRead !== undefined) where.isRead = isRead;
    if (category) where.category = category;

    const [data, total] = await this.notificationRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(userId: number): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * 标记已读
   */
  async markAsRead(id: number, userId: number): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await this.notificationRepository.save(notification);
  }

  /**
   * 批量标记已读
   */
  async markAllAsRead(userId: number): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  /**
   * 删除通知
   */
  async remove(id: number, userId: number): Promise<void> {
    await this.notificationRepository.delete({ id, userId });
  }

  /**
   * 清空已读通知
   */
  async clearRead(userId: number): Promise<void> {
    await this.notificationRepository.delete({ userId, isRead: true });
  }
}

