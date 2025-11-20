import { apiService } from './api';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../types';

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/login', credentials);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '登录失败');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiService.post<AuthResponse>('/auth/register', userData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '注册失败');
    }
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } catch (error: any) {
      // 即使登出失败也不抛出错误，因为本地状态已经清除
      console.error('Logout error:', error);
    }
  }

  async getProfile(): Promise<User> {
    try {
      const response = await apiService.get<User>('/auth/profile');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '获取用户信息失败');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    try {
      const response = await apiService.post<{ accessToken: string; expiresIn: number }>('/auth/refresh', {
        refreshToken,
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || '刷新令牌失败');
    }
  }
}

export const authService = new AuthService();
