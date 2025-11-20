import { ApiFormat } from '../enums/api-format.enum';

/**
 * 构建选项接口
 */
export interface BuildOptions {
  /** 目标API格式 */
  apiFormat?: ApiFormat;

  /** Token预算配置 */
  tokenBudget?: TokenBudget;

  /** 是否启用世界书激活 */
  enableWorldBook?: boolean;

  /** 世界书扫描深度（最近N条消息） */
  worldBookScanDepth?: number;

  /** 世界书递归扫描最大轮数 */
  worldBookMaxRecursion?: number;

  /** 是否启用调试模式 */
  debug?: boolean;
}

/**
 * Token预算接口
 */
export interface TokenBudget {
  /** 总预算（模型上下文限制 - 输出预留） */
  total: number;

  /** 系统提示预算 */
  systemPrompts?: number;

  /** 角色定义预算 */
  characterDef?: number;

  /** 示例消息预算 */
  examples?: number;

  /** 世界书预算（固定值，优先级高于比例） */
  worldBookBudget?: number;

  /** 世界书预算比例（0-1之间，如0.25表示25%） */
  worldBookRatio?: number;

  /** 世界书最小预算 */
  worldBookBudgetMin?: number;

  /** 世界书最大预算 */
  worldBookBudgetMax?: number;

  /** 保护的最近历史消息数量 */
  protectedHistoryCount?: number;

  /** 最小激活组件数量 */
  minActivations?: number;

  /** 是否允许预算扩展 */
  allowBudgetExpand?: boolean;

  /** 最大扩展次数 */
  maxExpandTimes?: number;

  /** 预算分配策略 */
  budgetPriority?: 'order' | 'activation_order' | 'token_efficiency' | 'relevance';

  /** 安全边界（预留token） */
  safetyMargin?: number;
}

/**
 * Token统计接口
 */
export interface TokenStats {
  /** 总Token数 */
  total: number;

  /** 系统提示Token数 */
  systemPrompts: number;

  /** 角色定义Token数 */
  characterDef: number;

  /** 示例消息Token数 */
  examples: number;

  /** 世界书Token数 */
  worldBook: number;

  /** 历史消息Token数 */
  history: number;

  /** Author's Note Token数 */
  authorNote: number;

  /** 用户输入Token数 */
  userInput: number;

  /** 是否超出预算 */
  overBudget: boolean;

  /** 被裁剪的组件数量 */
  trimmedComponents: number;

  /** 预算使用详情 */
  budgetDetails?: {
    /** 可分配预算 */
    allocatable: number;
    /** 世界书预算 */
    worldBookBudget: number;
    /** 已使用预算 */
    used: number;
    /** 剩余预算 */
    remaining: number;
    /** 使用百分比 */
    percentage: number;
  };

  /** 激活详情 */
  activationDetails?: {
    /** 总候选数 */
    totalCandidates: number;
    /** 已激活数 */
    activated: number;
    /** 因预算跳过数 */
    skippedBudget: number;
    /** 强制激活数（ignoreBudget） */
    ignoredBudget: number;
  };

  /** 预算扩展信息 */
  expansionInfo?: {
    /** 是否触发扩展 */
    expanded: boolean;
    /** 扩展次数 */
    times: number;
    /** 原始预算 */
    originalBudget: number;
    /** 最终预算 */
    finalBudget: number;
  };
}
