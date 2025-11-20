import { Injectable } from '@nestjs/common';
import { MacroProcessor, MacroContext } from '../interfaces/macro-context.interface';

/**
 * 角色相关宏处理服务
 * 
 * 支持的宏（支持 {{}} 和 ${} 两种格式）：
 * - {{char}} 或 ${char}: 当前角色名
 * - {{user}} 或 ${user}: 用户名/人设名
 * - {{charIfNotGroup}} 或 ${charIfNotGroup}: 单聊时角色名，群聊时为空
 * - {{charPrompt}} 或 ${charPrompt}: 角色卡完整提示词
 */
@Injectable()
export class CharacterMacroService implements MacroProcessor {
  /**
   * 处理角色相关宏
   */
  process(text: string, context: MacroContext): string {
    let result = text;
    
    // 替换 {{char}} 或 ${char} - 角色名
    if (context.characterName) {
      result = result.replace(/(?:\{\{|\$\{)char\}\}/gi, context.characterName);
    }
    
    // 替换 {{user}} 或 ${user} - 用户显示名称（来自用户资料的 nickname 字段）
    if (context.userName) {
      result = result.replace(/(?:\{\{|\$\{)user\}\}/gi, context.userName);
    }
    
    // 替换 {{charIfNotGroup}} 或 ${charIfNotGroup} - 群聊时为空
    if (context.isGroupChat) {
      result = result.replace(/(?:\{\{|\$\{)charIfNotGroup\}\}/gi, '');
    } else if (context.characterName) {
      result = result.replace(/(?:\{\{|\$\{)charIfNotGroup\}\}/gi, context.characterName);
    }
    
    // 替换 {{charPrompt}} 或 ${charPrompt} - 角色卡完整提示词
    if (context.characterPrompt) {
      result = result.replace(/(?:\{\{|\$\{)charPrompt\}\}/gi, context.characterPrompt);
    }
    
    return result;
  }
  
  /**
   * 获取支持的宏列表
   */
  getSupportedMacros(): string[] {
    return ['char', 'user', 'charIfNotGroup', 'charPrompt'];
  }
}
