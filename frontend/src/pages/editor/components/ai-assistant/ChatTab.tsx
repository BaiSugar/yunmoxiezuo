import React, {
  useState,
  useEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MessageCircle,
  Send,
  Sparkles,
  Settings,
  User,
  Globe,
  X,
  Copy,
  StopCircle,
  CheckCircle,
} from "lucide-react";
import { ModelConfigModal } from "./ModelConfigModal";
import { PromptSelectionModal } from "./PromptSelectionModal";
import { ParameterInput } from "./ParameterInput";
import { ChapterSelectionModal } from "./ChapterSelectionModal";
import type { SelectedChapter } from "./ChapterSelectionModal";
import { CharacterSelectionModal } from "./CharacterSelectionModal";
import { WorldSettingSelectionModal } from "./WorldSettingSelectionModal";
import { MemoSelectionModal } from "./MemoSelectionModal";
import { userPreferencesApi } from "../../../../services/user-preferences.api";
import { aiModelsApi } from "../../../../services/ai-models.api";
import {
  charactersApi,
  worldSettingsApi,
  memosApi,
} from "../../../../services/characters.api";
import { promptsApi } from "../../../../services/prompts.api";
import {
  chatHistoriesApi,
  messagesApi,
  ChatScenarioType,
} from "../../../../services/chat-histories.api";
import { generationApi } from "../../../../services/generation.api";
import { useToast } from "../../../../contexts/ToastContext";
import {
  validateRequiredParameters,
  formatValidationErrors,
} from "../../../../utils/promptValidation";
import type { AIModelBasic } from "../../../../types/ai-model";
import type { Prompt, PromptParameter } from "../../../../types/prompt";
import type {
  Character,
  WorldSetting,
  Memo,
} from "../../../../types/character";
import type { Chapter } from "../types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isGenerating?: boolean;
  timestamp?: number; // 消息创建时间戳
  config?: {
    promptName?: string;
    promptId?: number;
    // promptContent 已移除 - 敏感信息不应保存到历史记录
    parameters?: Record<string, string>;
    characterIds?: number[]; // 用于后端重建
    characterNames?: string[]; // 用于前端显示
    worldSettingIds?: number[]; // 用于后端重建
    worldSettingNames?: string[]; // 用于前端显示
    mentionedCharacters?: string[];
    mentionedWorlds?: string[];
    mentionedMemos?: string[];
    mentionedChapters?: string[];
  };
}

export interface ChatTabRef {
  clearChat: () => Promise<void>;
  loadHistory: (historyId: number) => Promise<void>;
  saveCurrentChat: () => Promise<void>;
  handleDeleteHistory: (deletedHistoryId: number) => void;
  // 面板模式调用：程序化发送消息
  triggerSend: (config: {
    promptId: number;
    modelId: number;
    temperature: number;
    parameters: Record<string, string>;
    characterIds: number[];
    worldSettingIds: number[];
    memoIds: number[];
    chapterSelections: Array<{ id: number; useSummary: boolean }>;
  }) => Promise<void>;
  // 获取最新的助手消息（用于结果模态窗）
  getLatestAssistantMessage: () => string;
  // 获取生成状态
  getIsGenerating: () => boolean;
}

interface Volume {
  id: number;
  name: string;
  chapters: Chapter[];
}

interface ChatTabProps {
  onSendMessage: (
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
  ) => void;
  onApplyToEditor?: (content: string) => void;
  novelId?: number;
  chapters?: Chapter[]; // 传入章节列表
  volumes?: Volume[]; // 传入分卷列表（用于章节选择）
  fixedCategoryId?: number; // 固定的提示词分类ID（创意工坊模式）
  fixedCategoryName?: string; // 固定的分类名称（用于显示）
  onRequestNovel?: () => void; // 请求选择作品的回调（@功能需要）
  sharedPrompt?: Prompt | null; // 共享的提示词（从面板模式传入）
  sharedPromptParameters?: Record<string, string>; // 共享的参数
}

/**
 * AI对话Tab
 */
