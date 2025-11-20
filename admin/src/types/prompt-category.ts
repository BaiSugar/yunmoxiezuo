// 提示词分类相关类型定义

/**
 * 分类使用场景类型
 */
export type CategoryUsageType = 'writing' | 'roleplay';

/**
 * 提示词分类
 */
export interface Category {
  id: number;
  name: string;
  icon: string;
  description?: string;
  order: number;
  usageType: CategoryUsageType;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建分类DTO
 */
export interface CreateCategoryDto {
  name: string;
  icon: string;
  description?: string;
  order?: number;
  usageType?: CategoryUsageType;
}

/**
 * 更新分类DTO
 */
export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  description?: string;
  order?: number;
  usageType?: CategoryUsageType;
}
