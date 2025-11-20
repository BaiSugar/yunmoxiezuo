export interface Tool {
  id: number;
  name: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  category: string;
  isEnabled: boolean;
  requiresMembership: boolean;
  allowedMembershipLevels: string[];
  orderNum: number;
  config: Record<string, any>;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export const SearchType = {
  TITLE: 'title',
  URL: 'url',
  CONTENT: 'content',
  KEYWORD: 'keyword',
} as const;

export type SearchType = typeof SearchType[keyof typeof SearchType];

export interface NovelSearchRequest {
  searchType: SearchType;
  query: string;
  platform?: string;
}

export interface NovelBook {
  bookId?: string;
  title: string;
  author: string;
  preview: string;
  platform: string;
  link: string;
  content?: string;  // 书籍详细内容（段落用\n\n分隔）
  totalParagraphs?: number;
  url?: string;  // 直接链接（用于视频或文件类型）
  type?: string;  // 结果类型（success/video等）
}

export interface NovelSearchResponse {
  code: string;
  data: NovelBook[];
  message: string;
}

export interface ToolCheckResponse {
  code: string;
  data: {
    hasAccess: boolean;
    isEnabled: boolean;
    requiresMembership: boolean;
    title: string;
    description: string;
  };
}
