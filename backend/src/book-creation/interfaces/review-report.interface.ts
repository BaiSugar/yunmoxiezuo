/**
 * 审稿报告接口
 */
export interface ReviewReport {
  /** 章节ID */
  chapterId: number;

  /** 综合评分 (0-100) */
  score: number;

  /** 问题列表 */
  issues: ReviewIssue[];

  /** 改进建议 */
  suggestions: string[];

  /** 优点 */
  strengths: string[];
}

/**
 * 审稿问题接口
 */
export interface ReviewIssue {
  /** 问题类型 */
  type: 'logic' | 'character' | 'continuity' | 'style';

  /** 严重程度 */
  severity: 'high' | 'medium' | 'low';

  /** 问题描述 */
  description: string;

  /** 问题位置 */
  location: string;
}

