import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, In } from 'typeorm';
import { Announcement, AnnouncementRead } from '../entities';
import {
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  QueryAnnouncementDto,
} from '../dto';
import { TargetType } from '../enums';
import { WebSocketGateway } from '../../websocket/websocket.gateway';
import { WebSocketXssFilterService } from '../../websocket/services/websocket-xss-filter.service';
import { WsMessage, WsMessageType } from '../../websocket/interfaces/websocket-message.interface';
import { UsersService } from '../../users/users.service';
import { RolesService } from '../../roles/roles.service';
import { UserMembershipsService } from '../../memberships/services/user-memberships.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(AnnouncementRead)
    private readonly readRepository: Repository<AnnouncementRead>,
    private readonly wsGateway: WebSocketGateway,
    private readonly xssFilter: WebSocketXssFilterService,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly userMembershipsService: UserMembershipsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * 创建公告
   */
  async create(
    createDto: CreateAnnouncementDto,
    creatorId: number,
  ): Promise<Announcement> {
    const announcement = this.announcementRepository.create({
      ...createDto,
      creatorId,
    });

    return await this.announcementRepository.save(announcement);
  }

  /**
   * 查询公告列表（管理端）
   */
  async findAll(query: QueryAnnouncementDto) {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.type) where.type = filters.type;
    if (filters.level) where.level = filters.level;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.isTop !== undefined) where.isTop = filters.isTop;
    if (filters.isPush !== undefined) where.isPush = filters.isPush;
    if (filters.isPopup !== undefined) where.isPopup = filters.isPopup;

    const [data, total] = await this.announcementRepository.findAndCount({
      where,
      order: {
        isTop: 'DESC',
        priority: 'DESC',
        createdAt: 'DESC',
      },
      skip,
      take: limit,
      relations: ['creator'],
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
   * 获取当前有效公告（用户端）
   */
  async findActive(userId?: number) {
    const now = new Date();

    const query = this.announcementRepository
      .createQueryBuilder('announcement')
      .where('announcement.isActive = :isActive', { isActive: true })
      .andWhere('announcement.startTime <= :now', { now })
      .andWhere(
        '(announcement.endTime IS NULL OR announcement.endTime > :now)',
        { now },
      );

    const announcements = await query
      .orderBy('announcement.isTop', 'DESC')
      .addOrderBy('announcement.priority', 'DESC')
      .addOrderBy('announcement.publishedAt', 'DESC')
      .getMany();

    // 根据目标受众筛选
    const filtered = await this.filterByTarget(announcements, userId);

    // 如果有用户ID，附加已读状态
    if (userId) {
      return await this.attachReadStatus(filtered, userId);
    }

    return filtered;
  }

  /**
   * 获取需要弹窗的公告
   */
  async findPopup(userId?: number) {
    const active = await this.findActive(userId);
    return active.filter((a) => a.isPopup);
  }

  /**
   * 获取未读数量
   */
  async getUnreadCount(userId: number): Promise<number> {
    const active = await this.findActive(userId);
    const needReadAnnouncements = active.filter((a) => a.needRead);

    const readRecords = await this.readRepository.find({
      where: {
        userId,
        announcementId: In(needReadAnnouncements.map((a) => a.id)),
        isRead: true,
      },
    });

    return needReadAnnouncements.length - readRecords.length;
  }

  /**
   * 根据ID查询公告
   */
  async findOne(id: number): Promise<Announcement> {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    // 增加浏览次数
    await this.announcementRepository.increment({ id }, 'viewCount', 1);

    return announcement;
  }

  /**
   * 更新公告
   */
  async update(
    id: number,
    updateDto: UpdateAnnouncementDto,
    userId: number,
  ): Promise<Announcement> {
    const announcement = await this.findOne(id);

    // 权限检查：只有创建人可以更新
    if (announcement.creatorId !== userId) {
      throw new ForbiddenException('无权修改此公告');
    }

    Object.assign(announcement, updateDto);
    const updatedAnnouncement = await this.announcementRepository.save(announcement);

    // 🔔 如果公告已发布且设置了推送，通知在线用户更新
    if (updatedAnnouncement.isActive && updatedAnnouncement.isPush) {
      await this.pushAnnouncementUpdate(updatedAnnouncement);
    }

    return updatedAnnouncement;
  }

  /**
   * 删除公告
   */
  async remove(id: number, userId: number): Promise<void> {
    const announcement = await this.findOne(id);

    // 权限检查：只有创建人可以删除
    if (announcement.creatorId !== userId) {
      throw new ForbiddenException('无权删除此公告');
    }

    // 🔔 如果公告已发布，通知在线用户删除
    if (announcement.isActive && announcement.isPush) {
      await this.pushAnnouncementDelete(announcement);
    }

    await this.announcementRepository.remove(announcement);
  }

  /**
   * 发布公告
   */
  async publish(id: number, userId: number): Promise<Announcement> {
    const announcement = await this.findOne(id);

    if (announcement.creatorId !== userId) {
      throw new ForbiddenException('无权发布此公告');
    }

    announcement.publishedAt = new Date();
    announcement.isActive = true;

    const savedAnnouncement = await this.announcementRepository.save(announcement);

    // 如果设置了自动推送且弹窗，则自动推送
    if (savedAnnouncement.isPush && savedAnnouncement.isPopup) {
      await this.pushNow(id, userId);
    }

    return savedAnnouncement;
  }

  /**
   * 立即推送公告（WebSocket）
   */
  async pushNow(id: number, userId: number): Promise<void> {
    const announcement = await this.findOne(id);

    if (announcement.creatorId !== userId) {
      throw new ForbiddenException('无权推送此公告');
    }

    // 清理XSS，确保安全
    const sanitizedAnnouncement = this.xssFilter.sanitizeAnnouncement(announcement);

    // 构建WebSocket消息
    const message: WsMessage = {
      type: WsMessageType.ANNOUNCEMENT_NEW,
      data: sanitizedAnnouncement,
      timestamp: Date.now(),
    };

    // 根据目标类型推送
    await this.pushByTarget(message, announcement);

    this.logger.log(`公告已推送: ${announcement.title} (ID: ${id})`);
  }

  /**
   * 根据目标类型推送公告（在线用户通过WebSocket，离线用户通过通知系统）
   */
  private async pushByTarget(message: WsMessage, announcement: Announcement): Promise<void> {
    // 获取目标用户ID列表
    const targetUserIds = await this.getTargetUserIds(announcement);
    
    // 推送给在线用户（WebSocket）
    switch (announcement.targetType) {
      case TargetType.ALL:
        this.wsGateway.broadcastToAll(message);
        this.logger.debug(`广播公告到所有在线用户: ${announcement.title}`);
        break;

      case TargetType.USER:
        if (announcement.targetIds && announcement.targetIds.length > 0) {
          this.wsGateway.sendToUsersThrottled(announcement.targetIds, message);
          this.logger.debug(`推送公告到 ${announcement.targetIds.length} 个在线用户: ${announcement.title}`);
        }
        break;

      case TargetType.ROLE:
        if (announcement.targetIds && announcement.targetIds.length > 0) {
          await this.pushToRoles(announcement.targetIds, message);
        }
        break;

      case TargetType.MEMBERSHIP:
        if (announcement.targetIds && announcement.targetIds.length > 0) {
          await this.pushToMemberships(announcement.targetIds, message);
        }
        break;

      default:
        this.logger.warn(`未知的目标类型: ${announcement.targetType}`);
    }

    // 为离线用户创建通知
    await this.createNotificationsForOfflineUsers(targetUserIds, announcement);
  }

  /**
   * 获取目标用户ID列表
   */
  private async getTargetUserIds(announcement: Announcement): Promise<number[]> {
    switch (announcement.targetType) {
      case TargetType.ALL:
        // 全部用户 - 返回空数组（表示所有用户）
        return [];

      case TargetType.USER:
        return announcement.targetIds || [];

      case TargetType.ROLE:
        if (announcement.targetIds && announcement.targetIds.length > 0) {
          return await this.getUserIdsByRoles(announcement.targetIds);
        }
        return [];

      case TargetType.MEMBERSHIP:
        if (announcement.targetIds && announcement.targetIds.length > 0) {
          return await this.getUserIdsByMemberships(announcement.targetIds);
        }
        return [];

      default:
        return [];
    }
  }

  /**
   * 根据角色ID获取用户ID列表
   */
  private async getUserIdsByRoles(roleIds: number[]): Promise<number[]> {
    try {
      const roles = await this.rolesService.findByIds(roleIds);
      const userIds: Set<number> = new Set();
      
      for (const role of roles) {
        // 使用 roleCode 查询用户
        const result = await this.usersService.findAll({ roleCode: role.code, page: 1, pageSize: 1000 });
        result.items.forEach(u => userIds.add(u.id));
      }
      
      return Array.from(userIds);
    } catch (error) {
      this.logger.error(`获取角色用户失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 根据会员等级ID获取用户ID列表
   */
  private async getUserIdsByMemberships(planIds: number[]): Promise<number[]> {
    try {
      // TODO: 实现会员等级用户查询
      this.logger.warn('会员等级用户查询功能待实现');
      return [];
    } catch (error) {
      this.logger.error(`获取会员用户失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 为离线用户创建通知
   */
  private async createNotificationsForOfflineUsers(
    targetUserIds: number[],
    announcement: Announcement,
  ): Promise<void> {
    try {
      let userIdsToNotify: number[] = [];

      // targetUserIds 为空数组表示"所有用户"
      if (targetUserIds.length === 0) {
        // 查询所有用户ID
        const allUsers = await this.usersService.findAll({ page: 1, pageSize: 10000 });
        userIdsToNotify = allUsers.items.map(u => u.id);
        this.logger.debug(`公告目标为所有用户，将为 ${userIdsToNotify.length} 个用户创建通知`);
      } else {
        userIdsToNotify = targetUserIds;
      }

      let offlineCount = 0;

      // 为离线用户创建通知
      for (const userId of userIdsToNotify) {
        const isOnline = this.wsGateway.isUserOnline(userId);
        
        if (!isOnline) {
          // 用户离线，创建通知
          await this.notificationsService.createAndPush({
            userId,
            title: `新公告：${announcement.title}`,
            content: announcement.summary || announcement.content.substring(0, 100),
            category: `announcement-${announcement.type}`,
            level: announcement.level as any,
            action: announcement.hasLink && announcement.linkUrl
              ? {
                  text: announcement.linkText || '查看详情',
                  url: announcement.linkUrl,
                }
              : undefined,
            extra: {
              announcementId: announcement.id,
              isPopup: announcement.isPopup,
            },
          });
          offlineCount++;
        }
      }
      
      this.logger.log(`已为 ${offlineCount} 个离线用户创建公告通知（总目标用户：${userIdsToNotify.length}）`);
    } catch (error) {
      this.logger.error(`创建离线通知失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 推送给指定角色
   */
  private async pushToRoles(roleIds: number[], message: WsMessage): Promise<void> {
    try {
      // 获取角色信息
      const roles = await this.rolesService.findByIds(roleIds);
      
      for (const role of roles) {
        this.wsGateway.sendToRole(role.name, message);
        this.logger.debug(`推送公告到角色 ${role.name}`);
      }
    } catch (error) {
      this.logger.error(`推送到角色失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 推送给指定会员等级
   */
  private async pushToMemberships(membershipIds: number[], message: WsMessage): Promise<void> {
    try {
      // TODO: 实现会员等级推送
      // 需要查询指定会员等级的所有用户ID
      // const users = await this.usersService.findByMembershipIds(membershipIds);
      // const userIds = users.map(u => u.id);
      // this.wsGateway.sendToUsersThrottled(userIds, message);
      
      this.logger.debug(`推送公告到会员等级 ${membershipIds.join(',')}`);
    } catch (error) {
      this.logger.error(`推送到会员等级失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 推送公告更新通知
   */
  private async pushAnnouncementUpdate(announcement: Announcement): Promise<void> {
    try {
      // 清理XSS，确保安全
      const sanitizedAnnouncement = this.xssFilter.sanitizeAnnouncement(announcement);

      // 构建WebSocket消息
      const message: WsMessage = {
        type: WsMessageType.ANNOUNCEMENT_UPDATE,
        data: sanitizedAnnouncement,
        timestamp: Date.now(),
      };

      // 根据目标类型推送
      await this.pushByTarget(message, announcement);

      this.logger.log(`公告更新已推送: ${announcement.title} (ID: ${announcement.id})`);
    } catch (error) {
      this.logger.error(`推送公告更新失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 推送公告删除通知
   */
  private async pushAnnouncementDelete(announcement: Announcement): Promise<void> {
    try {
      // 构建WebSocket消息（只需要ID）
      const message: WsMessage = {
        type: WsMessageType.ANNOUNCEMENT_DELETE,
        data: {
          id: announcement.id,
          title: announcement.title, // 用于日志
        },
        timestamp: Date.now(),
      };

      // 根据目标类型推送
      await this.pushByTarget(message, announcement);

      this.logger.log(`公告删除已推送: ${announcement.title} (ID: ${announcement.id})`);
    } catch (error) {
      this.logger.error(`推送公告删除失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 根据目标受众筛选公告
   */
  private async filterByTarget(
    announcements: Announcement[],
    userId?: number,
  ): Promise<Announcement[]> {
    if (!userId) {
      // 未登录用户只能看 targetType = 'all' 的公告
      return announcements.filter((a) => a.targetType === TargetType.ALL);
    }

    // 获取用户的角色和会员信息
    let userRoles: number[] = [];
    let userMembershipPlanIds: number[] = [];

    try {
      const user = await this.usersService.findOne(userId);
      if (user.roles) {
        userRoles = user.roles.map((role) => role.id);
      }
    } catch (error) {
      this.logger.warn(`无法获取用户角色信息: ${error.message}`);
    }

    // 获取用户的会员信息
    try {
      const membership = await this.userMembershipsService.findActiveByUser(userId);
      if (membership) {
        userMembershipPlanIds = [membership.planId];
      }
    } catch (error) {
      this.logger.warn(`无法获取用户会员信息: ${error.message}`);
    }

    // 筛选公告
    return announcements.filter((a) => {
      if (a.targetType === TargetType.ALL) return true;
      
      if (a.targetType === TargetType.USER) {
        return a.targetIds?.includes(userId);
      }
      
      if (a.targetType === TargetType.ROLE) {
        return a.targetIds?.some((roleId) => userRoles.includes(roleId));
      }
      
      if (a.targetType === TargetType.MEMBERSHIP) {
        return a.targetIds?.some((planId) => userMembershipPlanIds.includes(planId));
      }
      
      return false;
    });
  }

  /**
   * 附加已读状态
   */
  private async attachReadStatus(
    announcements: Announcement[],
    userId: number,
  ): Promise<any[]> {
    const readRecords = await this.readRepository.find({
      where: {
        userId,
        announcementId: In(announcements.map((a) => a.id)),
      },
    });

    const readMap = new Map(readRecords.map((r) => [r.announcementId, r]));

    return announcements.map((announcement) => ({
      ...announcement,
      isRead: readMap.get(announcement.id)?.isRead || false,
      isClicked: readMap.get(announcement.id)?.isClicked || false,
    }));
  }
}
