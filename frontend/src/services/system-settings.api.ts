import { apiService } from './api';

export interface FontOption {
  value: string;
  label: string;
  category: string;
  description?: string;
}

export interface EditorConfig {
  available_fonts?: FontOption[];
  allow_custom_fonts?: boolean;
  font_size_range?: { min: number; max: number; default: number };
  line_height_range?: { min: number; max: number; default: number };
  paragraph_indent_range?: { min: number; max: number; default: number };
  paragraph_spacing_range?: { min: number; max: number; default: number };
}

export interface PublicSettings {
  email?: {
    verification_enabled?: boolean;
    verification_code_expire?: number;
    verification_resend_interval?: number;
  };
  system?: {
    site_name?: string;
    site_url?: string;
    register_enabled?: boolean;
  };
  footer?: {
    qq_group_image?: string;
    qq_group_number?: string;
    wechat_image?: string;
    wechat_text?: string;
    show_qq?: boolean;
    show_wechat?: boolean;
  };
  editor?: EditorConfig;
}

/**
 * 获取公开的系统配置
 */
export const getPublicSettings = async (): Promise<PublicSettings> => {
  const response = await apiService.get<PublicSettings>('/system-settings/public');
  return response.data.data;
};
