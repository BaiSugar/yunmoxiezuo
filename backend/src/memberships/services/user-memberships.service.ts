import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual, IsNull } from 'typeorm';
import { UserMembership } from '../entities/user-membership.entity';
import { MembershipPlansService } from './membership-plans.service';
import { MembershipSource } from '../enums/membership-source.enum';

/**
 * 用户会员服务
 */
@Injectable()
export class UserMembershipsService {
  constructor(
    @InjectRepository(UserMembership)
    private readonly membershipRepository: Repository<UserMembership>,
    private readonly plansService: MembershipPlansService,
  ) {}

  /**
   * 为用户开通会员
   */
  async activate(
    userId: number,
    planId: number,
    source: MembershipSource,
    relatedId?: number,
    customDuration?: number,
  ): Promise<UserMembership> {
    const plan = await this.plansService.findOne(planId);

    // 检查用户是否已有该等级或更高等级的活跃会员
    const existingMembership = await this.findActiveByUser(userId);

    const now = new Date();
    let startDate = now;
    let endDate: Date | undefined = undefined;

    // 使用自定义时长或套餐默认时长
    const duration = customDuration !== undefined && customDuration > 0 
      ? customDuration 
      : plan.duration;

    // 计算结束时间
    if (duration > 0) {
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + duration);
    }

    // 会员叠加规则
    if (existingMembership) {
      if (existingMembership.level === plan.level) {
        // 同等级：延长时间
        if (existingMembership.endDate) {
          startDate = existingMembership.endDate > now ? existingMembership.endDate : now;
          if (duration > 0) {
            endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + duration);
          }
        }
        // 停用旧会员
        existingMembership.isActive = false;
        await this.membershipRepository.save(existingMembership);
      } else if (existingMembership.level > plan.level) {
        // 新等级较低：拒绝
        throw new BadRequestException('当前会员等级高于要开通的等级，无法降级');
      } else {
        // 新等级较高：立即生效，停用旧会员
        existingMembership.isActive = false;
        await this.membershipRepository.save(existingMembership);
      }
    }

    // 创建新会员记录
    const membershipData = {
      userId,
      planId,
      level: plan.level,
      startDate,
      endDate,
      isActive: true,
      source,
      orderId: source === MembershipSource.PURCHASE ? relatedId : undefined,
      redeemCodeId: source === MembershipSource.REDEEM ? relatedId : undefined,
      autoRenew: false,
    };

    const membership = this.membershipRepository.create(membershipData);
    return await this.membershipRepository.save(membership);
  }

  /**
   * 获取用户当前活跃会员
   */
  async findActiveByUser(userId: number): Promise<UserMembership | null> {
    const now = new Date();

    return await this.membershipRepository.findOne({
      where: [
        // 永久会员
        {
          userId,
          isActive: true,
          startDate: LessThanOrEqual(now),
          endDate: IsNull(),
        },
        // 有期限且未过期
        {
          userId,
          isActive: true,
          startDate: LessThanOrEqual(now),
          endDate: MoreThanOrEqual(now),
        },
      ],
      relations: ['plan'],
      order: { level: 'DESC', startDate: 'DESC' },
    });
  }

  /**
   * 获取用户所有会员记录
   */
  async findAllByUser(userId: number, page: number = 1, limit: number = 20) {
    const [data, total] = await this.membershipRepository.findAndCount({
      where: { userId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
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
   * 检查用户是否有活跃会员
   */
  async hasActiveMembership(userId: number): Promise<boolean> {
    const membership = await this.findActiveByUser(userId);
    return !!membership;
  }

  /**
   * 获取用户会员等级
   */
  async getUserLevel(userId: number): Promise<number> {
    const membership = await this.findActiveByUser(userId);
    return membership?.level || 0;
  }

  /**
   * 取消自动续费
   */
  async cancelAutoRenew(userId: number, membershipId: number): Promise<UserMembership> {
    const membership = await this.membershipRepository.findOne({
      where: { id: membershipId, userId },
    });

    if (!membership) {
      throw new NotFoundException('会员记录不存在');
    }

    if (!membership.isActive) {
      throw new BadRequestException('会员已过期');
    }

    membership.autoRenew = false;
    return await this.membershipRepository.save(membership);
  }

  /**
   * 定时任务：过期会员
   * 返回过期会员的用户ID列表，用于WebSocket推送通知
   */
  async expireMemberships(): Promise<{ count: number; userIds: number[] }> {
    const now = new Date();

    // 先查询即将过期的会员（获取userId）
    const expiredMemberships = await this.membershipRepository
      .createQueryBuilder('membership')
      .select('membership.userId', 'userId')
      .where('membership.isActive = :isActive', { isActive: true })
      .andWhere('membership.endDate IS NOT NULL')
      .andWhere('membership.endDate < :now', { now })
      .getRawMany();

    const userIds = expiredMemberships.map(m => m.userId);

    // 批量更新状态
    if (userIds.length > 0) {
      await this.membershipRepository
        .createQueryBuilder()
        .update(UserMembership)
        .set({ isActive: false })
        .where('userId IN (:...userIds)', { userIds })
        .andWhere('isActive = :isActive', { isActive: true })
        .andWhere('endDate IS NOT NULL')
        .andWhere('endDate < :now', { now })
        .execute();
    }

    return {
      count: userIds.length,
      userIds,
    };
  }
}
