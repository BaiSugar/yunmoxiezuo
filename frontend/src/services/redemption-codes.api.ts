import { apiService } from './api';

/**
 * 兑换码相关API
 */
export const redemptionCodesApi = {
  /**
   * 兑换卡密
   */
  async redeem(code: string) {
    const response = await apiService.post('/redemption-codes/redeem', { code });
    return response.data.data;
  },
};

