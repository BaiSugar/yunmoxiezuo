import { Injectable } from '@nestjs/common';
import { MacroProcessor, MacroContext } from '../interfaces/macro-context.interface';

/**
 * 随机与计算宏处理服务
 * 
 * 支持的宏：
 * - {{roll:公式}}: 骰子掷骰，如 {{roll:1d20}} 或 {{roll:2d6+3}}
 * - {{random::选项1::选项2::...}}: 随机选择一个选项
 * - {{pick::变量名}}: 从变量列表中随机选择
 */
@Injectable()
export class RandomMacroService implements MacroProcessor {
  /**
   * 处理随机相关宏
   */
  process(text: string, context: MacroContext): string {
    let result = text;
    
    // 处理 {{roll:公式}} - 骰子
    result = this.processRollMacro(result);
    
    // 处理 {{random::选项1::选项2}} - 随机选择
    result = this.processRandomMacro(result);
    
    // 处理 {{pick::变量名}} - 从列表随机选
    result = this.processPickMacro(result, context);
    
    return result;
  }
  
  /**
   * 处理骰子宏 {{roll:1d20}}
   */
  private processRollMacro(text: string): string {
    const rollRegex = /\{\{roll:([^}]+)\}\}/gi;
    return text.replace(rollRegex, (match, formula) => {
      try {
        return String(this.rollDice(formula.trim()));
      } catch (error) {
        return match; // 保留原始宏
      }
    });
  }
  
  /**
   * 处理随机选择宏 {{random::选项1::选项2}}
   */
  private processRandomMacro(text: string): string {
    const randomRegex = /\{\{random::([^}]+)\}\}/gi;
    return text.replace(randomRegex, (match, options) => {
      const choices = options.split('::').map((s: string) => s.trim());
      if (choices.length === 0) return match;
      
      const randomIndex = Math.floor(Math.random() * choices.length);
      return choices[randomIndex];
    });
  }
  
  /**
   * 处理从变量列表随机选择 {{pick::变量名}}
   */
  private processPickMacro(text: string, context: MacroContext): string {
    const pickRegex = /\{\{pick::([^}]+)\}\}/gi;
    return text.replace(pickRegex, (match, varName) => {
      const variable = context.variables?.[varName.trim()];
      if (!variable || !Array.isArray(variable) || variable.length === 0) {
        return match; // 保留原始宏
      }
      
      const randomIndex = Math.floor(Math.random() * variable.length);
      return String(variable[randomIndex]);
    });
  }
  
  /**
   * 掷骰子计算
   * 支持格式：1d20, 2d6+3, 3d8-2
   */
  private rollDice(formula: string): number {
    // 解析公式：NdM+X 或 NdM-X
    const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
    if (!match) {
      throw new Error('Invalid dice formula');
    }
    
    const count = parseInt(match[1], 10); // 骰子数量
    const sides = parseInt(match[2], 10); // 骰子面数
    const modifier = match[3] ? parseInt(match[3], 10) : 0; // 修正值
    
    // 验证参数
    if (count < 1 || count > 100 || sides < 2 || sides > 1000) {
      throw new Error('Invalid dice parameters');
    }
    
    // 掷骰并求和
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * sides) + 1;
    }
    
    return total + modifier;
  }
  
  /**
   * 获取支持的宏列表
   */
  getSupportedMacros(): string[] {
    return ['roll', 'random', 'pick'];
  }
}
