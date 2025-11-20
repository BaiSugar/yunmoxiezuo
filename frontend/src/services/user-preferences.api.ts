import { apiService } from './api';
import type {
  UserModelPreference,
  CreateUserModelPreferenceDto,
  UpdateUserModelPreferenceDto,
} from '../types/ai-model';

/**
 * 用户模型偏好设置 API 服务
 */
export const userPreferencesApi = {
  /**
   * 创建或更新用户模型偏好设置
   */
  async createOrUpdate(data: CreateUserModelPreferenceDto): Promise<UserModelPreference> {
    const response = await apiService.post<UserModelPreference>('/user-model-preferences', data);
    return response.data.data;
  },

  /**
   * 获取当前用户的所有模型偏好设置
   */
  async getAll(): Promise<UserModelPreference[]> {
    const response = await apiService.get<UserModelPreference[]>('/user-model-preferences');
    return response.data.data;
  },

  /**
   * 获取当前用户对指定模型的偏好设置
   */
  async getByModel(modelId: number): Promise<UserModelPreference | null> {
    try {
      const response = await apiService.get<UserModelPreference>(`/user-model-preferences/model/${modelId}`);
      return response.data.data;
    } catch (error: any) {
      // 404 表示没有保存的偏好，返回 null
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * 更新模型偏好设置（按ID）
   */
  async update(id: number, data: UpdateUserModelPreferenceDto): Promise<UserModelPreference> {
    const response = await apiService.put<UserModelPreference>(`/user-model-preferences/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除模型偏好设置
   */
  async delete(id: number): Promise<void> {
    await apiService.delete(`/user-model-preferences/${id}`);
  },
};
