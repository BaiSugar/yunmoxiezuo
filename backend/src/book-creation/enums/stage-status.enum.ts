/**
 * 阶段状态枚举
 */
export enum StageStatus {
  /** 待执行 */
  PENDING = 'pending',

  /** 执行中 */
  PROCESSING = 'processing',

  /** 已完成 */
  COMPLETED = 'completed',

  /** 失败 */
  FAILED = 'failed',

  /** 已跳过 */
  SKIPPED = 'skipped',
}

