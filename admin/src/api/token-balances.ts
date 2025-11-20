import request from '../utils/request';

/**
 * 字数余额管理API
 */

/**
 * 获取用户字数余额（管理员）
 */
export async function getUserBalance(userId: number) {
  return request.get(`/token-balances/user/${userId}`);
}

/**
 * 为用户充值字数（管理员）
 */
export async function rechargeTokens(userId: number, data: {
  amount: number;
  isGift: boolean;
  remark?: string;
}) {
  return request.post(`/token-balances/user/${userId}/recharge`, data);
}

/**
 * 设置用户每日免费额度（管理员）
 */
export async function setDailyQuota(userId: number, quota: number) {
  return request.post(`/token-balances/user/${userId}/daily-quota`, { quota });
}

