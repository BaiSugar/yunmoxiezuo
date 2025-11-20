import { Injectable } from '@nestjs/common';
import { WorldBookEntry } from '../interfaces/world-book-entry.interface';

/**
 * 世界书扫描缓冲区服务
 * 负责管理扫描文本和关键词匹配
 */
@Injectable()
export class WorldBookBufferService {
  /**
   * 构建扫描文本
   * @param currentMessage 当前用户消息
   * @param historyMessages 历史消息列表（按时间降序）
   * @param depth 扫描深度
   */
  buildScanText(
    currentMessage: string,
    historyMessages: string[],
    depth: number,
  ): string {
    // 拼接：当前消息 + 最近 depth 条历史消息
    const messages = [currentMessage, ...historyMessages.slice(0, depth)];

    // 转换为小写（用于不区分大小写的匹配）
    return messages.join('\n').toLowerCase();
  }

  /**
   * 关键词匹配
   * @param entry 世界书条目
   * @param scanText 扫描文本（已转小写）
   * @returns 是否匹配成功
   */
  matchKeywords(entry: WorldBookEntry, scanText: string): boolean {
    // 1. 主关键词匹配
    const primaryMatch = this.matchPrimaryKeywords(entry, scanText);
    if (!primaryMatch) {
      return false;
    }

    // 2. 无次要关键词 = 直接返回 true
    if (!entry.secondaryKeywords || entry.secondaryKeywords.length === 0) {
      return true;
    }

    // 3. 有次要关键词 = 根据选择性逻辑判断
    return this.matchSecondaryKeywords(entry, scanText);
  }

  /**
   * 匹配主关键词
   * @param entry 世界书条目
   * @param scanText 扫描文本
   * @returns 是否至少匹配一个主关键词
   */
  private matchPrimaryKeywords(
    entry: WorldBookEntry,
    scanText: string,
  ): boolean {
    return entry.keywords.some((keyword) =>
      this.matchSingleKeyword(keyword, scanText, entry),
    );
  }

  /**
   * 匹配次要关键词
   * @param entry 世界书条目
   * @param scanText 扫描文本
   * @returns 根据选择性逻辑判断结果
   */
  private matchSecondaryKeywords(
    entry: WorldBookEntry,
    scanText: string,
  ): boolean {
    const secondaryMatches = entry.secondaryKeywords!.filter((keyword) =>
      this.matchSingleKeyword(keyword, scanText, entry),
    ).length;

    const totalSecondary = entry.secondaryKeywords!.length;

    // 根据选择性逻辑判断
    switch (entry.selectiveLogic || 'AND_ANY') {
      case 'AND_ANY':
        // 主关键词 + 任一次要关键词
        return secondaryMatches > 0;

      case 'AND_ALL':
        // 主关键词 + 全部次要关键词
        return secondaryMatches === totalSecondary;

      case 'NOT_ANY':
        // 主关键词 + 无次要关键词
        return secondaryMatches === 0;

      case 'NOT_ALL':
        // 主关键词 + 非全部次要关键词
        return secondaryMatches < totalSecondary;

      default:
        return true;
    }
  }

  /**
   * 匹配单个关键词
   * @param keyword 关键词
   * @param scanText 扫描文本
   * @param entry 世界书条目（用于获取匹配选项）
   * @returns 是否匹配
   */
  private matchSingleKeyword(
    keyword: string,
    scanText: string,
    entry: WorldBookEntry,
  ): boolean {
    // 检查是否是正则表达式（以 / 开头和结尾）
    if (keyword.startsWith('/') && keyword.endsWith('/')) {
      return this.matchRegex(keyword, scanText, entry);
    }

    // 普通文本匹配
    return this.matchText(keyword, scanText, entry);
  }

  /**
   * 正则表达式匹配
   * @param keyword 正则表达式字符串（包含 / /）
   * @param scanText 扫描文本
   * @param entry 世界书条目
   * @returns 是否匹配
   */
  private matchRegex(
    keyword: string,
    scanText: string,
    entry: WorldBookEntry,
  ): boolean {
    try {
      // 提取正则表达式内容（去掉 / /）
      const pattern = keyword.slice(1, -1);

      // 构建正则表达式（根据大小写敏感设置）
      const flags = entry.caseSensitive ? '' : 'i';
      const regex = new RegExp(pattern, flags);

      return regex.test(scanText);
    } catch (error) {
      // 正则表达式无效，返回 false
      console.error(`Invalid regex pattern: ${keyword}`, error);
      return false;
    }
  }

  /**
   * 文本匹配
   * @param keyword 关键词
   * @param scanText 扫描文本
   * @param entry 世界书条目
   * @returns 是否匹配
   */
  private matchText(
    keyword: string,
    scanText: string,
    entry: WorldBookEntry,
  ): boolean {
    // 转换关键词大小写
    const transformedKeyword = entry.caseSensitive
      ? keyword
      : keyword.toLowerCase();

    const transformedScanText = entry.caseSensitive ? scanText : scanText;

    // 全词匹配
    if (entry.matchWholeWords) {
      return this.matchWholeWord(transformedKeyword, transformedScanText);
    }

    // 部分匹配（包含即可）
    return transformedScanText.includes(transformedKeyword);
  }

  /**
   * 全词匹配
   * @param keyword 关键词
   * @param scanText 扫描文本
   * @returns 是否匹配
   */
  private matchWholeWord(keyword: string, scanText: string): boolean {
    // 检查关键词是否包含空格（多词）
    const hasSpace = keyword.includes(' ');

    if (hasSpace) {
      // 多词：直接包含匹配
      return scanText.includes(keyword);
    } else {
      // 单词：使用单词边界正则
      const regex = new RegExp(`(?:^|\\W)(${this.escapeRegex(keyword)})(?:$|\\W)`);
      return regex.test(scanText);
    }
  }

  /**
   * 转义正则表达式特殊字符
   * @param str 字符串
   * @returns 转义后的字符串
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
