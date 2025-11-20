import { Injectable } from '@nestjs/common';
import { MacroProcessor, MacroContext } from '../interfaces/macro-context.interface';

/**
 * 对话相关宏处理服务
 * 
 * 支持的宏（支持 {{}} 和 ${} 两种格式）：
 * - {{lastMessage}} 或 ${lastMessage}: 最后一条消息内容
 * - {{lastMessageId}} 或 ${lastMessageId}: 最后一条消息ID
 * - {{lastCharMessage}} 或 ${lastCharMessage}: 角色最后一条消息
 * - {{lastUserMessage}} 或 ${lastUserMessage}: 用户最后一条消息
 * - {{currentSwipeId}} 或 ${currentSwipeId}: 当前swipe索引
 */
@Injectable()
export class ConversationMacroService implements MacroProcessor {
  /**
   * 处理对话相关宏
   */
  process(text: string, context: MacroContext): string {
    let result = text;
    
    // 替换 {{lastMessage}} 或 ${lastMessage} - 最后一条消息
    if (context.lastMessage) {
      result = result.replace(/(?:\{\{|\$\{)lastMessage\}\}/gi, context.lastMessage);
    }
    
    // 替换 {{lastMessageId}} 或 ${lastMessageId} - 最后一条消息ID
    if (context.lastMessageId) {
      result = result.replace(/(?:\{\{|\$\{)lastMessageId\}\}/gi, context.lastMessageId);
    }
    
    // 替换 {{lastCharMessage}} 或 ${lastCharMessage} - 角色最后一条消息
    if (context.lastCharMessage) {
      result = result.replace(/(?:\{\{|\$\{)lastCharMessage\}\}/gi, context.lastCharMessage);
    }
    
    // 替换 {{lastUserMessage}} 或 ${lastUserMessage} - 用户最后一条消息
    if (context.lastUserMessage) {
      result = result.replace(/(?:\{\{|\$\{)lastUserMessage\}\}/gi, context.lastUserMessage);
    }
    
    // 替换 {{currentSwipeId}} 或 ${currentSwipeId} - 当前swipe索引
    if (context.currentSwipeId !== undefined) {
      result = result.replace(/(?:\{\{|\$\{)currentSwipeId\}\}/gi, String(context.currentSwipeId));
    }
    
    return result;
  }
  
  /**
   * 获取支持的宏列表
   */
  getSupportedMacros(): string[] {
    return [
      'lastMessage',
      'lastMessageId',
      'lastCharMessage',
      'lastUserMessage',
      'currentSwipeId',
    ];
  }
}
