/**
 * 提示词组API服务
 */

import { apiService } from './api';
import type {
  PromptGroup,
  PromptGroupsResponse,
  CreatePromptGroupDto,
  UpdatePromptGroupDto,
  QueryPromptGroupsParams,
  ApplyPromptGroupDto,
  ReviewApplicationDto,
  PromptGroupApplication,
  PromptGroupParametersResponse,
} from '../types/prompt-group';

/**
 * 创建提示词组
 */
export const createPromptGroup = async (
  data: CreatePromptGroupDto
): Promise<PromptGroup> => {
  const response = await apiService.post<PromptGroup>('/prompt-groups', data);
  return response.data.data;
};

/**
 * 获取提示词组列表
 */
export const getPromptGroups = async (
  params?: QueryPromptGroupsParams
): Promise<PromptGroupsResponse> => {
  const response = await apiService.get<PromptGroupsResponse>('/prompt-groups', { params });
  return response.data.data;
};

/**
 * 获取我的提示词组列表
 */
export const getMyPromptGroups = async (): Promise<PromptGroupsResponse> => {
  const response = await apiService.get<PromptGroupsResponse>('/prompt-groups/my');
  return response.data.data;
};

/**
 * 获取提示词组详情
 */
export const getPromptGroupById = async (id: number): Promise<PromptGroup> => {
  const response = await apiService.get<PromptGroup>(`/prompt-groups/${id}`);
  return response.data.data;
};

/**
 * 更新提示词组
 */
export const updatePromptGroup = async (
  id: number,
  data: UpdatePromptGroupDto
): Promise<PromptGroup> => {
  const response = await apiService.patch<PromptGroup>(`/prompt-groups/${id}`, data);
  return response.data.data;
};

/**
 * 删除提示词组
 */
export const deletePromptGroup = async (id: number): Promise<void> => {
  await apiService.delete(`/prompt-groups/${id}`);
};

/**
 * 申请使用提示词组
 */
export const applyPromptGroup = async (
  id: number,
  data: ApplyPromptGroupDto
): Promise<PromptGroupApplication> => {
  const response = await apiService.post<PromptGroupApplication>(`/prompt-groups/${id}/apply`, data);
  return response.data.data;
};

/**
 * 获取我的申请列表
 */
export const getMyApplications = async (): Promise<PromptGroupApplication[]> => {
  const response = await apiService.get<PromptGroupApplication[]>('/prompt-groups/applications/my');
  return response.data.data;
};

/**
 * 获取待审核的申请列表
 */
export const getPendingApplications = async (): Promise<PromptGroupApplication[]> => {
  const response = await apiService.get<PromptGroupApplication[]>('/prompt-groups/applications/pending');
  return response.data.data;
};

/**
 * 审核申请
 */
export const reviewApplication = async (
  applicationId: number,
  data: ReviewApplicationDto
): Promise<PromptGroupApplication> => {
  const response = await apiService.patch<PromptGroupApplication>(
    `/prompt-groups/applications/${applicationId}/review`,
    data
  );
  return response.data.data;
};

/**
 * 点赞提示词组
 */
export const likePromptGroup = async (id: number): Promise<void> => {
  await apiService.post(`/prompt-groups/${id}/like`);
};

/**
 * 取消点赞
 */
export const unlikePromptGroup = async (id: number): Promise<void> => {
  await apiService.delete(`/prompt-groups/${id}/like`);
};

/**
 * 记录使用提示词组
 */
export const recordUse = async (id: number): Promise<void> => {
  await apiService.post(`/prompt-groups/${id}/use`);
};

/**
 * 获取提示词组的所有参数
 */
export const getPromptGroupParameters = async (
  id: number
): Promise<PromptGroupParametersResponse> => {
  const response = await apiService.get<PromptGroupParametersResponse>(`/prompt-groups/${id}/parameters`);
  return response.data.data;
};

/**
 * 检查是否有权限使用提示词组
 */
export const checkPermission = async (id: number): Promise<{ hasPermission: boolean }> => {
  const response = await apiService.get<{ hasPermission: boolean }>(`/prompt-groups/${id}/check-permission`);
  return response.data.data;
};

export const promptGroupApi = {
  create: createPromptGroup,
  getAll: getPromptGroups,
  getMy: getMyPromptGroups,
  getById: getPromptGroupById,
  update: updatePromptGroup,
  delete: deletePromptGroup,
  apply: applyPromptGroup,
  getMyApplications,
  getPendingApplications,
  reviewApplication,
  like: likePromptGroup,
  unlike: unlikePromptGroup,
  recordUse,
  getParameters: getPromptGroupParameters,
  checkPermission,
};

export default promptGroupApi;

