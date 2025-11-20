import { TaskStatus } from '../enums';

/**
 * 任务进度接口
 */
export interface TaskProgress {
  /** 任务ID */
  taskId: number;

  /** 任务状态 */
  status: TaskStatus;

  /** 当前阶段 */
  currentStage: string;

  /** 总进度百分比 (0-100) */
  overallProgress: number;

  /** 当前阶段进度 */
  stageProgress?: {
    current: number;
    total: number;
    percentage: number;
    message?: string;
  };

  /** 已完成的阶段列表 */
  completedStages: string[];

  /** 总消耗字数 */
  totalCharactersConsumed: number;

  /** 创建时间 */
  createdAt: Date;

  /** 更新时间 */
  updatedAt: Date;

  /** 完成时间 */
  completedAt?: Date;
}

