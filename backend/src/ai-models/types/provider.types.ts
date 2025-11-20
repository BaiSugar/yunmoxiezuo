/**
 * AI 提供商类型定义
 */

/**
 * 支持的聊天补全来源
 */
export enum ChatCompletionSource {
  OPENAI = 'openai',
  CLAUDE = 'claude',
  OPENROUTER = 'openrouter',
  MAKERSUITE = 'makersuite',
  VERTEXAI = 'vertexai',
  AI21 = 'ai21',
  MISTRALAI = 'mistralai',
  CUSTOM = 'custom',
  COHERE = 'cohere',
  PERPLEXITY = 'perplexity',
  GROQ = 'groq',
  ELECTRONHUB = 'electronhub',
  NANOGPT = 'nanogpt',
  DEEPSEEK = 'deepseek',
  AIMLAPI = 'aimlapi',
  XAI = 'xai',
  POLLINATIONS = 'pollinations',
  MOONSHOT = 'moonshot',
  FIREWORKS = 'fireworks',
  COMETAPI = 'cometapi',
  AZURE_OPENAI = 'azure_openai',
}

/**
 * 提供商认证类型
 */
export enum ProviderAuthType {
  API_KEY = 'api_key',
  BEARER = 'bearer',
  BASIC = 'basic',
  CUSTOM = 'custom',
}

/**
 * 提供商状态
 */
export enum ProviderStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

/**
 * 提供商配置接口
 */
export interface IProviderConfig {
  baseUrl: string;
  authType: ProviderAuthType;
  headers?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

/**
 * 提供商能力接口
 */
export interface IProviderCapabilities {
  supportedParameters?: string[];
  maxTokens?: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsJsonSchema: boolean;
  supportsVision: boolean;
  supportsWebSearch: boolean;
  supportsThinking: boolean;
}
