/**
 * 兼容的剪贴板复制工具
 * 优先使用 Clipboard API，降级到 document.execCommand
 */

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<boolean> 是否成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 方案1：尝试使用 Clipboard API（现代浏览器 + HTTPS）
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API 失败，尝试降级方案:', err);
    }
  }

  // 方案2：降级方案 - 使用 document.execCommand（兼容 HTTP）
  try {
    // 创建临时 textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    
    // 设置样式使其不可见
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    textarea.style.opacity = '0';
    
    document.body.appendChild(textarea);
    
    // 选中文本
    textarea.focus();
    textarea.select();
    
    // 兼容 iOS
    if (navigator.userAgent.match(/ipad|iphone/i)) {
      const range = document.createRange();
      range.selectNodeContents(textarea);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      textarea.setSelectionRange(0, text.length);
    }
    
    // 执行复制命令
    const successful = document.execCommand('copy');
    
    // 清理
    document.body.removeChild(textarea);
    
    return successful;
  } catch (err) {
    console.error('降级复制方案也失败:', err);
    return false;
  }
}

/**
 * 检查是否支持 Clipboard API
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && window.isSecureContext);
}

/**
 * 获取当前环境信息（用于调试）
 */
export function getClipboardEnvironment() {
  return {
    hasClipboardAPI: !!navigator.clipboard,
    isSecureContext: window.isSecureContext,
    protocol: window.location.protocol,
    isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
  };
}
