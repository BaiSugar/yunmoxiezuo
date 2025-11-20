import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  ArrowLeft,
  History,
  Plus,
  MessageCircle,
  Settings2,
  BookOpen,
} from "lucide-react";
import { ChatTab } from "./ChatTab";
import type { ChatTabRef } from "./ChatTab";
import { GeneratorPanelMode } from "./GeneratorPanelMode";
import { GenerationResultPanel } from "./GenerationResultPanel";
import { generationApi } from "../../../../services/generation.api";
import {
  chatHistoriesApi,
  messagesApi,
  ChatScenarioType,
} from "../../../../services/chat-histories.api";
import { useToast } from "../../../../contexts/ToastContext";
import type { PromptCategory, Prompt } from "../../../../types/prompt";
import type { EditorSettings } from "../../../../types/editor-settings";

export interface GeneratorInterfaceRef {
  loadHistory: (historyId: number) => Promise<void>;
  handleDeleteHistory: (deletedHistoryId: number) => void;
}

interface GeneratorInterfaceProps {
  category: PromptCategory;
  novelId?: number;
  onApplyToEditor?: (content: string) => void;
  onBack: () => void;
  onShowHistory: () => void; // 显示历史记录回调
  onRequestNovel?: () => void; // 请求关联作品回调
  chapters?: any[];
  volumes?: any[];
  // 关联作品相关
  selectedNovelName?: string;
  showWorkTip?: boolean;
  onWorkSelectorOpen?: () => void;
  editorSettings?: EditorSettings | null; // 编辑器设置（作品编辑页专用）
}

type ViewMode = "panel" | "chat";

/**
 * 生成器界面 - 支持面板模式和对话模式切换
 */
export const GeneratorInterface = forwardRef<
  GeneratorInterfaceRef,
  GeneratorInterfaceProps
