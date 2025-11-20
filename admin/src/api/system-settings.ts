import request from '../utils/request';

export interface SystemSetting {
  id: number;
  category: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  label: string;
  description: string;
  isEncrypted: boolean;
  isPublic: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingDto {
  value: string;
}

export interface BatchUpdateDto {
  settings: Array<{
    id: number;
    value: string;
  }>;
}

/**
 * 获取所有系统配置
 */
export const getSystemSettings = () => {
  return request.get<SystemSetting[]>('/system-settings');
};

/**
 * 按分类获取系统配置
 */
export const getSystemSettingsByCategory = (category: string) => {
  return request.get<SystemSetting[]>(`/system-settings/category/${category}`);
};

/**
 * 获取公开配置
 */
export const getPublicSettings = () => {
  return request.get<Record<string, any>>('/system-settings/public');
};

/**
 * 获取单个配置
 */
export const getSystemSetting = (id: number) => {
  return request.get<SystemSetting>(`/system-settings/${id}`);
};

/**
 * 更新单个配置
 */
export const updateSystemSetting = (id: number, data: UpdateSettingDto) => {
  return request.put<SystemSetting>(`/system-settings/${id}`, data);
};

/**
 * 批量更新配置
 */
export const batchUpdateSystemSettings = (data: BatchUpdateDto) => {
  return request.put<SystemSetting[]>('/system-settings/batch', data);
};

