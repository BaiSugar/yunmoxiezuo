import React, { useState, useEffect } from "react";
import {
  Wand2,
  FileText,
  User,
  Globe,
  BookOpen,
  ChevronDown,
  Settings,
  Sparkles,
} from "lucide-react";
import { ParameterInput } from "./ParameterInput";
import { PromptSelectionModal } from "./PromptSelectionModal";
import { ModelConfigModal } from "./ModelConfigModal";
import { CharacterSelectionModal } from "./CharacterSelectionModal";
import { WorldSettingSelectionModal } from "./WorldSettingSelectionModal";
import { MemoSelectionModal } from "./MemoSelectionModal";
import {
  ChapterSelectionModal,
  type SelectedChapter,
} from "./ChapterSelectionModal";
import { aiModelsApi } from "../../../../services/ai-models.api";
import { userPreferencesApi } from "../../../../services/user-preferences.api";
import {
  charactersApi,
  worldSettingsApi,
  memosApi,
} from "../../../../services/characters.api";
import { useToast } from "../../../../contexts/ToastContext";
import type { Prompt } from "../../../../types/prompt";
import type { AIModelBasic } from "../../../../types/ai-model";
import type {
  Character,
  WorldSetting,
  Memo,
} from "../../../../types/character";
import type { Chapter } from "../types";

interface Volume {
  id: number;
  name: string;
  chapters: Chapter[];
}

interface GeneratorPanelModeProps {
  categoryId: number;
  categoryName: string;
  novelId?: number;
  chapters?: Chapter[];
  volumes?: Volume[];
  onGenerate: (config: {
    promptId: number;
    modelId: number;
    temperature: number;
    parameters: Record<string, string>;
    characterIds: number[];
    worldSettingIds: number[];
    memoIds: number[];
    chapterSelections: Array<{ id: number; useSummary: boolean }>;
  }) => void;
  onCancel: () => void;
  isGenerating: boolean;
  onViewResult?: () => void;
  onRegenerate?: () => void;
  onRequestNovel?: () => void; // 当需要作品但未关联时调用
  onPromptSelect?: (
    prompt: Prompt | null,
    parameters: Record<string, string>
  ) => void; // 提示词选择回调，用于共享到对话模式
}

/**
 * 生成器面板配置模式
 */
