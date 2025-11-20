/**
 * 导出格式枚举
 */
export enum ExportFormat {
  /** JSONL格式（原生） */
  JSONL = 'jsonl',
  /** 纯文本格式 */
  TXT = 'txt',
  /** HTML格式 */
  HTML = 'html',
  /** Markdown格式 */
  MARKDOWN = 'markdown',
}

/**
 * 导入来源平台
 */
export enum ImportSource {
  /** SillyTavern原生格式 */
  SILLYTAVERN = 'sillytavern',
  /** Ooba格式 */
  OOBA = 'ooba',
  /** CAI Tools */
  CAI_TOOLS = 'cai_tools',
  /** Agnai */
  AGNAI = 'agnai',
  /** RisuAI */
  RISUAI = 'risuai',
  /** Chub */
  CHUB = 'chub',
  /** Kobold Lite */
  KOBOLD_LITE = 'kobold_lite',
}
