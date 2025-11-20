import request from '../utils/request';
import type { LoginRequest, LoginResponse, RegisterRequest, User } from '../types/user';

/**
 * 管理后台登录
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  return request.post<LoginResponse>('/auth/admin/login', data);
};

/**
 * 用户注册
 */
export const register = async (data: RegisterRequest): Promise<LoginResponse> => {
  return request.post<LoginResponse>('/auth/register', data);
};

/**
 * 刷新 Token
 */
export const refreshToken = async (refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> => {
  return request.post<{ accessToken: string; expiresIn: number }>(
    '/auth/refresh',
    { refreshToken }
  );
};

/**
 * 用户登出
 */
export const logout = async (): Promise<{ message: string }> => {
  return request.post<{ message: string }>('/auth/logout');
};

/**
 * 获取当前用户信息
 */
export const getProfile = async (): Promise<User> => {
  return request.get<User>('/auth/profile');
};

