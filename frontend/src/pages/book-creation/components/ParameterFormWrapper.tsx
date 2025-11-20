import React, { useState, useEffect } from "react";
import { FileText, ArrowLeft } from "lucide-react";
import { promptsApi } from "../../../services/prompts.api";
import { ParameterInput } from "../../editor/components/ai-assistant/ParameterInput";
import type { Prompt, PromptParameter } from "../../../types/prompt";

interface ParameterFormWrapperProps {
  promptId: number;
  onSubmit: (parameters: Record<string, any>) => void;
  onBack?: () => void;
}

/**
 * 参数填写表单包装器
 * 使用完善的 ParameterInput 组件
 */
const ParameterFormWrapper: React.FC<ParameterFormWrapperProps> = ({
  promptId,
  onSubmit,
  onBack,
}) => {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [parameters, setParameters] = useState<PromptParameter[]>([]);
  const [promptParameters, setPromptParameters] = useState<Record<string, any>>(
    {}
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPromptDetails();
  }, [promptId]);

  const loadPromptDetails = async () => {
    try {
      setLoading(true);
      // 使用 getPromptConfig 获取提示词配置（包含参数信息）
      const promptData = await promptsApi.getPromptConfig(promptId);
      setPrompt(promptData);

      // 提取所有参数
      const allParams: PromptParameter[] = [];

      // 方式1：从 parameters 字段直接获取（内容不公开时）
      if ((promptData as any).parameters?.length > 0) {
        (promptData as any).parameters.forEach((param: PromptParameter) => {
          if (!allParams.find((p) => p.name === param.name)) {
            allParams.push(param);
          }
        });
      }

      // 方式2：从 contents 中提取（内容公开时）
      if (promptData.contents) {
        promptData.contents.forEach((content: any) => {
          if (content.parameters) {
            content.parameters.forEach((param: PromptParameter) => {
              // 避免重复参数
              if (!allParams.find((p) => p.name === param.name)) {
                allParams.push(param);
              }
            });
          }
        });
      }

      setParameters(allParams);

      // 初始化默认值
      const initialValues: Record<string, any> = {};
      allParams.forEach((param) => {
        initialValues[param.name] = "";
      });
      setPromptParameters(initialValues);
    } catch (err) {
      console.error("Failed to load prompt details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 验证必填参数
    for (const param of parameters) {
      if (param.required && !promptParameters[param.name]?.trim()) {
        alert(`请填写必填参数：${param.name}`);
        return;
      }
    }

    onSubmit(promptParameters);
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="text-center py-8">
          <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">加载参数中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          填写创作参数
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          为 <span className="font-medium text-purple-600">{prompt?.name}</span>{" "}
          填写所需参数
        </p>
      </div>

      {parameters.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
          <p className="text-yellow-800 text-center">
            💡 此提示词没有参数，可以直接创建任务
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 参数提示 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-blue-800 text-sm">
              💡 <strong>提示：</strong>
              详细的参数能帮助AI生成更符合您期望的内容
            </p>
          </div>

          {/* 参数列表 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              参数配置
            </h3>
            <div className="space-y-4">
              {parameters.map((param) => (
                <div key={param.name}>
                  <ParameterInput
                    paramName={param.name}
                    value={promptParameters[param.name] || ""}
                    onChange={(value) =>
                      setPromptParameters({
                        ...promptParameters,
                        [param.name]: value,
                      })
                    }
                    placeholder={param.description || `请输入${param.name}`}
                    required={param.required}
                    description={param.description}
                    // 一键成书不需要这些资源，传空数组
                    characters={[]}
                    worldSettings={[]}
                    memos={[]}
                    chapters={[]}
                    volumes={[]}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                返回上一步
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              创建任务并开始生成
            </button>
          </div>
        </form>
      )}

      {parameters.length === 0 && (
        <div className="flex gap-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              返回上一步
            </button>
          )}
          <button
            onClick={() => onSubmit({})}
            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
          >
            创建任务并开始生成
          </button>
        </div>
      )}
    </div>
  );
};

export default ParameterFormWrapper;
