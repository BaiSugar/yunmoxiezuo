/**
 * 宏替换上下文接口
 * 包含替换宏所需的所有上下文信息
 */
export interface MacroContext {
  /** 当前用户ID */
  userId?: number;
  
  /** 用户显示名称（用于 {{user}} 宏） */
  userName?: string;
  
  /** 角色名称（用于 {{char}} 宏） */
  characterName?: string;
  
  /** 角色卡完整提示词 */
  characterPrompt?: string;
  
  /** 是否群聊模式 */
  isGroupChat?: boolean;
  
  /** 最后一条消息内容 */
  lastMessage?: string;
  
  /** 最后一条消息ID */
  lastMessageId?: string;
  
  /** 角色最后一条消息 */
  lastCharMessage?: string;
  
  /** 用户最后一条消息 */
  lastUserMessage?: string;
  
  /** 当前swipe索引 */
  currentSwipeId?: number;
  
  /** 变量存储 */
  variables?: Record<string, any>;
  
  /** 额外的上下文数据 */
  [key: string]: any;
}

/**
 * 宏处理器接口
 * 每个宏处理器必须实现此接口
 */
export interface MacroProcessor {
  /**
   * 处理并替换文本中的宏
   * @param text 原始文本
   * @param context 宏上下文
   * @returns 替换后的文本
   */
  process(text: string, context: MacroContext): Promise<string> | string;
  
  /**
   * 获取该处理器支持的宏名称列表
   */
  getSupportedMacros(): string[];
}
