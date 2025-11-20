import { apiService } from './api';

/**
 * 字数包类型
 */
export interface TokenPackage {
  id: number;
  name: string;
  tokenAmount: number;
  bonusTokens: number;
  price: number;
  validDays: number;
  minMemberLevel: number;
  discount: number;
  isActive: boolean;
  sort: number;
  description: string;
  purchaseUrl: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 字数包API
 */

/**
 * 获取字数包列表（公开接口）
 */
export const getTokenPackages = async (isActive?: boolean): Promise<TokenPackage[]> => {
  const params = isActive !== undefined ? { isActive } : {};
  const response = await apiService.get<TokenPackage[]>('/token-packages', { params });
  return response.data.data || response.data;
};

/**
 * 获取单个字数包详情
 */
export const getTokenPackage = async (id: number): Promise<TokenPackage> => {
  const response = await apiService.get<TokenPackage>(`/token-packages/${id}`);
  return response.data.data || response.data;
};