export const ChatTab = forwardRef<ChatTabRef, ChatTabProps>(
  (
    {
      onSendMessage,
      onApplyToEditor,
      novelId,
      chapters = [],
      volumes = [],
      fixedCategoryId,
      fixedCategoryName: _fixedCategoryName,
      onRequestNovel,
      sharedPrompt,
      sharedPromptParameters,
    },
    ref
  ) => {
    const { error: showError, success: showSuccess } = useToast();
    const [inputValue, setInputValue] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    // 生成页面会话ID（存储在sessionStorage，标签页关闭时自动清除）
    const pageSessionId = React.useMemo(() => {
      const sessionKey = `pageSession_${novelId}`;
      let sessionId = sessionStorage.getItem(sessionKey);
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        sessionStorage.setItem(sessionKey, sessionId);
      }
      return sessionId;
    }, [novelId]);

    // 从localStorage恢复messages（包含会话ID）
    const [messages, setMessages] = useState<Message[]>(() => {
      const saved = localStorage.getItem(
        `chatTab_messages_${novelId}_${pageSessionId}`
      );
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (error) {
          console.error("恢复对话消息失败:", error);
          return [];
        }
      }
      return [];
    });

    // 追踪已保存的消息数量（初始化为当前消息数量，避免重复保存）
    const [savedMessageCount, setSavedMessageCount] = useState(() => {
      const saved = localStorage.getItem(
        `chatTab_messages_${novelId}_${pageSessionId}`
      );
      if (saved) {
        try {
          const parsedMessages = JSON.parse(saved);
          return parsedMessages.length; // 初始化为已有消息数量
        } catch (error) {
          return 0;
        }
      }
      return 0;
    });

    // 从localStorage恢复currentChatId（包含会话ID）
    const [currentChatId, setCurrentChatId] = useState<string>(() => {
      const saved = localStorage.getItem(
        `chatTab_currentChatId_${novelId}_${pageSessionId}`
      );
      if (saved) {
        // 修复旧数据：如果是纯数字字符串（旧格式），转换为带 chat_ 前缀
        const numericId = Number(saved);
        if (
          !isNaN(numericId) &&
          !saved.startsWith("chat_") &&
          numericId > 1000000000000
        ) {
          // 这是一个时间戳格式的临时ID，转换为新格式
          return `chat_${Date.now()}`;
        }
        return saved;
      }
      return `chat_${Date.now()}`;
    });
    const [generatingMessageId, setGeneratingMessageId] = useState<
      string | null
    >(null);
    const generationCancelRef = React.useRef<(() => void) | null>(null);
    const [expandedPromptConfig, setExpandedPromptConfig] = useState<
      string | null
    >(null);
    const [mobileActiveMessage, setMobileActiveMessage] = useState<
      string | null
    >(null);

    // 对话区域ref，用于自动滚动
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const messagesContainerRef = React.useRef<HTMLDivElement>(null);
    const messageRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

    // 自动滚动开关（用户干预后关闭，用户主动回到底部后开启）
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

    // 悬停时临时折叠提示词配置（避免遮挡操作按钮）
    const [hoveringMessage, setHoveringMessage] = useState<string | null>(null);

    // @ 关联的数据
    const [mentionedCharacters, setMentionedCharacters] = useState<Character[]>(
      []
    );
    const [mentionedWorldSettings, setMentionedWorldSettings] = useState<
      WorldSetting[]
    >([]);
    const [mentionedMemos, setMentionedMemos] = useState<Memo[]>([]);

    // 临时选中的项（还未确认）
    const [tempMentionedCharacters, setTempMentionedCharacters] = useState<
      Character[]
    >([]);
    const [tempMentionedWorldSettings, setTempMentionedWorldSettings] =
      useState<WorldSetting[]>([]);
    const [tempMentionedMemos, setTempMentionedMemos] = useState<Memo[]>([]);
    const [mentionedChapters, setMentionedChapters] = useState<
      SelectedChapter[]
    >([]);

    // 所有可用的数据（用于@ 选择）
    const [allMemos, setAllMemos] = useState<Memo[]>([]);

    // @ 选择模态窗
    const [showMentionCharacterModal, setShowMentionCharacterModal] =
      useState(false);
    const [showMentionWorldModal, setShowMentionWorldModal] = useState(false);
    const [showMentionMemoModal, setShowMentionMemoModal] = useState(false);
    const [showMentionChapterModal, setShowMentionChapterModal] =
      useState(false);

    // @ 菜单状态
    const [showAtMenu, setShowAtMenu] = useState(false);

    // @ 按钮菜单状态（点击显示，不是hover）
    const [showAtButtonMenu, setShowAtButtonMenu] = useState(false);

    // 提示词选择状态（会话级别，不持久化）
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [showPromptModal, setShowPromptModal] = useState(false);
    const [loadingPrompt, setLoadingPrompt] = useState(false);

    // 提示词配置折叠状态
    const [isConfigCollapsed, setIsConfigCollapsed] = useState(false);

    // 选择模态窗状态
    const [showCharacterModal, setShowCharacterModal] = useState(false);
    const [showWorldSettingModal, setShowWorldSettingModal] = useState(false);

    // 提示词参数配置（会话级别，不持久化）
    const [promptParameters, setPromptParameters] = useState<
      Record<string, string>
    >({});

    // 同步共享的提示词和参数（从面板模式传入）
    // 仅在提示词ID变化时更新，避免重复设置
    useEffect(() => {
      if (sharedPrompt && sharedPrompt.id !== selectedPrompt?.id) {
        setSelectedPrompt(sharedPrompt);
        if (sharedPromptParameters) {
          setPromptParameters(sharedPromptParameters);
        }
      }
    }, [sharedPrompt, sharedPromptParameters, selectedPrompt?.id]);

    // 人物卡和世界观相关
    const [characters, setCharacters] = useState<Character[]>([]);
    const [worldSettings, setWorldSettings] = useState<WorldSetting[]>([]);
    const [selectedCharacterIds, setSelectedCharacterIds] = useState<number[]>(
      []
    );
    const [selectedWorldSettingIds, setSelectedWorldSettingIds] = useState<
      number[]
    >([]);
    // 从 localStorage 恢复模型选择状态
    const [selectedModel, setSelectedModel] = useState<number>(() => {
      const saved = localStorage.getItem("chatTab_selectedModel");
      return saved ? Number(saved) : 0;
    }); // 模型数据库ID
    const [selectedModelName, setSelectedModelName] = useState<string>(() => {
      return localStorage.getItem("chatTab_selectedModelName") || "";
    }); // 模型显示名称
    const [models, setModels] = useState<AIModelBasic[]>([]); // 模型列表
    const [temperature, setTemperature] = useState<number>(() => {
      const saved = localStorage.getItem("chatTab_temperature");
      return saved ? Number(saved) : 0.7;
    });
    const [historyMessageLimit, setHistoryMessageLimit] = useState<number>(
      () => {
        const saved = localStorage.getItem("chatTab_historyMessageLimit");
        return saved ? Number(saved) : 10; // 默认保留最近10条消息
      }
    );
    const [showModelConfig, setShowModelConfig] = useState(false);

    // 清理旧的提示词选择数据（组件挂载时）
    useEffect(() => {
      localStorage.removeItem("chatTab_selectedPromptId");
      localStorage.removeItem("chatTab_selectedPromptName");
      // 清理旧的单选数据
      localStorage.removeItem("chatTab_selectedCharacterId");
      localStorage.removeItem("chatTab_selectedWorldSettingId");
    }, []);

    // 当novelId或fixedCategoryId变化时清理配置
    useEffect(() => {
      // 只在实际变化时清理，不在组件卸载时清理
      const savedNovelId = localStorage.getItem("chatTab_currentNovelId");
      const savedCategoryId = localStorage.getItem("chatTab_currentCategoryId");

      const novelChanged =
        novelId && savedNovelId && String(novelId) !== savedNovelId;
      const categoryChanged =
        String(fixedCategoryId || "") !== (savedCategoryId || "");

      if (novelChanged || categoryChanged) {
        // 切换到不同作品或不同分类，清理之前的配置和消息
        localStorage.removeItem("chatTab_selectedPrompt");
        localStorage.removeItem("chatTab_promptParameters");
        localStorage.removeItem("chatTab_selectedCharacterIds");
        localStorage.removeItem("chatTab_selectedWorldSettingIds");

        // 清理旧会话的数据
        if (novelChanged && savedNovelId) {
          const oldSessionId = sessionStorage.getItem(
            `pageSession_${savedNovelId}`
          );
          if (oldSessionId) {
            localStorage.removeItem(
              `chatTab_messages_${savedNovelId}_${oldSessionId}`
            );
            localStorage.removeItem(
              `chatTab_currentChatId_${savedNovelId}_${oldSessionId}`
            );
          }
        }

        // 清理当前会话的消息（切换分类时）
        if (categoryChanged) {
          localStorage.removeItem(
            `chatTab_messages_${novelId}_${pageSessionId}`
          );
          localStorage.removeItem(
            `chatTab_currentChatId_${novelId}_${pageSessionId}`
          );
        }

        // 重置状态
        setMessages([]);
        setCurrentChatId(`chat_${Date.now()}`);
        setSavedMessageCount(0);
      }

      // 保存当前novelId和categoryId
      if (novelId) {
        localStorage.setItem("chatTab_currentNovelId", String(novelId));
      }
      localStorage.setItem(
        "chatTab_currentCategoryId",
        String(fixedCategoryId || "")
      );
    }, [novelId, fixedCategoryId, pageSessionId]);

    // 保存messages到localStorage（支持手机端持久化）
    useEffect(() => {
      if (novelId && messages.length > 0) {
        localStorage.setItem(
          `chatTab_messages_${novelId}_${pageSessionId}`,
          JSON.stringify(messages)
        );
      }
    }, [messages, novelId, pageSessionId]);

    // 保存currentChatId到localStorage
    useEffect(() => {
      if (novelId && currentChatId) {
        localStorage.setItem(
          `chatTab_currentChatId_${novelId}_${pageSessionId}`,
          currentChatId
        );
      }
    }, [currentChatId, novelId, pageSessionId]);

    // 移除了 localStorage 持久化 - 提示词配置应该是会话级别的

    // 暴露方法给父组件
    useImperativeHandle(
      ref,
      () => ({
        clearChat: async () => {
          // 保存当前对话到历史记录
          await saveCurrentChat();
          // 清空当前对话
          setMessages([]);
          setCurrentChatId(`chat_${Date.now()}`); // 使用 chat_ 前缀标识临时ID
          setSavedMessageCount(0); // 重置已保存消息数量

          // 清理localStorage
          if (novelId) {
            localStorage.removeItem(
              `chatTab_messages_${novelId}_${pageSessionId}`
            );
            localStorage.removeItem(
              `chatTab_currentChatId_${novelId}_${pageSessionId}`
            );
          }

          showSuccess("已创建新对话");
        },
        loadHistory: async (historyId: number) => {
          try {
            const currentId = Number(currentChatId);

            // 检查是否点击的是当前对话
            if (!isNaN(currentId) && currentId === historyId) {
              showSuccess("已经是当前对话");
              return;
            }

            // 只在当前是新对话（临时ID）且有消息时才保存
            const isCurrentNewChat =
              isNaN(currentId) ||
              currentId === 0 ||
              String(currentChatId).startsWith("chat_");
            if (isCurrentNewChat && messages.length > 0) {
              await saveCurrentChat();
            }

            // 从后端加载历史记录
            const response = await chatHistoriesApi.getDetail(historyId);
            const chatHistory = response.data.data;

            // 调试日志
            console.log("加载历史记录 - 原始响应:", response.data);
            console.log("加载历史记录 - chatHistory:", chatHistory);
            console.log("加载历史记录 - messages:", chatHistory.messages);

            // 转换消息格式
            const loadedMessages: Message[] = (chatHistory.messages || []).map(
              (msg: any, index: number) => ({
                id: `msg_${index}`,
                role: msg.isUser ? "user" : "assistant", // 修正：使用isUser而不是is_user
                content: msg.mes,
                timestamp: msg.sendDate, // 使用后端返回的时间戳
                config: msg.extra,
              })
            );

            // 更新状态
            setMessages(loadedMessages);
            setCurrentChatId(String(historyId));
            setSavedMessageCount(loadedMessages.length); // 设置已保存消息数量

            // 清理localStorage中的旧数据，使用新加载的数据
            if (novelId) {
              localStorage.setItem(
                `chatTab_messages_${novelId}_${pageSessionId}`,
                JSON.stringify(loadedMessages)
              );
              localStorage.setItem(
                `chatTab_currentChatId_${novelId}_${pageSessionId}`,
                String(historyId)
              );
            }

            showSuccess("已加载历史对话");
          } catch (error) {
            showError("加载历史对话失败");
            console.error("加载历史失败:", error);
          }
        },
        saveCurrentChat: async () => {
          await saveCurrentChat();
        },
        handleDeleteHistory: (deletedHistoryId: number) => {
          // 检查删除的历史记录是否是当前正在使用的聊天
          const currentId = Number(currentChatId);
          if (!isNaN(currentId) && currentId === deletedHistoryId) {
            // 是当前聊天，创建新聊天
            setMessages([]);
            setCurrentChatId(`chat_${Date.now()}`);
            setSavedMessageCount(0);

            // 清理localStorage
            if (novelId) {
              localStorage.removeItem(
                `chatTab_messages_${novelId}_${pageSessionId}`
              );
              localStorage.removeItem(
                `chatTab_currentChatId_${novelId}_${pageSessionId}`
              );
            }

            showSuccess("已删除当前对话，已创建新对话");
          }
        },
        // 面板模式调用：程序化发送消息
        triggerSend: async (config: {
          promptId: number;
          modelId: number;
          temperature: number;
          parameters: Record<string, string>;
          characterIds: number[];
          worldSettingIds: number[];
          memoIds: number[];
          chapterSelections: Array<{ id: number; useSummary: boolean }>;
        }) => {
          // TODO: 实现程序化发送消息
          console.log("triggerSend called with config:", config);
        },
        // 获取最新的助手消息（用于结果模态窗）
        getLatestAssistantMessage: () => {
          const assistantMessages = messages.filter(
            (msg) => msg.role === "assistant"
          );
          return assistantMessages.length > 0
            ? assistantMessages[assistantMessages.length - 1].content
            : "";
        },
        // 获取生成状态
        getIsGenerating: () => {
          return generatingMessageId !== null;
        },
      }),
      [novelId, currentChatId, messages, pageSessionId, generatingMessageId]
    );

    // 保存当前对话到历史记录（后端API）
    const saveCurrentChat = async () => {
      if (messages.length === 0) return;

      try {
        console.log("保存对话 - currentChatId:", currentChatId);
        const chatId = Number(currentChatId);
        const isNewChat = isNaN(chatId) || chatId === 0;
        console.log("保存对话 - chatId:", chatId, "isNewChat:", isNewChat);

        // 准备消息数据（过滤掉正在生成的消息和空消息）
        const validMessages = messages.filter(
          (msg) => !msg.isGenerating && msg.content.trim() !== ""
        );

        if (validMessages.length === 0) return; // 没有有效消息，不保存

        const messagesData = validMessages.map((msg) => ({
          name: msg.role === "user" ? "用户" : "AI助手",
          isUser: msg.role === "user",
          mes: msg.content,
          sendDate: msg.timestamp || Date.now(), // 使用消息创建时间
          extra: msg.config,
        }));

        if (isNewChat) {
          // 创建新的聊天历史（AI写作模式）
          const chatName =
            validMessages[0]?.content.slice(0, 50) || "未命名对话";
          const response = await chatHistoriesApi.create({
            chatName,
            novelId, // 关联小说ID
            categoryId: fixedCategoryId, // 创意工坊分类ID
            chatMetadata: {
              scenarioType: ChatScenarioType.WRITING, // AI写作模式（与后端GenerationMode.WRITING一致）
              preview:
                validMessages[validMessages.length - 1]?.content.slice(
                  0,
                  100
                ) || "",
            },
          });

          const newChatId = response.data.data.id;
          setCurrentChatId(String(newChatId));

          // 批量创建消息
          await messagesApi.batchCreate(newChatId, messagesData);

          // 更新已保存消息数量（使用有效消息数量）
          setSavedMessageCount(validMessages.length);
        } else {
          // 增量更新现有聊天
          const chatName =
            validMessages[0]?.content.slice(0, 50) || "未命名对话";
          const preview =
            validMessages[validMessages.length - 1]?.content.slice(0, 100) ||
            "";

          // 更新聊天名称和预览
          await chatHistoriesApi.update(chatId, {
            chatName,
            chatMetadata: {
              scenarioType: ChatScenarioType.WRITING,
              preview,
            },
          });

          // 只保存新增的有效消息（增量更新）
          if (validMessages.length > savedMessageCount) {
            const newMessages = messagesData.slice(savedMessageCount);
            if (newMessages.length > 0) {
              await messagesApi.batchCreate(chatId, newMessages);
              // 更新已保存消息数量（使用有效消息数量）
              setSavedMessageCount(validMessages.length);
            }
          }
        }
      } catch (error) {
        console.error("保存对话失败:", error);
        // 保存失败不影响用户体验，只记录日志
      }
    };

    // 自动保存对话（消息变化时）
    useEffect(() => {
      // 只在有新消息时才保存（messages.length > savedMessageCount）
      if (messages.length > 0 && messages.length > savedMessageCount) {
        const timer = setTimeout(() => {
          saveCurrentChat();
        }, 2000); // 2秒后自动保存
        return () => clearTimeout(timer);
      }
    }, [messages, savedMessageCount]);

    // 检查是否在底部（允许10px误差）
    const isAtBottom = React.useCallback(() => {
      if (!messagesContainerRef.current) return true;
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      return scrollHeight - scrollTop - clientHeight < 10;
    }, []);

    // 监听滚动事件，检测用户干预
    useEffect(() => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const handleScroll = () => {
        // 如果用户滚动到底部，重新开启自动滚动
        if (isAtBottom()) {
          setAutoScrollEnabled(true);
        } else {
          // 如果用户向上滚动（干预），关闭自动滚动
          setAutoScrollEnabled(false);
        }
      };

      container.addEventListener("scroll", handleScroll, { passive: true });
      return () => container.removeEventListener("scroll", handleScroll);
    }, [isAtBottom]);

    // 自动滚动到底部（消息变化时）
    const scrollToBottom = React.useCallback((smooth = true) => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? "smooth" : "auto",
          block: "end",
        });
      }
    }, []);

    // 监听消息变化，智能自动滚动
    useEffect(() => {
      if (messages.length > 0 && autoScrollEnabled) {
        // 只有开启自动滚动时才滚动到底部
        setTimeout(() => scrollToBottom(true), 100);
      }
    }, [messages, scrollToBottom, autoScrollEnabled]);

    // 格式化参数值显示（将{{@::}}格式转换为友好的UI显示）
    const formatParameterValue = (value: string): string => {
      if (!value) return value;

      let result = value;

      // 匹配并替换新格式引用
      const newFormatRegex =
        /\{\{@::(人物卡|世界观|备忘录|章节)::(\d+)(?:::(full|summary))?\}\}/g;
      result = result.replace(
        newFormatRegex,
        (match, type, idStr, chapterType) => {
          const id = parseInt(idStr, 10);

          if (type === "章节") {
            const chapter = chapters.find((c) => c.id === id);
            return chapter
              ? `章节(${chapter.title})[${
                  chapterType === "summary" ? "梗概" : "全文"
                }]`
              : `章节#${id}`;
          } else if (type === "人物卡") {
            const character = characters.find((c) => c.id === id);
            return character ? `人物卡(${character.name})` : `人物卡#${id}`;
          } else if (type === "世界观") {
            const worldSetting = worldSettings.find((w) => w.id === id);
            return worldSetting
              ? `世界观(${worldSetting.name})`
              : `世界观#${id}`;
          } else if (type === "备忘录") {
            const memo = allMemos.find((m) => m.id === id);
            return memo ? `备忘录(${memo.title})` : `备忘录#${id}`;
          }
          return match;
        }
      );

      return result;
    };

    // 分析提示词内容，提取需要的配置
    const promptConfig = useMemo(() => {
      if (!selectedPrompt) {
        return {
          hasParameters: false,
          parameters: [] as PromptParameter[],
          hasCharacter: false,
          hasWorldview: false,
        };
      }

      let hasParameters = false;
      let parameters: PromptParameter[] = [];
      let hasCharacter = false;
      let hasWorldview = false;

      // 优先从独立的parameters字段读取（内容不公开时）
      if (
        (selectedPrompt as any).parameters &&
        (selectedPrompt as any).parameters.length > 0
      ) {
        hasParameters = true;
        parameters = (selectedPrompt as any).parameters;
      }
      // 否则从contents中提取（内容公开时）
      else if (selectedPrompt.contents) {
        selectedPrompt.contents.forEach((content) => {
          // 检查是否有参数
          if (content.parameters && content.parameters.length > 0) {
            hasParameters = true;
            parameters = [...parameters, ...content.parameters];
          }
          // 检查是否需要人物卡
          if (content.type === "character" && content.isEnabled) {
            hasCharacter = true;
          }
          // 检查是否需要世界观
          if (content.type === "worldview" && content.isEnabled) {
            hasWorldview = true;
          }
        });
      }

      const config = {
        hasParameters,
        parameters,
        hasCharacter,
        hasWorldview,
      };

      return config;
    }, [selectedPrompt]);

    // 加载人物卡列表（始终加载，用于@ 关联和提示词配置）
    useEffect(() => {
      if (novelId) {
        const loadCharacters = async () => {
          try {
            const data = await charactersApi.getCharacters(novelId);
            setCharacters(data);
          } catch (error) {
            console.error("加载人物卡列表失败:", error);
          }
        };
        loadCharacters();
      }
    }, [novelId]);

    // 加载世界观列表（始终加载，用于@ 关联和提示词配置）
    useEffect(() => {
      if (novelId) {
        const loadWorldSettings = async () => {
          try {
            const data = await worldSettingsApi.getWorldSettings(novelId);
            setWorldSettings(data);
          } catch (error) {
            console.error("加载世界观列表失败:", error);
          }
        };
        loadWorldSettings();
      }
    }, [novelId]);

    // 加载备忘录列表（用于@ 关联）
    useEffect(() => {
      if (novelId) {
        const loadMemos = async () => {
          try {
            const data = await memosApi.getMemos(novelId);
            setAllMemos(data);
          } catch (error) {
            console.error("加载备忘录列表失败:", error);
          }
        };
        loadMemos();
      }
    }, [novelId]);

    // 当选择的提示词改变时，重置参数和选择（但保留历史消息）
    useEffect(() => {
      if (selectedPrompt) {
        // 初始化参数（设置默认值为空字符串）
        const initialParams: Record<string, string> = {};
        promptConfig.parameters.forEach((param) => {
          initialParams[param.name] = "";
        });
        setPromptParameters(initialParams);
        setSelectedCharacterIds([]);
        setSelectedWorldSettingIds([]);
      }
    }, [selectedPrompt, promptConfig.parameters]);

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
            // 保存到 localStorage
            localStorage.setItem(
              "chatTab_selectedModel",
              defaultModel.id.toString()
            );
            localStorage.setItem(
              "chatTab_selectedModelName",
              defaultModel.displayName
            );
          } else if (selectedModel && modelsData.length > 0) {
            const model = modelsData.find((m) => m.id === selectedModel);
            if (model) {
              setSelectedModelName(model.displayName);
              // 更新 localStorage
              localStorage.setItem(
                "chatTab_selectedModelName",
                model.displayName
              );
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
            // 保存到 localStorage
            localStorage.setItem(
              "chatTab_temperature",
              preference.temperature.toString()
            );
            // 加载历史消息数量限制
            if (preference.historyMessageLimit !== undefined) {
              setHistoryMessageLimit(preference.historyMessageLimit);
              localStorage.setItem(
                "chatTab_historyMessageLimit",
                preference.historyMessageLimit.toString()
              );
            }
          }
        } catch (error) {
          // 错误已在 API 服务中处理，这里无需额外处理
          console.log("未找到模型偏好设置，使用默认值");
        }
      };

      loadModelPreference();
    }, [selectedModel]);

    const handleSend = async () => {
      if (!inputValue.trim() && files.length === 0) return;

      // ===== 参数验证逻辑 =====
      // 如果选择了提示词，需要先获取详情并验证必填参数
      if (selectedPrompt?.id) {
        try {
          // 1. 获取提示词配置信息（包含参数定义，不包含敏感内容）
          const promptDetail = await promptsApi.getPromptConfig(
            selectedPrompt.id
          );

          // 2. 验证必填参数
          if (promptDetail.contents && promptDetail.contents.length > 0) {
            const validationErrors = validateRequiredParameters(
              promptDetail.contents,
              promptParameters
            );

            // 3. 如果有缺失的必填参数，提示用户并阻止发送
            if (validationErrors.length > 0) {
              const errorMessage = formatValidationErrors(validationErrors);
              showError(errorMessage);
              return; // 阻止发送
            }
          }

          // 4. 验证通过，记录使用行为（增加使用次数）
          try {
            await promptsApi.usePrompt(selectedPrompt.id);
          } catch (useError) {
            console.warn("记录提示词使用失败:", useError);
            // 使用记录失败不影响发送，继续执行
          }
        } catch (err) {
          console.error("验证参数失败:", err);
          showError(
            "验证参数失败，请稍后重试",
            err instanceof Error ? err.message : "未知错误"
          );
          return;
        }
      }
      // ===== 验证逻辑结束 =====

      // 构建用户消息（不添加提示词内容，由后端处理）
      const timestamp = Date.now();
      const userMessage: Message = {
        id: timestamp.toString(),
        role: "user",
        content: inputValue,
        timestamp, // 记录创建时间
        config: {
          promptName: selectedPrompt?.name,
          promptId: selectedPrompt?.id,
          // 注意：不保存 promptContent，这是敏感信息
          parameters:
            Object.keys(promptParameters).length > 0
              ? promptParameters
              : undefined,
          // 保存 ID（用于后端重建）和 names（用于前端显示）
          characterIds:
            selectedCharacterIds.length > 0 ? selectedCharacterIds : undefined,
          characterNames: selectedCharacterIds
            .map((id) => characters.find((c) => c.id === id)?.name)
            .filter(Boolean) as string[],
          worldSettingIds:
            selectedWorldSettingIds.length > 0
              ? selectedWorldSettingIds
              : undefined,
          worldSettingNames: selectedWorldSettingIds
            .map((id) => worldSettings.find((w) => w.id === id)?.name)
            .filter(Boolean) as string[],
          mentionedCharacters: mentionedCharacters.map((c) => c.name),
          mentionedWorlds: mentionedWorldSettings.map((w) => w.name),
          mentionedMemos: mentionedMemos.map((m) => m.title),
          mentionedChapters: mentionedChapters.map((c) => c.title),
        },
      };

      // 添加用户消息
      setMessages((prev) => [...prev, userMessage]);

      // 立即清空输入框和相关状态，提升用户体验
      setInputValue("");
      setFiles([]);
      setMentionedCharacters([]);
      setMentionedWorldSettings([]);
      setMentionedMemos([]);
      setMentionedChapters([]);

      // 构建mentionedChapters（仅来自底部输入框的直接引用）
      // 参数中的章节引用（{{@::章节::ID::type}}）由后端宏系统处理，不需要在这里解析
      const allMentionedChapters: Array<{
        chapterId: number;
        type: "full" | "summary";
      }> = mentionedChapters.map((c) => ({
        chapterId: c.id,
        type: c.useSummary ? "summary" : "full",
      }));

      // 构建配置数据（传给后端）
      const config = {
        promptId: selectedPrompt?.id,
        parameters:
          Object.keys(promptParameters).length > 0
            ? promptParameters
            : undefined,
        characterIds:
          selectedCharacterIds.length > 0 ? selectedCharacterIds : undefined,
        worldSettingIds:
          selectedWorldSettingIds.length > 0
            ? selectedWorldSettingIds
            : undefined,
        modelId: selectedModel || undefined,
        temperature: temperature,
        mentionedCharacterIds: mentionedCharacters.map((c) => c.id),
        mentionedWorldSettingIds: mentionedWorldSettings.map((w) => w.id),
        mentionedMemoIds: mentionedMemos.map((m) => m.id),
        mentionedChapters:
          allMentionedChapters.length > 0 ? allMentionedChapters : undefined,
        useInputAsSystemPrompt: !selectedPrompt,
      };

      console.log("发送消息配置:", config);

      // 添加AI消息占位符（生成中）
      const aiTimestamp = Date.now() + 1;
      const aiMessageId = aiTimestamp.toString();
      const aiMessage: Message = {
        id: aiMessageId,
        role: "assistant",
        content: "",
        timestamp: aiTimestamp, // 记录创建时间
        isGenerating: true,
      };
      setMessages((prev) => [...prev, aiMessage]);
      setGeneratingMessageId(aiMessageId);

      // 准备历史消息（不包含当前的AI占位符，包含完整配置用于后端重建）
      const history: Array<{
        role: "user" | "assistant";
        content: string;
        promptId?: number;
        parameters?: Record<string, string>;
        characterIds?: number[];
        worldSettingIds?: number[];
      }> = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
        promptId: msg.config?.promptId, // 传递 promptId 让后端重建 system 消息
        parameters: msg.config?.parameters, // 传递参数让后端重建时使用
        characterIds: msg.config?.characterIds, // 传递人物卡ID让后端重建时使用
        worldSettingIds: msg.config?.worldSettingIds, // 传递世界观ID让后端重建时使用
      }));

      // 调用真实的AI API（流式生成）
      try {
        const cancel = await generationApi.generateWritingStream(
          {
            novelId: novelId, // 传递作品ID，支持参数中的@引用
            promptId: config.promptId,
            parameters: config.parameters,
            userInput: userMessage.content, // 使用保存的消息内容
            modelId: config.modelId ? String(config.modelId) : undefined,
            temperature,
            historyMessageLimit:
              historyMessageLimit > 0 ? historyMessageLimit : undefined, // 历史消息数量限制
            history,
            characterIds: config.characterIds, // 用户选择的人物卡（填充插槽）
            worldSettingIds: config.worldSettingIds, // 用户选择的世界观（填充插槽）
            mentionedCharacterIds: config.mentionedCharacterIds, // @引用的人物卡
            mentionedWorldSettingIds: config.mentionedWorldSettingIds, // @引用的世界观
            mentionedMemoIds: config.mentionedMemoIds, // @引用的备忘录
            mentionedChapters: config.mentionedChapters, // @引用的章节（包含ID和类型）
          },
          // onMessage: 每次接收到新内容
          (content: string) => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? { ...msg, content: msg.content + content }
                  : msg
              )
            );
          },
          // onComplete: 生成完成
          () => {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId ? { ...msg, isGenerating: false } : msg
              )
            );
            setGeneratingMessageId(null);
            generationCancelRef.current = null;

            // 生成完成后立即保存（确保完整内容被保存）
            setTimeout(() => {
              saveCurrentChat();
            }, 500);
          },
          // onError: 错误处理
          (error: Error) => {
            console.error("AI生成错误:", error);
            const errorMessage = error.message || "未知错误";
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiMessageId
                  ? {
                      ...msg,
                      content: msg.content
                        ? `${msg.content}\n\n---\n❌ 生成中断: ${errorMessage}`
                        : `❌ 生成失败: ${errorMessage}`,
                      isGenerating: false,
                    }
                  : msg
              )
            );
            setGeneratingMessageId(null);
            generationCancelRef.current = null;
            showError("AI生成失败", errorMessage);
          }
        );

        generationCancelRef.current = cancel;
      } catch (error) {
        console.error("AI生成错误:", error);
        const errorMessage =
          error instanceof Error ? error.message : "未知错误";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? {
                  ...msg,
                  content: `生成失败: ${errorMessage}`,
                  isGenerating: false,
                }
              : msg
          )
        );
        setGeneratingMessageId(null);
        showError("AI生成失败", errorMessage);
      }

      // 调用父组件的回调（使用保存的消息内容）
      onSendMessage(userMessage.content, [], [], config);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    // 停止生成
    const handleStopGeneration = () => {
      if (generationCancelRef.current) {
        generationCancelRef.current();
        generationCancelRef.current = null;
      }
      if (generatingMessageId) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === generatingMessageId
              ? { ...msg, isGenerating: false }
              : msg
          )
        );
        setGeneratingMessageId(null);
      }
    };

    // 复制消息
    const handleCopyMessage = async (content: string) => {
      const { copyToClipboard } = await import("../../../../utils/clipboard");
      const success = await copyToClipboard(content);

      if (success) {
        showSuccess("已复制到剪贴板");
      } else {
        console.error("复制失败");
        showError("复制失败，请重试");
      }
    };

    // 应用到编辑器
    const handleApplyMessage = (content: string) => {
      if (onApplyToEditor) {
        onApplyToEditor(content);
        showSuccess("已应用到编辑器");
      } else {
        showError("编辑器功能未就绪");
      }
    };

    // 处理消息悬停 - 避免提示词配置遮挡操作按钮
    const handleMessageHover = React.useCallback(
      (messageId: string, isEnter: boolean) => {
        // 只在桌面端处理（移动端使用点击）
        if (window.innerWidth < 1024) return;

        // 检查是否有提示词配置（无论折叠还是展开）
        const hasPromptConfig = selectedPrompt && !loadingPrompt;
        if (!hasPromptConfig) {
          setHoveringMessage(null);
          return;
        }

        if (isEnter) {
          // 鼠标进入消息：记录悬停状态（隐藏提示词配置窗口）
          setHoveringMessage(messageId);
        } else {
          // 鼠标离开消息：清除悬停状态
          setHoveringMessage(null);
        }
      },
      [selectedPrompt, loadingPrompt]
    );

    // 处理输入变化 - 检测 @ 符号
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursorPosition = e.target.selectionStart;
      const oldValue = inputValue;

      setInputValue(newValue);

      console.log("输入变化:", {
        oldValue,
        newValue,
        cursorPosition,
        lastChar: newValue[cursorPosition - 1],
        isAt: newValue[cursorPosition - 1] === "@",
      });

      // 检测是否刚输入了 @
      if (
        newValue[cursorPosition - 1] === "@" &&
        newValue.length > oldValue.length
      ) {
        console.log("检测到@输入，显示菜单");
        setShowAtMenu(true);
      } else if (showAtMenu) {
        // 如果已经显示菜单，检查是否删除了@
        const textBeforeCursor = newValue.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        // 如果光标前没有@或者@后面已经有内容了，关闭菜单
        if (lastAtIndex === -1 || cursorPosition - lastAtIndex > 1) {
          setShowAtMenu(false);
        }
      }
    };

    // 选择 @ 类型后，移除输入框中的 @
    const handleSelectMentionType = (
      type: "character" | "world" | "memo" | "chapter"
    ) => {
      // 如果没有关联作品，触发请求关联
      if (!novelId && onRequestNovel) {
        onRequestNovel();
        setShowAtMenu(false);
        return;
      }

      // 移除最后一个 @
      const lastAtIndex = inputValue.lastIndexOf("@");
      if (lastAtIndex !== -1) {
        setInputValue(
          inputValue.substring(0, lastAtIndex) +
            inputValue.substring(lastAtIndex + 1)
        );
      }

      setShowAtMenu(false);

      // 打开对应的模态窗时，初始化临时选中状态为当前已选中的
      if (type === "character") {
        setTempMentionedCharacters([...mentionedCharacters]);
        setShowMentionCharacterModal(true);
      } else if (type === "world") {
        setTempMentionedWorldSettings([...mentionedWorldSettings]);
        setShowMentionWorldModal(true);
      } else if (type === "memo") {
        setTempMentionedMemos([...mentionedMemos]);
        setShowMentionMemoModal(true);
      } else if (type === "chapter") {
        setShowMentionChapterModal(true);
      }
    };

    return (
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* 对话区域 */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto min-h-0 px-4 py-6"
        >
          {messages.length === 0 ? (
            /* 背景图标 - 无消息时显示 */
            <div className="flex items-center justify-center h-full text-center text-gray-400">
              <div>
                {/* 图标 - 脉动动画 */}
                <div className="relative w-32 h-32 mx-auto mb-6">
                  {/* 外层脉动圆环 */}
                  <div
                    className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping"
                    style={{ animationDuration: "2s" }}
                  ></div>
                  <div className="absolute inset-0 bg-blue-300/10 rounded-full animate-pulse"></div>

                  {/* 中层圆环 */}
                  <div
                    className="absolute inset-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-60 animate-pulse"
                    style={{ animationDuration: "3s" }}
                  ></div>

                  {/* 核心图标区域 */}
                  <div className="absolute inset-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <MessageCircle
                      className="w-12 h-12 text-white"
                      strokeWidth={2}
                    />
                  </div>
                </div>

                {/* 提示文字 */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  对话区域，输入任何你对小说的疑问，
                  <br />
                  比如"人物设定如何修改"，"文章建议"。
                </p>
              </div>
            </div>
          ) : (
            /* 消息列表 */
            <div className="space-y-4 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {/* AI头像 */}
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}

                  {/* 消息内容 */}
                  <div
                    className={`flex-1 max-w-[80%] ${
                      message.role === "user" ? "text-right" : ""
                    }`}
                  >
                    {message.role === "user" ? (
                      /* 用户消息 */
                      <div>
                        <div className="inline-block text-left">
                          {/* 用户输入+提示词 */}
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
                            <div className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </div>
                            {message.config?.promptName && (
                              <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-90">
                                <button
                                  onClick={() =>
                                    setExpandedPromptConfig(
                                      expandedPromptConfig === message.id
                                        ? null
                                        : message.id
                                    )
                                  }
                                  className="inline-flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"
                                  title="点击查看提示词配置"
                                >
                                  <Sparkles className="w-3 h-3" />@
                                  {message.config.promptName}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 提示词配置详情（可展开）- 移到外层以获得完整宽度 */}
                        {message.config?.promptName &&
                          expandedPromptConfig === message.id &&
                          (() => {
                            const paramCount = message.config.parameters
                              ? Object.keys(message.config.parameters).length
                              : 0;
                            const hasCharacters =
                              message.config.characterNames &&
                              message.config.characterNames.length > 0;
                            const hasWorlds =
                              message.config.worldSettingNames &&
                              message.config.worldSettingNames.length > 0;

                            // 智能判断是否需要滚动条
                            const needsScroll =
                              paramCount >= 4 || // 参数4个及以上，直接启用
                              (paramCount >= 3 && hasWorlds) || // 参数3个及以上 + 世界观
                              (paramCount >= 2 && hasCharacters && hasWorlds); // 参数2个及以上 + 人物卡 + 世界观

                            return (
                              <div className="mt-2 bg-gray-800/90 backdrop-blur-sm rounded-lg text-xs text-white border border-gray-600/50 shadow-lg">
                                {/* 固定头部 */}
                                <div className="flex items-center justify-between p-3 pb-2">
                                  <div className="font-semibold flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    提示词配置
                                  </div>
                                  <button
                                    onClick={() =>
                                      setExpandedPromptConfig(null)
                                    }
                                    className="text-white/70 hover:text-white transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* 可滚动内容区域 */}
                                <div
                                  className={`px-3 pb-3 space-y-2 ${
                                    needsScroll
                                      ? "max-h-64 overflow-y-auto message-config-scroll"
                                      : ""
                                  }`}
                                  style={
                                    needsScroll
                                      ? ({
                                          scrollbarWidth: "thin",
                                          scrollbarColor:
                                            "#4b5563 rgba(31, 41, 55, 0.5)",
                                        } as React.CSSProperties)
                                      : undefined
                                  }
                                >
                                  {/* 参数 */}
                                  {message.config.parameters &&
                                    paramCount > 0 && (
                                      <div>
                                        <div className="text-white/80 font-medium mb-1">
                                          参数：
                                        </div>
                                        <div className="space-y-1 pl-2">
                                          {Object.entries(
                                            message.config.parameters
                                          ).map(([key, value]) => (
                                            <div
                                              key={key}
                                              className="flex gap-2"
                                            >
                                              <span className="text-white/60">
                                                {key}:
                                              </span>
                                              <span className="flex-1 break-words">
                                                {formatParameterValue(value)}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                  {/* 人物卡 */}
                                  {message.config.characterNames &&
                                    message.config.characterNames.length >
                                      0 && (
                                      <div>
                                        <div className="text-white/80 font-medium mb-1 flex items-center gap-1.5">
                                          <User className="w-3 h-3" />
                                          人物卡：
                                        </div>
                                        <div className="pl-2 text-white/90">
                                          {message.config.characterNames.join(
                                            "、"
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* 世界观 */}
                                  {message.config.worldSettingNames &&
                                    message.config.worldSettingNames.length >
                                      0 && (
                                      <div>
                                        <div className="text-white/80 font-medium mb-1 flex items-center gap-1.5">
                                          <Globe className="w-3 h-3" />
                                          世界观：
                                        </div>
                                        <div className="pl-2 text-white/90">
                                          {message.config.worldSettingNames.join(
                                            "、"
                                          )}
                                        </div>
                                      </div>
                                    )}

                                  {/* 如果没有任何配置 */}
                                  {paramCount === 0 &&
                                    (!message.config.characterNames ||
                                      message.config.characterNames.length ===
                                        0) &&
                                    (!message.config.worldSettingNames ||
                                      message.config.worldSettingNames
                                        .length === 0) && (
                                      <div className="text-white/60 text-center py-2">
                                        该提示词无额外配置
                                      </div>
                                    )}
                                </div>
                              </div>
                            );
                          })()}

                        {/* 关联信息（提示词配置的人物卡和世界观） */}
                        {(message.config?.characterNames &&
                          message.config.characterNames.length > 0) ||
                        (message.config?.worldSettingNames &&
                          message.config.worldSettingNames.length > 0) ? (
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            {message.config?.characterNames &&
                              message.config.characterNames.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3 h-3" />
                                  <span>
                                    提示词人物卡:{" "}
                                    {message.config.characterNames.join("、")}
                                  </span>
                                </div>
                              )}
                            {message.config?.worldSettingNames &&
                              message.config.worldSettingNames.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-3 h-3" />
                                  <span>
                                    提示词世界观:{" "}
                                    {message.config.worldSettingNames.join(
                                      "、"
                                    )}
                                  </span>
                                </div>
                              )}
                          </div>
                        ) : null}

                        {/* @关联的信息 */}
                        {(message.config?.mentionedCharacters &&
                          message.config.mentionedCharacters.length > 0) ||
                        (message.config?.mentionedWorlds &&
                          message.config.mentionedWorlds.length > 0) ||
                        (message.config?.mentionedMemos &&
                          message.config.mentionedMemos.length > 0) ||
                        (message.config?.mentionedChapters &&
                          message.config.mentionedChapters.length > 0) ? (
                          <div className="mt-2 text-xs text-gray-500 space-y-1">
                            {message.config.mentionedCharacters &&
                              message.config.mentionedCharacters.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3 h-3" />
                                  <span>
                                    关联人物卡:{" "}
                                    {message.config.mentionedCharacters.join(
                                      "、"
                                    )}
                                  </span>
                                </div>
                              )}
                            {message.config.mentionedWorlds &&
                              message.config.mentionedWorlds.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <Globe className="w-3 h-3" />
                                  <span>
                                    关联世界观:{" "}
                                    {message.config.mentionedWorlds.join("、")}
                                  </span>
                                </div>
                              )}
                            {message.config.mentionedMemos &&
                              message.config.mentionedMemos.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span>📝</span>
                                  <span>
                                    关联备忘录:{" "}
                                    {message.config.mentionedMemos.join("、")}
                                  </span>
                                </div>
                              )}
                            {message.config.mentionedChapters &&
                              message.config.mentionedChapters.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <span>📖</span>
                                  <span>
                                    关联章节:{" "}
                                    {message.config.mentionedChapters.join(
                                      "、"
                                    )}
                                  </span>
                                </div>
                              )}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      /* AI消息 */
                      <div
                        ref={(el) => {
                          if (el) {
                            messageRefs.current.set(message.id, el);
                          } else {
                            messageRefs.current.delete(message.id);
                          }
                        }}
                        className="group"
                        onMouseEnter={() =>
                          handleMessageHover(message.id, true)
                        }
                        onMouseLeave={() =>
                          handleMessageHover(message.id, false)
                        }
                        onClick={() => {
                          // 移动端：点击消息切换按钮显示，同时隐藏提示词配置
                          if (window.innerWidth < 1024) {
                            setMobileActiveMessage(
                              mobileActiveMessage === message.id
                                ? null
                                : message.id
                            );
                            // 如果有提示词配置，点击消息时隐藏配置窗口
                            if (selectedPrompt && !loadingPrompt) {
                              setHoveringMessage(
                                hoveringMessage === message.id
                                  ? null
                                  : message.id
                              );
                            }
                          }
                        }}
                      >
                        <div
                          className={`bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm ${
                            message.isGenerating
                              ? "border-2 border-blue-400"
                              : "border border-gray-200"
                          }`}
                        >
                          {message.content ? (
                            <div className="text-sm text-gray-900 markdown-content">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  p: ({ children }) => (
                                    <p className="my-2 leading-relaxed">
                                      {children}
                                    </p>
                                  ),
                                  h1: ({ children }) => (
                                    <h1 className="text-xl font-semibold mt-4 mb-2">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="text-lg font-semibold mt-4 mb-2">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="text-base font-semibold mt-3 mb-2">
                                      {children}
                                    </h3>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="my-2 ml-4 list-disc space-y-1">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="my-2 ml-4 list-decimal space-y-1">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => (
                                    <li className="my-1">{children}</li>
                                  ),
                                  code: ({ inline, children, ...props }: any) =>
                                    inline ? (
                                      <code
                                        className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-800"
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    ) : (
                                      <code
                                        className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs font-mono my-2"
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    ),
                                  pre: ({ children }) => (
                                    <pre className="my-2">{children}</pre>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700 my-2">
                                      {children}
                                    </blockquote>
                                  ),
                                  a: ({ children, href }) => (
                                    <a
                                      href={href}
                                      className="text-blue-600 hover:underline"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {children}
                                    </a>
                                  ),
                                  strong: ({ children }) => (
                                    <strong className="font-semibold">
                                      {children}
                                    </strong>
                                  ),
                                  em: ({ children }) => (
                                    <em className="italic">{children}</em>
                                  ),
                                  table: ({ children }) => (
                                    <table className="border-collapse w-full my-2">
                                      {children}
                                    </table>
                                  ),
                                  th: ({ children }) => (
                                    <th className="border border-gray-300 bg-gray-50 px-3 py-2 text-left">
                                      {children}
                                    </th>
                                  ),
                                  td: ({ children }) => (
                                    <td className="border border-gray-300 px-3 py-2">
                                      {children}
                                    </td>
                                  ),
                                  hr: () => (
                                    <hr className="my-4 border-gray-300" />
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          ) : message.isGenerating ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                              <div
                                className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                                style={{ animationDelay: "0.4s" }}
                              ></div>
                            </div>
                          ) : null}
                        </div>

                        {/* 操作按钮组 - PC端悬停显示，移动端点击显示 */}
                        <div
                          className={`mt-2 flex items-center gap-2 transition-opacity ${
                            message.isGenerating
                              ? ""
                              : mobileActiveMessage === message.id
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100"
                          }`}
                        >
                          {message.isGenerating ? (
                            /* 正在生成：显示停止按钮（始终可见） */
                            <button
                              onClick={handleStopGeneration}
                              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                              title="停止生成"
                            >
                              <StopCircle className="w-3.5 h-3.5" />
                              <span>停止</span>
                            </button>
                          ) : message.content ? (
                            /* 生成完成：显示复制和应用按钮（悬停时显示） */
                            <>
                              <button
                                onClick={() =>
                                  handleCopyMessage(message.content)
                                }
                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="复制内容"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>复制</span>
                              </button>
                              <button
                                onClick={() =>
                                  handleApplyMessage(message.content)
                                }
                                className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                title="应用到编辑器"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>应用</span>
                              </button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 用户头像 */}
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-sm">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {/* 滚动锚点 */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 输入区域 - 固定在底部 */}
        <div className="flex-shrink-0 border-t border-gray-200/50 bg-white/50 p-4 relative">
          {/* 加载提示词状态 - 悬浮样式 */}
          {loadingPrompt && (
            <div className="absolute bottom-full left-0 right-0 mb-2 z-10 p-3 bg-blue-50/90 backdrop-blur-sm border border-blue-200 rounded-lg text-center shadow-lg">
              <div className="text-xs text-blue-600">正在加载提示词详情...</div>
            </div>
          )}

          {/* 提示词配置区域 - 悬浮在输入框上方（限制最大高度，避免遮挡上方内容） */}
          {selectedPrompt && !loadingPrompt && !isConfigCollapsed && (
            <div
              className={`absolute bottom-full left-0 right-0 mb-2 z-10 max-h-[40vh] sm:max-h-[50vh] overflow-hidden transition-opacity duration-200 ${
                hoveringMessage
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              {/* 提示词参数输入区 */}
              {(promptConfig.hasParameters ||
                promptConfig.hasCharacter ||
                promptConfig.hasWorldview) && (
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50/50 to-purple-50/30 border-2 border-blue-200/60 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
                  {/* 配置头部 - 可折叠 */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/60 transition-all backdrop-blur-sm"
                    onClick={() => setIsConfigCollapsed(!isConfigCollapsed)}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm transition-transform ${
                          isConfigCollapsed ? "" : "rotate-90"
                        }`}
                      >
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          提示词配置
                        </div>
                        <div className="text-[10px] text-gray-600 mt-0.5 max-w-[150px] truncate">
                          {selectedPrompt.name}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPrompt(null);
                        setPromptParameters({});
                        setSelectedCharacterIds([]);
                        setSelectedWorldSettingIds([]);
                      }}
                      className="text-xs text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 px-3 py-1.5 rounded-lg transition-all font-semibold shadow-sm hover:shadow-md"
                    >
                      清除
                    </button>
                  </div>

                  {/* 配置内容 - 可折叠（限制最大高度，确保可滚动） */}
                  {!isConfigCollapsed && (
                    <div className="relative">
                      <div
                        className="px-3 pb-3 space-y-3.5 bg-white/40 backdrop-blur-sm max-h-48 sm:max-h-72 overflow-y-auto prompt-config-scroll"
                        style={
                          {
                            scrollbarWidth: "thin",
                            scrollbarColor: "#60a5fa #e0e7ff",
                          } as React.CSSProperties
                        }
                      >
                        {/* 原有配置内容 */}

                        {/* 参数输入 */}
                        {promptConfig.hasParameters && (
                          <div className="space-y-2.5">
                            <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                              <div className="w-1 h-3.5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                              参数设置
                            </div>
                            <div className="grid grid-cols-1 gap-2.5">
                              {promptConfig.parameters.map((param) => (
                                <ParameterInput
                                  key={param.name}
                                  paramName={param.name}
                                  value={promptParameters[param.name] || ""}
                                  onChange={(newValue) =>
                                    setPromptParameters({
                                      ...promptParameters,
                                      [param.name]: newValue,
                                    })
                                  }
                                  placeholder={
                                    param.description || `请输入${param.name}`
                                  }
                                  required={param.required}
                                  description={param.description}
                                  characters={characters}
                                  worldSettings={worldSettings}
                                  memos={allMemos}
                                  chapters={chapters}
                                  volumes={volumes}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 人物卡选择 */}
                        {promptConfig.hasCharacter && (
                          <div className="space-y-2.5">
                            <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                              <div className="w-1 h-3.5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              人物卡
                            </div>
                            {!novelId ? (
                              <div className="text-xs text-gray-500 py-2 px-3 bg-white/50 rounded-lg border border-gray-200/50">
                                ⚠️ 请先选择作品
                              </div>
                            ) : characters.length === 0 ? (
                              <div className="text-xs text-gray-500 py-2 px-3 bg-white/50 rounded-lg border border-gray-200/50">
                                💡 暂无人物卡，请先在作品中创建
                              </div>
                            ) : (
                              <button
                                onClick={async () => {
                                  // 打开前先刷新人物卡列表，获取最新数据
                                  if (novelId) {
                                    try {
                                      const data =
                                        await charactersApi.getCharacters(
                                          novelId
                                        );
                                      setCharacters(data);
                                    } catch (error) {
                                      console.error(
                                        "刷新人物卡列表失败:",
                                        error
                                      );
                                    }
                                  }
                                  setShowCharacterModal(true);
                                }}
                                className="group w-full px-3 py-2.5 text-sm bg-white/90 border-2 border-gray-200/60 rounded-lg hover:border-blue-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-left transition-all"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 bg-blue-50 rounded-md group-hover:bg-blue-100 transition-colors">
                                    <User className="w-3.5 h-3.5 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {selectedCharacterIds.length > 0 ? (
                                      <>
                                        <div className="text-gray-900 font-medium">
                                          已选择 {selectedCharacterIds.length}{" "}
                                          个
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                                          {selectedCharacterIds
                                            .map(
                                              (id) =>
                                                characters.find(
                                                  (c) => c.id === id
                                                )?.name
                                            )
                                            .filter(Boolean)
                                            .join("、")}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-gray-400">
                                        点击选择人物卡（可多选）
                                      </div>
                                    )}
                                  </div>
                                  <svg
                                    className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </div>
                              </button>
                            )}
                          </div>
                        )}

                        {/* 世界观选择 */}
                        {promptConfig.hasWorldview && (
                          <div className="space-y-2.5">
                            <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                              <div className="w-1 h-3.5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                              <Globe className="w-3.5 h-3.5 text-indigo-600" />
                              世界观
                            </div>
                            {!novelId ? (
                              <div className="text-xs text-gray-500 py-2 px-3 bg-white/50 rounded-lg border border-gray-200/50">
                                ⚠️ 请先选择作品
                              </div>
                            ) : worldSettings.length === 0 ? (
                              <div className="text-xs text-gray-500 py-2 px-3 bg-white/50 rounded-lg border border-gray-200/50">
                                💡 暂无世界观，请先在作品中创建
                              </div>
                            ) : (
                              <button
                                onClick={async () => {
                                  // 打开前先刷新世界观列表，获取最新数据
                                  if (novelId) {
                                    try {
                                      const data =
                                        await worldSettingsApi.getWorldSettings(
                                          novelId
                                        );
                                      setWorldSettings(data);
                                    } catch (error) {
                                      console.error(
                                        "刷新世界观列表失败:",
                                        error
                                      );
                                    }
                                  }
                                  setShowWorldSettingModal(true);
                                }}
                                className="group w-full px-3 py-2.5 text-sm bg-white/90 border-2 border-gray-200/60 rounded-lg hover:border-indigo-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-left transition-all"
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 bg-indigo-50 rounded-md group-hover:bg-indigo-100 transition-colors">
                                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {selectedWorldSettingIds.length > 0 ? (
                                      <>
                                        <div className="text-gray-900 font-medium">
                                          已选择{" "}
                                          {selectedWorldSettingIds.length} 个
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                                          {selectedWorldSettingIds
                                            .map(
                                              (id) =>
                                                worldSettings.find(
                                                  (s) => s.id === id
                                                )?.name
                                            )
                                            .filter(Boolean)
                                            .join("、")}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="text-gray-400">
                                        点击选择世界观（可多选）
                                      </div>
                                    )}
                                  </div>
                                  <svg
                                    className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5l7 7-7 7"
                                    />
                                  </svg>
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* 滚动提示 - 底部渐变 */}
                      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 to-transparent pointer-events-none"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 提示词无需配置提示（折叠时显示）- 悬浮样式 */}
          {selectedPrompt &&
            !loadingPrompt &&
            isConfigCollapsed &&
            !promptConfig.hasParameters &&
            !promptConfig.hasCharacter &&
            !promptConfig.hasWorldview && (
              <div
                className={`absolute bottom-full left-0 right-0 mb-2 z-10 p-2.5 bg-green-50/90 backdrop-blur-sm border border-green-200 rounded-lg shadow-lg transition-opacity duration-200 ${
                  hoveringMessage
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100"
                }`}
              >
                <div className="text-xs text-green-700 text-center">
                  ✓ 已选择「{selectedPrompt.name}」
                </div>
              </div>
            )}

          {/* 配置折叠按钮（当有配置但折叠时显示）- 悬浮样式 */}
          {selectedPrompt &&
            !loadingPrompt &&
            isConfigCollapsed &&
            (promptConfig.hasParameters ||
              promptConfig.hasCharacter ||
              promptConfig.hasWorldview) && (
              <button
                onClick={() => setIsConfigCollapsed(false)}
                className={`absolute bottom-full left-0 right-0 mb-2 z-10 w-full p-2.5 bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm border border-blue-200 rounded-lg hover:border-blue-300 transition-all text-xs font-medium text-blue-700 flex items-center justify-center gap-2 shadow-lg ${
                  hoveringMessage
                    ? "opacity-0 pointer-events-none"
                    : "opacity-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>展开提示词配置</span>
              </button>
            )}

          {/* @ 关联标签显示区 */}
          {(mentionedCharacters.length > 0 ||
            mentionedWorldSettings.length > 0 ||
            mentionedMemos.length > 0 ||
            mentionedChapters.length > 0) && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {mentionedCharacters.map((char) => (
                <div
                  key={`char-${char.id}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium"
                >
                  <User className="w-3 h-3" />
                  <span>人物卡({char.name})</span>
                  <button
                    onClick={() =>
                      setMentionedCharacters(
                        mentionedCharacters.filter((c) => c.id !== char.id)
                      )
                    }
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {mentionedWorldSettings.map((world) => (
                <div
                  key={`world-${world.id}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium"
                >
                  <Globe className="w-3 h-3" />
                  <span>世界观({world.name})</span>
                  <button
                    onClick={() =>
                      setMentionedWorldSettings(
                        mentionedWorldSettings.filter((w) => w.id !== world.id)
                      )
                    }
                    className="hover:bg-indigo-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {mentionedMemos.map((memo) => (
                <div
                  key={`memo-${memo.id}`}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium"
                >
                  <span className="text-sm">📝</span>
                  <span>备忘录({memo.title})</span>
                  <button
                    onClick={() =>
                      setMentionedMemos(
                        mentionedMemos.filter((m) => m.id !== memo.id)
                      )
                    }
                    className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {mentionedChapters.map((chapter) => (
                <div
                  key={`chapter-${chapter.id}`}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    chapter.useSummary
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  <span className="text-sm">📖</span>
                  <span>
                    章节({chapter.title})
                    <span className="ml-1 opacity-75">
                      [{chapter.useSummary ? "梗概" : "全文"}]
                    </span>
                  </span>
                  <button
                    onClick={() =>
                      setMentionedChapters(
                        mentionedChapters.filter((c) => c.id !== chapter.id)
                      )
                    }
                    className={`rounded-full p-0.5 transition-colors ${
                      chapter.useSummary
                        ? "hover:bg-blue-200"
                        : "hover:bg-green-200"
                    }`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 输入框 */}
          <div className="relative mb-3 group">
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="请输入指令，使用@可以快速关联内容"
              className="w-full px-4 py-3 pr-12 pl-4 pb-12 bg-white border-2 border-gray-200/60 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 resize-none text-sm transition-all shadow-sm focus:shadow-md placeholder:text-gray-400"
              rows={3}
            />

            {/* @ 菜单浮窗（输入@时显示） - 固定在输入框上方 */}
            {showAtMenu && (
              <>
                {/* 背景遮罩 */}
                <div
                  className="fixed inset-0 z-[9998]"
                  onClick={() => setShowAtMenu(false)}
                ></div>

                {/* 菜单 - 相对于输入框定位 */}
                <div className="absolute bottom-full left-4 mb-2 z-[9999] bg-white rounded-xl shadow-2xl border-2 border-blue-200 py-2 min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 pb-2 border-b border-gray-100">
                    <div className="text-xs font-semibold text-gray-600">
                      选择关联类型
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectMentionType("character")}
                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors flex items-center gap-2.5"
                  >
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-700">人物卡</span>
                  </button>
                  <button
                    onClick={() => handleSelectMentionType("world")}
                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-indigo-50 transition-colors flex items-center gap-2.5"
                  >
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="font-medium text-gray-700">世界观</span>
                  </button>
                  <button
                    onClick={() => handleSelectMentionType("memo")}
                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-purple-50 transition-colors flex items-center gap-2.5"
                  >
                    <div className="p-1.5 bg-purple-100 rounded-lg text-base">
                      📝
                    </div>
                    <span className="font-medium text-gray-700">备忘录</span>
                  </button>
                  <button
                    onClick={() => handleSelectMentionType("chapter")}
                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-green-50 transition-colors flex items-center gap-2.5"
                  >
                    <div className="p-1.5 bg-green-100 rounded-lg text-base">
                      📖
                    </div>
                    <span className="font-medium text-gray-700">章节</span>
                  </button>
                </div>
              </>
            )}

            {/* 功能按钮 - 在输入框内 */}
            <div className="absolute left-2 bottom-2 flex items-center gap-1">
              {/* @ 关联按钮 - 点击显示菜单 */}
              <div className="relative">
                <button
                  onClick={() => {
                    // 如果没有关联作品，触发请求关联
                    if (!novelId && onRequestNovel) {
                      onRequestNovel();
                      return;
                    }
                    setShowAtButtonMenu(!showAtButtonMenu);
                  }}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1.5 transition-all"
                  title={novelId ? "关联内容" : "需要先关联作品"}
                >
                  <span className="text-sm font-semibold">@</span>
                  <span className="hidden sm:inline">关联</span>
                </button>

                {/* 下拉菜单 - 点击显示 */}
                {showAtButtonMenu && (
                  <>
                    {/* 背景遮罩 */}
                    <div
                      className="fixed inset-0 z-[9998]"
                      onClick={() => setShowAtButtonMenu(false)}
                    ></div>

                    {/* 菜单 */}
                    <div className="absolute bottom-full left-0 mb-1 z-[9999] bg-white rounded-xl shadow-2xl border-2 border-blue-200 py-2 min-w-[150px] animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-2 pb-1.5 border-b border-gray-100">
                        <div className="text-xs font-semibold text-gray-600">
                          选择关联类型
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (!novelId && onRequestNovel) {
                            setShowAtButtonMenu(false);
                            onRequestNovel();
                            return;
                          }
                          setShowAtButtonMenu(false);
                          setShowMentionCharacterModal(true);
                        }}
                        className="w-full px-3 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors flex items-center gap-2.5"
                      >
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <User className="w-3.5 h-3.5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-700">
                          人物卡
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          if (!novelId && onRequestNovel) {
                            setShowAtButtonMenu(false);
                            onRequestNovel();
                            return;
                          }
                          setShowAtButtonMenu(false);
                          setShowMentionWorldModal(true);
                        }}
                        className="w-full px-3 py-2.5 text-sm text-left hover:bg-indigo-50 transition-colors flex items-center gap-2.5"
                      >
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                          <Globe className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-700">
                          世界观
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          if (!novelId && onRequestNovel) {
                            setShowAtButtonMenu(false);
                            onRequestNovel();
                            return;
                          }
                          setShowAtButtonMenu(false);
                          setShowMentionMemoModal(true);
                        }}
                        className="w-full px-3 py-2.5 text-sm text-left hover:bg-purple-50 transition-colors flex items-center gap-2.5"
                      >
                        <div className="p-1.5 bg-purple-100 rounded-lg text-base">
                          📝
                        </div>
                        <span className="font-medium text-gray-700">
                          备忘录
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          if (!novelId && onRequestNovel) {
                            setShowAtButtonMenu(false);
                            onRequestNovel();
                            return;
                          }
                          setShowAtButtonMenu(false);
                          setShowMentionChapterModal(true);
                        }}
                        className="w-full px-3 py-2.5 text-sm text-left hover:bg-green-50 transition-colors flex items-center gap-2.5"
                      >
                        <div className="p-1.5 bg-green-100 rounded-lg text-base">
                          📖
                        </div>
                        <span className="font-medium text-gray-700">章节</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg px-2 py-1.5 transition-all"
                title="添加文件"
              >
                <span className="text-sm">📎</span>
                <span className="hidden sm:inline">文件</span>
              </button>
            </div>

            {/* 发送按钮 */}
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() && files.length === 0}
              className="absolute right-2 bottom-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              title="发送"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>

          {/* 选择提示词和专业模型 */}
          <div className="flex items-center gap-2">
            {/* 选择提示词按钮 */}
            <button
              onClick={() => {
                console.log(
                  "🔘 [ChatTab] 点击选择提示词按钮，当前selectedPrompt:",
                  selectedPrompt?.name || "null"
                );
                setShowPromptModal(true);
              }}
              style={{
                backgroundColor: selectedPrompt ? "#eff6ff" : "#ffffff",
                borderColor: selectedPrompt ? "#93c5fd" : "#e5e7eb",
              }}
              className={`flex-1 px-3 py-2 border rounded-lg text-sm text-left transition-all min-w-0 ${
                selectedPrompt
                  ? "hover:border-blue-400"
                  : "hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles
                  className={`w-4 h-4 flex-shrink-0 ${
                    selectedPrompt ? "text-blue-500" : "text-gray-400"
                  }`}
                />
                <span
                  className={`truncate min-w-0 flex-1 ${
                    selectedPrompt
                      ? "text-blue-900 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {(() => {
                    const displayText = selectedPrompt?.name || "选择提示词";
                    return displayText;
                  })()}
                </span>
                {selectedPrompt && (
                  <X
                    className="w-3.5 h-3.5 text-blue-500 hover:text-blue-700 flex-shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPrompt(null);
                      setPromptParameters({});
                      setSelectedCharacterIds([]);
                      setSelectedWorldSettingIds([]);
                    }}
                  />
                )}
              </div>
            </button>

            {/* 专业模型按钮 */}
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
          selectedPromptId={selectedPrompt?.id || null}
          fixedCategoryId={fixedCategoryId} // 传入固定的分类ID
          onSelect={async (prompt) => {
            setShowPromptModal(false);
            setLoadingPrompt(true);
            try {
              // 如果后端返回成功，说明用户有权使用该提示词（无需检查contents）
              setSelectedPrompt(prompt);
              showSuccess("已选择提示词", prompt.name);
            } catch (error) {
              console.error("选择提示词失败:", error);
              showError("操作失败，请重试");
            } finally {
              setLoadingPrompt(false);
            }
          }}
        />

        {/* 模型配置模态框 */}
        <ModelConfigModal
          isOpen={showModelConfig}
          onClose={() => setShowModelConfig(false)}
          currentModel={selectedModel}
          currentTemperature={temperature}
          currentHistoryMessageLimit={historyMessageLimit}
          onSave={async (modelId, temp, histLimit) => {
            try {
              // 保存到后端
              await userPreferencesApi.createOrUpdate({
                modelId: modelId,
                temperature: temp,
                historyMessageLimit: histLimit,
              });

              // 更新本地状态
              setSelectedModel(modelId);
              setTemperature(temp);
              setHistoryMessageLimit(histLimit);

              // 更新模型显示名称
              const model = models.find((m) => m.id === modelId);
              if (model) {
                setSelectedModelName(model.displayName);
                // 保存到 localStorage
                localStorage.setItem(
                  "chatTab_selectedModel",
                  modelId.toString()
                );
                localStorage.setItem(
                  "chatTab_selectedModelName",
                  model.displayName
                );
              }
              localStorage.setItem("chatTab_temperature", temp.toString());
              localStorage.setItem(
                "chatTab_historyMessageLimit",
                histLimit.toString()
              );
            } catch (error) {
              console.error("保存模型配置失败:", error);
              showError("保存模型配置失败");
            }
          }}
        />

        {/* 人物卡选择模态窗 */}
        <CharacterSelectionModal
          isOpen={showCharacterModal}
          onClose={() => setShowCharacterModal(false)}
          characters={characters}
          selectedIds={selectedCharacterIds}
          onConfirm={(selectedIds) => {
            setSelectedCharacterIds(selectedIds);
            setShowCharacterModal(false);
          }}
          title="选择人物卡"
          allowMultiple={true}
        />

        {/* 世界观选择模态窗 */}
        <WorldSettingSelectionModal
          isOpen={showWorldSettingModal}
          onClose={() => setShowWorldSettingModal(false)}
          worldSettings={worldSettings}
          selectedIds={selectedWorldSettingIds}
          onConfirm={(selectedIds) => {
            setSelectedWorldSettingIds(selectedIds);
            setShowWorldSettingModal(false);
          }}
          title="选择世界观"
          allowMultiple={true}
        />

        {/* @ 关联人物卡模态窗 */}
        {showMentionCharacterModal && novelId && (
          <CharacterSelectionModal
            isOpen={showMentionCharacterModal}
            onClose={() => {
              setTempMentionedCharacters([]);
              setShowMentionCharacterModal(false);
            }}
            characters={characters}
            selectedIds={tempMentionedCharacters.map((c) => c.id)}
            onConfirm={(selectedIds) => {
              const selectedCharacters = characters.filter((c) =>
                selectedIds.includes(c.id)
              );
              setMentionedCharacters(selectedCharacters);
              setTempMentionedCharacters([]);
              setShowMentionCharacterModal(false);
            }}
            title="关联人物卡"
            allowMultiple={true}
          />
        )}

        {/* @ 关联世界观模态窗 */}
        {showMentionWorldModal && novelId && (
          <WorldSettingSelectionModal
            isOpen={showMentionWorldModal}
            onClose={() => {
              setTempMentionedWorldSettings([]);
              setShowMentionWorldModal(false);
            }}
            worldSettings={worldSettings}
            selectedIds={tempMentionedWorldSettings.map((w) => w.id)}
            onConfirm={(selectedIds) => {
              const selectedWorldSettings = worldSettings.filter((w) =>
                selectedIds.includes(w.id)
              );
              setMentionedWorldSettings(selectedWorldSettings);
              setTempMentionedWorldSettings([]);
              setShowMentionWorldModal(false);
            }}
            title="关联世界观"
            allowMultiple={true}
          />
        )}

        {/* @ 关联备忘录模态窗 */}
        {showMentionMemoModal && novelId && (
          <MemoSelectionModal
            isOpen={showMentionMemoModal}
            onClose={() => {
              setTempMentionedMemos([]);
              setShowMentionMemoModal(false);
            }}
            memos={allMemos}
            selectedIds={tempMentionedMemos.map((m) => m.id)}
            onConfirm={(selectedIds) => {
              const selectedMemos = allMemos.filter((m) =>
                selectedIds.includes(m.id)
              );
              setMentionedMemos(selectedMemos);
              setTempMentionedMemos([]);
              setShowMentionMemoModal(false);
            }}
            title="关联备忘录"
            allowMultiple={true}
          />
        )}

        {/* 章节选择模态框 */}
        <ChapterSelectionModal
          isOpen={showMentionChapterModal}
          onClose={() => setShowMentionChapterModal(false)}
          chapters={chapters}
          volumes={volumes}
          selectedChapters={mentionedChapters}
          onConfirm={(selectedChapters) => {
            setMentionedChapters(selectedChapters);
            setShowMentionChapterModal(false);
          }}
        />
      </div>
    );
  }
);
