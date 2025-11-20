/**
 * 字数余额和消耗记录 API
 */

import { apiService } from './api';
import type {
  TokenBalance,
  TokenTransaction,
  TokenConsumptionRecord,
  DailyQuotaInfo,
  ConsumptionStatistics,
  PaginatedResponse,
  GetTransactionsParams,
  GetConsumptionsParams,
  GetStatisticsParams,
} from '../types/token-balance';

/**
 * 查询用户余额
 */
export const getBalance = async (): Promise<TokenBalance> => {
  const response = await apiService.get<TokenBalance>('/token-balances');
  return response.data.data;
};

/**
 * 查询每日免费额度
 */
export const getDailyQuota = async (): Promise<DailyQuotaInfo> => {
  const response = await apiService.get<DailyQuotaInfo>('/token-balances/daily-quota');
  return response.data.data;
};

/**
 * 查询字数流水记录
 */
export const getTransactions = async (
  params?: GetTransactionsParams
): Promise<PaginatedResponse<TokenTransaction>> => {
  const response = await apiService.get<PaginatedResponse<TokenTransaction>>('/token-balances/transactions', { params });
  return response.data.data;
};

/**
 * 查询字数消耗记录
 */
export const getConsumptions = async (
  params?: GetConsumptionsParams
): Promise<PaginatedResponse<TokenConsumptionRecord>> => {
  const response = await apiService.get<PaginatedResponse<TokenConsumptionRecord>>('/token-balances/consumptions', { params });
  return response.data.data;
};

/**
 * 查询消耗统计
 */
export const getConsumptionStatistics = async (
  params?: GetStatisticsParams
): Promise<ConsumptionStatistics> => {
  const response = await apiService.get<ConsumptionStatistics>('/token-balances/statistics', { params });
  return response.data.data;
};

// 导出为命名导出和默认导出，兼容不同的导入方式
export const tokenBalancesApi = {
  getBalance,
  getDailyQuota,
  getTransactions,
  getConsumptions,
  getConsumptionStatistics,
};

export default tokenBalancesApi;
