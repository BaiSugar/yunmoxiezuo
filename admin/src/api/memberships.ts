import request from '../utils/request';
import type { 
  MembershipPlan, 
  CreateMembershipPlanDto, 
  UpdateMembershipPlanDto,
  QueryMembershipPlanDto,
  MembershipPlanListResponse 
} from '../types/membership';

/**
 * 会员管理API
 */

/**
 * 获取会员套餐列表（带分页）
 */
export async function getMembershipPlanList(params?: QueryMembershipPlanDto): Promise<MembershipPlanListResponse> {
  return request.get('/membership-plans', { params });
}

/**
 * 获取所有会员套餐（不分页，实际会获取前100条）
 */
export async function getMembershipPlans(): Promise<MembershipPlan[]> {
  const response = await getMembershipPlanList({ limit: 100 });
  return response.data;
}

/**
 * 获取单个会员套餐
 */
export async function getMembershipPlan(id: number): Promise<MembershipPlan> {
  return request.get(`/membership-plans/${id}`);
}

/**
 * 创建会员套餐
 */
export async function createMembershipPlan(data: CreateMembershipPlanDto): Promise<MembershipPlan> {
  return request.post('/membership-plans', data);
}

/**
 * 更新会员套餐
 */
export async function updateMembershipPlan(id: number, data: UpdateMembershipPlanDto): Promise<MembershipPlan> {
  return request.put(`/membership-plans/${id}`, data);
}

/**
 * 删除会员套餐
 */
export async function deleteMembershipPlan(id: number): Promise<void> {
  return request.delete(`/membership-plans/${id}`);
}

/**
 * 切换会员套餐状态
 */
export async function toggleMembershipPlanStatus(id: number): Promise<MembershipPlan> {
  return request.patch(`/membership-plans/${id}/toggle-status`);
}

/**
 * 获取用户当前活跃会员（管理员）
 */
export async function getUserActiveMembership(userId: number) {
  return request.get(`/user-memberships/user/${userId}/active`);
}

/**
 * 为用户开通会员（管理员）
 */
export async function activateMembership(userId: number, data: {
  planId: number;
  duration?: number;
}) {
  return request.post(`/user-memberships/user/${userId}/activate`, data);
}
