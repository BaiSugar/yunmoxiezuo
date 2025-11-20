import { apiService } from './api';
import type { EditorSettings, UpdateEditorSettingsDto } from '../types/editor-settings';

/**
 * 编辑器设置 API 服务
 */
export const editorSettingsApi = {
  /**
   * 获取当前用户的编辑器设置
   * 如果用户没有设置，后端会自动创建默认配置并返回
   */
  async getSettings(): Promise<EditorSettings> {
    const response = await apiService.get<EditorSettings>('/editor-settings');
    return response.data.data;
  },

  /**
   * 创建或保存编辑器设置
   */
  async saveSettings(data: UpdateEditorSettingsDto): Promise<EditorSettings> {
    const response = await apiService.post<EditorSettings>('/editor-settings', data);
    return response.data.data;
  },

  /**
   * 更新编辑器设置
   */
  async updateSettings(data: UpdateEditorSettingsDto): Promise<EditorSettings> {
    const response = await apiService.put<EditorSettings>('/editor-settings', data);
    return response.data.data;
  },

  /**
   * 重置为默认设置
   */
  async resetSettings(): Promise<EditorSettings> {
    const response = await apiService.post<EditorSettings>('/editor-settings/reset');
    return response.data.data;
  },

  /**
   * 删除编辑器设置
   */
  async deleteSettings(): Promise<void> {
    await apiService.delete('/editor-settings');
  },

  /**
   * 上传编辑器背景图
   */
  async uploadBackground(file: File): Promise<{ backgroundImage: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiService.post<{ backgroundImage: string; url: string }>(
      '/editor-settings/upload-background',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data.data;
  },

  /**
   * 删除编辑器背景图
   */
  async deleteBackground(): Promise<void> {
    await apiService.delete('/editor-settings/background');
  },
};

