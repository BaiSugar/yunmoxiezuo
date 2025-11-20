/**
 * 提示词系统类型定义
 */

import type { User } from './index';

/**
 * 提示词状态
 */
export type PromptStatus = 'draft' | 'published' | 'archived';

/**
 * 权限类型
 */
export type PermissionType = 'view' | 'use' | 'edit';

/**
 * 消息角色类型
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * 内容类型
 */
export type ContentType = 'text' | 'character' | 'worldview';

/**
 * 申请状态
 */
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

/**
 * 提示词内容参数
 */
export interface PromptParameter {
  name: string;
  required: boolean;
  description?: string;
}

/**
 * 提示词内容
 */
export interface PromptContent {
  id: number;
  promptId: number;
  name: string;
  role: MessageRole;
  content: string;
  order: number;
  type: ContentType;
  referenceId?: number;
  isEnabled: boolean;
  parameters?: PromptParameter[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 分类使用场景类型
 */
export type CategoryUsageType = 'writing' | 'roleplay';

/**
 * 提示词分类
 */
export interface PromptCategory {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  order: number;
  usageType: CategoryUsageType;
  createdAt: string;
  updatedAt: string;
}

/**
 * 提示词
 */
export interface Prompt {
  id: number;
  name: string;
  description?: string;
  isPublic: boolean;
  isContentPublic: boolean;
  requireApplication: boolean;
  isBanned?: boolean;
  bannedReason?: string | null;
  bannedAt?: string | null;
  needsReview?: boolean; // 是否需要管理员审核才能发布
  reviewSnapshot?: {
    name: string;
    description: string;
    contents: any[];
    snapshotAt: Date;
  } | null; // 审核快照（保存举报前的内容）
  reviewSubmittedAt?: string | null; // 提交审核时间
  authorId: number;
  categoryId: number;
  hotValue: number;
  viewCount: number;
  useCount: number;
  likeCount: number;
  status: PromptStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  author?: User;
  category?: PromptCategory;
  contents?: PromptContent[];
  parameters?: PromptParameter[]; // 当内容不公开且非作者时，返回参数列表而非contents
  // 动态字段（由后端查询注入）
  isLiked?: boolean;
  isFavorited?: boolean;
  hasPermission?: boolean; // 用户是否已有使用权限（申请已通过或作者）
  pendingApplicationsCount?: number;
}

/**
 * 提示词权限
 */
export interface PromptPermission {
  id: number;
  promptId: number;
  userId: number;
  permission: PermissionType;
  grantedBy: number;
  createdAt: string;
  user?: User;
}

/**
 * 提示词申请
 */
export interface PromptApplication {
  id: number;
  promptId: number;
  userId: number;
  reason: string;
  status: ApplicationStatus;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
  prompt?: Prompt;
  user?: User;
  reviewer?: User;
}

/**
 * 提示词统计数据
 */
export interface PromptStats {
  viewCount: number;
  useCount: number;
  likeCount: number;
  hotValue: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * 创建提示词DTO
 */
export interface CreatePromptDto {
  name: string;
  description?: string;
  isPublic: boolean;
  isContentPublic: boolean;
  requireApplication: boolean;
  categoryId: number;
  status: PromptStatus;
  contents: Array<{
    name: string;
    role: MessageRole;
    content: string;
    order: number;
    type: ContentType;
    referenceId?: number;
    isEnabled: boolean;
    parameters?: PromptParameter[];
  }>;
}

/**
 * 更新提示词DTO
 */
export interface UpdatePromptDto {
  name?: string;
  description?: string;
  isPublic?: boolean;
  isContentPublic?: boolean;
  requireApplication?: boolean;
  categoryId?: number;
  status?: PromptStatus;
  contents?: Array<{
    id?: number;
    name: string;
    role: MessageRole;
    content: string;
    order: number;
    type: ContentType;
    referenceId?: number;
    isEnabled: boolean;
    parameters?: PromptParameter[];
  }>;
}

/**
 * 创建分类DTO
 */
export interface CreatePromptCategoryDto {
  name: string;
  icon?: string;
  description?: string;
  order?: number;
  usageType?: CategoryUsageType;
}

/**
 * 更新分类DTO
 */
export interface UpdatePromptCategoryDto {
  name?: string;
  icon?: string;
  description?: string;
  order?: number;
  usageType?: CategoryUsageType;
}

/**
 * 授予权限DTO
 */
export interface GrantPermissionDto {
  userId: number;
  permission: PermissionType;
}

/**
 * 申请使用提示词DTO
 */
export interface ApplyPromptDto {
  reason: string;
}

/**
 * 审核申请DTO
 */
export interface ReviewApplicationDto {
  status: 'approved' | 'rejected';
  reviewNote?: string;
}

/**
 * 查询提示词参数
 */
export interface QueryPromptsParams {
  page?: number;
  pageSize?: number;
  categoryId?: number;
  isPublic?: boolean;
  authorId?: number;
  keyword?: string;
  status?: PromptStatus;
  sortBy?: 'hotValue' | 'createdAt' | 'viewCount' | 'useCount' | 'likeCount';
  sortOrder?: 'ASC' | 'DESC';
}
