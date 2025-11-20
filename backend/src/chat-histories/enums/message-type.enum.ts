/**
 * 消息类型枚举
 */
export enum MessageType {
  /** 普通消息 */
  NORMAL = 'normal',
  /** 系统消息 */
  SYSTEM = 'system',
  /** 问候消息 */
  GREETING = 'greeting',
  /** 旁白消息 */
  NARRATOR = 'narrator',
  /** 注释消息 */
  COMMENT = 'comment',
}

/**
 * 系统消息子类型
 */
export enum SystemMessageType {
  /** 对话开始 */
  CHAT_START = 'chat_start',
  /** Swipe信息 */
  SWIPE_INFO = 'swipe_info',
  /** 空白消息 */
  BLANK = 'blank',
}
