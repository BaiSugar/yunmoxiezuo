import { SetMetadata } from '@nestjs/common';

export const MEMBERSHIP_LEVEL_KEY = 'membershipLevel';
export const MEMBERSHIP_FEATURE_KEY = 'membershipFeature';

/**
 * 要求最低会员等级装饰器
 * @param level 最低会员等级
 */
export const RequireMembershipLevel = (level: number) => 
  SetMetadata(MEMBERSHIP_LEVEL_KEY, level);

/**
 * 要求特定会员权益装饰器
 * @param feature 权益名称（如：apiAccess, customService）
 */
export const RequireMembershipFeature = (feature: string) => 
  SetMetadata(MEMBERSHIP_FEATURE_KEY, feature);
