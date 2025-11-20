/**
 * AI 模型管理相关类型定义
 */

/**
 * 提供商来源
 */
export const ChatCompletionSource = {
  OPENAI: 'openai',
  CLAUDE: 'claude',
  OPENROUTER: 'openrouter',
  MAKERSUITE: 'makersuite',
  VERTEXAI: 'vertexai',
  AI21: 'ai21',
  MISTRALAI: 'mistralai',
  CUSTOM: 'custom',
  COHERE: 'cohere',
  PERPLEXITY: 'perplexity',
  GROQ: 'groq',
  ELECTRONHUB: 'electronhub',
  NANOGPT: 'nanogpt',
  DEEPSEEK: 'deepseek',
  AIMLAPI: 'aimlapi',
  XAI: 'xai',
  POLLINATIONS: 'pollinations',
  MOONSHOT: 'moonshot',
  FIREWORKS: 'fireworks',
  COMETAPI: 'cometapi',
  AZURE_OPENAI: 'azure_openai',
} as const;
export type ChatCompletionSource = typeof ChatCompletionSource[keyof typeof ChatCompletionSource];

/**
 * 提供商状态
 */
export const ProviderStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ERROR: 'error',
} as const;
export type ProviderStatus = typeof ProviderStatus[keyof typeof ProviderStatus];

/**
 * 模型状态
 */
export const ModelStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DEPRECATED: 'deprecated',
} as const;
export type ModelStatus = typeof ModelStatus[keyof typeof ModelStatus];

/**
 * API Key 状态
 */
export const ApiKeyStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ERROR: 'error',
  COOLDOWN: 'cooldown',
} as const;
export type ApiKeyStatus = typeof ApiKeyStatus[keyof typeof ApiKeyStatus];

/**
 * API Key 轮询策略
 */
export const RotationStrategy = {
  ROUND_ROBIN: 'round_robin',
  RANDOM: 'random',
  WEIGHTED: 'weighted',
  PRIORITY: 'priority',
  LEAST_USED: 'least_used',
} as const;
export type RotationStrategy = typeof RotationStrategy[keyof typeof RotationStrategy];

/**
 * 提供商认证类型
 */
export const ProviderAuthType = {
  API_KEY: 'api_key',
  BEARER: 'bearer',
  BASIC: 'basic',
  CUSTOM: 'custom',
} as const;
export type ProviderAuthType = typeof ProviderAuthType[keyof typeof ProviderAuthType];

/**
 * 提供商配置
 */
export interface ProviderConfig {
  baseUrl: string;
  authType: ProviderAuthType;
  headers?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
  rateLimit?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
}

/**
 * 提供商能力
 */
export interface ProviderCapabilities {
  supportedParameters?: string[];
  maxTokens?: number;
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsJsonSchema: boolean;
  supportsVision: boolean;
  supportsWebSearch: boolean;
  supportsThinking: boolean;
}

/**
 * AI 提供商
 */
export interface AiProvider {
  id: number;
  name: string;
  source: ChatCompletionSource;
  displayName: string;
  description: string;
  status: ProviderStatus;
  config: ProviderConfig;
  capabilities: ProviderCapabilities;
  apiKey?: string; // 创建/更新时使用，不会从服务器返回
  maskedApiKey?: string; // 脱敏后的Key，用于显示
  isDefault: boolean;
  order: number;
  rotationStrategy: RotationStrategy;
  createdAt: string;
  updatedAt: string;
  models?: AiModel[];
  apiKeys?: ApiKey[];
}

/**
 * 模型定价
 */
export interface ModelPricing {
  inputTokenPrice: number;
  outputTokenPrice: number;
  currency: string;
}

/**
 * 模型限制
 */
export interface ModelLimits {
  maxInputTokens?: number;
  maxOutputTokens?: number;
  rateLimit?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
}

/**
 * 模型分类
 */
export interface ModelCategory {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  models?: AiModel[];
}

/**
 * AI 模型
 */
