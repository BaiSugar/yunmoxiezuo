import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import type { ApiResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      // 开发环境使用相对路径（走 Vite 代理），生产环境使用环境变量
      // 注意：这里只用 /api，Nginx 会自动添加 /v1
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * 获取访问令牌
   */
  private getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private setupInterceptors() {
    // 请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
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
    this.api.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // 如果是401错误且不是刷新token的请求，且没有重试过
        if (
          error.response?.status === 401 && 
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/refresh') // 避免刷新请求本身触发刷新
        ) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.post('/auth/refresh', {
                refreshToken,
              });

              const { accessToken } = response.data.data;
              localStorage.setItem('accessToken', accessToken);

              // 重新发送原始请求
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // 刷新token失败，清除本地存储并跳转到登录页
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            
            // 避免在登录页重复跳转
            if (!window.location.pathname.includes('/login')) {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        // 如果是刷新token请求失败，直接清除并跳转
        if (originalRequest.url?.includes('/auth/refresh')) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }

        // 提取后端返回的错误信息
        const errorMessage = error.response?.data?.message || error.message || '请求失败';
        const newError = new Error(errorMessage);
        (newError as any).response = error.response;
        return Promise.reject(newError);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    // 调试：打印 URL 和参数
    console.log(`[API] POST ${url}`, { data, params: (url.match(/\/(\d+|NaN)\//g) || []) });
    return this.api.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.put(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.delete(url, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.patch(url, data, config);
  }

  /**
   * 流式请求（SSE）
   * 
   * 注意：此方法使用原生 fetch API 而非 axios，因为：
   * 1. axios 不支持流式读取（ReadableStream）
   * 2. fetch 可以直接访问 response.body.getReader()
   * 3. 因此无法使用 axios 的拦截器，需要手动添加 Authorization
   * 
   * @param url 请求URL
   * @param data 请求数据
   * @param onMessage 每次接收到消息的回调
   * @param onComplete 完成时的回调
   * @param onError 错误时的回调
   * @param timeout 超时时间（毫秒），默认5分钟（300000毫秒）
   * @returns 取消函数
   */
  async stream<T = any>(
    url: string,
    data: any,
    onMessage: (data: T) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    timeout: number = 300000, // 默认5分钟（300000毫秒）
  ): Promise<() => void> {
    // 复用 token 获取逻辑
    const token = this.getToken();
    const baseURL = this.api.defaults.baseURL || '';

    // 创建 AbortController 用于超时控制
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    // 设置超时
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        controller.abort();
        onError(new Error('请求超时，已自动取消'));
      }, timeout);
    }

    try {
      const response = await fetch(`${baseURL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      if (!response.ok) {
        // 解析后端返回的错误消息
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.data?.error || `HTTP ${response.status}`);
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      // 创建取消函数
      const cancel = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        controller.abort();
        reader.cancel();
      };

      // 读取流
      const readStream = async () => {
        try {
          console.log('[API] 开始读取SSE流');
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('[API] 流读取完成');
              if (timeoutId) {
                clearTimeout(timeoutId);
              }
              onComplete();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            console.log('[API] 收到chunk:', chunk.substring(0, 100) + '...');
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') {
                  console.log('[API] 收到[DONE]信号');
                  if (timeoutId) {
                    clearTimeout(timeoutId);
                  }
                  onComplete();
                  return;
                }
                if (dataStr) {
                  try {
                    const parsed = JSON.parse(dataStr);
                    console.log('[API] 解析SSE数据成功:', parsed);
                    onMessage(parsed);
                  } catch (e) {
                    console.error('Failed to parse SSE data:', e, dataStr);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('[API] 流读取错误:', error);
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          if (error instanceof Error && error.name !== 'AbortError') {
            onError(error);
          }
        }
      };

      readStream();

      return cancel;
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      onError(error as Error);
      return () => {};
    }
  }
}

export const apiService = new ApiService();
