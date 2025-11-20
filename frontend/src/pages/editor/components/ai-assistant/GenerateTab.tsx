import React, { useState, useEffect } from "react";
import { Sparkles, Send, Settings } from "lucide-react";
import { ModelConfigModal } from "./ModelConfigModal";
import { PromptSelectionModal } from "./PromptSelectionModal";
import { userPreferencesApi } from "../../../../services/user-preferences.api";
import { aiModelsApi } from "../../../../services/ai-models.api";
import { useToast } from "../../../../contexts/ToastContext";
import type { AIModelBasic } from "../../../../types/ai-model";

interface GenerateTabProps {
  onGenerate: (
    promptId: number,
    input: string,
    modelId: string,
    temperature?: number
  ) => void;
}

/**
 * AI生成Tab
 */
export const GenerateTab: React.FC<GenerateTabProps> = ({ onGenerate }) => {
  const { error: showError } = useToast();
  const [inputValue, setInputValue] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [selectedPromptName, setSelectedPromptName] = useState<string>("");
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<number>(0); // 模型数据库ID
  const [selectedModelName, setSelectedModelName] = useState<string>(""); // 模型显示名称
  const [models, setModels] = useState<AIModelBasic[]>([]); // 模型列表
  const [temperature, setTemperature] = useState(0.7);
  const [historyMessageLimit, setHistoryMessageLimit] = useState(10);
  const [showModelConfig, setShowModelConfig] = useState(false);

  // 加载模型列表
  useEffect(() => {
    const loadModels = async () => {
      try {
        const modelsData = await aiModelsApi.getActiveModels();
        setModels(modelsData);

        // 如果没有选中的模型，使用默认模型
        if (!selectedModel && modelsData.length > 0) {
          const defaultModel =
            modelsData.find((m) => m.isDefault) || modelsData[0];
          setSelectedModel(defaultModel.id);
          setSelectedModelName(defaultModel.displayName);
        } else if (selectedModel && modelsData.length > 0) {
          const model = modelsData.find((m) => m.id === selectedModel);
          if (model) {
            setSelectedModelName(model.displayName);
          }
        }
      } catch (error) {
        console.error("加载模型列表失败:", error);
      }
    };

    loadModels();
  }, []);

  // 加载用户模型偏好设置
  useEffect(() => {
    const loadModelPreference = async () => {
      if (!selectedModel) return;

      try {
        const preference = await userPreferencesApi.getByModel(selectedModel);
        if (preference) {
          setTemperature(preference.temperature);
          // 加载历史消息数量限制
          if (preference.historyMessageLimit !== undefined) {
            setHistoryMessageLimit(preference.historyMessageLimit);
          }
        }
      } catch (error) {
        // 错误已在 API 服务中处理，这里无需额外处理
        console.log("未找到模型偏好设置，使用默认值");
      }
    };

    loadModelPreference();
  }, [selectedModel]);

  const handleGenerate = () => {
    if (!selectedPromptId || !inputValue.trim()) {
      return;
    }

    onGenerate(
      selectedPromptId,
      inputValue,
      selectedModel.toString(),
      temperature
    );
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 生成区域 */}
      <div className="flex-1 flex items-center justify-center text-gray-400 px-6">
        <div className="text-center">
          {/* 图标 */}
          <div className="relative w-32 h-32 mx-auto mb-6">
            <div className="absolute inset-0 bg-purple-50 rounded-full opacity-30"></div>
            <div className="absolute inset-4 bg-purple-50 rounded-full opacity-50"></div>
            <div className="absolute inset-8 bg-purple-50 rounded-full flex items-center justify-center">
              <Sparkles
                className="w-12 h-12 text-purple-400"
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* 提示文字 */}
          <p className="text-sm text-gray-600 leading-relaxed">
            选择提示词，输入生成指令
            <br />
            AI将根据你的要求生成内容
          </p>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200/50 bg-white/50 p-4">
        {/* 功能按钮行 */}
        <div className="flex items-center gap-3 mb-3">
          <button
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="关联内容"
          >
            <span className="text-base">@</span>
            <span>关联内容</span>
            <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center ml-1">
              ?
            </span>
          </button>

          <button
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="添加文件"
          >
            <span className="text-base">📎</span>
            <span>添加文件</span>
            <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs flex items-center justify-center ml-1">
              ?
            </span>
          </button>
        </div>

        {/* 输入框 */}
        <div className="relative mb-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="请输入生成指令，使用@可以快速关联内容"
            className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
            rows={3}
          />

          {/* 发送按钮 */}
          <button
            onClick={handleGenerate}
            disabled={!selectedPromptId || !inputValue.trim()}
            className="absolute right-2 bottom-2 w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
            title="生成"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* 选择提示词和专业模型 */}
        <div className="flex items-center gap-2">
          {/* 选择提示词按钮 */}
          <button
            onClick={() => setShowPromptModal(true)}
            style={{
              backgroundColor: selectedPromptName ? "#eff6ff" : "#ffffff",
              borderColor: selectedPromptName ? "#93c5fd" : "#e5e7eb",
            }}
            className={`flex-1 px-3 py-2 border rounded-lg text-sm text-left transition-all ${
              selectedPromptName
                ? "hover:border-blue-400"
                : "hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles
                className={`w-4 h-4 flex-shrink-0 ${
                  selectedPromptName ? "text-blue-500" : "text-gray-400"
                }`}
              />
              <span
                className={`truncate ${
                  selectedPromptName
                    ? "text-blue-900 font-medium"
                    : "text-gray-500"
                }`}
              >
                {selectedPromptName || "选择提示词"}
              </span>
            </div>
          </button>

          {/* 选择模型按钮 */}
          <button
            onClick={() => setShowModelConfig(true)}
            style={{
              backgroundColor: selectedModelName ? "#eff6ff" : "#ffffff",
              borderColor: selectedModelName ? "#93c5fd" : "#e5e7eb",
            }}
            className={`px-3 py-2 border rounded-lg text-sm transition-all whitespace-nowrap ${
              selectedModelName
                ? "hover:border-blue-400"
                : "hover:border-gray-300"
            }`}
            title="配置AI模型和参数"
          >
            <div className="flex items-center gap-2">
              <Settings
                className={`w-4 h-4 flex-shrink-0 ${
                  selectedModelName ? "text-blue-500" : "text-gray-400"
                }`}
              />
              <span
                className={
                  selectedModelName
                    ? "text-blue-900 font-medium"
                    : "text-gray-500"
                }
              >
                {selectedModelName || "选择模型"}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 提示词选择模态框 */}
      <PromptSelectionModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        selectedPromptId={selectedPromptId}
        onSelect={(prompt) => {
          setSelectedPromptId(prompt.id);
          setSelectedPromptName(prompt.name);
          setShowPromptModal(false);
        }}
      />

      {/* 模型配置模态框 */}
      <ModelConfigModal
        isOpen={showModelConfig}
        onClose={() => setShowModelConfig(false)}
        currentModel={selectedModel}
        currentTemperature={temperature}
        currentHistoryMessageLimit={historyMessageLimit}
        onSave={async (modelId, temp, historyLimit) => {
          try {
            // 保存到后端
            await userPreferencesApi.createOrUpdate({
              modelId: modelId,
              temperature: temp,
              historyMessageLimit: historyLimit,
            });

            // 更新本地状态
            setSelectedModel(modelId);
            setTemperature(temp);
            setHistoryMessageLimit(historyLimit);

            // 更新模型显示名称
            const model = models.find((m) => m.id === modelId);
            if (model) {
              setSelectedModelName(model.displayName);
            }
          } catch (error) {
            console.error("保存模型配置失败:", error);
            showError("保存模型配置失败");
          }
        }}
      />
    </div>
  );
};
