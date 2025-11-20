import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserMembershipsService } from '../services/user-memberships.service';
import { WebSocketGateway } from '../../websocket/websocket.gateway';
import { WsMessageType } from '../../websocket/interfaces/websocket-message.interface';

/**
 * 会员过期检测定时任务
 */
@Injectable()
export class MembershipExpiryTask {
  private readonly logger = new Logger(MembershipExpiryTask.name);

  constructor(
    private readonly userMembershipsService: UserMembershipsService,
    @Inject(forwardRef(() => WebSocketGateway))
    private readonly wsGateway: WebSocketGateway,
  ) {}

  /**
   * 每5分钟检查并更新过期会员
   * 将已过期但仍标记为激活的会员设置为未激活状态
   * 
   * 注意：此任务仅更新数据库状态，实际权限判断在查询时实时进行
   */
  @Cron('*/5 * * * *', {
    name: 'expireMemberships',
    timeZone: 'Asia/Shanghai',
  })
  async handleMembershipExpiry() {
    this.logger.debug('开始检查过期会员...');
    
    try {
      const { count, userIds } = await this.userMembershipsService.expireMemberships();
      
      if (count > 0) {
        this.logger.log(`成功处理 ${count} 个过期会员`);
        
        // 通过 WebSocket 推送会员过期通知
        for (const userId of userIds) {
          try {
            this.wsGateway.sendToUser(userId, {
              type: WsMessageType.MEMBERSHIP_EXPIRED,
              data: {
                userId,
                message: '您的会员已过期，部分功能可能受限',
                expiredAt: new Date().toISOString(),
              },
              timestamp: Date.now(),
            });
          } catch (err) {
            this.logger.error(`推送会员过期通知失败 (用户${userId}):`, err.message);
          }
        }
      }
    } catch (error) {
      this.logger.error('检查过期会员失败:', error.message, error.stack);
    }
  }

  /**
   * 每天凌晨额外执行一次，确保数据准确性并记录日志
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'expireMembershipsMidnight',
    timeZone: 'Asia/Shanghai',
  })
  async handleMidnightExpiry() {
    this.logger.log('执行每日会员过期检查（凌晨任务）...');
    await this.handleMembershipExpiry();
  }
}
