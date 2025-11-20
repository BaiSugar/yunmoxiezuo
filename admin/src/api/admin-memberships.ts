import request from '../utils/request';

/**
 * 管理员会员管理API
 */

export interface UserMembershipInfo {
  id: number;
  username: string;
  email: string;
  membership?: {
    id: number;
    planName: string;
    planType: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
    autoRenew: boolean;
    createdAt: string;
  };
  membershipHistory: Array<{
    id: number;
    planName: string;
    startDate: string;
    endDate: string;
    status: string;
    createdAt: string;
  }>;
}

export interface MembershipStatistics {
  totalUsers: number;
  activeMembers: number;
  expiringSoon: number;
  autoRenewUsers: number;
  planDistribution: {
    basic: number;
    premium: number;
    professional: number;
    enterprise: number;
  };
  monthlyRevenue: number;
  yearlyRevenue: number;
}

/**
 * 获取所有用户的会员信息
 */
export async function getUsersMembershipInfo(params: {
  page?: number;
  limit?: number;
  search?: string;
  planType?: string;
  status?: string;
  autoRenew?: string;
}) {
  return request.get('/admin/memberships/users', { params });
}

/**
 * 获取会员统计信息
 */
export async function getMembershipStatistics(): Promise<MembershipStatistics> {
  return request.get('/admin/memberships/statistics');
}
