import { apiService } from './api';

/**
 * 会员套餐类型
 */
export interface MembershipPlan {
  id: number;
  name: string;
  type: string;
  level: number;
  price: number;
  duration: number;
  tokenQuota: number;
  dailyTokenLimit: number;
  maxConcurrentChats: number;
  canUseAdvancedModels: boolean;
  priority: number;
  features: Record<string, any>;
  isActive: boolean;
  sort: number;
  description: string;
  purchaseUrl: string;
  freeInputCharsPerRequest: number;
  outputFree: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueryMembershipPlanDto {
  isActive?: boolean;
  minLevel?: number;
  maxLevel?: number;
  page?: number;
  limit?: number;
}

export interface MembershipPlanListResponse {
  data: MembershipPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 获取会员套餐列表（带分页）
 */
export const getMembershipPlanList = async (params?: QueryMembershipPlanDto): Promise<MembershipPlanListResponse> => {
  const response = await apiService.get<MembershipPlanListResponse>('/membership-plans', { params });
  return response.data.data || response.data;
};

/**
 * 会员相关API
 */
export const membershipsApi = {
  /**
   * 获取我的活跃会员
   */
  async getMyActiveMembership() {
    const response = await apiService.get('/user-memberships/me/active');
    return response.data.data;
  },

  /**
   * 获取我的会员列表
   */
  async getMyMemberships(params?: { page?: number; limit?: number }) {
    const response = await apiService.get('/user-memberships/me', { params });
    return response.data.data;
  },

  /**
   * 取消自动续费
   */
  async cancelAutoRenew(membershipId: number) {
    const response = await apiService.post(`/user-memberships/${membershipId}/cancel-auto-renew`);
    return response.data.data;
  },

  /**
   * 获取会员套餐列表
   */
  async getPlans() {
    const response = await apiService.get('/membership-plans');
    return response.data.data;
  },
};

