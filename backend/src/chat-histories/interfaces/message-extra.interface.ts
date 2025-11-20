import { SystemMessageType } from '../enums';

/**
 * 附件信息接口
 */
export interface FileAttachment {
  /** 文件URL */
  url: string;
  /** 文件大小（字节） */
  size?: number;
  /** 文件名 */
  name?: string;
  /** 创建时间戳 */
  created?: number;
  /** 提取的文本内容 */
  text?: string;
}

/**
 * 消息扩展信息接口
 */
export interface MessageExtra {
  /** Token数量 */
  token_count?: number;
  /** 使用的API */
  api?: string;
  /** 使用的模型 */
  model?: string;
  /** 文件附件 */
  file?: FileAttachment;
  /** 图片附件（单张或多张） */
  image?: string | string[];
  /** 内联图片 */
  inline_image?: string | string[];
  /** 偏置设置 */
  bias?: string;
  /** 生成开始时间 */
  gen_started?: number;
  /** 生成结束时间 */
  gen_finished?: number;
  /** 是否为小型系统消息 */
  isSmallSys?: boolean;
  /** 系统消息类型 */
  type?: SystemMessageType;
  /** 显示文本 */
  display_text?: string;
  /** 消息标题 */
  title?: string;
  /** 消息备注 */
  note?: string;
  /** 自定义元数据 */
  metadata?: Record<string, any>;
  /** 完成原因 */
  finish_reason?: string;
}
