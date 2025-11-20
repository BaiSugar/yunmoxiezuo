/**
 * AI 模型类型定义
 */

// AI 模型状态
export type ModelStatus = 'active' | 'inactive' | 'deprecated';

// AI 模型特性
export type ModelFeature = 'chat' | 'reasoning' | 'vision' | 'audio' | 'function_calling' | 'web_search';

// 价格信息
export interface ModelPricing {
  inputTokenPrice: number;
  outputTokenPrice: number;
  currency: string;
}

// 速率限制
export interface RateLimit {
  requestsPerMinute: number;
  tokensPerMinute: number;
}

// 模型限制
export interface ModelLimits {
  maxInputTokens: number;
  maxOutputTokens: number;
  rateLimit?: RateLimit;
}

// 模型分类
export interface ModelCategory {
  id: number;
  name: string;
  icon?: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// AI 模型
export interface AIModel {
  id: number;
  modelId: string;
  displayName: string;
  description?: string;
  status: ModelStatus;
  providerId: number;
  categoryId?: number;
  category?: ModelCategory;
  version?: string;
  contextWindow: number;
  maxOutputTokens: number;
  pricing?: ModelPricing;
  limits?: ModelLimits;
  features: ModelFeature[];
  supportsStreaming: boolean;
  supportsTools: boolean;
  supportsVision: boolean;
  isDefault: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  provider?: AIProvider;
}

// AI 提供商
export interface AIProvider {
  id: number;
  name: string;
  source: string;
  displayName: string;
  description?: string;
  status: 'active' | 'inactive';
  config: any;
  capabilities: any;
  isDefault: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  models?: AIModel[];
}

// 用户模型偏好设置
export interface UserModelPreference {
  id: number;
  userId: number;
  modelId: number;
  temperature: number;
  historyMessageLimit?: number;
  createdAt: string;
  updatedAt: string;
}

// 创建/更新用户模型偏好 DTO
export interface CreateUserModelPreferenceDto {
  modelId: number;  // 后端使用数据库唯一ID
  temperature: number;
  historyMessageLimit?: number;
}

export interface UpdateUserModelPreferenceDto {
  temperature: number;
  historyMessageLimit?: number;
}

// 前端模型选择器使用的简化模型信息（不包含敏感信息）
export interface AIModelBasic {
  id: number;
  displayName: string;
  description?: string;
  isDefault: boolean;
  providerId: number;
  providerName: string;
  categoryId?: number;
  categoryName?: string;
  categoryIcon?: string;
  categoryDescription?: string;
  categoryOrder?: number;
  isFree?: boolean;
  inputRatio?: number;
  outputRatio?: number;
}
