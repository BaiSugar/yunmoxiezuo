import { PromptPosition } from '../enums/position.enum';
import { PromptRole } from '../entities/prompt-content.entity';

/**
 * 提示词组件接口
 * 代表构建过程中的一个独立组件
 */
export interface PromptComponent {
  /** 唯一标识符 */
  identifier: string;

  /** 内容文本 */
  content: string;

  /** 消息角色 */
  role: PromptRole;

  /** 位置标识 */
  position: PromptPosition;

  /** 排序权重（数值越小越靠前，默认100） */
  order?: number;

  /** 深度值（仅用于AT_DEPTH位置） */
  depth?: number;

  /** Token数量（可选，用于预算控制） */
  tokens?: number;

  /** 是否为必需组件（必需组件不会被裁剪） */
  required?: boolean;

  /** 是否为常驻组件（世界书中constant=true的条目） */
  constant?: boolean;

  /** 是否忽略预算（强制激活，不计入Token预算） */
  ignoreBudget?: boolean;

  /** 关键词匹配次数（用于相关性评分） */
  matchCount?: number;

  /** 激活顺序（用于activation_order策略） */
  activationOrder?: number;
}

/**
 * 位置桶接口
 * 将组件按位置分组后的数据结构
 */
export interface PositionBucket {
  systemPrompts: PromptComponent[];
  beforeChar: PromptComponent[];
  charDef: PromptComponent[];
  afterChar: PromptComponent[];
  exampleTop: PromptComponent[];
  examples: PromptComponent[];
  exampleBottom: PromptComponent[];
  history: PromptComponent[];
  depthInjections: PromptComponent[];
  anTop: PromptComponent[];
  anBottom: PromptComponent[];
  latestInput: PromptComponent[];
}

/**
 * 消息接口（OpenAI标准格式）
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
