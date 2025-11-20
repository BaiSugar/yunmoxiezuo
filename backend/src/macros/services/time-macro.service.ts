import { Injectable } from '@nestjs/common';
import { MacroProcessor, MacroContext } from '../interfaces/macro-context.interface';

/**
 * 时间相关宏处理服务
 * 
 * 支持的宏（支持 {{}} 和 ${} 两种格式）：
 * - {{time}} 或 ${time}: 当前时间（HH:mm）
 * - {{date}} 或 ${date}: 当前日期（YYYY年MM月DD日）
 * - {{weekday}} 或 ${weekday}: 星期几
 * - {{isotime}} 或 ${isotime}: ISO格式时间
 */
@Injectable()
export class TimeMacroService implements MacroProcessor {
  /**
   * 处理时间相关宏
   */
  process(text: string, context: MacroContext): string {
    let result = text;
    const now = new Date();
    
    // 替换 {{time}} 或 ${time} - 当前时间 (HH:mm)
    if (result.includes('{{time}}') || result.includes('${time}')) {
      const timeStr = this.formatTime(now);
      result = result.replace(/(?:\{\{|\$\{)time\}\}/gi, timeStr);
    }
    
    // 替换 {{date}} 或 ${date} - 当前日期 (YYYY年MM月DD日)
    if (result.includes('{{date}}') || result.includes('${date}')) {
      const dateStr = this.formatDate(now);
      result = result.replace(/(?:\{\{|\$\{)date\}\}/gi, dateStr);
    }
    
    // 替换 {{weekday}} 或 ${weekday} - 星期几
    if (result.includes('{{weekday}}') || result.includes('${weekday}')) {
      const weekdayStr = this.formatWeekday(now);
      result = result.replace(/(?:\{\{|\$\{)weekday\}\}/gi, weekdayStr);
    }
    
    // 替换 {{isotime}} 或 ${isotime} - ISO格式时间
    if (result.includes('{{isotime}}') || result.includes('${isotime}')) {
      const isoStr = now.toISOString();
      result = result.replace(/(?:\{\{|\$\{)isotime\}\}/gi, isoStr);
    }
    
    return result;
  }
  
  /**
   * 格式化时间为 HH:mm
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  /**
   * 格式化日期为 YYYY年MM月DD日
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}年${month}月${day}日`;
  }
  
  /**
   * 格式化星期
   */
  private formatWeekday(date: Date): string {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekdays[date.getDay()];
  }
  
  /**
   * 获取支持的宏列表
   */
  getSupportedMacros(): string[] {
    return ['time', 'date', 'weekday', 'isotime'];
  }
}
