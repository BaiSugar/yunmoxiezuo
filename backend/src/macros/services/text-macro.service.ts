import { Injectable } from '@nestjs/common';
import { MacroProcessor, MacroContext } from '../interfaces/macro-context.interface';

/**
 * 文本处理宏服务
 * 
 * 支持的宏：
 * - {{trim}}: 去除文本前后空格
 * - {{trim::文本}}: 去除指定文本的空格
 * - 管道操作: {{宏::uppercase}}, {{宏::lowercase}}, {{宏::length}}
 */
@Injectable()
export class TextMacroService implements MacroProcessor {
  /**
   * 处理文本相关宏
   */
  process(text: string, context: MacroContext): string {
    let result = text;
    
    // 处理 {{trim}} - 去除整个文本的前后空格
    if (result.includes('{{trim}}')) {
      result = result.replace(/\{\{trim\}\}/gi, '').trim();
    }
    
    // 处理 {{trim::文本}} - 去除指定文本的空格
    result = this.processTrimMacro(result);
    
    // 处理管道操作（应该在其他宏替换后执行）
    result = this.processPipeMacros(result, context);
    
    return result;
  }
  
  /**
   * 处理 {{trim::文本}} 宏
   */
  private processTrimMacro(text: string): string {
    const trimRegex = /\{\{trim::([^}]+)\}\}/gi;
    return text.replace(trimRegex, (match, content) => {
      return content.trim();
    });
  }
  
  /**
   * 处理管道操作宏
   * 格式：{{宏名::pipe操作}}
   */
  private processPipeMacros(text: string, context: MacroContext): string {
    let result = text;
    
    // 处理 ::uppercase 管道
    result = result.replace(/\{\{([^:}]+)::uppercase\}\}/gi, (match, content) => {
      // 如果content本身是宏，需要先替换（假设已经替换过了）
      return content.toUpperCase();
    });
    
    // 处理 ::lowercase 管道
    result = result.replace(/\{\{([^:}]+)::lowercase\}\}/gi, (match, content) => {
      return content.toLowerCase();
    });
    
    // 处理 ::length 管道
    result = result.replace(/\{\{([^:}]+)::length\}\}/gi, (match, content) => {
      return String(content.length);
    });
    
    return result;
  }
  
  /**
   * 获取支持的宏列表
   */
  getSupportedMacros(): string[] {
    return ['trim', 'uppercase', 'lowercase', 'length'];
  }
}
