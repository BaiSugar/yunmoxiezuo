import request from '../utils/request';
import type {
  AiProvider,
  AiModel,
  ApiKey,
  ModelCategory,
  CreateProviderDto,
  UpdateProviderDto,
  CreateModelDto,
  UpdateModelDto,
  TestModelConnectionDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateApiKeyDto,
  UpdateApiKeyDto,
  BulkCreateApiKeyDto,
  TestConnectionResponse,
} from '../types/ai-model';

/**
 * ==================== AI 提供商管理 ====================
 */

/**
 * 获取所有提供商
 */
export const getProviderList = async (): Promise<AiProvider[]> => {
  return request.get<AiProvider[]>('/ai-providers');
};

/**
 * 获取活跃提供商
 */
export const getActiveProviders = async (): Promise<AiProvider[]> => {
  return request.get<AiProvider[]>('/ai-providers/active');
};

/**
 * 获取默认提供商
 */
export const getDefaultProvider = async (): Promise<AiProvider> => {
  return request.get<AiProvider>('/ai-providers/default');
};

/**
 * 获取单个提供商
 */
export const getProviderById = async (id: number): Promise<AiProvider> => {
  return request.get<AiProvider>(`/ai-providers/${id}`);
};

/**
 * 创建提供商
 */
export const createProvider = async (data: CreateProviderDto): Promise<AiProvider> => {
  return request.post<AiProvider>('/ai-providers', data);
};

/**
 * 更新提供商
 */
export const updateProvider = async (id: number, data: UpdateProviderDto): Promise<AiProvider> => {
  return request.put<AiProvider>(`/ai-providers/${id}`, data);
};

/**
 * 删除提供商
 */
export const deleteProvider = async (id: number): Promise<{ message: string }> => {
  return request.delete<{ message: string }>(`/ai-providers/${id}`);
};

/**
 * 测试提供商连接
 */
export const testProviderConnection = async (id: number): Promise<TestConnectionResponse> => {
  return request.post<TestConnectionResponse>(`/ai-providers/${id}/test`);
};

/**
 * 获取提供商的可用模型列表（从提供商API获取）
 */
export const getAvailableModels = async (providerId: number): Promise<any[]> => {
  return request.get<any[]>(`/ai-providers/${providerId}/available-models`);
};

/**
 * ==================== AI 模型管理 ====================
 */

/**
 * 获取所有模型
 */
export const getModelList = async (): Promise<AiModel[]> => {
  return request.get<AiModel[]>('/ai-models');
};

/**
 * 获取活跃模型
 */
export const getActiveModels = async (): Promise<AiModel[]> => {
  return request.get<AiModel[]>('/ai-models/active');
};

/**
 * 获取默认模型
 */
export const getDefaultModel = async (): Promise<AiModel> => {
  return request.get<AiModel>('/ai-models/default');
};

/**
 * 获取指定提供商的模型
 */
export const getModelsByProviderId = async (providerId: number): Promise<AiModel[]> => {
  return request.get<AiModel[]>(`/ai-models/provider/${providerId}`);
};

/**
 * 获取指定分类的模型
 */
export const getModelsByCategoryId = async (categoryId: number): Promise<AiModel[]> => {
  return request.get<AiModel[]>(`/ai-models/category/${categoryId}`);
};

/**
 * 获取单个模型
 */
export const getModelById = async (id: number): Promise<AiModel> => {
  return request.get<AiModel>(`/ai-models/${id}`);
};

/**
 * 创建模型
 */
export const createModel = async (data: CreateModelDto): Promise<AiModel> => {
  return request.post<AiModel>('/ai-models', data);
};

/**
 * 更新模型
 */
export const updateModel = async (id: number, data: UpdateModelDto): Promise<AiModel> => {
  return request.put<AiModel>(`/ai-models/${id}`, data);
};

/**
 * 测试模型连接
 */
export const testModelConnection = async (data: TestModelConnectionDto): Promise<TestConnectionResponse> => {
  return request.post<TestConnectionResponse>('/ai-models/test-connection', data);
};

/**
 * 删除模型
 */
export const deleteModel = async (id: number): Promise<{ message: string }> => {
  return request.delete<{ message: string }>(`/ai-models/${id}`);
};

/**
 * 批量导入模型
 */
export const bulkImportModels = async (providerId: number, models: CreateModelDto[]): Promise<AiModel[]> => {
  return request.post<AiModel[]>(`/ai-models/provider/${providerId}/bulk-import`, models);
};

/**
 * ==================== 模型分类管理 ====================
 */

/**
 * 获取所有分类
 */
export const getCategoryList = async (): Promise<ModelCategory[]> => {
  return request.get<ModelCategory[]>('/model-categories');
};

/**
 * 获取单个分类
 */
export const getCategoryById = async (id: number): Promise<ModelCategory> => {
  return request.get<ModelCategory>(`/model-categories/${id}`);
};

/**
 * 创建分类
 */
export const createCategory = async (data: CreateCategoryDto): Promise<ModelCategory> => {
  return request.post<ModelCategory>('/model-categories', data);
};

/**
 * 更新分类
 */
export const updateCategory = async (id: number, data: UpdateCategoryDto): Promise<ModelCategory> => {
  return request.patch<ModelCategory>(`/model-categories/${id}`, data);
};

/**
 * 删除分类
 */
export const deleteCategory = async (id: number): Promise<void> => {
  return request.delete<void>(`/model-categories/${id}`);
};

/**
 * ==================== API Key 管理 ====================
 */

/**
 * 获取提供商的所有 API Keys
 */
export const getApiKeysByProviderId = async (providerId: number): Promise<ApiKey[]> => {
  return request.get<ApiKey[]>(`/ai-keys/provider/${providerId}`);
};

/**
 * 获取单个 API Key
 */
export const getApiKeyById = async (id: number): Promise<ApiKey> => {
  return request.get<ApiKey>(`/ai-keys/${id}`);
};

/**
 * 创建 API Key
 */
export const createApiKey = async (data: CreateApiKeyDto): Promise<ApiKey> => {
  return request.post<ApiKey>('/ai-keys', data);
};

/**
 * 批量创建 API Keys
 */
export const bulkCreateApiKeys = async (data: BulkCreateApiKeyDto): Promise<ApiKey[]> => {
  return request.post<ApiKey[]>('/ai-keys/bulk', data);
};

/**
 * 更新 API Key
 */
export const updateApiKey = async (id: number, data: UpdateApiKeyDto): Promise<ApiKey> => {
  return request.put<ApiKey>(`/ai-keys/${id}`, data);
};

/**
 * 删除 API Key
 */
export const deleteApiKey = async (id: number): Promise<{ message: string }> => {
  return request.delete<{ message: string }>(`/ai-keys/${id}`);
};

/**
 * 恢复错误的 API Key
 */
export const recoverApiKey = async (id: number): Promise<ApiKey> => {
  return request.post<ApiKey>(`/ai-keys/${id}/recover`);
};

/**
 * 获取健康状态
 */
export const getHealthStatus = async (): Promise<any> => {
  return request.get('/ai-keys/health/status');
};

/**
 * 重置统计数据
 */
export const resetStatistics = async (): Promise<{ message: string }> => {
  return request.post<{ message: string }>('/ai-keys/stats/reset');
};