export const GeneratorPanelMode: React.FC<GeneratorPanelModeProps> = ({
  categoryId,
  categoryName,
  novelId,
  chapters = [],
  volumes = [],
  onGenerate,
  onCancel,
  isGenerating,
  onViewResult,
  onRegenerate,
  onRequestNovel,
  onPromptSelect,
}) => {
  const { error: showError } = useToast();

  // 提示词和模型
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModelBasic | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number>(0);
  const [temperature, setTemperature] = useState(0.7);
  const [historyMessageLimit, setHistoryMessageLimit] = useState(10);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);

  // 参数
  const [promptParameters, setPromptParameters] = useState<
    Record<string, string>
  >({});

  // 关联功能
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  const [selectedWorldSettings, setSelectedWorldSettings] = useState<
    WorldSetting[]
  >([]);
  const [selectedMemos, setSelectedMemos] = useState<Memo[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<SelectedChapter[]>(
    []
  );
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);

  // 可用的关联数据
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldSettings, setWorldSettings] = useState<WorldSetting[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);

  // 可用的模型列表（用于 ModelConfigModal）
  const [models, setModels] = useState<AIModelBasic[]>([]);

  // 加载默认提示词和模型（仅在首次挂载或categoryId变化时执行）
  const [lastCategoryId, setLastCategoryId] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 首次加载
    if (!isInitialized) {
      loadDefaultSettings();
      setLastCategoryId(categoryId);
      setIsInitialized(true);
      return;
    }

    // 分类切换时重置
    if (lastCategoryId !== categoryId) {
      setSelectedPrompt(null);
      setPromptParameters({});
      setSelectedCharacters([]);
      setSelectedWorldSettings([]);
      setSelectedMemos([]);
      setSelectedChapters([]);

      // 通知父组件清除共享的提示词状态
      if (onPromptSelect) {
        onPromptSelect(null, {});
      }

      // 加载新的默认设置
      loadDefaultSettings();
      setLastCategoryId(categoryId);
    }
  }, [categoryId, lastCategoryId, isInitialized]);

  // 加载关联数据（当有作品时）
  useEffect(() => {
    if (novelId) {
      loadNovelRelatedData();
    } else {
      setCharacters([]);
      setWorldSettings([]);
      setMemos([]);
    }
  }, [novelId]);

  const loadDefaultSettings = async () => {
    try {
      // 加载可用的模型列表
      const modelsData: any = await aiModelsApi.getActiveModels();
      const modelsList = Array.isArray(modelsData)
        ? modelsData
        : modelsData?.data || [];
      setModels(modelsList);

      // 读取用户偏好配置（与对话模式共享）
      try {
        const prefs = await userPreferencesApi.getAll();

        if (prefs && prefs.length > 0) {
          // 找到最近更新的偏好（最新使用的）
          const latestPref = prefs.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];

          // 使用用户偏好的模型和温度
          const preferredModel = modelsList.find(
            (m: AIModelBasic) => m.id === latestPref.modelId
          );
          if (preferredModel) {
            setSelectedModel(preferredModel);
            setSelectedModelId(preferredModel.id);
            setTemperature(latestPref.temperature || 0.7);
            // 加载历史消息数量限制
            if (latestPref.historyMessageLimit !== undefined) {
              setHistoryMessageLimit(latestPref.historyMessageLimit);
            }
          } else if (modelsList.length > 0) {
            // 偏好的模型不存在，使用第一个模型
            setSelectedModel(modelsList[0]);
            setSelectedModelId(modelsList[0].id);
          }
        } else if (modelsList.length > 0) {
          // 没有偏好配置，使用第一个模型
          setSelectedModel(modelsList[0]);
          setSelectedModelId(modelsList[0].id);
        }
      } catch (err) {
        // 没有偏好配置，使用第一个模型
        if (modelsList.length > 0) {
          setSelectedModel(modelsList[0]);
          setSelectedModelId(modelsList[0].id);
        }
      }

      // 不再自动选择提示词，让用户手动选择
      // 之前会加载分类下的第一个提示词作为默认，现在改为不默认选择
    } catch (error) {
      console.error("加载默认设置失败:", error);
    }
  };

  const loadNovelRelatedData = async () => {
    if (!novelId) return;

    try {
      // 并行加载
      const [charsData, worldsData, memosData] = await Promise.all([
        charactersApi.getCharacters(novelId).catch(() => []),
        worldSettingsApi.getWorldSettings(novelId).catch(() => []),
        memosApi.getMemos(novelId).catch(() => []),
      ]);

      setCharacters(charsData);
      setWorldSettings(worldsData);
      setMemos(memosData);
    } catch (error) {
      console.error("加载作品关联数据失败:", error);
    }
  };

  // 从提示词中提取参数列表（兼容两种格式）
  const extractParameters = (prompt: Prompt): any[] => {
    // 优先从独立的parameters字段读取（内容不公开时）
    if ((prompt as any).parameters && (prompt as any).parameters.length > 0) {
      return (prompt as any).parameters;
    }
    // 否则从contents中提取（内容公开时）
    if (prompt.contents) {
      const params: any[] = [];
      prompt.contents.forEach((content) => {
        if (content.parameters && content.parameters.length > 0) {
          params.push(...content.parameters);
        }
      });
      return params;
    }
    return [];
  };

  const handlePromptSelect = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    // 重置参数
    const parameters = extractParameters(prompt);
    const initialParams: Record<string, string> = {};
    parameters.forEach((param: any) => {
      initialParams[param.name] = "";
    });
    setPromptParameters(initialParams);
    setShowPromptModal(false);

    // 通知父组件，同步到对话模式
    if (onPromptSelect) {
      onPromptSelect(prompt, initialParams);
    }
  };

  const handleModelSave = (modelId: number, temp: number, limit: number) => {
    const model = models.find((m) => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      setSelectedModelId(modelId);
      setTemperature(temp);
      setHistoryMessageLimit(limit);
    }
    setShowModelModal(false);
  };

  const handleGenerate = () => {
    if (!selectedPrompt) {
      showError("请选择提示词");
      return;
    }
    if (!selectedModel) {
      showError("请选择AI模型");
      return;
    }

    // 验证必填参数
    const parameters = extractParameters(selectedPrompt);
    const missingParams = parameters
      .filter((p) => p.required && !promptParameters[p.name]?.trim())
      .map((p) => p.name);

    if (missingParams && missingParams.length > 0) {
      showError(`请填写必填参数: ${missingParams.join(", ")}`);
      return;
    }

    onGenerate({
      promptId: selectedPrompt.id,
      modelId: selectedModelId,
      temperature,
      parameters: promptParameters,
      characterIds: selectedCharacters.map((c) => c.id),
      worldSettingIds: selectedWorldSettings.map((w) => w.id),
      memoIds: selectedMemos.map((m) => m.id),
      chapterSelections: selectedChapters.map((c) => ({
        id: c.id,
        useSummary: c.useSummary,
      })),
    });
  };

  const handleAssociationClick = (
    type: "character" | "world" | "memo" | "chapter"
  ) => {
    if (!novelId) {
      onRequestNovel?.();
      return;
    }

    switch (type) {
      case "character":
        setShowCharacterModal(true);
        break;
      case "world":
        setShowWorldModal(true);
        break;
      case "memo":
        setShowMemoModal(true);
        break;
      case "chapter":
        setShowChapterModal(true);
        break;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* 配置区域 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 md:space-y-5">
          {/* 标题区域 - 精简设计 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0">
                <Wand2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {categoryName}生成器
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">
                  配置生成参数并开始创作
                </p>
              </div>
            </div>
          </div>

          {/* 核心配置区域 - 提示词和模型 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-600 flex-shrink-0" />
              核心配置
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {/* 提示词 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  提示词模板
                </label>
                <button
                  onClick={() => setShowPromptModal(true)}
                  className="w-full p-2.5 sm:p-3.5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left group"
                >
                  {selectedPrompt ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {selectedPrompt.name}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-gray-400">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>选择提示词</span>
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>

              {/* 模型 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                  AI模型
                </label>
                <button
                  onClick={() => setShowModelModal(true)}
                  className="w-full p-2.5 sm:p-3.5 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition-all text-left group"
                >
                  {selectedModel ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {selectedModel.displayName}
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-purple-600 flex-shrink-0" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-gray-400">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>选择模型</span>
                      </div>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 参数配置区域 */}
          {selectedPrompt &&
            (() => {
              const parameters = extractParameters(selectedPrompt);
              return parameters.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5">
                  <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-600" />
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
                          placeholder={`请输入${param.name}`}
                          required={param.required}
                          description={param.description}
                          characters={characters}
                          worldSettings={worldSettings}
                          memos={memos}
                          chapters={chapters}
                          volumes={volumes}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

          {/* 关联资源区域 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-600 flex-shrink-0" />
                关联资源
              </h3>
              {!novelId && (
                <span className="text-xs px-2 py-1 bg-amber-50 text-amber-700 rounded border border-amber-200 font-medium whitespace-nowrap">
                  需要关联作品
                </span>
              )}
            </div>

            <div className="space-y-2 sm:space-y-3">
              {/* 人物卡 */}
              <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      人物卡
                    </span>
                  </div>
                  <button
                    onClick={() => handleAssociationClick("character")}
                    className="text-xs px-2 py-1 rounded bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 border border-blue-200 font-medium transition-colors flex-shrink-0 ml-2"
                  >
                    {selectedCharacters.length > 0 ? "修改" : "添加"}
                  </button>
                </div>
                {selectedCharacters.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedCharacters.map((char) => (
                      <div
                        key={char.id}
                        className="px-2.5 py-1 bg-white border border-blue-200 text-blue-700 rounded text-sm flex items-center gap-1.5"
                      >
                        <span>{char.name}</span>
                        <button
                          onClick={() =>
                            setSelectedCharacters(
                              selectedCharacters.filter((c) => c.id !== char.id)
                            )
                          }
                          className="hover:text-blue-900 text-base leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">暂无关联</div>
                )}
              </div>

              {/* 世界观 */}
              <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Globe className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      世界观
                    </span>
                  </div>
                  <button
                    onClick={() => handleAssociationClick("world")}
                    className="text-xs px-2 py-1 rounded bg-white hover:bg-green-50 text-green-600 hover:text-green-700 border border-green-200 font-medium transition-colors flex-shrink-0 ml-2"
                  >
                    {selectedWorldSettings.length > 0 ? "修改" : "添加"}
                  </button>
                </div>
                {selectedWorldSettings.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedWorldSettings.map((world) => (
                      <div
                        key={world.id}
                        className="px-2.5 py-1 bg-white border border-green-200 text-green-700 rounded text-sm flex items-center gap-1.5"
                      >
                        <span>{world.name}</span>
                        <button
                          onClick={() =>
                            setSelectedWorldSettings(
                              selectedWorldSettings.filter(
                                (w) => w.id !== world.id
                              )
                            )
                          }
                          className="hover:text-green-900 text-base leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">暂无关联</div>
                )}
              </div>

              {/* 备忘录 */}
              <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      备忘录
                    </span>
                  </div>
                  <button
                    onClick={() => handleAssociationClick("memo")}
                    className="text-xs px-2 py-1 rounded bg-white hover:bg-purple-50 text-purple-600 hover:text-purple-700 border border-purple-200 font-medium transition-colors flex-shrink-0 ml-2"
                  >
                    {selectedMemos.length > 0 ? "修改" : "添加"}
                  </button>
                </div>
                {selectedMemos.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedMemos.map((memo) => (
                      <div
                        key={memo.id}
                        className="px-2.5 py-1 bg-white border border-purple-200 text-purple-700 rounded text-sm flex items-center gap-1.5"
                      >
                        <span>{memo.title}</span>
                        <button
                          onClick={() =>
                            setSelectedMemos(
                              selectedMemos.filter((m) => m.id !== memo.id)
                            )
                          }
                          className="hover:text-purple-900 text-base leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">暂无关联</div>
                )}
              </div>

              {/* 章节 */}
              <div className="p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      章节
                    </span>
                  </div>
                  <button
                    onClick={() => handleAssociationClick("chapter")}
                    className="text-xs px-2 py-1 rounded bg-white hover:bg-orange-50 text-orange-600 hover:text-orange-700 border border-orange-200 font-medium transition-colors flex-shrink-0 ml-2"
                  >
                    {selectedChapters.length > 0 ? "修改" : "添加"}
                  </button>
                </div>
                {selectedChapters.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedChapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        className="px-2.5 py-1 bg-white border border-orange-200 text-orange-700 rounded text-sm flex items-center gap-1.5"
                      >
                        <span>{chapter.title}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded border border-orange-200">
                          {chapter.useSummary ? "梗概" : "正文"}
                        </span>
                        <button
                          onClick={() =>
                            setSelectedChapters(
                              selectedChapters.filter(
                                (c) => c.id !== chapter.id
                              )
                            )
                          }
                          className="hover:text-orange-900 text-base leading-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">暂无关联</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="border-t border-gray-200 bg-white px-3 sm:px-4 md:px-6 py-3 sm:py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
          <button
            onClick={onCancel}
            className="px-4 sm:px-5 py-2 sm:py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all font-medium text-sm sm:text-base"
          >
            取消
          </button>

          {onViewResult && !isGenerating && (
            <button
              onClick={onViewResult}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white border border-blue-500 text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium text-sm sm:text-base"
            >
              查看结果
            </button>
          )}

          {onRegenerate && !isGenerating && (
            <button
              onClick={handleGenerate}
              disabled={!selectedPrompt || !selectedModel}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              重新生成
            </button>
          )}

          {/* 只在没有生成结果时显示"开始生成"按钮 */}
          {!onViewResult && !onRegenerate && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !selectedPrompt || !selectedModel}
              className="px-6 sm:px-8 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  开始生成
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 人物卡选择模态框 - 使用与对话模式相同的组件 */}
      {novelId && (
        <CharacterSelectionModal
          isOpen={showCharacterModal}
          onClose={() => setShowCharacterModal(false)}
          characters={characters}
          selectedIds={selectedCharacters.map((c) => c.id)}
          onConfirm={(selectedIds) => {
            setSelectedCharacters(
              characters.filter((c) => selectedIds.includes(c.id))
            );
            setShowCharacterModal(false);
          }}
        />
      )}

      {/* 世界观选择模态框 - 使用与对话模式相同的组件 */}
      {novelId && (
        <WorldSettingSelectionModal
          isOpen={showWorldModal}
          onClose={() => setShowWorldModal(false)}
          worldSettings={worldSettings}
          selectedIds={selectedWorldSettings.map((w) => w.id)}
          onConfirm={(selectedIds) => {
            setSelectedWorldSettings(
              worldSettings.filter((w) => selectedIds.includes(w.id))
            );
            setShowWorldModal(false);
          }}
        />
      )}

      {/* 备忘录选择模态框 - 使用与对话模式相同的组件 */}
      {novelId && (
        <MemoSelectionModal
          isOpen={showMemoModal}
          onClose={() => setShowMemoModal(false)}
          memos={memos}
          selectedIds={selectedMemos.map((m) => m.id)}
          onConfirm={(selectedIds) => {
            setSelectedMemos(memos.filter((m) => selectedIds.includes(m.id)));
            setShowMemoModal(false);
          }}
        />
      )}

      {/* 章节选择模态框 - 使用与对话模式相同的组件 */}
      {novelId && (
        <ChapterSelectionModal
          isOpen={showChapterModal}
          onClose={() => setShowChapterModal(false)}
          chapters={chapters}
          volumes={volumes}
          selectedChapters={selectedChapters}
          onConfirm={(selections) => {
            setSelectedChapters(selections);
            setShowChapterModal(false);
          }}
        />
      )}

      {/* 提示词选择模态框 */}
      <PromptSelectionModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        onSelect={handlePromptSelect}
        fixedCategoryId={categoryId}
      />

      {/* 模型配置模态框 */}
      <ModelConfigModal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
        currentModel={selectedModelId}
        currentTemperature={temperature}
        currentHistoryMessageLimit={historyMessageLimit}
        onSave={handleModelSave}
      />
    </div>
  );
};
