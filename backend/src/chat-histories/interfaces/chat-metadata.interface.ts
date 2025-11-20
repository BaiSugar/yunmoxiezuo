/**
 * 深度提示配置
 */
export interface DepthPrompt {
  /** 深度 */
  depth?: number;
  /** 提示词 */
  prompt?: string;
  /** 角色 */
  role?: string;
}

/**
 * 任务目标配置
 */
export interface Objective {
  /** 目标文本 */
  text?: string;
  /** 是否完成 */
  completed?: boolean;
}

/**
 * 聊天元数据接口
 */
export interface ChatMetadata {
  /** 完整性校验值 */
  integrity?: string;
  /** 聊天备注 */
  note?: string;
  /** 自定义场景 */
  scenario?: string;
  /** 话痨度 */
  talkativeness?: number;
  /** 深度提示配置 */
  depth_prompt?: DepthPrompt;
  /** 任务目标配置 */
  objective?: Objective;
  /** 记忆/备忘录 */
  memo?: string;
  /** 扩展插件数据 */
  extensions?: Record<string, any>;
}
