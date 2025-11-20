/**
 * 人物卡类型定义
 */

export interface Character {
  id: number;
  novelId: number;
  name: string;
  category?: string;
  fields?: Record<string, any>; // 自定义字段
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCharacterDto {
  name: string;
  category?: string;
  fields?: Record<string, any>;
  order?: number;
}

export interface UpdateCharacterDto {
  name?: string;
  category?: string;
  fields?: Record<string, any>;
  order?: number;
}

/**
 * 世界观设定类型定义
 */

export interface WorldSetting {
  id: number;
  novelId: number;
  name: string;
  category?: string;
  fields?: Record<string, any>; // 自定义字段
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorldSettingDto {
  name: string;
  category?: string;
  fields?: Record<string, any>;
  order?: number;
}

export interface UpdateWorldSettingDto {
  name?: string;
  category?: string;
  fields?: Record<string, any>;
  order?: number;
}

/**
 * 分类统计
 */
export interface CategoryStats {
  category: string;
  count: number;
}

/**
 * 备忘录类型定义
 */

export interface Memo {
  id: number;
  novelId: number;
  title: string;
  content: string;
  color?: string;
  isPinned: boolean;
  reminderAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoDto {
  title: string;
  content: string;
  color?: string;
  isPinned?: boolean;
  reminderAt?: string;
}

export interface UpdateMemoDto {
  title?: string;
  content?: string;
  color?: string;
  isPinned?: boolean;
  reminderAt?: string;
}
