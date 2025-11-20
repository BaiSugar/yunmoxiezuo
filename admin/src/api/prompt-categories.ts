import request from '../utils/request';
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../types/prompt-category';

/**
 * 获取所有分类
 */
export const getCategoryList = async (): Promise<Category[]> => {
  return request.get<Category[]>('/prompt-categories');
};

/**
 * 获取分类详情
 */
export const getCategoryById = async (id: number): Promise<Category> => {
  return request.get<Category>(`/prompt-categories/${id}`);
};

/**
 * 创建分类
 */
export const createCategory = async (data: CreateCategoryDto): Promise<Category> => {
  return request.post<Category>('/prompt-categories', data);
};

/**
 * 更新分类
 */
export const updateCategory = async (
  id: number,
  data: UpdateCategoryDto
): Promise<Category> => {
  return request.patch<Category>(`/prompt-categories/${id}`, data);
};

/**
 * 删除分类
 */
export const deleteCategory = async (id: number): Promise<{ message: string }> => {
  return request.delete<{ message: string }>(`/prompt-categories/${id}`);
};
