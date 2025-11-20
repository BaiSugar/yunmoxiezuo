import { Injectable } from '@nestjs/common';

/**
 * 语言类型
 */
export enum LanguageType {
  CHINESE = 'zh',
  ENGLISH = 'en',
  MIXED = 'mixed',
}

/**
 * 字符数统计服务
 */
@Injectable()
export class CharacterCounterService {
  /**
   * Token 转换为字符数
   * 
   * 经验公式：
   * - 中文：1 token ≈ 1.5 字符
   * - 英文：1 token ≈ 4 字符
   * - 混合：1 token ≈ 2.5 字符
   */
  tokenToChars(tokens: number, language: LanguageType = LanguageType.MIXED): number {
    const ratioMap = {
      [LanguageType.CHINESE]: 1.5,
      [LanguageType.ENGLISH]: 4.0,
      [LanguageType.MIXED]: 2.5,
    };

    return Math.ceil(tokens * ratioMap[language]);
  }

  /**
   * 检测文本语言类型
   */
  detectLanguage(text: string): LanguageType {
    // 统计中文字符数
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 统计英文字符数（字母）
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;

    const total = chineseChars + englishChars;
    if (total === 0) return LanguageType.MIXED;

    const chineseRatio = chineseChars / total;
    
    if (chineseRatio > 0.7) return LanguageType.CHINESE;
    if (chineseRatio < 0.3) return LanguageType.ENGLISH;
    return LanguageType.MIXED;
  }

  /**
   * 统计文本字符数
   */
  countChars(text: string): number {
    if (!text) return 0;
    return text.length;
  }

  /**
   * 统计消息数组的总字符数
   */
  countMessageChars(messages: Array<{ content: string | any }>): number {
    let total = 0;
    
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        total += this.countChars(msg.content);
      } else if (Array.isArray(msg.content)) {
        // 处理多模态内容（如图片+文字）
        for (const item of msg.content) {
          if (item.type === 'text' && item.text) {
            total += this.countChars(item.text);
          }
        }
      }
    }
    
    return total;
  }

  /**
   * 估算Token数（根据字符数反推）
   * 用于前端预估或没有真实token数据时
   */
  estimateTokens(text: string): number {
    const chars = this.countChars(text);
    const language = this.detectLanguage(text);
    
    const ratioMap = {
      [LanguageType.CHINESE]: 1.5,
      [LanguageType.ENGLISH]: 4.0,
      [LanguageType.MIXED]: 2.5,
    };

    return Math.ceil(chars / ratioMap[language]);
  }
}