>(
  (
    {
      category,
      novelId,
      onApplyToEditor,
      onBack,
      onShowHistory,
      onRequestNovel,
      chapters = [],
      volumes = [],
      selectedNovelName,
      showWorkTip = false,
      onWorkSelectorOpen,
      editorSettings,
    },
    ref
  ) => {
    const chatTabRef = useRef<ChatTabRef>(null);
    const { error: showError } = useToast();

    // 视图模式
    const [viewMode, setViewMode] = useState<ViewMode>("panel");

    // 生成状态（监听 ChatTab 的消息）
    const [latestAssistantMessage, setLatestAssistantMessage] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [showResultPanel, setShowResultPanel] = useState(false);
    const [hasGeneratedResult, setHasGeneratedResult] = useState(false); // 是否已生成结果
    const [generatedChatHistoryId, setGeneratedChatHistoryId] = useState<
      number | null
    >(null);

    // 存储面板配置，用于生成
    const [pendingPanelConfig, setPendingPanelConfig] = useState<{
      promptId: number;
      modelId: number;
      temperature: number;
      parameters: Record<string, string>;
      characterIds: number[];
      worldSettingIds: number[];
      memoIds: number[];
      chapterSelections: Array<{ id: number; useSummary: boolean }>;
    } | null>(null);

    // 共享的提示词状态（面板模式和对话模式共享）
    const [sharedPrompt, setSharedPrompt] = useState<Prompt | null>(null);
    const [sharedPromptParameters, setSharedPromptParameters] = useState<
      Record<string, string>
    >({});

    // 清除所有状态的函数
    const clearAllStates = () => {
      setSharedPrompt(null);
      setSharedPromptParameters({});
      setPendingPanelConfig(null);
      setLatestAssistantMessage("");
      setIsGenerating(false);
      setShowResultPanel(false);
      setHasGeneratedResult(false);
      setGeneratedChatHistoryId(null);
      setViewMode("panel");
    };

    // 当切换模块时，重置所有状态
    useEffect(() => {
      clearAllStates();
    }, [category.id]);

    // 组件卸载时清除状态
    useEffect(() => {
      return () => {
        clearAllStates();
      };
    }, []);

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        // 加载历史记录
        loadHistory: async (historyId: number) => {
          // 切换到对话模式
          setShowResultPanel(false);
          setViewMode("chat");

          // 等待一下确保ChatTab已经渲染
          setTimeout(() => {
            if (chatTabRef.current) {
              chatTabRef.current.loadHistory(historyId);
            }
          }, 100);
        },
        // 处理删除历史记录
        handleDeleteHistory: (deletedHistoryId: number) => {
          if (chatTabRef.current) {
            chatTabRef.current.handleDeleteHistory(deletedHistoryId);
          }
        },
      }),
      []
    );

    const handleSendMessage = (
      message: string,
      mentions: string[],
      files: File[],
      config?: {
        promptId?: number;
        parameters?: Record<string, string>;
        characterIds?: number[];
        worldSettingIds?: number[];
        modelId?: number;
        temperature?: number;
      }
    ) => {
      console.log("发送消息:", { message, mentions, files, config });
      // AI对话已在ChatTab内部实现
    };

    const handleApplyToEditor = (content: string) => {
      if (onApplyToEditor) {
        onApplyToEditor(content);
      } else {
        console.log("应用到编辑器:", content);
      }
    };

    const handleNewChat = () => {
      if (chatTabRef.current) {
        chatTabRef.current.clearChat();
      }
    };

    // 停止生成的取消函数
    const cancelGenerationRef = useRef<(() => void) | null>(null);

    // 面板模式生成 - 直接调用生成API
    const handlePanelGenerate = async (config: {
      promptId: number;
      modelId: number;
      temperature: number;
      parameters: Record<string, string>;
      characterIds: number[];
      worldSettingIds: number[];
      memoIds: number[];
      chapterSelections: Array<{ id: number; useSummary: boolean }>;
    }) => {
      // 保存配置
      setPendingPanelConfig(config);

      // 显示结果面板
      setShowResultPanel(true);
      setIsGenerating(true);
      setHasGeneratedResult(false); // 开始生成时重置状态
      setLatestAssistantMessage("");

      try {
        // 构建章节引用
        const mentionedChapters = config.chapterSelections.map((sel) => ({
          chapterId: sel.id,
          type: sel.useSummary ? ("summary" as const) : ("full" as const),
        }));

        // 调用流式生成API
        const cancelFn = await generationApi.generateWritingStream(
          {
            promptId: config.promptId,
            modelId: String(config.modelId),
            temperature: config.temperature,
            parameters: config.parameters,
            characterIds: config.characterIds,
            worldSettingIds: config.worldSettingIds,
            mentionedMemoIds: config.memoIds,
            mentionedChapters,
            novelId,
            stream: true,
          },
          (content) => {
            // 流式更新内容
            setLatestAssistantMessage((prev) => prev + content);
          },
          () => {
            // 生成完成
            setIsGenerating(false);
            setHasGeneratedResult(true); // 标记已生成结果
            cancelGenerationRef.current = null;
          },
          (error) => {
            // 生成错误
            console.error("生成失败:", error);
            showError("生成失败", error.message || "AI生成时出现错误");
            setIsGenerating(false);
            cancelGenerationRef.current = null;
          }
        );

        cancelGenerationRef.current = cancelFn;
      } catch (error: any) {
        console.error("生成失败:", error);
        showError("生成失败", error.message || "AI生成时出现错误");
        setIsGenerating(false);
      }
    };

    // 保存生成结果为历史记录
    const saveGenerationAsHistory = useCallback(
      async (content: string) => {
        if (!content.trim() || !pendingPanelConfig) return;

        try {
          // 构建用户输入信息（从配置中提取提示词信息）
          const paramInfo = Object.entries(pendingPanelConfig.parameters)
            .filter(([_, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ");
          const userInput = paramInfo
            ? `${category.name}生成 (${paramInfo})`
            : `${category.name}生成`;

          // 创建新的聊天历史 - 使用生成内容的前50个字符作为标题（与对话模式一致）
          const chatName = content.slice(0, 50) || `${category.name}生成`;
          const response = await chatHistoriesApi.create({
            chatName,
            novelId, // 关联小说ID（可能为空）
            categoryId: category.id, // 创意工坊分类ID
            chatMetadata: {
              scenarioType: ChatScenarioType.WRITING, // AI写作模式
              preview: content.slice(0, 100) || "",
            },
          });

          const newChatId = response.data.data.id;
          setGeneratedChatHistoryId(newChatId);

          // 创建消息（只保存AI生成的内容作为助手消息）
          await messagesApi.batchCreate(newChatId, [
            {
              name: "用户",
              isUser: true,
              mes: userInput,
              sendDate: Date.now(),
              extra: pendingPanelConfig,
            },
            {
              name: "AI助手",
              isUser: false,
              mes: content,
              sendDate: Date.now(),
              extra: {},
            },
          ]);

          console.log("生成结果已保存为历史记录，ID:", newChatId);
        } catch (error) {
          console.error("保存历史记录失败:", error);
          // 保存失败不影响用户体验，只记录日志
        }
      },
      [category.id, category.name, novelId, pendingPanelConfig]
    );

    // 重新生成
    const handleRegenerate = () => {
      if (pendingPanelConfig) {
        // 清空之前的内容和历史记录ID
        setLatestAssistantMessage("");
        setGeneratedChatHistoryId(null);
        setHasGeneratedResult(false);
        handlePanelGenerate(pendingPanelConfig);
      }
    };

    // 停止生成
    const handleStopGeneration = () => {
      if (cancelGenerationRef.current) {
        cancelGenerationRef.current();
        cancelGenerationRef.current = null;
      }
      setIsGenerating(false);
    };

    // 处理追问（切换到对话模式并加载历史记录）
    const handleFollowUp = async () => {
      // 先确保历史记录已保存
      if (!generatedChatHistoryId && latestAssistantMessage) {
        await saveGenerationAsHistory(latestAssistantMessage);
      }

      // 切换到对话模式
      setShowResultPanel(false);
      setViewMode("chat");

      // 等待一下确保ChatTab已经渲染
      setTimeout(() => {
        // 加载历史记录
        if (generatedChatHistoryId && chatTabRef.current) {
          chatTabRef.current.loadHistory(generatedChatHistoryId);
        }
      }, 100);
    };

    // 监听生成完成，自动保存历史记录
    useEffect(() => {
      if (
        !isGenerating &&
        latestAssistantMessage &&
        !generatedChatHistoryId &&
        showResultPanel
      ) {
        // 生成刚完成且还没保存历史记录
        saveGenerationAsHistory(latestAssistantMessage);
      }
    }, [
      isGenerating,
      latestAssistantMessage,
      generatedChatHistoryId,
      showResultPanel,
      saveGenerationAsHistory,
    ]);

    return (
      <div className="flex-1 flex flex-col min-h-0 bg-white">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 px-3 sm:px-4 py-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {/* 返回按钮 */}
            <button
              onClick={() => {
                clearAllStates();
                onBack();
              }}
              className="p-2 hover:bg-white/80 rounded-lg transition-all flex items-center gap-2 group flex-shrink-0"
              title="返回工坊"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors hidden sm:inline">
                返回
              </span>
            </button>

            {/* 分类标题 */}
            <div className="border-l border-gray-300 pl-2 sm:pl-3 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 truncate">
                <span className="hidden sm:inline truncate">
                  {category.name}生成器
                </span>
                <span className="sm:hidden truncate">{category.name}</span>
              </h3>
              {category.description && (
                <p className="text-xs text-gray-500 mt-0.5 hidden lg:block truncate">
                  {category.description}
                </p>
              )}
            </div>

            {/* 关联作品按钮 - 如果提供了回调函数 */}
            {onWorkSelectorOpen && (
              <div className="relative flex-shrink-0 ml-auto sm:ml-0">
                <button
                  onClick={onWorkSelectorOpen}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm font-medium shadow-md hover:shadow-lg ${
                    novelId
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : showWorkTip
                      ? "bg-yellow-500 text-white border-2 border-yellow-600 shadow-xl animate-pulse"
                      : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                  }`}
                  title={novelId ? "切换关联作品" : "关联作品以使用功能"}
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="hidden md:inline truncate max-w-[120px]">
                    {novelId ? selectedNovelName : "关联作品"}
                  </span>
                </button>

                {/* 新手提示 - 动画箭头和文字 */}
                {showWorkTip && !novelId && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 hidden md:block">
                    {/* 提示框 */}
                    <div className="px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white rounded-xl shadow-2xl whitespace-nowrap mb-1">
                      <div className="font-semibold text-sm mb-0.5">
                        点击这里关联作品
                      </div>
                      <div className="text-xs opacity-90">
                        关联后可使用资源引用功能
                      </div>
                    </div>
                    {/* 向下箭头 */}
                    <div className="flex justify-center">
                      <svg
                        className="w-6 h-6 text-yellow-500 animate-bounce"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a1 1 0 01-.707-.293l-7-7a1 1 0 011.414-1.414L10 15.586l6.293-6.293a1 1 0 011.414 1.414l-7 7A1 1 0 0110 18z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
            {/* 模式切换 */}
            <div className="flex items-center bg-white/80 rounded-lg p-0.5 sm:p-1 border border-gray-200">
              <button
                onClick={() => setViewMode("panel")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                  viewMode === "panel"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="面板模式"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">面板</span>
              </button>
              <button
                onClick={() => setViewMode("chat")}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 sm:gap-1.5 ${
                  viewMode === "chat"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                title="对话模式"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">对话</span>
              </button>
            </div>

            {/* 对话模式专属按钮 */}
            {viewMode === "chat" && (
              <>
                <div className="w-px h-4 sm:h-6 bg-gray-300 hidden sm:block"></div>
                <button
                  onClick={handleNewChat}
                  className="p-1.5 sm:p-2 hover:bg-white/80 rounded-lg transition-colors"
                  title="新建对话"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={onShowHistory}
                  className="p-1.5 sm:p-2 hover:bg-white/80 rounded-lg transition-colors"
                  title="历史记录"
                >
                  <History className="w-4 h-4 text-gray-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 内容区 - 同时渲染两个组件，通过显示/隐藏切换（避免重新挂载） */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* 面板模式 */}
          <div
            className={
              viewMode === "panel"
                ? "flex-1 flex flex-col overflow-hidden relative"
                : "hidden"
            }
          >
            {/* 配置面板 - 始终渲染，通过CSS控制显示 */}
            <div
              className={
                !showResultPanel
                  ? "flex-1 flex flex-col overflow-hidden"
                  : "hidden"
              }
            >
              <GeneratorPanelMode
                categoryId={category.id}
                categoryName={category.name}
                novelId={novelId}
                chapters={chapters}
                volumes={volumes}
                onGenerate={handlePanelGenerate}
                onCancel={onBack}
                isGenerating={false}
                onViewResult={
                  hasGeneratedResult
                    ? () => setShowResultPanel(true)
                    : undefined
                }
                onRegenerate={hasGeneratedResult ? handleRegenerate : undefined}
                onRequestNovel={onRequestNovel}
                onPromptSelect={(prompt, parameters) => {
                  // 如果 prompt 为 null，清除共享状态
                  if (prompt) {
                    setSharedPrompt(prompt);
                    setSharedPromptParameters(parameters);
                  } else {
                    setSharedPrompt(null);
                    setSharedPromptParameters({});
                  }
                }}
              />
            </div>

            {/* 结果面板 - 始终渲染，通过CSS控制显示 */}
            <div
              className={
                showResultPanel
                  ? "flex-1 flex flex-col overflow-hidden"
                  : "hidden"
              }
            >
              <GenerationResultPanel
                content={latestAssistantMessage}
                isGenerating={isGenerating}
                categoryName={category.name}
                onBack={() => setShowResultPanel(false)}
                onSwitchToChat={handleFollowUp}
                onRegenerate={handleRegenerate}
                onStopGeneration={handleStopGeneration}
                onApplyToWork={onApplyToEditor}
                editorSettings={editorSettings}
              />
            </div>
          </div>

          {/* 对话模式 */}
          <div
            className={
              viewMode === "chat"
                ? "flex-1 flex flex-col overflow-hidden"
                : "hidden"
            }
          >
            <ChatTab
              ref={chatTabRef}
              onSendMessage={handleSendMessage}
              onApplyToEditor={handleApplyToEditor}
              novelId={novelId}
              chapters={chapters}
              volumes={volumes}
              fixedCategoryId={category.id}
              fixedCategoryName={category.name}
              onRequestNovel={onRequestNovel}
              sharedPrompt={sharedPrompt}
              sharedPromptParameters={sharedPromptParameters}
            />
          </div>
        </div>
      </div>
    );
  }
);
