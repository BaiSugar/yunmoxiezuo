import type { ApiKey } from '../entities/api-key.entity';

/**
 * 轮询策略
 */
export enum RotationStrategy {
  /** 轮询：按顺序依次使用 */
  ROUND_ROBIN = 'round_robin',
  
  /** 随机：随机选择可用的 Key */
  RANDOM = 'random',
  
  /** 加权轮询：根据权重分配使用频率 */
  WEIGHTED = 'weighted',
  
  /** 优先级：优先使用高优先级的 Key */
  PRIORITY = 'priority',
  
  /** 最少使用：选择使用次数最少的 Key */
  LEAST_USED = 'least_used',
}

/**
 * Key 选择结果
 */
export interface IKeySelectionResult {
  /** 选中的 Key */
  key: ApiKey;
  
  /** 是否为备用 Key（主 Key 不可用时） */
  isFallback: boolean;
  
  /** 选择原因 */
  reason?: string;
}

/**
 * Key 使用记录
 */
export interface IKeyUsageRecord {
  keyId: number;
  success: boolean;
  errorMessage?: string;
  tokensUsed?: number;
  timestamp: Date;
}

/**
 * Key 健康状态
 */
export interface IKeyHealth {
  keyId: number;
  keyName: string;
  status: string;
  isHealthy: boolean;
  errorRate: number;
  lastUsed: Date | null;
  lastError: Date | null;
  usageCount: number;
  errorCount: number;
  cooldownUntil: Date | null;
}
