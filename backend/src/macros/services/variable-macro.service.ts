import { Injectable } from '@nestjs/common';
import { MacroProcessor, MacroContext } from '../interfaces/macro-context.interface';

/**
 * 变量宏处理服务
 * 
 * 支持的宏：
 * - {{变量名}} 或 ${变量名}: 直接引用参数（简化格式，最常用）
 * - {{getvar::变量名}} 或 ${getvar::变量名}: 获取变量值
 * - {{setvar::变量名::值}} 或 ${setvar::变量名::值}: 设置变量（会修改context中的variables）
 */
@Injectable()
export class VariableMacroService implements MacroProcessor {
  /**
   * 处理变量相关宏
   */
  process(text: string, context: MacroContext): string {
    let result = text;
    
    // 初始化 variables 如果不存在
    if (!context.variables) {
      context.variables = {};
    }
    
    // 处理 {{setvar::变量名::值}} - 设置变量
    result = this.processSetvarMacro(result, context);
    
    // 处理 {{getvar::变量名}} - 获取变量
    result = this.processGetvarMacro(result, context);
    
    // 处理简化格式 {{变量名}} - 直接引用参数
    result = this.processSimpleVariableMacro(result, context);
    
    return result;
  }
  
  /**
   * 处理设置变量宏 {{setvar::变量名::值}} 或 ${setvar::变量名::值}
   */
  private processSetvarMacro(text: string, context: MacroContext): string {
    // 支持两种格式：{{}} 需要 }}，${} 只需要 }
    const setvarRegex = /\{\{setvar::([^:}]+)::([^}]+)\}\}|\$\{setvar::([^:}]+)::([^}]+)\}/gi;
    return text.replace(setvarRegex, (match, varName1, value1, varName2, value2) => {
      const varName = varName1 || varName2;
      const value = value1 || value2;
      const name = varName.trim();
      const val = value.trim();
      
      // 尝试解析为数字或布尔值
      let parsedValue: any = val;
      if (val === 'true') {
        parsedValue = true;
      } else if (val === 'false') {
        parsedValue = false;
      } else if (!isNaN(Number(val))) {
        parsedValue = Number(val);
      }
      
      // 设置变量
      context.variables![name] = parsedValue;
      
      // setvar 宏本身不产生输出，返回空字符串
      return '';
    });
  }
  
  /**
   * 处理获取变量宏 {{getvar::变量名}} 或 ${getvar::变量名}
   */
  private processGetvarMacro(text: string, context: MacroContext): string {
    // 支持两种格式：{{}} 需要 }}，${} 只需要 }
    const getvarRegex = /\{\{getvar::([^}]+)\}\}|\$\{getvar::([^}]+)\}/gi;
    return text.replace(getvarRegex, (match, varName1, varName2) => {
      const name = (varName1 || varName2).trim();
      const value = context.variables![name];
      
      // 如果变量不存在，保留原始宏
      if (value === undefined) {
        return match;
      }
      
      // 转换为字符串
      return String(value);
    });
  }
  
  /**
   * 处理简化格式变量宏 {{变量名}} 或 ${变量名}
   * 这是最常用的参数引用格式
   */
  private processSimpleVariableMacro(text: string, context: MacroContext): string {
    // 匹配 {{xxx}} 或 ${xxx} 格式，但排除已经被处理过的特殊宏（包含 :: 的）
    // 注意：{{}} 需要两个}，${} 只需要一个}
    const simpleVarRegex = /\{\{([^:}]+)\}\}|\$\{([^:}]+)\}/g;
    
    // 调试：记录所有匹配到的变量
    const matches = [...text.matchAll(simpleVarRegex)];
    if (matches.length > 0) {
      console.log('\n[VariableMacro] 检测到变量占位符:');
      matches.forEach((m) => {
        const varName = (m[1] || m[2]).trim();
        console.log(`  - 原始: ${m[0]}, 变量名: ${varName}`);
      });
      console.log(`[VariableMacro] 可用的变量:`, Object.keys(context.variables || {}));
    }
    
    return text.replace(simpleVarRegex, (match, varName1, varName2) => {
      // varName1 是 {{}} 格式的变量名，varName2 是 ${} 格式的变量名
      const name = (varName1 || varName2).trim();
      
      // 跳过特殊宏关键字（char, user, time, date等）
      const specialMacros = ['char', 'user', 'time', 'date', 'weekday', 'isotime', 
                            'lastMessage', 'lastCharMessage', 'lastUserMessage',
                            'charIfNotGroup', 'charPrompt', 'trim'];
      
      if (specialMacros.includes(name)) {
        console.log(`[VariableMacro] 跳过特殊宏: ${name}`);
        return match; // 保留，由其他处理器处理
      }
      
      // 从 variables 中获取值
      const value = context.variables![name];
      
      // 如果变量不存在，保留原始宏
      if (value === undefined) {
        console.log(`[VariableMacro] ❌ 变量不存在: ${name}, 保留原始占位符`);
        return match;
      }
      
      // 转换为字符串
      console.log(`[VariableMacro] ✅ 替换变量: ${name} = ${String(value).substring(0, 50)}...`);
      return String(value);
    });
  }
  
  /**
   * 获取支持的宏列表
   */
  getSupportedMacros(): string[] {
    return ['getvar', 'setvar', 'simple-variable'];
  }
}
