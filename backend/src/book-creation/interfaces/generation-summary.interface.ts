/**
 * 生成摘要接口
 * 用于批量生成章节后的统计信息
 */
export interface GenerationSummary {
  /** 成功生成数量 */
  totalGenerated: number;

  /** 失败数量 */
  totalFailed: number;

  /** 总消耗字数 */
  charactersConsumed?: number;

  /** 失败的章节 */
  failedChapters?: Array<{
    chapterId: number;
    error: string;
  }>;
}

/**
 * 审稿摘要接口
 */
export interface ReviewSummary {
  /** 总章节数 */
  totalChapters: number;

  /** 已审稿数量 */
  reviewed: number;

  /** 已优化数量 */
  optimized: number;

  /** 失败数量 */
  failed: number;

  /** 平均评分 */
  averageScore?: number;

  /** 总消耗字数 */
  charactersConsumed?: number;
}

