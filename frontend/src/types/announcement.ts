/**
 * 公告系统类型定义
 */

/**
 * 公告类型
 */
export type AnnouncementType = 'system' | 'activity' | 'maintenance' | 'feature' | 'notice';

/**
 * 提示级别
 */
export type AnnouncementLevel = 'info' | 'warning' | 'error' | 'success';

/**
 * 链接打开方式
 */
export type LinkTarget = '_blank' | '_self';

/**
 * 链接位置
 */
export type LinkPosition = 'content' | 'button' | 'both';

/**
 * 目标受众类型
 */
export type TargetType = 'all' | 'role' | 'user' | 'membership';

/**
 * 公告样式配置
 */
export interface StyleConfig {
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
}

/**
 * 公告
 */
export interface Announcement {
  id: number;
  title: string;
  content: string;
  summary?: string;
  type: AnnouncementType;
  level: AnnouncementLevel;
  priority: number;
  hasLink: boolean;
  linkUrl?: string;
  linkText?: string;
  linkTarget: LinkTarget;
  linkPosition: LinkPosition;
  isActive: boolean;
  isTop: boolean;
  isPush: boolean;
  isPopup: boolean;
  needRead: boolean;
  startTime: string;
  endTime?: string;
  publishedAt?: string;
  targetType: TargetType;
  targetIds?: number[];
  viewCount: number;
  readCount: number;
  clickCount: number;
  attachments?: any;
  styleConfig?: StyleConfig;
  creatorId: number;
  createdAt: string;
  updatedAt: string;
  // 动态字段（由后端注入）
  isRead?: boolean;
  isClicked?: boolean;
}

/**
 * 未读数量响应
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * 标记已读DTO
 */
export interface MarkAsReadDto {
  needClick?: boolean;
}
