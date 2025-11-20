/**
 * 提示词相关类型定义
 */

export interface Prompt {
  id: number;
  name: string;
  description: string;
  authorId: number;
  author: { id: number; username: string; nickname: string };
  isPublic: boolean;
  isContentPublic: boolean;
  requireApplication: boolean;
  isBanned: boolean;
  bannedReason?: string;
  bannedAt?: string;
  needsReview?: boolean; // 是否需要管理员审核才能发布
  reviewSnapshot?: {
    name: string;
    description: string;
    contents: any[];
    snapshotAt: Date;
  } | null; // 审核快照（保存举报前的内容）
  reviewSubmittedAt?: string | null; // 提交审核时间
  status: 'draft' | 'published' | 'archived';
  hotValue: number;
  viewCount: number;
  useCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  contents?: any[]; // 当前内容
}

export interface PromptReport {
  id: number;
  promptId: number;
  prompt: {
    id: number;
    name: string;
    isBanned: boolean;
  };
  reporter: {
    id: number;
    username: string;
    nickname: string;
  };
  reason: 'spam' | 'inappropriate' | 'violence' | 'hate_speech' | 'pornography' | 'copyright' | 'fraud' | 'other';
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerId?: number;
  reviewer?: {
    id: number;
    username: string;
  };
  reviewNote?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