export interface AiModel {
  id: number;
  modelId: string;
  displayName: string;
  description: string;
  status: ModelStatus;
  providerId: number;
  provider?: AiProvider;
  categoryId?: number;
  category?: ModelCategory;
  version?: string;
  contextWindow: number;
  maxOutputTokens: number;
  pricing: ModelPricing;
  limits?: ModelLimits;
  features: string[];
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  isDefault: boolean;
  order: number;
  inputRatio: number;
  outputRatio: number;
  isFree: boolean;
  minInputChars: number;
  baseUrl?: string;
  apiKey?: string; // 创建/更新时使用，不会从服务器返回
  maskedApiKey?: string; // 脱敏后的Key，用于显示
  createdAt: string;
  updatedAt: string;
}

/**
 * API Key
 */
export interface ApiKey {
  id: number;
  providerId: number;
  provider?: AiProvider;
  name: string;
  key: string;
  status: ApiKeyStatus;
  weight: number;
  priority: number;
  usageCount: number;
  successCount: number;
  errorCount: number;
  lastUsedAt?: string;
  lastErrorAt?: string;
  lastErrorMessage?: string;
  cooldownUntil?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 创建提供商 DTO
 */
export interface CreateProviderDto {
  name: string;
  source: ChatCompletionSource;
  displayName: string;
  description?: string;
  status?: ProviderStatus;
  config: ProviderConfig;
  capabilities: ProviderCapabilities;
  apiKey?: string;
  isDefault?: boolean;
  order?: number;
  rotationStrategy?: RotationStrategy;
}

/**
 * 更新提供商 DTO
 */
export interface UpdateProviderDto {
  name?: string;
  displayName?: string;
  description?: string;
  status?: ProviderStatus;
  config?: ProviderConfig;
  capabilities?: ProviderCapabilities;
  apiKey?: string;
  isDefault?: boolean;
  order?: number;
  rotationStrategy?: RotationStrategy;
}

/**
 * 创建分类 DTO
 */
export interface CreateCategoryDto {
  name: string;
  icon?: string;
  description?: string;
  order?: number;
}

/**
 * 更新分类 DTO
 */
export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  description?: string;
  order?: number;
}

/**
 * 创建模型 DTO
 */
export interface CreateModelDto {
  modelId: string;
  displayName: string;
  description?: string;
  status?: ModelStatus;
  providerId: number;
  categoryId?: number;
  version?: string;
  contextWindow: number;
  maxOutputTokens: number;
  pricing: ModelPricing;
  limits?: ModelLimits;
  features?: string[];
  supportsStreaming?: boolean;
  supportsTools?: boolean;
  supportsVision?: boolean;
  isDefault?: boolean;
  order?: number;
  inputRatio?: number;
  outputRatio?: number;
  isFree?: boolean;
  minInputChars?: number;
  baseUrl?: string;
  apiKey?: string;
}

/**
 * 更新模型 DTO
 */
export interface UpdateModelDto {
  modelId?: string;
  displayName?: string;
  description?: string;
  status?: ModelStatus;
  categoryId?: number | null;
  version?: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  pricing?: ModelPricing;
  limits?: ModelLimits;
  features?: string[];
  supportsStreaming?: boolean;
  supportsTools?: boolean;
  supportsVision?: boolean;
  isDefault?: boolean;
  order?: number;
  inputRatio?: number;
  outputRatio?: number;
  isFree?: boolean;
  minInputChars?: number;
  baseUrl?: string;
  apiKey?: string;
}

export interface TestModelConnectionDto {
  providerId: number;
  modelId: string;
  baseUrl?: string;
  apiKey?: string;
}

/**
 * 创建 API Key DTO
 */
export interface CreateApiKeyDto {
  providerId: number;
  name: string;
  key: string;
  weight?: number;
  priority?: number;
}

/**
 * 批量创建 API Keys DTO
 */
export interface BulkCreateApiKeyDto {
  providerId: number;
  keys: Array<{
    name: string;
    key: string;
    weight?: number;
    priority?: number;
  }>;
}

/**
 * 更新 API Key DTO
 */
export interface UpdateApiKeyDto {
  name?: string;
  key?: string;
  status?: ApiKeyStatus;
  weight?: number;
  priority?: number;
}

/**
 * 测试连接响应
 */
export interface TestConnectionResponse {
  success: boolean;
  message: string;
}
