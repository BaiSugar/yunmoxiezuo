/**
 * 深度提示角色类型
 * 对应 OpenAI Chat Completion 的 role 字段
 */
export enum DepthPromptRole {
  /** 系统消息 */
  SYSTEM = 'system',
  
  /** 用户消息 */
  USER = 'user',
  
  /** 助手消息 */
  ASSISTANT = 'assistant',
}
