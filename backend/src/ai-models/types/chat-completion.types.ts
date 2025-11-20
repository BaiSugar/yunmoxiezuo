/**
 * 聊天补全类型定义
 */

/**
 * 消息角色
 */
export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
  TOOL = 'tool',
}

/**
 * 消息接口
 */
export interface IMessage {
  role: MessageRole;
  content: string | IMessageContent[];
  name?: string;
  tool_call_id?: string;
  tool_calls?: IToolCall[];
}

/**
 * 消息内容（支持多模态）
 */
export interface IMessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

/**
 * 工具调用接口
 */
export interface IToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * 工具定义接口
 */
export interface ITool {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters: Record<string, any>;
  };
}

/**
 * 通用聊天补全请求参数
 */
export interface IChatCompletionRequest {
  // 基础参数
  model: string;
  messages: IMessage[];
  stream?: boolean;

  // 采样参数
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  top_a?: number;
  min_p?: number;

  // 重复控制
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;

  // 其他控制参数
  stop?: string | string[];
  seed?: number;
  n?: number;
  logit_bias?: Record<string, number>;
  logprobs?: boolean;
  top_logprobs?: number;

  // 工具调用
  tools?: ITool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; name: string };

  // 结构化输出
  response_format?: {
    type: 'json_object' | 'json_schema' | 'text';
    json_schema?: {
      name: string;
      strict?: boolean;
      schema: Record<string, any>;
    };
  };

  // 提供商特定参数
  [key: string]: any;
}

/**
 * 统一聊天补全响应格式
 */
export interface IChatCompletionResponse {
  id: string;
  object: 'chat.completion' | 'chat.completion.chunk';
  created: number;
  model: string;
  choices: IChoice[];
  usage?: IUsage;
  system_fingerprint?: string;
}

/**
 * 选项接口
 */
export interface IChoice {
  index: number;
  message?: IMessage;
  delta?: Partial<IMessage>;
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  logprobs?: any;
}

/**
 * Token 使用统计
 */
export interface IUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
}

/**
 * 流式响应数据
 */
export interface IStreamChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: Partial<IToolCall>[];
    };
    finish_reason?: string | null;
  }[];
}
