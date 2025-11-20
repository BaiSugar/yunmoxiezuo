/**
 * 编辑器主题类型
 */
export const EditorTheme = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto',
} as const;

export type EditorTheme = typeof EditorTheme[keyof typeof EditorTheme];

/**
 * 编辑器设置
 */
export interface EditorSettings {
  id: number;
  userId: number;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  theme: EditorTheme;
  paragraphIndent: number;
  paragraphSpacing: number;
  autoSave: boolean;
  autoSaveInterval: number;
  showWordCount: boolean;
  backgroundColor: string | null;
  backgroundImage: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建/更新编辑器设置 DTO
 */
export interface UpdateEditorSettingsDto {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  theme?: EditorTheme;
  paragraphIndent?: number;
  paragraphSpacing?: number;
  autoSave?: boolean;
  autoSaveInterval?: number;
  showWordCount?: boolean;
  backgroundColor?: string | null;
  backgroundImage?: string | null;
}

/**
 * 默认编辑器设置
 */
export const DEFAULT_EDITOR_SETTINGS: Partial<EditorSettings> = {
  fontFamily: 'PingFang SC, Microsoft YaHei, Hiragino Sans GB, WenQuanYi Micro Hei, sans-serif',
  fontSize: 16,
  lineHeight: 1.8,
  theme: EditorTheme.AUTO,
  paragraphIndent: 2,
  paragraphSpacing: 1,
  autoSave: true,
  autoSaveInterval: 30,
  showWordCount: true,
  backgroundColor: null,
  backgroundImage: null,
};

