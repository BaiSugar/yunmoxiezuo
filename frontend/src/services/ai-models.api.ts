import { apiService } from './api';
import type { AIModel, AIModelBasic, AIProvider, ModelFeature } from '../types/ai-model';

/**
 * AI 模型管理 API 服务
 */
export const aiModelsApi = {
  /**
   * 获取所有 AI 模型
   */
  async getModels(): Promise<AIModel[]> {
    const response = await apiService.get<AIModel[]>('/ai-models');
    return response.data.data;
  },

  /**
   * 获取活跃的 AI 模型（仅返回前端需要的基本信息，不包含敏感数据）
   */
  async getActiveModels(): Promise<AIModelBasic[]> {
    const response = await apiService.get<AIModelBasic[]>('/ai-models/active/basic');
    return response.data.data;
  },

  /**
   * 获取默认 AI 模型
   */
  async getDefaultModel(): Promise<AIModel> {
    const response = await apiService.get<AIModel>('/ai-models/default');
    return response.data.data;
  },

  /**
   * 根据提供商ID获取模型列表
   */
  async getModelsByProvider(providerId: number): Promise<AIModel[]> {
    const response = await apiService.get<AIModel[]>(`/ai-models/provider/${providerId}`);
    return response.data.data;
  },

  /**
   * 根据特性查询模型
   */
  async getModelsByFeatures(features: ModelFeature[]): Promise<AIModel[]> {
    const featuresStr = features.join(',');
    const response = await apiService.get<AIModel[]>(`/ai-models/features?features=${featuresStr}`);
    return response.data.data;
  },

  /**
   * 获取单个模型详情
   */
  async getModel(id: number): Promise<AIModel> {
    const response = await apiService.get<AIModel>(`/ai-models/${id}`);
    return response.data.data;
  },
};

/**
 * AI 提供商管理 API 服务
 */
export const aiProvidersApi = {
  /**
   * 获取所有提供商
   */
  async getProviders(): Promise<AIProvider[]> {
    const response = await apiService.get<AIProvider[]>('/ai-providers');
    return response.data.data;
  },

  /**
   * 获取活跃提供商
   */
  async getActiveProviders(): Promise<AIProvider[]> {
    const response = await apiService.get<AIProvider[]>('/ai-providers/active');
    return response.data.data;
  },

  /**
   * 获取默认提供商
   */
  async getDefaultProvider(): Promise<AIProvider> {
    const response = await apiService.get<AIProvider>('/ai-providers/default');
    return response.data.data;
  },

  /**
   * 获取单个提供商详情
   */
  async getProvider(id: number): Promise<AIProvider> {
    const response = await apiService.get<AIProvider>(`/ai-providers/${id}`);
    return response.data.data;
  },
};
