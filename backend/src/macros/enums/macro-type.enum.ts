/**
 * 宏类型枚举
 */
export enum MacroType {
  /** 角色相关宏 */
  CHARACTER = 'character',
  
  /** 时间相关宏 */
  TIME = 'time',
  
  /** 对话相关宏 */
  CONVERSATION = 'conversation',
  
  /** 随机与计算宏 */
  RANDOM = 'random',
  
  /** 文本处理宏 */
  TEXT = 'text',
  
  /** 变量宏 */
  VARIABLE = 'variable',
  
  /** 管道操作宏 */
  PIPE = 'pipe',
}

/**
 * 宏替换阶段
 */
export enum MacroReplacementStage {
  /** 加载时（静态宏） */
  LOAD = 'load',
  
  /** 构建时（上下文宏） */
  BUILD = 'build',
  
  /** 发送前（动态宏） */
  BEFORE_SEND = 'before_send',
}
