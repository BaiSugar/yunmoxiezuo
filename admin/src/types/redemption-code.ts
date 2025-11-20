/**
 * 卡密类型枚举
 */
export const CodeType = {
  /** 会员卡密 */
  MEMBERSHIP: 'membership',
  /** 字数卡密 */
  TOKEN: 'token',
  /** 混合卡密（会员+字数） */
  MIXED: 'mixed',
} as const;

export type CodeType = typeof CodeType[keyof typeof CodeType];

/**
 * 卡密
 */
export interface RedemptionCode {
  id: number;
  code: string;
  type: CodeType;
  membershipPlanId: number | null;
  membershipPlan?: {
    id: number;
    name: string;
    level: number;
  };
  tokenAmount: number;
  batchId: string | null;
  maxUseCount: number;
  usedCount: number;
  validFrom: string | null;
  validTo: string | null;
  isActive: boolean;
  creatorId: number | null;
  creator?: {
    id: number;
    username: string;
  };
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建卡密DTO
 */
export interface CreateRedemptionCodeDto {
  type: CodeType;
  membershipPlanId?: number;
  tokenAmount?: number;
  batchId?: string;
  maxUseCount?: number;
  validFrom?: string;
  validTo?: string;
  remark?: string;
}

/**
 * 批量生成卡密DTO
 */
export interface BatchGenerateCodesDto {
  type: CodeType;
  membershipPlanId?: number;
  tokenAmount?: number;
  batchId?: string;
  count: number;
  maxUseCount?: number;
  validFrom?: string;
  validTo?: string;
  remark?: string;
}

/**
 * 更新卡密DTO
 */
export interface UpdateRedemptionCodeDto extends Partial<CreateRedemptionCodeDto> {
  isActive?: boolean;
}

/**
 * 查询卡密DTO
 */
export interface QueryRedemptionCodeDto {
  type?: CodeType;
  batchId?: string;
  isActive?: boolean;
  code?: string;
  page?: number;
  limit?: number;
}

/**
 * 卡密列表响应
 */
export interface RedemptionCodeListResponse {
  data: RedemptionCode[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 卡密使用记录
 */
export interface RedemptionRecord {
  id: number;
  codeId: number;
  codeStr: string;
  userId: number;
  user?: {
    id: number;
    username: string;
    nickname?: string;
  };
  membershipId: number | null;
  tokenAmount: number;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

/**
 * 卡密统计
 */
export interface CodeStatistics {
  totalCodes: number;
  activeCodes: number;
  usedCodes: number;
  expiredCodes: number;
}
