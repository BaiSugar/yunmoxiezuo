/**
 * 会员套餐
 */
export interface MembershipPlan {
  id: number;
  name: string;
  type: string; // 套餐类型标识（basic, premium, vip等）
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
  purchaseUrl: string; // 购买地址
  freeInputCharsPerRequest: number; // 每次请求免费输入字符数（会员特权）
  outputFree: boolean; // 输出是否完全免赹（会员特权）
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建会员套餐DTO
 */
export interface CreateMembershipPlanDto {
  name: string;
  type: string; // 套餐类型标识（basic, premium, vip等）
  level: number;
  price: number;
  duration: number;
  tokenQuota: number;
  dailyTokenLimit?: number;
  maxConcurrentChats?: number;
  canUseAdvancedModels?: boolean;
  priority?: number;
  features?: Record<string, any>;
  sort?: number;
  description?: string;
  purchaseUrl?: string; // 购买地址
  freeInputCharsPerRequest?: number; // 每次请求免费输入字符数（会员特权）
  outputFree?: boolean; // 输出是否完全免费（会员特权）
}

/**
 * 更新会员套餐DTO
 */
export interface UpdateMembershipPlanDto extends Partial<CreateMembershipPlanDto> {}

/**
 * 查询会员套餐DTO
 */
export interface QueryMembershipPlanDto {
  isActive?: boolean;
  minLevel?: number;
  maxLevel?: number;
  page?: number;
  limit?: number;
}

/**
 * 会员套餐列表响应
 */
export interface MembershipPlanListResponse {
  data: MembershipPlan[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 用户会员记录
 */
export interface UserMembership {
  id: number;
  userId: number;
  planId: number;
  plan: MembershipPlan;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
