import { PromptRole } from '../../prompts/entities/prompt-content.entity';

/**
 * 解析后的内容
 */
export interface ResolvedContent {
  /** 角色类型 */
  role: PromptRole;
  
  /** 内容文本 */
  content: string;
  
  /** 排序顺序 */
  order: number;
  
  /** 原始内容ID（用于追踪） */
  sourceId?: number;
  
  /** 内容类型标识 */
  type?: 'prompt' | 'character' | 'worldview';
}
