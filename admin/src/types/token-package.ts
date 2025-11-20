/**
 * 字数包
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
 * 创建字数包DTO
 */
export interface CreateTokenPackageDto {
  name: string;
  tokenAmount: number;
  bonusTokens?: number;
  price: number;
  validDays?: number;
  minMemberLevel?: number;
  discount?: number;
  sort?: number;
  description?: string;
  purchaseUrl?: string;
}

/**
 * 更新字数包DTO
 */
export interface UpdateTokenPackageDto extends Partial<CreateTokenPackageDto> {}

/**
 * 查询字数包DTO
 */
export interface QueryTokenPackageDto {
  isActive?: boolean;
  minMemberLevel?: number;
  page?: number;
  limit?: number;
}

/**
 * 字数包列表响应
 */
export interface TokenPackageListResponse {
  data: TokenPackage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
