import { Injectable } from '@nestjs/common';
import { MacroContext } from '../interfaces/macro-context.interface';
import { MacroReplacementStage } from '../enums/macro-type.enum';

// 导入所有宏处理服务
import { CharacterMacroService } from './character-macro.service';
import { TimeMacroService } from './time-macro.service';
import { ConversationMacroService } from './conversation-macro.service';
import { RandomMacroService } from './random-macro.service';
import { TextMacroService } from './text-macro.service';
import { VariableMacroService } from './variable-macro.service';
import { MentionMacroService } from './mention-macro.service';

/**
 * 主宏替换服务
 * 
 * 负责协调所有宏处理器，按正确的顺序执行替换
 * 
 * 替换顺序：
 * 1. @引用宏（最先处理，加载实际内容）
 * 2. 静态宏（角色、用户名）
 * 3. 变量宏（setvar/getvar）
 * 4. 对话引用宏
 * 5. 时间宏
 * 6. 随机/计算宏
 * 7. 文本处理宏（trim, pipe）
 */
@Injectable()
export class MacroReplacerService {
  constructor(
    private readonly characterMacroService: CharacterMacroService,
    private readonly timeMacroService: TimeMacroService,
    private readonly conversationMacroService: ConversationMacroService,
    private readonly randomMacroService: RandomMacroService,
    private readonly textMacroService: TextMacroService,
    private readonly variableMacroService: VariableMacroService,
    private readonly mentionMacroService: MentionMacroService,
  ) {}
  
  /**
   * 替换文本中的所有宏
   * 
   * @param text 原始文本
   * @param context 宏上下文
   * @param stage 替换阶段（可选，用于控制执行哪些宏）
   * @returns 替换后的文本
   */
  async replace(
    text: string,
    context: MacroContext,
    stage?: MacroReplacementStage,
  ): Promise<string> {
    if (!text) return text;
    
    let result = text;
    
    // 根据阶段执行不同的宏替换
    switch (stage) {
      case MacroReplacementStage.LOAD:
        // 加载时：只替换静态宏
        result = this.characterMacroService.process(result, context);
        break;
        
      case MacroReplacementStage.BUILD:
        // 构建时：替换上下文相关宏
        result = this.characterMacroService.process(result, context);
        result = this.variableMacroService.process(result, context);
        result = this.conversationMacroService.process(result, context);
        break;
        
      case MacroReplacementStage.BEFORE_SEND:
        // 发送前：替换所有动态宏
        result = await this.replaceAll(result, context);
        break;
        
      default:
        // 默认：替换所有宏
        result = await this.replaceAll(result, context);
    }
    
    return result;
  }
  
  /**
   * 替换所有宏（完整替换流程）
   */
  private async replaceAll(text: string, context: MacroContext): Promise<string> {
    let result = text;
    
    // 1. @引用宏（最先处理，将@引用替换为实际内容）
    result = await this.mentionMacroService.processAsync(result, context);
    
    // 2. 静态宏（角色、用户名）
    result = this.characterMacroService.process(result, context);
    
    // 3. 变量宏（setvar 必须先执行，然后是 getvar）
    result = this.variableMacroService.process(result, context);
    
    // 4. 对话引用宏
    result = this.conversationMacroService.process(result, context);
    
    // 5. 时间宏
    result = this.timeMacroService.process(result, context);
    
    // 6. 随机/计算宏
    result = this.randomMacroService.process(result, context);
    
    // 7. 文本处理宏（最后执行）
    result = this.textMacroService.process(result, context);
    
    return result;
  }
  
  /**
   * 批量替换多个文本
   */
  async replaceMultiple(
    texts: string[],
    context: MacroContext,
    stage?: MacroReplacementStage,
  ): Promise<string[]> {
    return Promise.all(
      texts.map(text => this.replace(text, context, stage)),
    );
  }
  
  /**
   * 检查文本中是否包含宏（支持 {{}} 和 ${} 两种格式）
   */
  containsMacros(text: string): boolean {
    return /(?:\{\{|\$\{)[^}]+\}\}/.test(text);
  }
  
  /**
   * 提取文本中的所有宏名称（支持 {{}} 和 ${} 两种格式）
   */
  extractMacroNames(text: string): string[] {
    const macroRegex = /(?:\{\{|\$\{)([^:}]+)(?:::[^}]*)?\}\}/g;
    const matches = [...text.matchAll(macroRegex)];
    return matches.map(match => match[1].trim());
  }
}
