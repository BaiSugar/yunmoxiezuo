import request from '../utils/request';

/**
 * 管理员字数管理API
 */

export interface UserTokenInfo {
  id: number;
  username: string;
  email: string;
  totalTokens: number;
  usedTokens: number;
  frozenTokens: number;
  giftTokens: number;
  dailyFreeQuota: number;
  dailyUsedQuota: number;
  membership?: {
    planName: string;
    expiresAt: string;
    isActive: boolean;
  };
}

export interface TokenStatistics {
  totalUsers: number;
  totalTokens: number;
  totalUsedTokens: number;
  membershipUsers: number;
  dailyUsage: number;
  monthlyUsage: number;
}

/**
 * 获取所有用户的字数信息
 */
export async function getUsersTokenInfo(params: {
  page?: number;
  limit?: number;
  search?: string;
  minTokens?: number;
  maxTokens?: number;
  hasMembership?: string;
}) {
  return request.get('/admin/token-balances/users', { params });
}

/**
 * 获取字数统计信息
 */
export async function getTokenStatistics(): Promise<TokenStatistics> {
  return request.get('/admin/token-balances/statistics');
}
