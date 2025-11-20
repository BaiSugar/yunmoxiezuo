/**
 * 世界书条目接口
 * 基于 SillyTavern 的世界书设计
 */

/**
 * 选择性逻辑类型
 */
export enum SelectiveLogic {
  /** 主关键词 + 任一次要关键词 */
  AND_ANY = 'AND_ANY',
  /** 主关键词 + 全部次要关键词 */
  AND_ALL = 'AND_ALL',
  /** 主关键词 + 无次要关键词 */
  NOT_ANY = 'NOT_ANY',
  /** 主关键词 + 非全部次要关键词 */
  NOT_ALL = 'NOT_ALL',
}

/**
 * 插入位置类型
 * 基于 SillyTavern 的 8 种位置类型
 */
export enum WorldBookPosition {
  /** 角色定义之前 */
  BEFORE = 'before',
  
  /** 角色定义之后 */
  AFTER = 'after',
  
  /** Author's Note 之前 */
  AN_TOP = 'ANTop',
  
  /** Author's Note 之后 */
  AN_BOTTOM = 'ANBottom',
  
  /** 指定深度 */
  AT_DEPTH = 'atDepth',
  
  /** 示例消息（Example Messages）之前 */
  EM_TOP = 'EMTop',
  
  /** 示例消息之后 */
  EM_BOTTOM = 'EMBottom',
  
  /** 自定义插槽 */
  OUTLET = 'outlet',
}

/**
 * 世界书条目
 */
export interface WorldBookEntry {
  // ============ 基础信息 ============
  /** 条目唯一标识 */
  uid: string;

  /** 条目名称/标题 */
  name: string;

  /** 条目内容文本 */
  content: string;

  // ============ 激活控制 ============
  /** 主关键词列表 */
  keywords: string[];

  /** 次要关键词列表 */
  secondaryKeywords?: string[];

  /** 选择性逻辑 */
  selectiveLogic?: SelectiveLogic;

  // ============ 位置控制 ============
  /** 插入位置 */
  position: WorldBookPosition;

  /** 深度（当 position=atDepth 时使用） */
  depth?: number;

  /** 自定义插槽名称（当 position=outlet 时使用） */
  outletName?: string;

  /** 排序权重（越小越靠前） */
  order: number;

  // ============ 包含组（Inclusion Groups） ============
  /** 组名（同组内一次只能激活一个） */
  group?: string;

  /** 强制优先（组内最高优先级） */
  groupOverride?: boolean;

  /** 组内权重（用于评分或随机选择） */
  groupWeight?: number;

  /** 启用组评分机制 */
  useGroupScoring?: boolean;

  // ============ 特殊标记 ============
  /** 常驻（总是激活，不检查关键词） */
  constant?: boolean;

  /** 禁用此条目 */
  disable?: boolean;

  // ============ 时效性 ============
  /** 粘性：激活后保持N条消息 */
  sticky?: number;

  /** 冷却：激活后N条消息内不再激活 */
  cooldown?: number;

  /** 延迟：前N条消息不激活 */
  delay?: number;

  // ============ Token预算控制 ============
  /** 忽略Token预算限制 */
  ignoreBudget?: boolean;

  /** 激活顺序（用于预算分配） */
  activationOrder?: number;

  /** 匹配次数（用于相关性评分） */
  matchCount?: number;

  /** Token数量（运行时计算） */
  tokens?: number;

  // ============ 高级选项 ============
  /** 激活概率（0-100） */
  probability?: number;

  /** 启用概率检查 */
  useProbability?: boolean;

  /** 扫描深度（覆盖全局设置） */
  scanDepth?: number;

  /** 大小写敏感 */
  caseSensitive?: boolean;

  /** 全词匹配 */
  matchWholeWords?: boolean;

  /** 排除递归（此条目内容不参与递归扫描） */
  excludeRecursion?: boolean;

  /** 阻止递归（此条目只在第0轮能被激活） */
  preventRecursion?: boolean;

  /** 延迟递归（在第N轮递归才能被激活） */
  delayUntilRecursion?: number;
}

/**
 * 角色扮演配置
 * 存储在 Prompt.roleplayConfig 字段中
 */
export interface RoleplayConfig {
  /** 角色卡片（人物设定） */
  characterCard?: string;

  /** 世界书条目列表 */
  worldBookEntries?: WorldBookEntry[];

  // ============ 扫描配置 ============
  /** 扫描深度（默认4） */
  scanDepth?: number;

  // ============ 递归扫描配置 ============
  /** 启用递归扫描 */
  enableRecursion?: boolean;

  /** 最大递归深度（默认5） */
  maxRecursionDepth?: number;

  // ============ Token预算配置 ============
  /** Token预算百分比（占总可用预算的百分比，默认25%） */
  tokenBudgetPercent?: number;

  /** Token预算上限（固定值） */
  tokenBudgetCap?: number;

  /** Token预算下限 */
  tokenBudgetMin?: number;

  /** 预算分配优先级策略 */
  budgetPriority?: 'order' | 'activation_order' | 'token_efficiency' | 'relevance';

  /** 允许预算扩展 */
  allowBudgetExpand?: boolean;

  /** 最大扩展次数（默认3） */
  maxExpandTimes?: number;

  // ============ 最小激活配置 ============
  /** 最小激活条目数 */
  minActivations?: number;

  /** 最大扫描深度（用于最小激活） */
  maxScanDepth?: number;
}
