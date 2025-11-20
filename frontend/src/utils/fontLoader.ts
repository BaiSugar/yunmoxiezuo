import type { Font } from '../types/font';

/**
 * 动态加载字体文件并应用到页面
 */
export class FontLoader {
  private static loadedFonts = new Set<string>();
  private static styleElement: HTMLStyleElement | null = null;

  /**
   * 初始化字体样式元素
   */
  private static initStyleElement(): HTMLStyleElement {
    if (!this.styleElement) {
      this.styleElement = document.createElement('style');
      this.styleElement.id = 'dynamic-fonts';
      document.head.appendChild(this.styleElement);
    }
    return this.styleElement;
  }

  /**
   * 加载单个字体
   */
  static loadFont(font: Font): Promise<void> {
    return new Promise((resolve, reject) => {
      // 系统字体无需加载
      if (font.format === 'system' || !font.url) {
        resolve();
        return;
      }

      // 已加载过的字体跳过
      if (this.loadedFonts.has(font.name)) {
        resolve();
        return;
      }

      const styleEl = this.initStyleElement();
      
      // 根据格式设置 format 参数
      let formatType = '';
      switch (font.format.toLowerCase()) {
        case 'woff2':
          formatType = 'woff2';
          break;
        case 'woff':
          formatType = 'woff';
          break;
        case 'ttf':
          formatType = 'truetype';
          break;
        case 'otf':
          formatType = 'opentype';
          break;
        default:
          formatType = font.format;
      }

      // 生成 @font-face 规则
      const fontFaceRule = `
        @font-face {
          font-family: '${font.name}';
          src: url('${font.url}') format('${formatType}');
          font-display: swap;
        }
      `;

      // 添加到样式表
      styleEl.textContent += fontFaceRule;

      // 使用 FontFaceSet API 检测字体是否加载成功
      if ('fonts' in document) {
        const fontFace = new FontFace(font.name, `url(${font.url})`);
        fontFace.load().then(() => {
          (document as any).fonts.add(fontFace);
          this.loadedFonts.add(font.name);
          resolve();
        }).catch((error) => {
          console.error(`加载字体 ${font.name} 失败:`, error);
          reject(error);
        });
      } else {
        // 旧浏览器降级处理
        this.loadedFonts.add(font.name);
        resolve();
      }
    });
  }

  /**
   * 批量加载字体
   */
  static async loadFonts(fonts: Font[]): Promise<void> {
    const promises = fonts.map(font => this.loadFont(font).catch(err => {
      console.error(`字体 ${font.displayName} 加载失败:`, err);
      // 单个字体加载失败不影响其他字体
    }));

    await Promise.all(promises);
  }

  /**
   * 检查字体是否已加载
   */
  static isFontLoaded(fontName: string): boolean {
    return this.loadedFonts.has(fontName);
  }

  /**
   * 获取字体的 font-family CSS 值
   */
  static getFontFamily(font: Font): string {
    if (font.format === 'system') {
      // 系统字体使用回退栈
      return this.getSystemFontStack(font.name);
    }
    // Web字体直接使用名称
    return `'${font.name}'`;
  }

  /**
   * 获取系统字体的回退栈
   */
  private static getSystemFontStack(fontName: string): string {
    const systemFontStacks: Record<string, string> = {
      'system-default': 'PingFang SC, Microsoft YaHei, Hiragino Sans GB, WenQuanYi Micro Hei, sans-serif',
      'Microsoft YaHei': 'Microsoft YaHei, PingFang SC, Hiragino Sans GB, sans-serif',
      'SimSun': 'SimSun, NSimSun, STSong, serif',
      'KaiTi': 'KaiTi, STKaiti, BiauKai, serif',
      'SimHei': 'SimHei, STHeiti, Heiti SC, sans-serif',
      'Arial': 'Arial, Helvetica, sans-serif',
      'Georgia': 'Georgia, Times New Roman, serif',
    };

    return systemFontStacks[fontName] || `${fontName}, sans-serif`;
  }

  /**
   * 清除所有加载的字体
   */
  static clear(): void {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }
    this.loadedFonts.clear();
  }
}

