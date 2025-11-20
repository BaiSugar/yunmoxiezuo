import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Settings,
  Coins,
  Zap,
  TrendingUp,
  TrendingDown,
  Gift,
} from "lucide-react";
import { aiModelsApi } from "../../../../services/ai-models.api";
import { useToast } from "../../../../contexts/ToastContext";
import { useAuth } from "../../../../contexts/AuthContext";
import type { AIModelBasic } from "../../../../types/ai-model";
import { tokenBalancesApi } from "../../../../services/token-balances.api";
import { userPreferencesApi } from "../../../../services/user-preferences.api";

interface ModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: number; // 模型数据库ID
  currentTemperature: number;
  currentHistoryMessageLimit: number;
  onSave: (
    modelId: number,
    temperature: number,
    historyMessageLimit: number
  ) => void;
}

/**
 * AI模型配置模态框
 */
const FALLBACK_CATEGORY_NAME = "未分类";

type CategoryGrouping = {
  models: AIModelBasic[];
  meta: {
    icon?: string;
    description?: string;
    order: number;
  };
};

export const ModelConfigModal: React.FC<ModelConfigModalProps> = ({
  isOpen,
  onClose,
  currentModel,
  currentTemperature,
  currentHistoryMessageLimit,
  onSave,
}) => {
  const { error: showError } = useToast();
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState(currentModel);
  const [temperature, setTemperature] = useState(currentTemperature || 0.7);
  const [historyMessageLimit, setHistoryMessageLimit] = useState(
    currentHistoryMessageLimit || 10
  );
  const [models, setModels] = useState<AIModelBasic[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(""); // 选中的模型分类
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<any>(null);
  const [dailyQuota, setDailyQuota] = useState<any>(null);

  // 加载活跃的 AI 模型列表和余额信息
  useEffect(() => {
    const loadData = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        // 加载模型列表
        const modelsData = await aiModelsApi.getActiveModels();
        setModels(modelsData);

        // 如果没有选中的模型，使用默认模型
        if (!currentModel && modelsData.length > 0) {
          const defaultModel =
            modelsData.find((m) => m.isDefault) || modelsData[0];
          setSelectedModel(defaultModel.id);
        }

        // 加载余额信息
        try {
          const balanceData = await tokenBalancesApi.getBalance();
          setBalance(balanceData);

          const quotaData = await tokenBalancesApi.getDailyQuota();
          setDailyQuota(quotaData);
        } catch (err) {
          console.log("加载余额信息失败（可能是未登录）");
        }
      } catch (error) {
        console.error("加载模型列表失败:", error);
        showError("加载模型列表失败");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, showError, currentModel]);

  // 当模态框打开时，初始化选中的模型
  useEffect(() => {
    if (isOpen) {
      setSelectedModel(currentModel);
    }
  }, [currentModel, isOpen]);

  const modelsByCategory = useMemo(() => {
    return models.reduce((acc, model) => {
      const categoryName = model.categoryName || FALLBACK_CATEGORY_NAME;
      if (!acc[categoryName]) {
        acc[categoryName] = {
          models: [],
          meta: {
            icon: model.categoryIcon,
            description: model.categoryDescription,
            order: model.categoryOrder ?? 999,
          },
        };
      }
      acc[categoryName].models.push(model);
      return acc;
    }, {} as Record<string, CategoryGrouping>);
  }, [models]);

  const categories = useMemo(() => {
    return Object.entries(modelsByCategory)
      .map(([name, { meta }]) => ({
        name,
        icon: meta.icon,
        description: meta.description,
        order: meta.order,
      }))
      .sort((a, b) => {
        const orderA = Number.isFinite(a.order) ? (a.order as number) : 999;
        const orderB = Number.isFinite(b.order) ? (b.order as number) : 999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return a.name.localeCompare(b.name);
      });
  }, [modelsByCategory]);

  // 当模型数据加载后，自动选择第一个分类
  useEffect(() => {
    if (categories.length === 0) {
      setSelectedCategory("");
      return;
    }

    if (!selectedCategory || !modelsByCategory[selectedCategory]) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, modelsByCategory, selectedCategory]);

  // 监控 temperature 变化
  useEffect(() => {
    console.log("🌡️ Temperature 状态变化：", temperature);
  }, [temperature]);

  // 当选中的模型变化时，加载用户对该模型的偏好设置
  useEffect(() => {
    const loadPreference = async () => {
      if (!selectedModel || !user || !isOpen) {
        console.log(
          "跳过加载偏好：selectedModel=",
          selectedModel,
          "user=",
          !!user,
          "isOpen=",
          isOpen
        );
        return;
      }

      console.log("开始加载模型偏好，modelId=", selectedModel);

      try {
        const preference = await userPreferencesApi.getByModel(selectedModel);
        if (preference) {
          console.log("✅ 成功加载用户模型偏好：", preference);
          // 确保转换为数字类型
          const temp =
            typeof preference.temperature === "string"
              ? parseFloat(preference.temperature)
              : preference.temperature;
          console.log("设置温度为：", temp, "(类型:", typeof temp, ")");
          setTemperature(temp);
        } else {
          console.log(
            "⚠️ 未找到偏好设置，使用默认值：",
            currentTemperature || 0.7
          );
          setTemperature(currentTemperature || 0.7);
        }
      } catch (error) {
        console.error("❌ 加载模型偏好失败：", error);
        setTemperature(currentTemperature || 0.7);
      }
    };

    loadPreference();
  }, [selectedModel, user, isOpen, currentTemperature]);

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 选中分类的模型
  const currentCategoryModels = selectedCategory
    ? modelsByCategory[selectedCategory]?.models || []
    : [];

  const handleSave = async () => {
    try {
      // 保存用户模型偏好设置到后端
      if (user) {
        await userPreferencesApi.createOrUpdate({
          modelId: selectedModel, // 使用数据库ID
          temperature: temperature,
          historyMessageLimit: historyMessageLimit,
        });
        console.log("用户模型偏好已保存到后端");
      }

      // 调用父组件的回调
      onSave(selectedModel, temperature, historyMessageLimit);
      onClose();
    } catch (error) {
      console.error("保存模型偏好失败:", error);
      showError("保存配置失败");
    }
  };

  // 计算是否有变更
  const hasChanges =
    selectedModel !== currentModel ||
    temperature !== (currentTemperature || 0.7) ||
    historyMessageLimit !== (currentHistoryMessageLimit || 10);

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md md:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">AI模型配置</h3>
                <p className="text-xs text-gray-500">选择模型并调整参数</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 余额信息卡片 */}
          {balance && (
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Coins className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    可用余额
                  </span>
                </div>
                <span className="text-base sm:text-lg font-bold text-blue-600 whitespace-nowrap">
                  {(
                    balance.totalTokens - balance.frozenTokens
                  ).toLocaleString()}{" "}
                  字
                </span>
              </div>

              {dailyQuota && dailyQuota.dailyFreeQuota > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 pt-2 border-t border-blue-200">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="text-xs text-gray-600">今日免费额度</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-purple-600 pl-6 sm:pl-0">
                    剩余 {dailyQuota.dailyRemainingQuota.toLocaleString()} /{" "}
                    {dailyQuota.dailyFreeQuota.toLocaleString()} 字
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 内容 */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* 模型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center justify-between">
                <span>选择AI模型</span>
                <span className="text-xs text-gray-500 font-normal">
                  共 {models.length} 个可用模型
                </span>
              </div>
            </label>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-2">加载中...</p>
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无可用模型</div>
            ) : (
              <div className="flex flex-col md:flex-row gap-4">
                {/* 模型分类列表 - PC/平板：左侧垂直，手机：顶部横向 */}
                <div className="md:w-40 flex-shrink-0">
                  {/* 手机端：横向滚动 */}
                  <div className="md:hidden flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    {categories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                          selectedCategory === category.name
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {category.icon && <span>{category.icon}</span>}
                          <span>{category.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* PC/平板：垂直列表 */}
                  <div className="hidden md:block space-y-1 max-h-96 overflow-y-auto">
                    {categories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => setSelectedCategory(category.name)}
                        className={`w-full px-4 py-2.5 text-left rounded-lg transition-all flex items-center justify-between group ${
                          selectedCategory === category.name
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-sm font-medium truncate flex items-center gap-2">
                          {category.icon && <span>{category.icon}</span>}
                          <span>{category.name}</span>
                        </span>
                        {selectedCategory === category.name && (
                          <svg
                            className="w-4 h-4 text-white flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 模型列表 */}
                <div className="flex-1 space-y-2 overflow-y-auto pr-1 max-h-[60vh] md:max-h-96">
                  {currentCategoryModels.map((model) => {
                    const isFree = model.isFree || false;
                    const inputRatio = model.inputRatio || 1.0;
                    const outputRatio = model.outputRatio || 1.0;

                    return (
                      <button
                        key={model.id}
                        onClick={() => setSelectedModel(model.id)}
                        className={`w-full p-3 sm:p-4 text-left rounded-xl border-2 transition-all group ${
                          selectedModel === model.id
                            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md"
                            : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                                {model.displayName}
                              </span>
                              {isFree && (
                                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  <Zap className="w-3 h-3" />
                                  免费
                                </span>
                              )}
                              {model.isDefault && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  推荐
                                </span>
                              )}
                            </div>
                            {!isFree && (
                              <div className="flex flex-wrap gap-2 text-xs mt-2">
                                <div className="flex items-center gap-1 text-amber-600">
                                  <TrendingUp className="w-3 h-3" />
                                  输入 {inputRatio}x
                                </div>
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <TrendingDown className="w-3 h-3" />
                                  输出 {outputRatio}x
                                </div>
                              </div>
                            )}
                            {model.description && (
                              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                {model.description}
                              </p>
                            )}
                          </div>
                          {selectedModel === model.id && (
                            <div className="flex-shrink-0">
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 温度设置 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center justify-between">
                <span>温度参数</span>
                <span className="text-lg font-bold text-blue-600">
                  {Number(temperature || 0.7).toFixed(1)}
                </span>
              </div>
              <span className="text-xs font-normal text-gray-500">
                控制AI回答的随机性和创造性
              </span>
            </label>

            {/* 温度滑块 */}
            <div className="relative pt-2 pb-4">
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(147 51 234) ${
                    temperature * 50
                  }%, rgb(229 231 235) ${
                    temperature * 50
                  }%, rgb(229 231 235) 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  精确
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  平衡
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  创意
                </span>
              </div>
            </div>

            {/* 温度说明 */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-600 space-y-1">
                {temperature <= 0.5 && (
                  <p>
                    🎯 <strong>精确模式</strong>
                    ：适合代码生成、逻辑推理等需要准确性的任务
                  </p>
                )}
                {temperature > 0.5 && temperature <= 1.0 && (
                  <p>
                    ⚖️ <strong>平衡模式</strong>
                    ：适合日常对话、内容生成等通用场景
                  </p>
                )}
                {temperature > 1.0 && temperature <= 1.5 && (
                  <p>
                    🎨 <strong>创意模式</strong>
                    ：适合创作故事、头脑风暴等需要想象力的任务
                  </p>
                )}
                {temperature > 1.5 && (
                  <p>
                    🚀 <strong>疯狂模式</strong>：极高创造性，结果可能不可预测
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 历史消息数量限制设置 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center justify-between">
                <span>关联对话数量</span>
                <span className="text-lg font-bold text-blue-600">
                  {historyMessageLimit === 0
                    ? "不限"
                    : `${historyMessageLimit} 条`}
                </span>
              </div>
              <span className="text-xs font-normal text-gray-500">
                AI 生成时保留的最近对话轮数（1轮=1问+1答）
              </span>
            </label>

            {/* 数量滑块 */}
            <div className="relative pt-2 pb-4">
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={historyMessageLimit}
                onChange={(e) => setHistoryMessageLimit(Number(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-green-200 to-blue-200 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, rgb(34 197 94) 0%, rgb(59 130 246) ${
                    historyMessageLimit * 5
                  }%, rgb(229 231 235) ${
                    historyMessageLimit * 5
                  }%, rgb(229 231 235) 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                <span>0</span>
                <span>10</span>
                <span>20</span>
              </div>
            </div>

            {/* 说明 */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="text-xs text-blue-700 space-y-2">
                <p className="flex items-start gap-2">
                  <span>💡</span>
                  <span>
                    <strong>为什么要限制？</strong>
                    历史对话太多会干扰 AI
                    理解最新指令。例如：你之前用提示词生成了3个100字物品，现在换成生成2个，但
                    AI 看到历史示例都是"1个1个地生成"，就会忽略新指令。
                  </span>
                </p>
                <p className="flex items-start gap-2">
                  <span>📊</span>
                  <span>
                    <strong>建议设置：</strong>
                    切换提示词或参数后，建议保留 2-5
                    轮对话，避免旧模式影响新生成。设置为 0
                    则不限制（可能导致上述问题）。
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 底部操作按钮 */}
        <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                hasChanges
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {hasChanges ? "保存配置" : "无变更"}
            </button>
          </div>
          {hasChanges && (
            <p className="text-xs text-center text-gray-500 mt-2">
              配置将立即生效
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
