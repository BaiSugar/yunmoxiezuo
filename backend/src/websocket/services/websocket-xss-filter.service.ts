import { Injectable } from '@nestjs/common';

/**
 * WebSocket XSS 防护服务
 * 
 * 功能：
 * 1. 过滤HTML标签
 * 2. 转义特殊字符
 * 3. 清理危险内容
 */
@Injectable()
export class WebSocketXssFilterService {
  // 允许的HTML标签白名单
  private readonly allowedTags = new Set([
    'p', 'br', 'span', 'div', 
    'strong', 'em', 'u', 'b', 'i',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'img',
  ]);

  // 允许的属性白名单
  private readonly allowedAttrs = new Set([
    'href', 'src', 'alt', 'title', 'class', 'id',
  ]);

  // 危险的协议
  private readonly dangerousProtocols = [
    'javascript:', 'data:', 'vbscript:', 'file:',
  ];

  /**
   * 清理HTML内容
   * @param html HTML内容
   * @param strict 是否严格模式（移除所有HTML标签）
   * @returns 清理后的内容
   */
  sanitizeHtml(html: string, strict: boolean = false): string {
    if (!html) {
      return '';
    }

    // 严格模式：移除所有HTML标签
    if (strict) {
      return this.stripAllTags(html);
    }

    // 标准模式：只保留白名单标签
    return this.filterTags(html);
  }

  /**
   * 移除所有HTML标签
   */
  private stripAllTags(html: string): string {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');
  }

  /**
   * 过滤HTML标签，只保留白名单
   */
  private filterTags(html: string): string {
    // 移除script和style标签
    let result = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

    // 移除事件处理属性
    result = result.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
    result = result.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

    // 清理危险协议
    for (const protocol of this.dangerousProtocols) {
      const regex = new RegExp(`${protocol}`, 'gi');
      result = result.replace(regex, '');
    }

    return result;
  }

  /**
   * 转义HTML特殊字符
   */
  escapeHtml(text: string): string {
    if (!text) {
      return '';
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 清理对象中的所有字符串字段
   */
  sanitizeObject<T extends Record<string, any>>(
    obj: T,
    strict: boolean = false,
  ): T {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    const result = { ...obj };

    for (const key in result) {
      const value = result[key];

      if (typeof value === 'string') {
        // 对于特定字段使用严格模式
        const useStrict = strict || this.shouldUseStrictMode(key);
        result[key] = this.sanitizeHtml(value, useStrict) as any;
      } else if (typeof value === 'object' && value !== null) {
        // 递归处理嵌套对象
        result[key] = this.sanitizeObject(value, strict);
      }
    }

    return result;
  }

  /**
   * 判断字段是否应该使用严格模式
   */
  private shouldUseStrictMode(fieldName: string): boolean {
    const strictFields = [
      'username', 'email', 'phone', 'title', 'name',
    ];
    return strictFields.includes(fieldName.toLowerCase());
  }

  /**
   * 验证URL是否安全
   */
  isUrlSafe(url: string): boolean {
    if (!url) {
      return false;
    }

    const lower = url.toLowerCase().trim();

    // 检查危险协议
    for (const protocol of this.dangerousProtocols) {
      if (lower.startsWith(protocol)) {
        return false;
      }
    }

    // 允许的协议
    const safeProtocols = ['http://', 'https://', 'ftp://', 'mailto:', '/', '#'];
    const hasSafeProtocol = safeProtocols.some(protocol => lower.startsWith(protocol));

    // 如果没有协议，认为是相对路径，也是安全的
    if (!lower.includes(':')) {
      return true;
    }

    return hasSafeProtocol;
  }

  /**
   * 清理公告内容
   * content字段允许HTML，其他字段严格过滤
   */
  sanitizeAnnouncement(announcement: any): any {
    const result = { ...announcement };

    // 严格过滤标题和摘要
    if (result.title) {
      result.title = this.stripAllTags(result.title);
    }
    if (result.summary) {
      result.summary = this.stripAllTags(result.summary);
    }

    // content字段允许安全的HTML
    if (result.content) {
      result.content = this.sanitizeHtml(result.content, false);
    }

    // 验证链接URL
    if (result.linkUrl && !this.isUrlSafe(result.linkUrl)) {
      result.linkUrl = null;
    }

    return result;
  }
}

