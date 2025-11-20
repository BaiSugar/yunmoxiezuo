import { apiService } from './api';
import type { Font, UploadFontDto } from '../types/font';

/**
 * 字体管理 API 服务
 */
export const fontsApi = {
  /**
   * 获取所有启用的字体（公开接口）
   */
  async getEnabledFonts(): Promise<Font[]> {
    const response = await apiService.get<Font[]>('/fonts/enabled');
    return response.data.data;
  },

  /**
   * 获取所有字体（管理员）
   */
  async getAllFonts(): Promise<Font[]> {
    const response = await apiService.get<Font[]>('/fonts');
    return response.data.data;
  },

  /**
   * 上传字体文件（管理员）
   */
  async uploadFont(file: File, dto: UploadFontDto): Promise<Font> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', dto.name);
    formData.append('displayName', dto.displayName);
    formData.append('category', dto.category);
    if (dto.description) formData.append('description', dto.description);
    if (dto.sortOrder !== undefined) formData.append('sortOrder', dto.sortOrder.toString());

    const response = await apiService.post<Font>('/fonts/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * 更新字体信息（管理员）
   */
  async updateFont(id: number, data: Partial<UploadFontDto>): Promise<Font> {
    const response = await apiService.put<Font>(`/fonts/${id}`, data);
    return response.data.data;
  },

  /**
   * 设置为默认字体（管理员）
   */
  async setDefaultFont(id: number): Promise<Font> {
    const response = await apiService.post<Font>(`/fonts/${id}/set-default`);
    return response.data.data;
  },

  /**
   * 删除字体（管理员）
   */
  async deleteFont(id: number): Promise<void> {
    await apiService.delete(`/fonts/${id}`);
  },

  /**
   * 用户上传字体文件
   */
  async userUploadFont(file: File, name: string, displayName: string, description?: string): Promise<Font> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('displayName', displayName);
    if (description) formData.append('description', description);

    const response = await apiService.post<Font>('/fonts/user/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  /**
   * 获取用户自己上传的字体列表
   */
  async getMyFonts(): Promise<Font[]> {
    const response = await apiService.get<Font[]>('/fonts/user/my-fonts');
    return response.data.data;
  },

  /**
   * 删除用户自己的字体
   */
  async deleteMyFont(id: number): Promise<void> {
    await apiService.delete(`/fonts/user/${id}`);
  },
};

