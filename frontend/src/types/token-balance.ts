/**
 * 字数余额和消耗相关类型定义
 * @module token-balance
 */

/**
 * 流水类型
 */
export const TransactionType = {
  RECHARGE: 'recharge' as const, // 充值
  CONSUME: 'consume' as const,   // 消费
  REFUND: 'refund' as const,     // 退款
  EXPIRE: 'expire' as const,     // 过期
  GIFT: 'gift' as const,         // 赠送
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

/**
 * 消耗来源
 */
export const ConsumptionSource = {
  CHAT: 'chat' as const,           // 聊天补全
  GENERATION: 'generation' as const, // AI写作生成
  AGENT: 'agent' as const,         // 智能体
} as const;

export type ConsumptionSource = typeof ConsumptionSource[keyof typeof ConsumptionSource];

/**
 * 用户字数余额
 */
export interface TokenBalance {
  id: number;
  userId: number;
  totalTokens: number;       // 总余额
  usedTokens: number;        // 已使用字数
  giftTokens: number;        // 赠送字数余额
  paidTokens: number;        // 付费字数余额
  frozenTokens: number;      // 冻结字数
  dailyFreeQuota: number;    // 每日免费额度
  dailyUsedQuota: number;    // 今日已用免费额度
  quotaResetDate: string;    // 额度重置日期
  lastConsumedAt?: string;   // 最后消费时间
  createdAt: string;
  updatedAt: string;
}

/**
 * 字数流水记录
 */
export interface TokenTransaction {
  id: number;
  userId: number;
  type: TransactionType;     // 类型
  amount: number;            // 变动数量（正数=增加，负数=减少）
  balanceBefore: number;     // 变动前余额
  balanceAfter: number;      // 变动后余额
  source: string;            // 来源
  relatedId?: number;        // 关联ID（订单ID、卡密ID等）
  modelName?: string;        // 使用的模型（消费时记录）
  remark?: string;           // 备注
  createdAt: string;
}

/**
 * 字数消耗记录
 */
export interface TokenConsumptionRecord {
  id: number;
  userId: number;
  modelId: number;
  inputChars: number;        // 输入字符数
  outputChars: number;       // 输出字符数
  inputRatio: number;        // 使用的输入倍率
  outputRatio: number;       // 使用的输出倍率
  calculatedInputCost: number;  // 计算的输入消耗
  calculatedOutputCost: number; // 计算的输出消耗
  totalCost: number;         // 总消耗
  usedDailyFree: number;     // 使用的每日免费额度
  usedPaid: number;          // 使用的付费额度
  isMember: boolean;         // 是否会员
  memberFreeInput: number;   // 会员免费输入字符数
  source: ConsumptionSource; // 来源
  relatedId?: number;        // 关联ID
  createdAt: string;
  // 关联字段
  model?: {
    id: number;
    name: string;
    provider: string;
  };
}

/**
 * 每日免费额度信息
 */
export interface DailyQuotaInfo {
  dailyFreeQuota: number;
  dailyUsedQuota: number;
  dailyRemainingQuota: number;
  quotaResetDate: string;
}

/**
 * 消耗统计
 */
export interface ConsumptionStatistics {
  totalConsumed: number;
  totalInputChars: number;
  totalOutputChars: number;
  totalDailyFreeUsed: number;
  totalPaidUsed: number;
  requestCount: number;
  bySource: {
    chat: number;
    generation: number;
    agent: number;
  };
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 查询字数流水记录参数
 */
export interface GetTransactionsParams {
  type?: TransactionType;
  page?: number;
  limit?: number;
}

/**
 * 查询字数消耗记录参数
 */
export interface GetConsumptionsParams {
  source?: ConsumptionSource;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * 查询消耗统计参数
 */
export interface GetStatisticsParams {
  startDate?: string;
  endDate?: string;
}
