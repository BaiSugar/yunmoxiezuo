import { apiService } from './api';
import type {
  Prompt,
  PromptCategory,
  PromptPermission,
  PromptApplication,
  PromptStats,
  PaginatedResponse,
  CreatePromptDto,
  UpdatePromptDto,
  GrantPermissionDto,
  ApplyPromptDto,
  ReviewApplicationDto,
  QueryPromptsParams,
} from '../types/prompt';

/**
 * 提示词 API 服务
 */
export const promptsApi = {
  /**
   * 获取提示词列表（支持分页和筛选）
   */
  async getPrompts(params?: QueryPromptsParams): Promise<PaginatedResponse<Prompt>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params?.categoryId) queryParams.append('categoryId', String(params.categoryId));
    if (params?.isPublic !== undefined) queryParams.append('isPublic', String(params.isPublic));
    if (params?.authorId) queryParams.append('authorId', String(params.authorId));
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const url = `/prompts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiService.get<PaginatedResponse<Prompt>>(url);
    return response.data.data;
  },

  /**
   * 获取我的提示词列表
   */
  async getMyPrompts(params?: { categoryId?: number; page?: number; pageSize?: number }): Promise<Prompt[]> {
    const queryParams = new URLSearchParams();
    if (params?.categoryId) queryParams.append('categoryId', String(params.categoryId));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
    
    const url = `/prompts/my${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiService.get<{ data: Prompt[]; pagination: any }>(url);
    return response.data.data.data;
  },

  /**
   * 获取我的收藏列表
   */
  async getMyFavorites(params?: { categoryId?: number }): Promise<Prompt[]> {
    const queryParams = new URLSearchParams();
    if (params?.categoryId) queryParams.append('categoryId', String(params.categoryId));
    
    const url = `/prompts/favorites${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiService.get<Prompt[]>(url);
    return response.data.data;
  },

  /**
   * 获取提示词详情
   */
  async getPrompt(id: number): Promise<Prompt> {
    const response = await apiService.get<Prompt>(`/prompts/${id}`);
    return response.data.data;
  },

  /**
   * 获取提示词配置信息（不包含敏感的content文本）
   */
  async getPromptConfig(id: number): Promise<Prompt> {
    const response = await apiService.get<Prompt>(`/prompts/${id}/config`);
    return response.data.data;
  },

  /**
   * 创建提示词
   */
  async createPrompt(data: CreatePromptDto): Promise<Prompt> {
    const response = await apiService.post<Prompt>('/prompts', data);
    return response.data.data;
  },

  /**
   * 更新提示词
   */
  async updatePrompt(id: number, data: UpdatePromptDto): Promise<Prompt> {
    const response = await apiService.patch<Prompt>(`/prompts/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除提示词
   */
  async deletePrompt(id: number): Promise<void> {
    await apiService.delete(`/prompts/${id}`);
  },

  /**
   * 提交提示词审核（作者）
   */
  async submitForReview(id: number): Promise<Prompt> {
    const response = await apiService.post<Prompt>(`/prompts/${id}/submit-review`);
    return response.data.data;
  },

  /**
   * 使用提示词（增加使用次数）
   */
  async usePrompt(id: number): Promise<{ message: string }> {
    const response = await apiService.post<{ message: string }>(`/prompts/${id}/use`);
    return response.data.data;
  },

  /**
   * 点赞提示词
   */
  async likePrompt(id: number): Promise<{ message: string }> {
    const response = await apiService.post<{ message: string }>(`/prompts/${id}/like`);
    return response.data.data;
  },

  /**
   * 取消点赞
   */
  async unlikePrompt(id: number): Promise<void> {
    await apiService.delete(`/prompts/${id}/like`);
  },

  /**
   * 收藏提示词
   */
  async favoritePrompt(id: number): Promise<{ message: string }> {
    const response = await apiService.post<{ message: string }>(`/prompts/${id}/favorite`);
    return response.data.data;
  },

  /**
   * 取消收藏
   */
  async unfavoritePrompt(id: number): Promise<void> {
    await apiService.delete(`/prompts/${id}/favorite`);
  },

  /**
   * 获取提示词统计数据
   */
  async getPromptStats(id: number): Promise<PromptStats> {
    const response = await apiService.get<PromptStats>(`/prompts/${id}/stats`);
    return response.data.data;
  },

  /**
   * 批量更新提示词
   */
  async batchUpdatePrompts(data: {
    promptIds: number[];
    isPublic?: boolean;
    isContentPublic?: boolean;
    requireApplication?: boolean;
    isBanned?: boolean;
  }): Promise<{
    success: number;
    failed: number;
    errors: Array<{ promptId: number; error: string }>;
  }> {
    const response = await apiService.post<{
      success: number;
      failed: number;
      errors: Array<{ promptId: number; error: string }>;
    }>('/prompts/batch-update', data);
    return response.data.data;
  },
};

