/**
 * 统一 API 响应接口
 */
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  timestamp: number;
}

/**
 * 分页数据接口
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T = any> {
  items: T[];
  pagination: PaginationMeta;
}

