/**
 * 提示词组相关类型定义
 */

import type { User } from './index';
import type { PromptCategory } from './prompt';

/**
 * 提示词组状态
 */
export type PromptGroupStatus = 'draft' | 'published' | 'archived';

/**
 * 提示词组权限类型
 */
export type PromptGroupPermissionType = 'view' | 'use' | 'edit';

/**
 * 提示词组申请状态
 */
export type PromptGroupApplicationStatus = 'pending' | 'approved' | 'rejected';

/**
 * 提示词组项
 */
export interface PromptGroupItem {
  id: number;
  groupId: number;
  promptId: number;
  prompt?: {
    id: number;
    name: string;
    description?: string;
  };
  stageType: string;
  stageLabel?: string;
  order: number;
  isRequired: boolean;
  createdAt: string;
}

/**
 * 提示词组
 */
export interface PromptGroup {
  id: number;
  userId: number;
  user?: User;
  name: string;
  description?: string;
  isPublic: boolean;
  requireApplication: boolean;
  categoryId?: number;
  category?: PromptCategory;
  status: PromptGroupStatus;
  viewCount: number;
  useCount: number;
  likeCount: number;
  hotValue: number;
  createdAt: string;
  updatedAt: string;
  items: PromptGroupItem[];
  // 动态字段
  isLiked?: boolean;
  pendingApplicationsCount?: number;
}

/**
 * 提示词组权限
 */
export interface PromptGroupPermission {
  id: number;
  groupId: number;
  userId: number;
  user?: User;
  permission: PromptGroupPermissionType;
  grantedBy: number;
  grantedAt: string;
}

/**
 * 提示词组申请
 */
export interface PromptGroupApplication {
  id: number;
  groupId: number;
  group?: PromptGroup;
  userId: number;
  user?: User;
  reason?: string;
  status: PromptGroupApplicationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  reviewer?: User;
  reviewNote?: string;
}

/**
 * 提示词组项DTO
 */
export interface PromptGroupItemDto {
  promptId: number;
  stageType: string;
  stageLabel?: string;
  order?: number;
  isRequired?: boolean;
}

/**
 * 创建提示词组DTO
 */
export interface CreatePromptGroupDto {
  name: string;
  description?: string;
  isPublic?: boolean;
  requireApplication?: boolean;
  categoryId?: number;
  status?: PromptGroupStatus;
  items: PromptGroupItemDto[];
}

/**
 * 更新提示词组DTO
 */
export interface UpdatePromptGroupDto extends Partial<CreatePromptGroupDto> {}

/**
 * 查询提示词组参数
 */
export interface QueryPromptGroupsParams {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  keyword?: string;
  isPublic?: boolean;
  userId?: number;
  status?: PromptGroupStatus;
  sortBy?: 'hotValue' | 'createdAt' | 'viewCount' | 'useCount' | 'likeCount';
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 提示词组列表响应
 */
export interface PromptGroupsResponse {
  data: PromptGroup[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 申请使用提示词组DTO
 */
export interface ApplyPromptGroupDto {
  reason?: string;
}

/**
 * 审核申请DTO
 */
export interface ReviewApplicationDto {
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

/**
 * 提示词组参数
 */
export interface PromptGroupParameter {
  name: string;
  required: boolean;
  description?: string;
  stageType: string;
  stageLabel?: string;
}

/**
 * 提示词组参数响应
 */
export interface PromptGroupParametersResponse {
  groupId: number;
  groupName: string;
  parameters: PromptGroupParameter[];
}

