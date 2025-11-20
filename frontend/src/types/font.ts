/**
 * 字体信息
 */
export interface Font {
  id: number;
  userId?: number | null; // 用户ID（系统字体为null，用户字体为具体ID）
  name: string;
  displayName: string;
  category: string;
  description: string;
  filePath: string;
  format: string;
  fileSize: number;
  isEnabled: boolean;
  isDefault: boolean;
  sortOrder: number;
  url: string; // 字体文件下载 URL
  createdAt: string;
  updatedAt: string;
}

/**
 * 字体分类
 */
export const FontCategory = {
  RECOMMENDED: '推荐',
  CHINESE: '中文',
  ENGLISH: '英文',
  SPECIAL: '特殊',
} as const;

export type FontCategory = typeof FontCategory[keyof typeof FontCategory];

/**
 * 上传字体 DTO
 */
export interface UploadFontDto {
  name: string;
  displayName: string;
  category: FontCategory;
  description?: string;
  sortOrder?: number;
}

