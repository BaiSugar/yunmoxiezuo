/**
 * 用户相关 API
 */

import { apiService } from './api';
import type { User } from '../types';

/**
 * 更新个人资料参数
 */
export interface UpdateProfileParams {
  nickname?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  emailVerificationCode?: string; // 修改邮箱时需要验证码
}

/**
 * 修改密码参数
 */
export interface ChangePasswordParams {
  oldPassword: string;
  newPassword: string;
}

/**
 * 获取个人信息
 */
export const getProfile = async (): Promise<User> => {
  const response = await apiService.get<User>('/users/me');
  return response.data.data;
};

/**
 * 更新个人资料
 */
export const updateProfile = async (params: UpdateProfileParams): Promise<User> => {
  const response = await apiService.patch<User>('/users/me', params);
  return response.data.data;
};

/**
 * 修改密码
 */
export const changePassword = async (params: ChangePasswordParams): Promise<void> => {
  await apiService.post('/users/change-password', params);
};

export const usersApi = {
  getProfile,
  updateProfile,
  changePassword,
};

export default usersApi;

