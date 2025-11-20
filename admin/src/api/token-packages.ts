import request from '../utils/request';
import type {
  TokenPackage,
  CreateTokenPackageDto,
  UpdateTokenPackageDto,
  QueryTokenPackageDto,
  TokenPackageListResponse,
} from '../types/token-package';

/**
 * 创建字数包
 */
export const createTokenPackage = async (data: CreateTokenPackageDto): Promise<TokenPackage> => {
  return request.post<TokenPackage>('/token-packages', data);
};

/**
 * 查询字数包列表
 */
export const getTokenPackageList = async (params?: QueryTokenPackageDto): Promise<TokenPackageListResponse> => {
  return request.get<TokenPackageListResponse>('/token-packages', { params });
};

/**
 * 获取字数包详情
 */
export const getTokenPackageDetail = async (id: number): Promise<TokenPackage> => {
  return request.get<TokenPackage>(`/token-packages/${id}`);
};

/**
 * 更新字数包
 */
export const updateTokenPackage = async (id: number, data: UpdateTokenPackageDto): Promise<TokenPackage> => {
  return request.put<TokenPackage>(`/token-packages/${id}`, data);
};

/**
 * 删除字数包
 */
export const deleteTokenPackage = async (id: number): Promise<{ message: string }> => {
  return request.delete<{ message: string }>(`/token-packages/${id}`);
};

/**
 * 上架/下架字数包
 */
export const toggleTokenPackageStatus = async (id: number): Promise<TokenPackage> => {
  return request.patch<TokenPackage>(`/token-packages/${id}/toggle-status`);
};
