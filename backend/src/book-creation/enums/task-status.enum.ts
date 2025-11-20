/**
 * 成书任务状态枚举
 */
export enum TaskStatus {
  /** 想法生成中 */
  IDEA_GENERATING = 'idea_generating',

  /** 书名简介生成中 */
  TITLE_GENERATING = 'title_generating',

  /** 大纲生成中 */
  OUTLINE_GENERATING = 'outline_generating',

  /** 正文生成中 */
  CONTENT_GENERATING = 'content_generating',

  /** 审稿优化中 */
  REVIEW_OPTIMIZING = 'review_optimizing',

  /** 已完成 */
  COMPLETED = 'completed',

  /** 失败 */
  FAILED = 'failed',

  /** 已取消 */
  CANCELLED = 'cancelled',

  /** 已暂停 */
  PAUSED = 'paused',

  /** 阶段完成，等待执行下一阶段 */
  WAITING_NEXT_STAGE = 'waiting_next_stage',
}

