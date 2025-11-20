import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  createModel,
  updateModel,
  getAvailableModels,
  getCategoryList,
  testModelConnection,
} from "../../api/ai-models";
import type {
  AiModel,
  AiProvider,
  ModelCategory,
  CreateModelDto,
  UpdateModelDto,
} from "../../types/ai-model";
import { ModelStatus } from "../../types/ai-model";
import { showToast } from "../../components/common/ToastContainer";

// 模型状态中文映射
const STATUS_LABELS: Record<ModelStatus, string> = {
  [ModelStatus.ACTIVE]: "激活",
  [ModelStatus.INACTIVE]: "未激活",
  [ModelStatus.DEPRECATED]: "已弃用",
};

// 模型信息接口（从API获取的模型元数据）
interface ModelInfo {
  id: string;
  displayName: string;
  contextWindow?: number;
  maxOutputTokens?: number;
  pricing?: {
    inputTokenPrice: number;
    outputTokenPrice: number;
    currency: string;
  };
  supportsStreaming?: boolean;
  supportsTools?: boolean;
  supportsVision?: boolean;
  features?: string[];
}

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

const SectionCard = ({
  title,
  description,
  action,
  children,
}: SectionCardProps) => (
  <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
    {children}
  </section>
);

export function ModelModal({
  mode,
  data,
  providers,
  categories: initialCategories = [],
  onClose,
  onSuccess,
}: {
  mode: "create" | "edit";
  data: AiModel | null;
  providers: AiProvider[];
  categories?: ModelCategory[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<any>({
    modelId: data?.modelId || "",
    displayName: data?.displayName || "",
    description: data?.description || "",
    status: data?.status || ModelStatus.ACTIVE,
    providerId: data?.providerId || providers[0]?.id || 0,
    version: data?.version || "",
    // 统一配置
    contextWindow: data?.contextWindow || 2000000,
    maxOutputTokens: data?.maxOutputTokens || 65533,
    pricing: data?.pricing || {
      inputTokenPrice: 0,
      outputTokenPrice: 0,
      currency: "USD",
    },
    limits: data?.limits || {
      maxInputTokens: undefined,
      maxOutputTokens: undefined,
      rateLimit: {
        requestsPerMinute: undefined,
        tokensPerMinute: undefined,
      },
    },
    features: data?.features || [],
    supportsStreaming: data?.supportsStreaming ?? true,
    supportsTools: data?.supportsTools ?? false,
    supportsVision: data?.supportsVision ?? false,
    isDefault: data?.isDefault || false,
    order: data?.order || 0,
    // 新增字段
    inputRatio: data?.inputRatio || 1.0,
    outputRatio: data?.outputRatio || 1.0,
    isFree: data?.isFree || false,
    minInputChars: data?.minInputChars || 10000,
    categoryId: data?.categoryId || undefined,
    baseUrl: data?.baseUrl || "",
    apiKey: data?.apiKey || "",
  });
  const [loading, setLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [manualInput, setManualInput] = useState(false); // 是否手动输入模型ID
  const [categories, setCategories] =
    useState<ModelCategory[]>(initialCategories);
  const [testingConnection, setTestingConnection] = useState(false);
  const canTestConnection = Boolean(formData.providerId && formData.modelId);

  // 加载分类列表
  useEffect(() => {
    if (initialCategories.length > 0) {
      setCategories(initialCategories);
      return;
    }
    const fetchCategories = async () => {
      try {
        const data = await getCategoryList();
        setCategories(data);
      } catch (error) {
        console.error("获取分类列表失败:", error);
      }
    };
    fetchCategories();
  }, [initialCategories]);

  // 当选择的提供商变化时，获取可用模型列表
  useEffect(() => {
    const fetchAvailableModels = async () => {
      if (!formData.providerId) return;

      setLoadingModels(true);
      try {
        const models = await getAvailableModels(formData.providerId);
        setAvailableModels(models);
      } catch (error: any) {
        console.error("获取可用模型失败:", error);
        showToast(error.message || "获取可用模型列表失败", "error");
        setAvailableModels([]);
      } finally {
        setLoadingModels(false);
      }
    };

    fetchAvailableModels();
  }, [formData.providerId]);

  // 当选择模型ID时，自动填充配置（使用统一默认值）
  const handleModelSelect = (modelId: string) => {
    const selectedModel = availableModels.find((m) => m.id === modelId);
    if (selectedModel) {
      setFormData({
        ...formData,
        modelId: selectedModel.id,
        displayName: selectedModel.displayName,
        // 统一配置
        contextWindow: 2000000,
        maxOutputTokens: 65533,
        pricing: {
          inputTokenPrice: 0,
          outputTokenPrice: 0,
          currency: "USD",
        },
        supportsStreaming: true,
        supportsTools: selectedModel.supportsTools ?? false,
        supportsVision: selectedModel.supportsVision ?? false,
        features: selectedModel.features || [],
      });
    } else {
      setFormData({ ...formData, modelId });
    }
  };

  const handleTestConnection = async () => {
    if (!formData.modelId) {
      showToast("请先选择模型 ID", "error");
      return;
    }
    if (!formData.providerId) {
      showToast("请选择提供商", "error");
      return;
    }
    setTestingConnection(true);
    try {
      const result = await testModelConnection({
        providerId: formData.providerId,
        modelId: formData.modelId,
        baseUrl: formData.baseUrl || undefined,
        apiKey: formData.apiKey || undefined,
      });
      showToast(
        result.message || "连接成功",
        result.success ? "success" : "error"
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message || error.message || "测试失败";
      showToast(message, "error");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 清理提交数据，只保留必要字段
      const submitData = {
        modelId: formData.modelId,
        displayName: formData.displayName,
        description: formData.description,
        status: formData.status,
        providerId: formData.providerId,
        version: formData.version,
        contextWindow: formData.contextWindow,
        maxOutputTokens: formData.maxOutputTokens,
        features: formData.features,
        supportsStreaming: formData.supportsStreaming,
        supportsTools: formData.supportsTools,
        supportsVision: formData.supportsVision,
        isDefault: formData.isDefault,
        order: formData.order,
        inputRatio: formData.inputRatio,
        outputRatio: formData.outputRatio,
        isFree: formData.isFree,
        minInputChars: formData.minInputChars,
        categoryId: formData.categoryId || undefined,
        baseUrl: formData.baseUrl || undefined,
        apiKey: formData.apiKey || undefined,
      };

      if (mode === "create") {
        await createModel(submitData as CreateModelDto);
        showToast("创建成功", "success");
      } else {
        await updateModel(data!.id, submitData as UpdateModelDto);
        showToast("更新成功", "success");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      showToast(error.message || "操作失败", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === "create" ? "新增模型" : "编辑模型"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            配置 AI 模型的详细参数和能力
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1 bg-gray-50">
            <SectionCard
              title="基本信息"
              description="配置模型 ID、展示名称与描述信息"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    模型 ID <span className="text-red-500">*</span>
                  </label>
                  {mode === "create" ? (
                    <>
                      <div className="flex gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => {
                            setManualInput(false);
                            setFormData({ ...formData, modelId: "" });
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            !manualInput
                              ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                              : "bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          📋 从列表选择
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setManualInput(true);
                            setFormData({ ...formData, modelId: "" });
                          }}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            manualInput
                              ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                              : "bg-gray-100 text-gray-600 border-2 border-gray-200 hover:bg-gray-200"
                          }`}
                        >
                          ✏️ 手动输入
                        </button>
                      </div>
                      {manualInput ? (
                        <input
                          type="text"
                          required
                          value={formData.modelId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              modelId: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                          placeholder="例如：gpt-4-turbo-preview"
                        />
                      ) : (
                        <select
                          required
                          value={formData.modelId}
                          onChange={(e) => handleModelSelect(e.target.value)}
                          disabled={loadingModels}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white font-mono text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {loadingModels
                              ? "正在加载模型列表..."
                              : "请选择模型"}
                          </option>
                          {availableModels.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.id} - {model.displayName}
                            </option>
                          ))}
                        </select>
                      )}
                      <p className="text-xs text-gray-500 mt-1.5">
                        {manualInput ? (
                          <>💡 手动输入模型ID（适用于API列表中没有的模型）</>
                        ) : (
                          <>💡 从API获取的模型列表中选择，会自动填充配置</>
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 font-mono text-sm text-gray-600">
                        {formData.modelId}
                      </div>
                      <p className="text-xs text-gray-500 mt-1.5">
                        💡 模型ID创建后不可修改
                      </p>
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    显示名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="可自定义，如：GPT-4 Turbo (企业版)"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    💡 用户界面显示的名称，选择模型后会自动填充，可修改
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                  rows={2}
                  placeholder="例如：最新一代GPT-4模型，支持128K上下文窗口，具备视觉和工具调用能力"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  💡 简要描述模型的特点和用途
                </p>
              </div>
            </SectionCard>

            <SectionCard
              title="连接与提供商"
              description="选择所属提供商并可覆盖 API Base URL / Key"
              action={
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={!canTestConnection || testingConnection}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                    !canTestConnection || testingConnection
                      ? "border-gray-200 text-gray-400 cursor-not-allowed"
                      : "border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  {testingConnection ? "测试中..." : "测试 API"}
                </button>
              }
            >
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    提供商 <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.providerId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        providerId: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.displayName}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">
                    💡 选择这个模型属于哪个AI提供商
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    状态
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as ModelStatus,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                  >
                    {Object.values(ModelStatus).map((status) => (
                      <option key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">
                    💡 激活=可用、未激活=暂停、已弃用=过时
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    版本
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) =>
                      setFormData({ ...formData, version: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="例如：2024-01、20240229"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    💡 模型的版本号（可选），用于区分不同版本
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    分类
                  </label>
                  <select
                    value={formData.categoryId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categoryId: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  >
                    <option value="">无分类</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon && <span>{category.icon}</span>}{" "}
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1.5">
                    💡 将模型分配到指定分类（可选）
                  </p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={formData.baseUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, baseUrl: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="例如：https://api.openai.com/v1"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    💡 模型的API Base URL（可选），如果不填则使用提供商的配置
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="例如：sk-xxx（留空则使用提供商配置）"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    💡 模型的API Key（可选），如果不填则使用提供商的配置
                  </p>
                </div>
              </div>
            </SectionCard>

            {formData.modelId && (
              <SectionCard
                title="✨ 模型能力"
                description="根据已选择模型自动识别的能力标签"
              >
                <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium">
                      流式输出
                    </span>
                    {formData.supportsTools && (
                      <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                        工具调用
                      </span>
                    )}
                    {formData.supportsVision && (
                      <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                        视觉输入
                      </span>
                    )}
                    {formData.features?.map((f: string) => (
                      <span
                        key={f}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-medium"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </SectionCard>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <SectionCard title="💰 计费设置" description="配置倍率与免费策略">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      输入倍率 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.inputRatio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          inputRatio: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="1.0"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      💡 输入字数的计费倍率（1.0 表示正常消耗）
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      输出倍率 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.outputRatio}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          outputRatio: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="1.0"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      💡 输出字数的计费倍率（1.0 表示正常消耗）
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      最小输入字符数 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.minInputChars}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minInputChars: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="10000"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      💡 单次请求最小消耗字符数（不足按此计算）
                    </p>
                  </div>
                </div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isFree}
                    onChange={(e) =>
                      setFormData({ ...formData, isFree: e.target.checked })
                    }
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-semibold text-gray-700">
                      免费模型
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      不消耗用户字数余额
                    </p>
                  </div>
                </label>
              </SectionCard>

              <SectionCard
                title="⚙️ 其他设置"
                description="排序、默认模型等高级选项"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      排序
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          order: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      💡 数字越小越靠前，用于控制列表显示顺序
                    </p>
                  </div>
                  <label className="flex items-center sm:items-start sm:justify-start">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isDefault: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mt-0.5"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-semibold text-gray-700">
                        设为默认模型
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        新对话默认使用此模型
                      </p>
                    </div>
                  </label>
                </div>
              </SectionCard>
            </div>
          </div>

          {/* 固定在底部的按钮 */}
          <div className="px-8 py-5 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:border-gray-400 font-medium transition-all"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-medium shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "提交中..." : "确定"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
