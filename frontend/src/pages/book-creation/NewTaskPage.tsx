import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wand2,
  ArrowLeft,
  Settings,
  PackageOpen,
  FileText,
  Cpu,
} from "lucide-react";
import { bookCreationApi } from "../../services/book-creation.api";
import promptGroupApi from "../../services/prompt-groups.api";
import { userPreferencesApi } from "../../services/user-preferences.api";
import { aiModelsApi } from "../../services/ai-models.api";
import type { TaskConfig } from "../../types/book-creation";
import type { PromptGroup } from "../../types/prompt-group";
import type { AIModelBasic } from "../../types/ai-model";
import { useToast } from "../../contexts/ToastContext";
import { PromptSelectionModal } from "../editor/components/ai-assistant/PromptSelectionModal";
import { ModelConfigModal } from "../editor/components/ai-assistant/ModelConfigModal";
import ParameterFormWrapper from "./components/ParameterFormWrapper";
import type { Prompt } from "../../types/prompt";

type PromptSourceType = "group" | "single";
type CreateStep = "select_mode" | "select_prompt" | "fill_parameters";

/**
 * 创建成书任务页
 */
const NewTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [autoExecute, setAutoExecute] = useState(true); // 默认勾选，创建后立即执行
  const [promptSource, setPromptSource] = useState<PromptSourceType>("group"); // 提示词来源（优先使用提示词组）
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [promptGroups, setPromptGroups] = useState<PromptGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [showTaskConfig, setShowTaskConfig] = useState(false);
  const [taskConfig, setTaskConfig] = useState<TaskConfig>({
    enableReview: true,
    concurrencyLimit: 5,
  });
  const [loading, setLoading] = useState(false);

  // AI模型配置相关状态
  const [showModelConfig, setShowModelConfig] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [historyMessageLimit, setHistoryMessageLimit] = useState<number>(10);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [currentModelInfo, setCurrentModelInfo] = useState<AIModelBasic | null>(
    null
  );

  // 提示词组参数相关状态
  const [groupParameters, setGroupParameters] = useState<any[]>([]);
  const [loadingParameters, setLoadingParameters] = useState(false);
  const [groupParameterValues, setGroupParameterValues] = useState<
    Record<string, any>
  >({});

  // 单个提示词模式的步骤控制
  const [currentStep, setCurrentStep] = useState<CreateStep>("select_mode");
  const [selectedIdeaPromptId, setSelectedIdeaPromptId] = useState<
    number | null
  >(null);
  // 使用 ref 保存同步标志，避免状态更新的异步问题
  const promptSelectionCompletedRef = useRef(false);

  // 加载用户偏好设置（页面加载时自动获取）
  useEffect(() => {
    loadUserPreferences();
  }, []);

  // 加载提示词组列表
  useEffect(() => {
    if (promptSource === "group") {
      loadPromptGroups();
    }
  }, [promptSource]);

  // 当选择提示词组后，加载参数
  useEffect(() => {
    if (selectedGroupId) {
      loadGroupParameters();
    } else {
      setGroupParameters([]);
      setGroupParameterValues({});
    }
  }, [selectedGroupId]);

  // 加载用户偏好设置
  const loadUserPreferences = async () => {
    try {
      setLoadingPreferences(true);
      const preferences = await userPreferencesApi.getAll();

      console.log("📥 [NewTaskPage] 从后端获取的配置：", preferences);

      if (preferences && preferences.length > 0) {
        // 现在只会返回一个配置（最新保存的）
        const preference = preferences[0];

        console.log(
          "🎯 [NewTaskPage] 加载配置：模型ID=" +
            preference.modelId +
            ", 温度=" +
            preference.temperature
        );

        // 设置模型配置
        setSelectedModelId(preference.modelId);
        setTemperature(preference.temperature);
        setHistoryMessageLimit(preference.historyMessageLimit || 10);

        // 加载模型信息
        const models = await aiModelsApi.getActiveModels();
        const modelInfo = models.find((m) => m.id === preference.modelId);
        if (modelInfo) {
          setCurrentModelInfo(modelInfo);
          console.log("✅ [NewTaskPage] 加载的模型：" + modelInfo.displayName);
        }
      } else {
        console.log("⚠️ 用户没有保存的偏好设置，需要手动配置");
      }
    } catch (err: any) {
      console.error("加载用户偏好设置失败:", err);
      // 不显示错误提示，用户可以手动配置
    } finally {
      setLoadingPreferences(false);
    }
  };

  const handleModelConfigSave = async (
    modelId: number,
    temp: number,
    historyLimit: number
  ) => {
    try {
      // 1. 保存到后端
      console.log("[NewTaskPage] 保存模型配置到后端:", {
        modelId,
        temp,
        historyLimit,
      });
      await userPreferencesApi.createOrUpdate({
        modelId,
        temperature: temp,
        historyMessageLimit: historyLimit,
      });

      console.log("[NewTaskPage] ✓ 模型配置已保存到后端");
      success("保存成功", "AI模型配置已保存");

      // 2. 更新本地状态
      setSelectedModelId(modelId);
      setTemperature(temp);
      setHistoryMessageLimit(historyLimit);

      // 3. 重新加载模型信息
      const models = await aiModelsApi.getActiveModels();
      const modelInfo = models.find((m) => m.id === modelId);
      if (modelInfo) {
        setCurrentModelInfo(modelInfo);
      }
    } catch (err: any) {
      console.error("保存模型配置失败:", err);
      error("保存失败", err.response?.data?.message || "保存模型配置失败");
    }
  };

  const loadGroupParameters = async () => {
    if (!selectedGroupId) return;

    try {
      setLoadingParameters(true);
      const response = await promptGroupApi.getParameters(selectedGroupId);

      // 系统预定义参数列表（这些参数由系统自动提供，不需要用户填写）
      const systemParameters = [
        "脑洞内容",
        "脑洞",
        "原始脑洞",
        "书名",
        "简介",
        "主大纲",
        "主大纲节点标题",
        "主大纲节点内容",
        "卷标题",
        "卷描述",
        "原始卷纲",
        "章节标题",
        "章节梗概",
        "章节大纲",
        "原始章节大纲",
        "前面章节的梗概",
        "前文梗概",
        "人物卡列表",
        "人物卡",
        "角色列表",
        "世界观列表",
        "世界观",
        "世界设定",
        "章节正文",
        "审稿报告",
        "审稿报告JSON",
        "用户反馈",
        "原始主大纲",
      ];

      // 过滤掉系统参数，只保留用户自定义参数
      const userParameters = response.parameters.filter(
        (param: any) => !systemParameters.includes(param.name)
      );

      // 调试日志
      console.log("=== 提示词组参数调试信息 ===");
      console.log("提示词组ID:", selectedGroupId);
      console.log("全部参数:", response.parameters);
      console.log(
        "系统参数（已过滤）:",
        response.parameters.filter((p: any) =>
          systemParameters.includes(p.name)
        )
      );
      console.log("用户参数（需要填写）:", userParameters);
      console.log("用户参数数量:", userParameters.length);

      setGroupParameters(userParameters);

      // 初始化参数默认值
      const initialValues: Record<string, any> = {};
      userParameters.forEach((param) => {
        initialValues[param.name] = "";
      });
      setGroupParameterValues(initialValues);
    } catch (err: any) {
      console.error("加载参数失败:", err);
      error("加载失败", err.response?.data?.message || "加载提示词组参数失败");
    } finally {
      setLoadingParameters(false);
    }
  };

  const loadPromptGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await promptGroupApi.getAll({
        isPublic: true,
        status: "published" as any,
        sortBy: "hotValue",
        sortOrder: "DESC",
        pageSize: 50,
      });
      setPromptGroups(response.data);
    } catch (err: any) {
      error("加载失败", err.response?.data?.message || "加载提示词组失败");
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleStartCreation = () => {
    // 验证AI模型
    if (!selectedModelId || selectedModelId === 0) {
      error("输入错误", "请先配置AI模型");
      return;
    }

    // 验证提示词来源
    if (promptSource === "group" && !selectedGroupId) {
      error("输入错误", "请选择一个提示词组");
      return;
    }

    // 验证提示词组参数
    if (promptSource === "group" && groupParameters.length > 0) {
      const missingParams = groupParameters.filter(
        (param) => param.required && !groupParameterValues[param.name]
      );
      if (missingParams.length > 0) {
        error(
          "输入错误",
          `请填写必填参数：${missingParams.map((p) => p.name).join("、")}`
        );
        return;
      }
    }

    if (promptSource === "group") {
      // 提示词组模式：直接创建任务
      handleCreateTaskWithGroup();
    } else {
      // 单个提示词模式：先选择脑洞提示词
      setCurrentStep("select_prompt");
    }
  };

  // 提示词组模式：创建任务
  const handleCreateTaskWithGroup = async () => {
    try {
      setLoading(true);

      const data: any = {
        autoExecute,
        promptGroupId: selectedGroupId,
      };

      // 传递选择的AI模型
      if (selectedModelId) {
        data.modelId = selectedModelId;
      }

      // 传递任务配置（包含AI参数）
      data.taskConfig = {
        ...(showTaskConfig ? taskConfig : {}),
        temperature,
        historyMessageLimit,
      };

      // 传递提示词组参数（如果有）
      if (groupParameters.length > 0) {
        data.parameters = groupParameterValues;
      }

      // 记录使用
      if (selectedGroupId) {
        await promptGroupApi.recordUse(selectedGroupId);
      }

      const response = await bookCreationApi.createTask(data);
      if (autoExecute) {
        success("创建成功", "任务创建成功，AI将开始创作");
      } else {
        success("创建成功", "任务创建成功，请手动执行阶段");
      }
      navigate(`/dashboard/book-creation/${response.id}`);
    } catch (err: any) {
      error("创建失败", err.response?.data?.message || "创建任务失败");
    } finally {
      setLoading(false);
    }
  };

  // 单个提示词模式：选择脑洞提示词
  const handleIdeaPromptSelected = async (prompt: Prompt) => {
    console.log("Selected prompt:", prompt.id, prompt.name);
    promptSelectionCompletedRef.current = true; // 使用 ref 标记选择完成（同步）
    setSelectedIdeaPromptId(prompt.id);
    setCurrentStep("fill_parameters");
  };

  // 单个提示词模式：填写参数后创建任务
  const handleParametersSubmit = async (_parameters: Record<string, any>) => {
    try {
      setLoading(true);

      // 创建任务，配置脑洞提示词
      const data: any = {
        autoExecute: false, // 先不执行，等配置好提示词后再执行
        taskConfig: showTaskConfig ? taskConfig : undefined,
      };

      const response = await bookCreationApi.createTask(data);
      const taskId = response.id;

      // 配置脑洞提示词
      await bookCreationApi.updatePromptConfig(taskId, {
        ideaPromptId: selectedIdeaPromptId!,
      });

      // 执行阶段1（脑洞生成），传入参数
      await bookCreationApi.executeStage(taskId, "stage_1_idea");

      success("创建成功", "任务创建成功，AI正在生成脑洞");
      navigate(`/dashboard/book-creation/${taskId}`);
    } catch (err: any) {
      error("创建失败", err.response?.data?.message || "创建任务失败");
    } finally {
      setLoading(false);
    }
  };

  const updateTaskConfig = (
    field: keyof TaskConfig,
    value: number | string | boolean
  ) => {
    setTaskConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => {
            if (currentStep === "fill_parameters") {
              setCurrentStep("select_prompt");
            } else if (currentStep === "select_prompt") {
              setCurrentStep("select_mode");
            } else {
              navigate("/dashboard/book-creation");
            }
          }}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {currentStep !== "select_mode" ? "返回上一步" : "返回任务列表"}
        </button>

        {/* 步骤指示器 */}
        {promptSource === "single" && currentStep !== "select_mode" && (
          <div className="mb-6 bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-gray-100">
            <div className="flex items-center justify-center gap-4">
              <div
                className={`flex items-center gap-2 ${
                  currentStep === "select_prompt"
                    ? "text-purple-600 font-medium"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === "select_prompt"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  1
                </div>
                <span>选择提示词</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div
                className={`flex items-center gap-2 ${
                  currentStep === "fill_parameters"
                    ? "text-purple-600 font-medium"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === "fill_parameters"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  2
                </div>
                <span>填写参数</span>
              </div>
            </div>
          </div>
        )}

        {/* 主内容 */}
        {currentStep === "select_mode" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Wand2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  创建成书任务
                </h1>
                <p className="text-gray-600">
                  选择提示词组或配置单个提示词，AI将根据提示词参数创作
                </p>
              </div>
            </div>

            {/* 重要提示 */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm">
                💡 <strong>新流程说明：</strong>
                现在无需手动输入想法，AI将根据脑洞生成提示词的参数来创作。
                请先选择提示词组或配置单个提示词，确保脑洞生成提示词已设置好相关参数。
              </p>
            </div>

            {/* 提示词来源选择 */}
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-3">
                提示词来源 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 使用提示词组 */}
                <button
                  type="button"
                  onClick={() => setPromptSource("group")}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    promptSource === "group"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <PackageOpen
                    className={`w-8 h-8 mx-auto mb-2 ${
                      promptSource === "group"
                        ? "text-purple-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="text-center">
                    <div className="font-medium text-gray-900">提示词组</div>
                    <div className="text-sm text-gray-500 mt-1">
                      使用预设的提示词套装（推荐）
                    </div>
                  </div>
                </button>

                {/* 使用单个提示词 */}
                <button
                  type="button"
                  onClick={() => setPromptSource("single")}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    promptSource === "single"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <FileText
                    className={`w-8 h-8 mx-auto mb-2 ${
                      promptSource === "single"
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div className="text-center">
                    <div className="font-medium text-gray-900">单个提示词</div>
                    <div className="text-sm text-gray-500 mt-1">
                      在任务执行时选择提示词
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 提示词组选择 */}
            {promptSource === "group" && (
              <div className="mb-6 bg-purple-50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  选择提示词组
                </h3>
                {loadingGroups ? (
                  <div className="text-center py-8 text-gray-500">
                    加载中...
                  </div>
                ) : promptGroups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    暂无可用的提示词组
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {promptGroups.map((group) => (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`p-4 border-2 rounded-xl text-left transition-all ${
                          selectedGroupId === group.id
                            ? "border-purple-500 bg-purple-100"
                            : "border-gray-200 bg-white hover:border-purple-300"
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {group.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {group.description}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>👁️ {group.viewCount}</span>
                          <span>🔥 {group.useCount}</span>
                          <span>❤️ {group.likeCount}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI模型配置（自动从用户偏好读取） */}
            <div className="mb-6">
              {loadingPreferences ? (
                <div className="w-full p-4 border-2 border-gray-200 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                    <span className="text-sm text-gray-600">
                      加载模型配置中...
                    </span>
                  </div>
                </div>
              ) : selectedModelId > 0 ? (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    AI模型配置（已自动加载）
                  </label>
                  <div className="w-full p-4 border-2 border-green-300 bg-green-50 rounded-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <Cpu className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-left flex-1 min-w-0">
                          <div className="font-medium text-gray-900 mb-1">
                            {currentModelInfo?.displayName ||
                              `模型 #${selectedModelId}`}
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>
                              温度: {temperature.toFixed(1)} · 对话数:{" "}
                              {historyMessageLimit}
                            </div>
                            {currentModelInfo?.description && (
                              <div className="text-gray-500 line-clamp-1">
                                {currentModelInfo.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowModelConfig(true)}
                        className="flex-shrink-0 p-2 hover:bg-green-100 rounded-lg transition-colors"
                        title="修改配置"
                      >
                        <Settings className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 px-1">
                    💡 配置已从您的偏好设置自动加载，点击右侧图标可修改
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    AI模型配置 <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowModelConfig(true)}
                    className="w-full flex items-center justify-between p-4 border-2 border-red-300 bg-red-50 rounded-xl hover:border-red-400 hover:bg-red-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-red-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">
                          未配置AI模型
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          点击选择AI模型和参数
                        </div>
                      </div>
                    </div>
                    <Settings className="w-5 h-5 text-red-600" />
                  </button>
                  <p className="text-xs text-red-600 px-1">
                    ⚠️ 您还没有保存过模型偏好，请先配置
                  </p>
                </div>
              )}
            </div>

            {/* 提示词组参数配置 */}
            {promptSource === "group" && selectedGroupId && (
              <div className="mb-6 bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  📝 参数配置
                </h3>
                {loadingParameters ? (
                  <div className="text-center py-4 text-gray-500">
                    加载参数中...
                  </div>
                ) : groupParameters.length === 0 ? (
                  <div className="text-center py-4 text-gray-600 text-sm">
                    该提示词组无需配置参数
                  </div>
                ) : (
                  <div className="space-y-4">
                    {groupParameters.map((param) => (
                      <div key={param.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {param.name}
                          {param.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                          {param.stageLabel && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({param.stageLabel})
                            </span>
                          )}
                        </label>
                        {param.description && (
                          <p className="text-xs text-gray-500 mb-2">
                            {param.description}
                          </p>
                        )}
                        <input
                          type="text"
                          value={groupParameterValues[param.name] || ""}
                          onChange={(e) => {
                            setGroupParameterValues((prev) => ({
                              ...prev,
                              [param.name]: e.target.value,
                            }));
                          }}
                          placeholder={`请输入${param.name}`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 单个提示词选择 */}
            {promptSource === "single" && (
              <div className="mb-6 bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-medium text-blue-900 mb-3">
                  📝 单个提示词模式
                </h3>
                <div className="space-y-2 text-sm text-blue-800">
                  <p>
                    ✅
                    您选择了单个提示词模式，任务创建后需要在执行各阶段前配置对应的提示词。
                  </p>
                  <p className="font-medium">工作流程：</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>创建空任务</li>
                    <li>在任务详情页，执行阶段前选择对应提示词</li>
                    <li>系统会在每个阶段执行前提示您配置提示词</li>
                  </ul>
                </div>
                <div className="mt-3 bg-blue-100 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    💡 <strong>提示：</strong>
                    使用提示词组模式可以一次性配置所有阶段的提示词，更加便捷！
                  </p>
                </div>
              </div>
            )}

            {/* 自动执行选项 */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoExecute}
                  onChange={(e) => setAutoExecute(e.target.checked)}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-700">
                  创建后立即执行第一阶段（脑洞生成）
                </span>
              </label>
            </div>

            {/* 任务配置 */}
            <div className="mb-6">
              <button
                onClick={() => setShowTaskConfig(!showTaskConfig)}
                className="flex items-center gap-2 text-purple-600 hover:text-purple-700 transition-colors mb-3"
              >
                <Settings className="w-5 h-5" />
                {showTaskConfig ? "隐藏" : "显示"}任务配置
              </button>

              {showTaskConfig && (
                <div className="mt-4 bg-purple-50 rounded-xl p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">
                        章节生成并发数
                      </label>
                      <input
                        type="number"
                        value={taskConfig.concurrencyLimit || 5}
                        onChange={(e) =>
                          updateTaskConfig(
                            "concurrencyLimit",
                            parseInt(e.target.value)
                          )
                        }
                        min={1}
                        max={10}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      />
                      <span className="text-xs text-gray-500">
                        默认：5（建议3-8）
                      </span>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={taskConfig.enableReview !== false}
                          onChange={(e) =>
                            updateTaskConfig("enableReview", e.target.checked)
                          }
                          className="w-5 h-5 text-purple-500 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          启用审稿优化（阶段5）
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="bg-purple-100 border border-purple-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-purple-800">
                      💡 提示：并发数越高，生成速度越快，但消耗字数速度也越快
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 预估提示 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 text-sm">
                ⚠️ 生成完整作品预计需要消耗 <strong>5-20万字</strong>
                ，请确保字数包余额充足
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={handleStartCreation}
                disabled={
                  loading || (promptSource === "group" && !selectedGroupId)
                }
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? "创建中..."
                  : promptSource === "single"
                  ? "下一步：选择提示词"
                  : "开始创作"}
              </button>
              <button
                onClick={() => navigate("/dashboard/book-creation")}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 步骤2：选择脑洞提示词（单个提示词模式） */}
        <PromptSelectionModal
          isOpen={currentStep === "select_prompt"}
          onClose={() => {
            console.log(
              "Modal closed, promptSelectionCompleted:",
              promptSelectionCompletedRef.current
            );
            // 只有在没有完成选择的情况下才返回上一步
            // 如果已经选择了提示词（ref.current = true），说明是正常流程，不应该重置
            if (!promptSelectionCompletedRef.current) {
              setCurrentStep("select_mode");
            }
            // 重置标志（为下次选择做准备）
            promptSelectionCompletedRef.current = false;
          }}
          onSelect={(prompt: Prompt) => {
            console.log("Prompt selected in modal:", prompt.id);
            handleIdeaPromptSelected(prompt);
          }}
        />

        {/* 步骤3：填写参数（单个提示词模式） */}
        {currentStep === "fill_parameters" && selectedIdeaPromptId ? (
          <ParameterFormWrapper
            promptId={selectedIdeaPromptId}
            onSubmit={handleParametersSubmit}
            onBack={() => setCurrentStep("select_prompt")}
          />
        ) : currentStep === "fill_parameters" ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-gray-100">
            <p className="text-gray-600 text-center">加载中...</p>
          </div>
        ) : null}

        {/* AI模型配置模态框 */}
        <ModelConfigModal
          isOpen={showModelConfig}
          onClose={() => setShowModelConfig(false)}
          currentModel={selectedModelId}
          currentTemperature={temperature}
          currentHistoryMessageLimit={historyMessageLimit}
          onSave={handleModelConfigSave}
        />
      </div>
    </div>
  );
};

export default NewTaskPage;
