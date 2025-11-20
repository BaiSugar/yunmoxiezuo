import { useState, useEffect } from "react";
import {
  getProviderList,
  deleteProvider,
  testProviderConnection,
  getModelList,
  deleteModel,
  getModelsByProviderId,
  getModelsByCategoryId,
  getCategoryList,
  createCategory,
  updateCategory,
  deleteCategory,
  getApiKeysByProviderId,
  deleteApiKey,
  recoverApiKey,
} from "../../api/ai-models";
import type {
  AiProvider,
  AiModel,
  ApiKey,
  ModelCategory,
  CreateCategoryDto,
  UpdateCategoryDto,
} from "../../types/ai-model";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { showToast } from "../../components/common/ToastContainer";
import { useAppSelector } from "../../store/hooks";
import { hasButtonPermission, PERMISSIONS } from "../../utils/permission";
import { ProviderModal } from "./ProviderModal";
import { ModelModal } from "./ModelModal";
import { ApiKeyModal } from "./ApiKeyModal";
import { CategoryModal } from "./CategoryModal";

type TabType = "providers" | "models" | "categories" | "apiKeys";

export default function AiModels() {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState<TabType>("providers");
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [models, setModels] = useState<AiModel[]>([]);
  const [categories, setCategories] = useState<ModelCategory[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(
    null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );

  const [providerModal, setProviderModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data: AiProvider | null;
  }>({ isOpen: false, mode: "create", data: null });

  const [modelModal, setModelModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data: AiModel | null;
  }>({ isOpen: false, mode: "create", data: null });

  const [apiKeyModal, setApiKeyModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data: ApiKey | null;
  }>({ isOpen: false, mode: "create", data: null });

  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    mode: "create" | "edit";
    data: ModelCategory | null;
  }>({ isOpen: false, mode: "create", data: null });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const loadProviders = async () => {
    setLoading(true);
    try {
      const data = await getProviderList();
      setProviders(data);
    } catch (error) {
      showToast("加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategoryList();
      setCategories(data);
    } catch (error) {
      showToast("加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async () => {
    setLoading(true);
    try {
      let data: AiModel[];
      if (selectedCategoryId) {
        data = await getModelsByCategoryId(selectedCategoryId);
      } else if (selectedProviderId) {
        data = await getModelsByProviderId(selectedProviderId);
      } else {
        data = await getModelList();
      }
      setModels(data);
    } catch (error) {
      showToast("加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadApiKeys = async () => {
    if (!selectedProviderId) {
      setApiKeys([]);
      return;
    }
    setLoading(true);
    try {
      const data = await getApiKeysByProviderId(selectedProviderId);
      setApiKeys(data);
    } catch (error) {
      showToast("加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "providers") {
      loadProviders();
    } else if (activeTab === "models") {
      loadProviders();
      loadCategories();
      loadModels();
    } else if (activeTab === "categories") {
      loadCategories();
    } else if (activeTab === "apiKeys") {
      loadProviders();
      if (selectedProviderId) {
        loadApiKeys();
      }
    }
  }, [activeTab, selectedProviderId, selectedCategoryId]);

  const handleDeleteProvider = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除提供商",
      message: `确定要删除提供商 "${name}" 吗？该提供商下的所有模型也会被删除。此操作无法撤销。`,
      onConfirm: async () => {
        try {
          await deleteProvider(id);
          showToast("删除成功", "success");
          loadProviders();
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  const handleTestConnection = async (id: number, name: string) => {
    try {
      showToast("正在测试连接...", "info");
      const result = await testProviderConnection(id);
      if (result.success) {
        showToast(`${name}: ${result.message}`, "success");
      } else {
        showToast(`${name}: ${result.message}`, "error");
      }
    } catch (error: any) {
      showToast(error.message || "测试失败", "error");
    }
  };

  const handleDeleteModel = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除模型",
      message: `确定要删除模型 "${name}" 吗？此操作无法撤销。`,
      onConfirm: async () => {
        try {
          await deleteModel(id);
          showToast("删除成功", "success");
          loadModels();
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  const handleDeleteApiKey = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除 API Key",
      message: `确定要删除 API Key "${name}" 吗？此操作无法撤销。`,
      onConfirm: async () => {
        try {
          await deleteApiKey(id);
          showToast("删除成功", "success");
          loadApiKeys();
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  const handleRecoverApiKey = async (id: number, name: string) => {
    try {
      await recoverApiKey(id);
      showToast(`${name} 已恢复`, "success");
      loadApiKeys();
    } catch (error: any) {
      showToast(error.message || "恢复失败", "error");
    }
  };

  const handleDeleteCategory = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除分类",
      message: `确定要删除分类 "${name}" 吗？此操作无法撤销。`,
      onConfirm: async () => {
        try {
          await deleteCategory(id);
          showToast("删除成功", "success");
          loadCategories();
          if (selectedCategoryId === id) {
            setSelectedCategoryId(null);
          }
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  const handleCategorySubmit = async (
    mode: "create" | "edit",
    data: CreateCategoryDto | UpdateCategoryDto,
    id?: number
  ) => {
    try {
      if (mode === "create") {
        await createCategory(data as CreateCategoryDto);
        showToast("创建成功", "success");
      } else {
        await updateCategory(id!, data as UpdateCategoryDto);
        showToast("更新成功", "success");
      }
      loadCategories();
      setCategoryModal({ isOpen: false, mode: "create", data: null });
    } catch (error: any) {
      showToast(error.message || "操作失败", "error");
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      error: "bg-red-100 text-red-800",
      deprecated: "bg-yellow-100 text-yellow-800",
      cooldown: "bg-orange-100 text-orange-800",
    };

    const labels: Record<string, string> = {
      active: "活跃",
      inactive: "未激活",
      error: "错误",
      deprecated: "已弃用",
      cooldown: "冷却中",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          styles[status] || styles.inactive
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const canCreate = hasButtonPermission(
    user,
    PERMISSIONS.AI_MODEL.PROVIDER_CREATE
  );
  const canUpdate = hasButtonPermission(
    user,
    PERMISSIONS.AI_MODEL.PROVIDER_UPDATE
  );
  const canDelete = hasButtonPermission(
    user,
    PERMISSIONS.AI_MODEL.PROVIDER_DELETE
  );
  const canTest = hasButtonPermission(user, PERMISSIONS.AI_MODEL.PROVIDER_TEST);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          AI 模型管理
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          管理 AI 提供商、模型配置和 API 密钥
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {["providers", "models", "categories", "apiKeys"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab === "providers"
                  ? "AI 提供商"
                  : tab === "models"
                  ? "模型配置"
                  : tab === "categories"
                  ? "模型分类"
                  : "API 密钥池"}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "providers" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                提供商列表
              </h2>
              {canCreate && (
                <button
                  onClick={() =>
                    setProviderModal({
                      isOpen: true,
                      mode: "create",
                      data: null,
                    })
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + 新增提供商
                </button>
              )}
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : providers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无数据</div>
              ) : (
                providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {provider.displayName}
                          </h3>
                          {getStatusBadge(provider.status)}
                          {provider.isDefault && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              默认
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {provider.description}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>来源: {provider.source}</span>
                          <span>模型数: {provider.models?.length || 0}</span>
                          <span>轮询: {provider.rotationStrategy}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {canTest && (
                          <button
                            onClick={() =>
                              handleTestConnection(
                                provider.id,
                                provider.displayName
                              )
                            }
                            className="px-3 py-1.5 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                          >
                            测试
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() =>
                              setProviderModal({
                                isOpen: true,
                                mode: "edit",
                                data: provider,
                              })
                            }
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            编辑
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() =>
                              handleDeleteProvider(
                                provider.id,
                                provider.displayName
                              )
                            }
                            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "models" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-lg font-semibold text-gray-900">
                  模型列表
                </h2>
                <select
                  value={selectedCategoryId || ""}
                  onChange={(e) => {
                    setSelectedCategoryId(
                      e.target.value ? Number(e.target.value) : null
                    );
                    setSelectedProviderId(null);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">全部分类</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon && <span>{c.icon}</span>} {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedProviderId || ""}
                  onChange={(e) => {
                    setSelectedProviderId(
                      e.target.value ? Number(e.target.value) : null
                    );
                    setSelectedCategoryId(null);
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">全部提供商</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
              </div>
              {canCreate && (
                <button
                  onClick={() =>
                    setModelModal({ isOpen: true, mode: "create", data: null })
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + 新增模型
                </button>
              )}
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : models.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无数据</div>
              ) : (
                models.map((model) => (
                  <div
                    key={model.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {model.displayName}
                          </h3>
                          {getStatusBadge(model.status)}
                          {model.isDefault && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              默认
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-2">
                          <span>模型ID: {model.modelId}</span>
                          {model.version && <span>版本: {model.version}</span>}
                          {model.category && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                              {model.category.icon && (
                                <span>{model.category.icon}</span>
                              )}{" "}
                              {model.category.name}
                            </span>
                          )}
                          {model.baseUrl && (
                            <span
                              className="text-xs text-gray-400 truncate max-w-xs"
                              title={model.baseUrl}
                            >
                              BaseURL: {model.baseUrl}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs mb-2">
                          {model.isFree ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                              免费模型
                            </span>
                          ) : (
                            <>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                输入×{model.inputRatio}
                              </span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">
                                输出×{model.outputRatio}
                              </span>
                              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                最小{model.minInputChars.toLocaleString()}字符
                              </span>
                            </>
                          )}
                        </div>
                        {model.description && (
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            {model.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {canUpdate && (
                          <button
                            onClick={() =>
                              setModelModal({
                                isOpen: true,
                                mode: "edit",
                                data: model,
                              })
                            }
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            编辑
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() =>
                              handleDeleteModel(model.id, model.displayName)
                            }
                            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">模型分类</h2>
              {canCreate && (
                <button
                  onClick={() =>
                    setCategoryModal({
                      isOpen: true,
                      mode: "create",
                      data: null,
                    })
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + 新增分类
                </button>
              )}
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : categories.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无数据</div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {category.icon && (
                            <span className="text-2xl">{category.icon}</span>
                          )}
                          <h3 className="text-lg font-semibold text-gray-900">
                            {category.name}
                          </h3>
                          {category.models && category.models.length > 0 && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {category.models.length} 个模型
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {canUpdate && (
                          <button
                            onClick={() =>
                              setCategoryModal({
                                isOpen: true,
                                mode: "edit",
                                data: category,
                              })
                            }
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            编辑
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() =>
                              handleDeleteCategory(category.id, category.name)
                            }
                            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "apiKeys" && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  API 密钥池
                </h2>
                <select
                  value={selectedProviderId || ""}
                  onChange={(e) =>
                    setSelectedProviderId(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">选择提供商</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
              </div>
              {canCreate && selectedProviderId && (
                <button
                  onClick={() =>
                    setApiKeyModal({ isOpen: true, mode: "create", data: null })
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + 新增密钥
                </button>
              )}
            </div>

            {!selectedProviderId ? (
              <div className="text-center py-8 text-gray-500">
                请先选择一个提供商
              </div>
            ) : loading ? (
              <div className="text-center py-8 text-gray-500">加载中...</div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                该提供商暂无 API 密钥
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <div
                    key={apiKey.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {apiKey.name}
                          </h3>
                          {getStatusBadge(apiKey.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 font-mono">
                          {apiKey.key.substring(0, 10)}...
                          {apiKey.key.substring(apiKey.key.length - 4)}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>权重: {apiKey.weight}</span>
                          <span>优先级: {apiKey.priority}</span>
                          <span>使用: {apiKey.usageCount}次</span>
                          <span>
                            成功率:{" "}
                            {apiKey.usageCount > 0
                              ? Math.round(
                                  (apiKey.successCount / apiKey.usageCount) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {apiKey.status === "error" && (
                          <button
                            onClick={() =>
                              handleRecoverApiKey(apiKey.id, apiKey.name)
                            }
                            className="px-3 py-1.5 text-sm bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition"
                          >
                            恢复
                          </button>
                        )}
                        {canUpdate && (
                          <button
                            onClick={() =>
                              setApiKeyModal({
                                isOpen: true,
                                mode: "edit",
                                data: apiKey,
                              })
                            }
                            className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                          >
                            编辑
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() =>
                              handleDeleteApiKey(apiKey.id, apiKey.name)
                            }
                            className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmColor="red"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {providerModal.isOpen && (
        <ProviderModal
          mode={providerModal.mode}
          data={providerModal.data}
          onClose={() =>
            setProviderModal({ isOpen: false, mode: "create", data: null })
          }
          onSuccess={() => {
            loadProviders();
            setProviderModal({ isOpen: false, mode: "create", data: null });
          }}
        />
      )}

      {modelModal.isOpen && (
        <ModelModal
          mode={modelModal.mode}
          data={modelModal.data}
          providers={providers}
          categories={categories}
          onClose={() =>
            setModelModal({ isOpen: false, mode: "create", data: null })
          }
          onSuccess={() => {
            loadModels();
            setModelModal({ isOpen: false, mode: "create", data: null });
          }}
        />
      )}

      {apiKeyModal.isOpen && (
        <ApiKeyModal
          mode={apiKeyModal.mode}
          data={apiKeyModal.data}
          providerId={selectedProviderId!}
          onClose={() =>
            setApiKeyModal({ isOpen: false, mode: "create", data: null })
          }
          onSuccess={() => {
            loadApiKeys();
            setApiKeyModal({ isOpen: false, mode: "create", data: null });
          }}
        />
      )}

      {categoryModal.isOpen && (
        <CategoryModal
          mode={categoryModal.mode}
          data={categoryModal.data}
          onClose={() =>
            setCategoryModal({ isOpen: false, mode: "create", data: null })
          }
          onSuccess={(mode, data, id) => handleCategorySubmit(mode, data, id)}
        />
      )}
    </div>
  );
}
