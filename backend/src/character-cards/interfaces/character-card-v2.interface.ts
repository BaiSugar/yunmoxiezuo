import { DepthPromptRole } from '../enums';

/**
 * V2 角色卡深度提示配置
 */
export interface DepthPromptConfig {
  /** 深度级别 */
  depth: number;
  
  /** 提示文本 */
  prompt: string;
  
  /** 角色类型 */
  role: DepthPromptRole;
}

/**
 * V2 角色卡扩展字段
 */
export interface CharacterCardV2Extensions {
  /** 话痨度（0-1），控制角色的话多程度 */
  talkativeness?: number;
  
  /** 是否标记为收藏 */
  fav?: boolean;
  
  /** 关联的世界设定名称 */
  world?: string;
  
  /** 深度提示设置 */
  depth_prompt?: DepthPromptConfig;
  
  /** 自定义正则脚本数组 */
  regex_scripts?: any[];
  
  // ============ 第三方扩展 ============
  /** Pygmalion.chat 唯一标识 */
  pygmalion_id?: string;
  
  /** GitHub 仓库地址 */
  github_repo?: string;
  
  /** 源 URL */
  source_url?: string;
  
  /** Chub 平台专用数据 */
  chub?: {
    full_path?: string;
    [key: string]: any;
  };
  
  /** RisuAI 专用数据 */
  risuai?: {
    source?: string[];
    [key: string]: any;
  };
  
  /** Stable Diffusion 提示词 */
  sd_character_prompt?: {
    positive?: string;
    negative?: string;
  };
  
  /** 其他自定义扩展 */
  [key: string]: any;
}

/**
 * V2 世界书条目扩展字段
 */
export interface WorldBookEntryExtensions {
  /** 扩展应用顺序 */
  position?: number;
  
  /** 防止递归应用 */
  exclude_recursion?: boolean;
  
  /** 应用概率（0-100） */
  probability?: number;
  
  /** 是否使用概率 */
  useProbability?: boolean;
  
  /** 最大递归深度 */
  depth?: number;
  
  /** 选择性逻辑类型 (0=AND_ANY, 1=AND_ALL, 2=NOT_ANY, 3=NOT_ALL) */
  selectiveLogic?: number;
  
  /** 分组名称 */
  group?: string;
  
  /** 覆盖现有分组 */
  group_override?: boolean;
  
  /** 组内权重 */
  group_weight?: number;
  
  /** 完全禁止递归 */
  prevent_recursion?: boolean;
  
  /** 仅在递归时检查 */
  delay_until_recursion?: boolean;
  
  /** 扫描深度 */
  scan_depth?: number;
  
  /** 是否全词匹配 */
  match_whole_words?: boolean;
  
  /** 是否使用组评分 */
  use_group_scoring?: boolean;
  
  /** 是否大小写敏感 */
  case_sensitive?: boolean;
  
  /** 自动化标识符 */
  automation_id?: string;
  
  /** 角色功能类型 */
  role?: number;
  
  /** 是否向量化处理 */
  vectorized?: boolean;
  
  /** 显示顺序 */
  display_index?: number;
  
  /** 匹配范围标志 */
  match_persona_description?: boolean;
  match_character_description?: boolean;
  match_character_personality?: boolean;
  match_character_depth_prompt?: boolean;
  match_scenario?: boolean;
  match_creator_notes?: boolean;
  
  /** 其他自定义扩展 */
  [key: string]: any;
}

/**
 * V2 世界书条目
 */
export interface WorldBookEntry {
  /** 主要触发关键词数组 */
  keys: string[];
  
  /** 次要触发关键词数组 */
  secondary_keys?: string[];
  
  /** 条目说明或注释 */
  comment?: string;
  
  /** 条目的实际内容 */
  content: string;
  
  /** 是否为常驻内容（始终插入） */
  constant?: boolean;
  
  /** 是否启用选择性触发 */
  selective?: boolean;
  
  /** 插入顺序优先级 */
  insertion_order: number;
  
  /** 是否启用此条目 */
  enabled: boolean;
  
  /** 插入位置 */
  position?: string;
  
  /** 唯一标识符 */
  id: number;
  
  /** 世界书条目扩展信息 */
  extensions?: WorldBookEntryExtensions;
}

/**
 * V2 角色专属世界书
 */
export interface CharacterBook {
  /** 世界书名称 */
  name?: string;
  
  /** 世界书条目数组 */
  entries: WorldBookEntry[];
  
  /** 世界书扩展信息 */
  extensions?: Record<string, any>;
}

/**
 * V2 角色卡数据主体
 */
export interface CharacterCardV2Data {
  // ============ 基础必需字段 ============
  /** 角色名称，在提示词中用 {{char}} 替换 */
  name: string;
  
  /** 角色的完整描述（外貌、身份、背景等） */
  description: string;
  
  /** 性格特征总结（形容词或短句） */
  personality: string;
  
  /** 当前场景设定，对话发生的背景 */
  scenario: string;
  
  /** 首条消息，角色的开场白 */
  first_mes: string;
  
  /** 示例对话，展示角色说话方式 */
  mes_example: string;
  
  // ============ 高级可选字段 ============
  /** 创建者给 AI 的额外说明和指导 */
  creator_notes?: string;
  
  /** 角色专属系统提示，可覆盖全局提示 */
  system_prompt?: string;
  
  /** 在对话历史之后的额外指令 */
  post_history_instructions?: string;
  
  /** 替代开场白数组，提供多种问候方式 */
  alternate_greetings?: string[];
  
  /** 标签数组，用于分类和搜索 */
  tags?: string[];
  
  /** 创建者名称 */
  creator?: string;
  
  /** 角色卡版本号 */
  character_version?: string;
  
  // ============ 世界书字段 ============
  /** 角色专属世界书数据 */
  character_book?: CharacterBook;
  
  // ============ 扩展字段 ============
  /** 扩展信息对象 */
  extensions?: CharacterCardV2Extensions;
}

/**
 * V2 角色卡完整结构
 */
export interface CharacterCardV2 {
  /** 规范标识 */
  spec: 'chara_card_v2';
  
  /** 规范版本 */
  spec_version: '2.0';
  
  /** 角色数据主体 */
  data: CharacterCardV2Data;
}