/**
 * 提示词分类 API 服务
 */
export const promptCategoriesApi = {
  /**
   * 获取所有分类（包括子分类）
   */
  async getCategories(): Promise<PromptCategory[]> {
    const response = await apiService.get<PromptCategory[]>('/prompt-categories');
    return response.data.data;
  },

  /**
   * 获取分类详情
   */
  async getCategory(id: number): Promise<PromptCategory> {
    const response = await apiService.get<PromptCategory>(`/prompt-categories/${id}`);
    return response.data.data;
  },
};

/**
 * 提示词权限 API 服务
 */
export const promptPermissionsApi = {
  /**
   * 授予权限（仅作者）
   */
  async grantPermission(promptId: number, data: GrantPermissionDto): Promise<PromptPermission> {
    const response = await apiService.post<PromptPermission>(`/prompts/${promptId}/permissions`, data);
    return response.data.data;
  },

  /**
   * 获取权限列表（仅作者）
   */
  async getPermissions(promptId: number): Promise<PromptPermission[]> {
    const response = await apiService.get<PromptPermission[]>(`/prompts/${promptId}/permissions`);
    return response.data.data;
  },

  /**
   * 撤销权限（仅作者）
   */
  async revokePermission(promptId: number, userId: number): Promise<void> {
    await apiService.delete(`/prompts/${promptId}/permissions/${userId}`);
  },
};

/**
 * 提示词申请 API 服务
 */
export const promptApplicationsApi = {
  /**
   * 申请使用私有提示词
   */
  async applyForPrompt(promptId: number, data: ApplyPromptDto): Promise<PromptApplication> {
    const response = await apiService.post<PromptApplication>(`/prompt-applications/prompts/${promptId}/apply`, data);
    return response.data.data;
  },

  /**
   * 获取我的申请列表
   */
  async getMyApplications(): Promise<PromptApplication[]> {
    const response = await apiService.get<PromptApplication[]>('/prompt-applications/my');
    return response.data.data;
  },

  /**
   * 获取待我审核的申请列表
   */
  async getPendingApplications(): Promise<PromptApplication[]> {
    const response = await apiService.get<PromptApplication[]>('/prompt-applications/pending');
    return response.data.data;
  },

  /**
   * 获取提示词的申请列表（仅作者）
   */
  async getPromptApplications(promptId: number): Promise<PromptApplication[]> {
    const response = await apiService.get<PromptApplication[]>(`/prompt-applications/prompts/${promptId}`);
    return response.data.data;
  },

  /**
   * 审核申请（仅作者）
   */
  async reviewApplication(id: number, data: ReviewApplicationDto): Promise<PromptApplication> {
    const response = await apiService.patch<PromptApplication>(`/prompt-applications/${id}/review`, data);
    return response.data.data;
  },
};

/**
 * 提示词举报 API 服务
 */
export const promptReportsApi = {
  /**
   * 举报提示词
   */
  async reportPrompt(promptId: number, data: {
    reason: 'spam' | 'inappropriate' | 'violence' | 'hate_speech' | 'pornography' | 'copyright' | 'fraud' | 'other';
    description?: string;
  }): Promise<any> {
    const response = await apiService.post<any>(`/prompts/reports/${promptId}`, data);
    return response.data.data;
  },

  /**
   * 获取我的举报记录
   */
  async getMyReports(page: number = 1, pageSize: number = 20): Promise<PaginatedResponse<any>> {
    const response = await apiService.get<PaginatedResponse<any>>(`/prompts/reports/my?page=${page}&pageSize=${pageSize}`);
    return response.data.data;
  },
};
