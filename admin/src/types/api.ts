// API 响应类型定义

export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface ApiErrorResponse {
  success: false;
  code: number;
  message: string;
  data: {
    error: string;
    details?: any;
    path: string;
    method: string;
  };
  timestamp: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 注意：request.ts 的响应拦截器会自动解包 ApiResponse.data
// 所以这里直接定义解包后的数据结构
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

