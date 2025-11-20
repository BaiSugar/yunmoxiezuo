import axios, { AxiosError } from 'axios';
import type { ApiResponse, ApiErrorResponse } from '../types/api';

// 自定义 axios 实例类型
interface CustomAxiosInstance {
  get<T = any>(url: string, config?: any): Promise<T>;
  post<T = any>(url: string, data?: any, config?: any): Promise<T>;
  put<T = any>(url: string, data?: any, config?: any): Promise<T>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<T>;
  delete<T = any>(url: string, config?: any): Promise<T>;
}

// 创建 axios 实例
const axiosInstance = axios.create({
  // 开发环境使用相对路径（走 Vite 代理），生产环境使用环境变量
  // 注意：这里只用 /api，Nginx 会自动添加 /v1
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const request = axiosInstance as unknown as CustomAxiosInstance;

// 请求拦截器
axiosInstance.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axiosInstance.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse;
    
    // 如果是统一响应格式，直接返回 data.data 部分（实际数据）
    if (data.success !== undefined && data.data !== undefined) {
      return data.data;
    }
    
    // 如果不是统一格式，返回原始数据
    return response.data;
  },
  async (error: AxiosError<ApiErrorResponse>) => {
    const { response, config } = error;

    if (response) {
      const { status } = response;

      // Token 过期，尝试刷新（但不处理刷新请求本身的401）
      if (status === 401 && !config?.url?.includes('/auth/refresh')) {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          try {
            // 刷新 token
            const { data: apiResponse } = await axios.post<ApiResponse<{ accessToken: string; expiresIn: number }>>(
              `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/v1/auth/refresh`, 
              { refreshToken }
            );

            if (apiResponse.success) {
              // 保存新 token
              localStorage.setItem('accessToken', apiResponse.data.accessToken);
              
              // 重试原请求
              const originalRequest = error.config!;
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${apiResponse.data.accessToken}`;
              }
              return axios(originalRequest);
            }
          } catch (refreshError) {
            // 刷新失败，清除 token 并跳转登录
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            // 避免在登录页重复跳转
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        } else {
          // 没有 refreshToken，直接跳转登录
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }

      // 如果是刷新token请求失败，直接清除并跳转
      if (status === 401 && config?.url?.includes('/auth/refresh')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      // 其他错误
      const errorMessage = response.data?.message || '请求失败';
      return Promise.reject(new Error(errorMessage));
    }

    return Promise.reject(error);
  }
);

export default request;
