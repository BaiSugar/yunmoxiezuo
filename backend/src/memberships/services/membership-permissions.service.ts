import { Injectable } from '@nestjs/common';
import { UserMembershipsService } from './user-memberships.service';

/**
 * 会员权限检查服务
 * 
 * 用于检查用户会员等级对应的权限
 */
@Injectable()
export class MembershipPermissionsService {
  constructor(
    private readonly userMembershipsService: UserMembershipsService,
  ) {}

  /**
   * 检查用户是否有活跃会员
   */
  async hasActiveMembership(userId: number): Promise<boolean> {
    return await this.userMembershipsService.hasActiveMembership(userId);
  }

  /**
   * 获取用户会员等级
   */
  async getUserLevel(userId: number): Promise<number> {
    return await this.userMembershipsService.getUserLevel(userId);
  }

  /**
   * 检查用户会员等级是否满足要求
   */
  async checkMinLevel(userId: number, minLevel: number): Promise<boolean> {
    const userLevel = await this.getUserLevel(userId);
    return userLevel >= minLevel;
  }

  /**
   * 检查用户是否可以使用高级模型
   */
  async canUseAdvancedModels(userId: number): Promise<boolean> {
    const membership = await this.userMembershipsService.findActiveByUser(userId);
    
    if (!membership) {
      return false;
    }

    return membership.plan.canUseAdvancedModels;
  }

  /**
   * 获取用户每日字数限制
   */
  async getDailyTokenLimit(userId: number): Promise<number> {
    const membership = await this.userMembershipsService.findActiveByUser(userId);
    
    if (!membership) {
      return 0; // 免费用户无限制或设置默认值
    }

    return membership.plan.dailyTokenLimit;
  }

  /**
   * 获取用户最大并发对话数
   */
  async getMaxConcurrentChats(userId: number): Promise<number> {
    const membership = await this.userMembershipsService.findActiveByUser(userId);
    
    if (!membership) {
      return 1; // 免费用户默认1个
    }

    return membership.plan.maxConcurrentChats;
  }

  /**
   * 获取用户队列优先级
   */
  async getQueuePriority(userId: number): Promise<number> {
    const membership = await this.userMembershipsService.findActiveByUser(userId);
    
    if (!membership) {
      return 1; // 免费用户最低优先级
    }

    return membership.plan.priority;
  }

  /**
   * 检查用户是否拥有特定权益
   * @param userId 用户ID
   * @param featureName 权益名称（如：apiAccess, customService）
   */
  async hasFeature(userId: number, featureName: string): Promise<boolean> {
    const membership = await this.userMembershipsService.findActiveByUser(userId);
    
    if (!membership || !membership.plan.features) {
      return false;
    }

    return membership.plan.features[featureName] === true;
  }

  /**
   * 获取用户所有会员权益
   */
  async getUserFeatures(userId: number): Promise<Record<string, any>> {
    const membership = await this.userMembershipsService.findActiveByUser(userId);
    
    if (!membership) {
      return {};
    }

    return {
      level: membership.level,
      canUseAdvancedModels: membership.plan.canUseAdvancedModels,
      dailyTokenLimit: membership.plan.dailyTokenLimit,
      maxConcurrentChats: membership.plan.maxConcurrentChats,
      priority: membership.plan.priority,
      features: membership.plan.features || {},
    };
  }
}
