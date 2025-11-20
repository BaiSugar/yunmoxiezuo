/**
 * API格式枚举
 * 支持的大语言模型API格式
 */
export enum ApiFormat {
  /** OpenAI格式（标准messages数组） */
  OPENAI = 'openai',

  /** Claude格式（分离system和messages） */
  CLAUDE = 'claude',

  /** Google Gemini格式 */
  GEMINI = 'gemini',
}
