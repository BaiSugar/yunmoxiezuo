import request from '../utils/request';

export interface Font {
  id: number;
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
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadFontDto {
  name: string;
  displayName: string;
  category: '推荐' | '中文' | '英文' | '特殊';
  description?: string;
  sortOrder?: number;
}

export interface UpdateFontDto {
  displayName?: string;
  category?: '推荐' | '中文' | '英文' | '特殊';
  description?: string;
  isEnabled?: boolean;
  sortOrder?: number;
}

/**
 * 获取所有字体
 */
export const getAllFonts = () => {
  return request.get<Font[]>('/fonts');
};

/**
 * 上传字体文件
 */
export const uploadFont = (file: File, data: UploadFontDto) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('name', data.name);
  formData.append('displayName', data.displayName);
  formData.append('category', data.category);
  if (data.description) formData.append('description', data.description);
  if (data.sortOrder !== undefined) formData.append('sortOrder', data.sortOrder.toString());

  return request.post<Font>('/fonts/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 更新字体信息
 */
export const updateFont = (id: number, data: UpdateFontDto) => {
  return request.put<Font>(`/fonts/${id}`, data);
};

/**
 * 设置为默认字体
 */
export const setDefaultFont = (id: number) => {
  return request.post<Font>(`/fonts/${id}/set-default`);
};

/**
 * 删除字体
 */
export const deleteFont = (id: number) => {
  return request.delete(`/fonts/${id}`);
};

