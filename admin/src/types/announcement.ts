// 公告类型定义

export const AnnouncementType = {
  SYSTEM: 'system',
  ACTIVITY: 'activity',
  MAINTENANCE: 'maintenance',
  FEATURE: 'feature',
  NOTICE: 'notice',
} as const;
export type AnnouncementType = typeof AnnouncementType[keyof typeof AnnouncementType];

export const AnnouncementLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;
export type AnnouncementLevel = typeof AnnouncementLevel[keyof typeof AnnouncementLevel];

export const LinkTarget = {
  BLANK: '_blank',
  SELF: '_self',
} as const;
export type LinkTarget = typeof LinkTarget[keyof typeof LinkTarget];

export const LinkPosition = {
  CONTENT: 'content',
  BUTTON: 'button',
  BOTH: 'both',
} as const;
export type LinkPosition = typeof LinkPosition[keyof typeof LinkPosition];

export const TargetType = {
  ALL: 'all',
  ROLE: 'role',
  USER: 'user',
  MEMBERSHIP: 'membership',
} as const;
export type TargetType = typeof TargetType[keyof typeof TargetType];

export interface Announcement {
  id: number;
  title: string;
  content: string;
  summary?: string;
  type: AnnouncementType;
  priority: number;
  level: AnnouncementLevel;
  
  // 链接跳转
  hasLink: boolean;
  linkUrl?: string;
  linkText?: string;
  linkTarget: LinkTarget;
  linkPosition: LinkPosition;
  
  // 显示控制
  isActive: boolean;
  isTop: boolean;
  isPush: boolean;
  isPopup: boolean;
  needRead: boolean;
  
  // 时间控制
  startTime: string;
  endTime?: string;
  publishedAt?: string;
  
  // 目标受众
  targetType: TargetType;
  targetIds?: number[];
  
  // 统计
  viewCount: number;
  readCount: number;
  clickCount: number;
  
  // 样式
  attachments?: any;
  styleConfig?: any;
  
  creatorId: number;
  creator?: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  content: string;
  summary?: string;
  type: AnnouncementType;
  priority?: number;
  level: AnnouncementLevel;
  hasLink?: boolean;
  linkUrl?: string;
  linkText?: string;
  linkTarget?: LinkTarget;
  linkPosition?: LinkPosition;
  isActive?: boolean;
  isTop?: boolean;
  isPush?: boolean;
  isPopup?: boolean;
  needRead?: boolean;
  startTime?: string;
  endTime?: string;
  targetType?: TargetType;
  targetIds?: number[];
  styleConfig?: any;
}

export interface UpdateAnnouncementDto extends Partial<CreateAnnouncementDto> {}

export interface QueryAnnouncementDto {
  page?: number;
  limit?: number;
  type?: AnnouncementType;
  level?: AnnouncementLevel;
  isActive?: boolean;
  isTop?: boolean;
}

export interface AnnouncementStats {
  viewCount: number;
  readCount: number;
  clickCount: number;
  clickRate: number;
  readRate: number;
}

export interface AnnouncementListResponse {
  data: Announcement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
