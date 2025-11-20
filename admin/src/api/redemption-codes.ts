import request from '../utils/request';
import type {
  RedemptionCode,
  CreateRedemptionCodeDto,
  BatchGenerateCodesDto,
  UpdateRedemptionCodeDto,
  QueryRedemptionCodeDto,
  RedemptionCodeListResponse,
  RedemptionRecord,
  CodeStatistics,
} from '../types/redemption-code';

/**
 * 创建单个卡密
 */
export const createRedemptionCode = async (data: CreateRedemptionCodeDto): Promise<RedemptionCode> => {
  return request.post<RedemptionCode>('/redemption-codes', data);
};

/**
 * 批量生成卡密
 */
export const batchGenerateCodes = async (data: BatchGenerateCodesDto): Promise<RedemptionCode[]> => {
  return request.post<RedemptionCode[]>('/redemption-codes/batch', data);
};

/**
 * 查询卡密列表
 */
export const getRedemptionCodeList = async (params?: QueryRedemptionCodeDto): Promise<RedemptionCodeListResponse> => {
  return request.get<RedemptionCodeListResponse>('/redemption-codes', { params });
};

/**
 * 获取卡密详情
 */
export const getRedemptionCodeDetail = async (id: number): Promise<RedemptionCode> => {
  return request.get<RedemptionCode>(`/redemption-codes/${id}`);
};

/**
 * 更新卡密
 */
export const updateRedemptionCode = async (id: number, data: UpdateRedemptionCodeDto): Promise<RedemptionCode> => {
  return request.put<RedemptionCode>(`/redemption-codes/${id}`, data);
};

/**
 * 删除卡密
 */
export const deleteRedemptionCode = async (id: number): Promise<{ message: string }> => {
  return request.delete<{ message: string }>(`/redemption-codes/${id}`);
};

/**
 * 启用/禁用卡密
 */
export const toggleRedemptionCodeStatus = async (id: number): Promise<RedemptionCode> => {
  return request.patch<RedemptionCode>(`/redemption-codes/${id}/toggle-status`);
};

/**
 * 获取卡密使用记录
 */
export const getRedemptionRecords = async (codeId: number): Promise<RedemptionRecord[]> => {
  return request.get<RedemptionRecord[]>(`/redemption-codes/${codeId}/records`);
};

/**
 * 获取卡密使用记录（带分页）
 */
export const getCodeUsageRecords = async (
  codeId: number,
  page: number = 1,
  limit: number = 20
): Promise<{
  data: RedemptionRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  return request.get(`/redemption-codes/${codeId}/records`, {
    params: { page, limit },
  });
};

/**
 * 获取卡密统计
 */
export const getCodeStatistics = async (): Promise<CodeStatistics> => {
  return request.get<CodeStatistics>('/redemption-codes/stats');
};

/**
 * 导出卡密
 */
export const exportCodes = async (params?: { batchId?: string; type?: string }): Promise<Blob> => {
  return request.get<Blob>('/redemption-codes/export', {
    params,
    responseType: 'blob',
  });
};
