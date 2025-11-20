/**
 * 一键成书系统类型定义
 */

/** 任务状态 */
export type TaskStatus =
  | 'idea_generating'
  | 'title_generating'
  | 'outline_generating'
  | 'content_generating'
  | 'review_optimizing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'
  | 'waiting_next_stage';

/** 阶段类型 */
export type StageType =
  | 'stage_1_idea'
  | 'stage_2_title'
  | 'stage_3_outline'
  | 'stage_4_content'
  | 'stage_5_review';

/** 阶段状态 */
export type StageStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';

/** 大纲节点状态 */
export type OutlineNodeStatus = 'draft' | 'optimized' | 'generated';

/** 提示词配置 - 12个提示词类型 */
export interface PromptConfig {
  ideaPromptId?: number; // 脑洞生成提示词ID
  ideaOptimizePromptId?: number; // 脑洞优化提示词ID
  titlePromptId?: number; // 书名简介生成提示词ID
  mainOutlinePromptId?: number; // 主大纲生成提示词ID
  mainOutlineOptimizePromptId?: number; // 大纲优化提示词ID
  volumeOutlinePromptId?: number; // 卷纲生成提示词ID
  volumeOutlineOptimizePromptId?: number; // 卷纲优化提示词ID
  chapterOutlinePromptId?: number; // 细纲生成提示词ID
  chapterOutlineOptimizePromptId?: number; // 细纲优化提示词ID
  contentPromptId?: number; // 章节正文生成提示词ID
  reviewPromptId?: number; // 章节审稿提示词ID
  summaryPromptId?: number; // 章节梗概生成提示词ID
}

/** 任务配置 */
export interface TaskConfig {
  enableReview?: boolean; // 是否启用审稿（默认true）
  concurrencyLimit?: number; // 并发限制（默认5）
}

/** 成书任务 */
export interface BookCreationTask {
  id: number;
  userId: number;
  novelId?: number;
  promptGroupId?: number; // 选择的提示词组ID（一旦设置不可更改）
  status: TaskStatus;
  currentStage: StageType;
  processedData: {
    brainstorm?: string; // 脑洞
    brainstormOptimized?: string; // 优化后的脑洞
    titles?: string[]; // 候选书名
    selectedTitle?: string; // 选定书名
    synopsis?: string; // 简介
    mainOutline?: any[]; // 主大纲
    mainOutlineOptimized?: any[]; // 优化后的主大纲
    volumeOutlines?: any[]; // 卷纲
    volumeOutlinesOptimized?: any[]; // 优化后的卷纲
    chapterOutlines?: any[]; // 细纲
    chapterOutlinesOptimized?: any[]; // 优化后的细纲
    generationSummary?: any; // 生成摘要
    reviewSummary?: any; // 审稿摘要
    [key: string]: any;
  };
  promptConfig?: PromptConfig; // 单个提示词配置（可在任务执行过程中更改）
  taskConfig?: TaskConfig;
  totalCharactersConsumed: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  novel?: {
    id: number;
    name: string;
    synopsis: string;
  };
  stages?: BookCreationStage[];
  promptGroup?: {
    id: number;
    name: string;
    description?: string;
  };
}

/** 阶段记录 */
export interface BookCreationStage {
  id: number;
  taskId: number;
  stageType: StageType;
  status: StageStatus;
  inputData?: Record<string, any>;
  outputData?: Record<string, any>;
  promptId?: number;
  charactersConsumed: number;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

/** 大纲节点 */
export interface OutlineNode {
  id: number;
  taskId: number;
  novelId: number;
  parentId?: number;
  level: number;
  title: string;
  content: string;
  order: number;
  status: OutlineNodeStatus;
  volumeId?: number;
  chapterId?: number;
  createdAt: string;
  updatedAt: string;
  children?: OutlineNode[];
}

/** 任务进度 */
export interface TaskProgress {
  taskId: number;
  status: TaskStatus;
  currentStage: StageType;
  overallProgress: number;
  stageProgress?: {
    current: number;
    total: number;
    percentage: number;
    message?: string;
  };
  completedStages: string[];
  totalCharactersConsumed: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

/** 审稿报告 */
export interface ReviewReport {
  chapterId: number;
  score: number;
  issues: ReviewIssue[];
  suggestions: string[];
  strengths: string[];
}

/** 审稿问题 */
export interface ReviewIssue {
  type: 'logic' | 'character' | 'continuity' | 'style';
  severity: 'high' | 'medium' | 'low';
  description: string;
  location: string;
}

/** WebSocket进度事件 */
export interface BookCreationProgressEvent {
  taskId: number;
  timestamp: string;
  event: 'task_created' | 'stage_started' | 'stage_progress' | 'stage_completed' | 'task_completed' | 'task_failed' | 'error';
  stage?: StageType;
  data: {
    current?: number;
    total?: number;
    percentage?: number;
    message?: string;
    result?: any;
    error?: string;
  };
}

/** 创建成书任务DTO */
export interface CreateBookTaskDto {
  promptGroupId?: number; // 提示词组ID（与promptConfig二选一，一旦设置不可更改）
  autoExecute?: boolean; // 是否立即执行第一阶段
  promptConfig?: PromptConfig; // 单个提示词配置（与promptGroupId二选一，可在任务执行过程中更改）
  taskConfig?: TaskConfig; // 任务配置
}

/** 更新提示词配置DTO */
export interface UpdatePromptConfigDto extends Partial<PromptConfig> {}

