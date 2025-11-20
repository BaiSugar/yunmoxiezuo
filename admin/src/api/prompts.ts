import request from '../utils/request';
import type { Prompt, PromptReport } from '../types/prompt';

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 导出类型，方便组件使用
export type { Prompt, PromptReport };

export const promptsApi = {
  /**
   * 获取所有提示词列表（管理员）
   */
  async getAllPromptsForAdmin(params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
    categoryId?: number;
    isPublic?: boolean;
    authorId?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<Prompt>> {
    return request.get('/prompts/admin/all', { params });
  },

  /**
   * 封禁提示词（管理员）
   */
  async banPrompt(id: number, reason?: string): Promise<Prompt> {
    return request.post(`/prompts/${id}/ban`, { reason });
  },

  /**
   * 解封提示词（管理员）
   */
  async unbanPrompt(id: number): Promise<Prompt> {
    return request.post(`/prompts/${id}/unban`);
  },

  /**
   * 审核通过提示词（管理员）
   */
  async approvePrompt(
    id: number,
    data: {
      autoPublish?: boolean;
      reviewNote?: string;
    }
  ): Promise<Prompt> {
    return request.post(`/prompts/${id}/approve`, data);
  },

  /**
   * 拒绝提示词审核（管理员）
   */
  async rejectPromptReview(
    id: number,
    data: {
      rejectReason?: string;
    }
  ): Promise<Prompt> {
    return request.post(`/prompts/${id}/reject-review`, data);
  },

  /**
   * 批量更新提示词（管理员）
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
    return request.post('/prompts/batch-update', data);
  },
};

export const promptReportsApi = {
  /**
   * 获取所有举报列表（管理员）
   */
  async getAllReports(params?: {
    page?: number;
    pageSize?: number;
    status?: 'pending' | 'approved' | 'rejected';
    promptId?: number;
  }): Promise<PaginatedResponse<PromptReport>> {
    return request.get('/prompts/reports', { params });
  },

  /**
   * 审核举报（管理员）
   */
  async reviewReport(
    reportId: number,
    data: {
      status: 'approved' | 'rejected';
      reviewNote?: string;
    }
  ): Promise<PromptReport> {
    return request.patch(`/prompts/reports/${reportId}/review`, data);
  },

  /**
   * 删除举报记录（管理员）
   */
  async deleteReport(reportId: number): Promise<void> {
    await request.delete(`/prompts/reports/${reportId}`);
  },

  /**
   * 获取提示词的举报统计（管理员）
   */
  async getReportStats(promptId: number): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    return request.get(`/prompts/reports/stats/${promptId}`);
  },
};

