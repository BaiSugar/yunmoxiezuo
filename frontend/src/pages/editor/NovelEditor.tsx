import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { novelsApi } from "../../services/novels.api";
import { editorSettingsApi } from "../../services/editor-settings.api";
import { fontsApi } from "../../services/fonts.api";
import { FontLoader } from "../../utils/fontLoader";
import type { EditorSettings } from "../../types/editor-settings";
import {
  EditorHeader,
  EditorContent,
  ChapterList,
  AIAssistant,
  ResizeDivider,
  CreateVolumeModal,
  CreateChapterModal,
  MobileDrawer,
  MobileToolbar,
  MobileBottomSheet,
  MobileEditorTools,
  ChangeVolumeSheet,
  MobileSortModal,
  EditorSettingsModal,
} from "./components";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { getEditorBackgroundStyle } from "../../utils/editorBackground";
import { VersionHistoryModal } from "./components/VersionHistoryModal";
import { CharactersPage } from "./characters";
import { WorldSettingsPage } from "./world-settings";
import { MemosPage } from "./memos";
import type { Chapter, Volume, DragState } from "./components";
import type { EditorContentRef } from "./components/EditorContent";
import type { SortUpdate } from "./components/MobileSortModal";

/**
 * 作品编辑器页面
 */
const NovelEditor: React.FC = () => {
  const navigate = useNavigate();
  const { novelId } = useParams<{ novelId: string }>();
  const { error: showError, success: showSuccess } = useToast();
  const { user, isAuthenticated } = useAuth();

  // 作品信息
  const [novelName, setNovelName] = useState("加载中...");
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  // 分卷和章节数据
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [standaloneChapters, setStandaloneChapters] = useState<Chapter[]>([]); // 独立章节
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [chapterContent, setChapterContent] = useState("");

  // 拖拽状态
  const [dragState, setDragState] = useState<DragState>({
    draggedItem: null,
    dropTarget: null,
  });

  // UI状态
  const [loading, setLoading] = useState(true);
  // TODO: 文本选中工具栏功能待实现
  // const [selectionToolbar, setSelectionToolbar] = useState<SelectionToolbarState>({
  //   show: false,
  //   x: 0,
  //   y: 0,
  //   selectedText: "",
  // });
  const [showCreateVolumeModal, setShowCreateVolumeModal] = useState(false);
  const [showCreateChapterModal, setShowCreateChapterModal] = useState(false);
  const [preselectedVolumeId, setPreselectedVolumeId] = useState<number | null>(
    null
  );

  // 移动端抽屉状态
  const [showMobileChapters, setShowMobileChapters] = useState(false);
  const [showMobileAI, setShowMobileAI] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);
  const [showChangeVolume, setShowChangeVolume] = useState(false);
  const [showMobileSortModal, setShowMobileSortModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false); // 历史版本模态窗
  const [showCharacters, setShowCharacters] = useState(false); // 人物卡页面
  const [showWorldSettings, setShowWorldSettings] = useState(false); // 世界观页面
  const [showMemos, setShowMemos] = useState(false); // 备忘录页面
  const [showEditorSettings, setShowEditorSettings] = useState(false); // 编辑器设置模态窗

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // 编辑器设置
  const [editorSettings, setEditorSettings] = useState<EditorSettings | null>(
    null
  );

  // 侧边栏宽度
  const [leftWidth, setLeftWidth] = useState(256); // 默认 w-64 = 256px
  const [rightWidth, setRightWidth] = useState(320); // 默认 w-80 = 320px
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  // 自动保存定时器
  const saveTimerRef = useRef<number | null>(null);
  const editorContentRef = useRef<EditorContentRef>(null);

  // 加载编辑器设置 - 当用户切换时自动刷新
  useEffect(() => {
    if (isAuthenticated && user) {
      loadEditorSettings();
    } else {
      // 用户未登录时清空设置
      setEditorSettings(null);
    }
  }, [user?.id, isAuthenticated]);

  // 模拟数据加载
  useEffect(() => {
    loadNovelData();
  }, [novelId]);

  const loadEditorSettings = async () => {
    try {
      // 1. 加载字体列表并预加载字体文件（系统字体 + 用户字体）
      const fonts = await fontsApi.getEnabledFonts();
      await FontLoader.loadFonts(fonts);

      // 2. 加载用户的编辑器设置
      const settings = await editorSettingsApi.getSettings();
      setEditorSettings(settings);
    } catch (error) {
      console.error("加载编辑器设置失败:", error);
      // 使用默认设置，不影响编辑器正常使用
    }
  };

  const loadNovelData = async () => {
    if (!novelId) return;

    setLoading(true);
    try {
      // 获取作品基本信息
      const novel = await novelsApi.getNovel(Number(novelId));
      setNovelName(novel.name);

      // 获取所有章节
      const allChapters = await novelsApi.getChapters(Number(novelId));

      // 获取分卷列表
      const volumesData = await novelsApi.getVolumes(Number(novelId));

      // 处理分卷和章节数据
      const processedVolumes: Volume[] = volumesData
        .map((vol: any) => {
          // 获取该分卷下的章节
          const volumeChapters = allChapters
            .filter((ch: any) => ch.volumeId === vol.id)
            .map((ch: any) => ({
              id: ch.id,
              title: ch.title,
              volumeId: ch.volumeId,
              content: ch.content || "",
              summary: ch.summary || "",
              wordCount: ch.wordCount || 0,
              order: ch.order,
              globalOrder: ch.globalOrder,
            }))
            .sort((a, b) => a.order - b.order);

          return {
            id: vol.id,
            name: vol.name,
            order: vol.order,
            globalOrder: vol.globalOrder || vol.order,
            isCollapsed: false,
            chapters: volumeChapters,
          };
        })
        .sort((a, b) => a.globalOrder - b.globalOrder);

      // 处理独立章节（volumeId 为 null）
      const standaloneChaptersData: Chapter[] = allChapters
        .filter((ch: any) => ch.volumeId === null)
        .map((ch: any) => ({
          id: ch.id,
          title: ch.title,
          volumeId: null,
          content: ch.content || "",
          summary: ch.summary || "",
          wordCount: ch.wordCount || 0,
          order: ch.order,
          globalOrder: ch.globalOrder || 0,
        }))
        .sort((a, b) => (a.globalOrder || 0) - (b.globalOrder || 0));

      setVolumes(processedVolumes);
      setStandaloneChapters(standaloneChaptersData);

      // 设置默认选中的章节 - 选择 globalOrder 最大的章节（最新的章节）
      const allChaptersForSelection = [
        ...standaloneChaptersData,
        ...processedVolumes.flatMap((v) => v.chapters),
      ];

      if (allChaptersForSelection.length > 0) {
        // 找到 globalOrder 最大的章节（最新的章节）
        const latestChapter = allChaptersForSelection.reduce((max, ch) => {
          const chapterOrder = ch.globalOrder ?? ch.order ?? 0;
          const maxOrder = max.globalOrder ?? max.order ?? 0;
          return chapterOrder > maxOrder ? ch : max;
        });

        if (latestChapter) {
          setCurrentChapter(latestChapter);
          setChapterContent(latestChapter.content);
        }
      }

      setLoading(false);
    } catch (error: any) {
      console.error("加载作品数据失败:", error);
      showError(
        "加载失败",
        error.response?.data?.message || "无法加载作品数据"
      );
      setLoading(false);
    }
  };

  // 静默刷新数据（不显示加载界面）
  const refreshData = async () => {
    if (!novelId) return;

    try {
      // 获取作品基本信息
      const novel = await novelsApi.getNovel(Number(novelId));
      setNovelName(novel.name);

      // 获取所有章节
      const allChapters = await novelsApi.getChapters(Number(novelId));

      // 获取分卷列表
      const volumesData = await novelsApi.getVolumes(Number(novelId));

      // 处理分卷和章节数据
      const processedVolumes: Volume[] = volumesData
        .map((vol: any) => {
          // 获取该分卷下的章节
          const volumeChapters = allChapters
            .filter((ch: any) => ch.volumeId === vol.id)
            .map((ch: any) => ({
              id: ch.id,
              title: ch.title,
              volumeId: ch.volumeId,
              content: ch.content || "",
              summary: ch.summary || "",
              wordCount: ch.wordCount || 0,
              order: ch.order,
              globalOrder: ch.globalOrder,
            }))
            .sort((a, b) => a.order - b.order);

          return {
            id: vol.id,
            name: vol.name,
            order: vol.order,
            globalOrder: vol.globalOrder || vol.order,
            isCollapsed: false,
            chapters: volumeChapters,
          };
        })
        .sort((a, b) => a.globalOrder - b.globalOrder);

      // 处理独立章节（volumeId 为 null）
      const standaloneChaptersData: Chapter[] = allChapters
        .filter((ch: any) => ch.volumeId === null)
        .map((ch: any) => ({
          id: ch.id,
          title: ch.title,
          volumeId: null,
          content: ch.content || "",
          summary: ch.summary || "",
          wordCount: ch.wordCount || 0,
          order: ch.order,
          globalOrder: ch.globalOrder || 0,
        }))
        .sort((a, b) => (a.globalOrder || 0) - (b.globalOrder || 0));

      setVolumes(processedVolumes);
      setStandaloneChapters(standaloneChaptersData);
    } catch (error: any) {
      console.error("刷新作品数据失败:", error);
      showError(
        "刷新失败",
        error.response?.data?.message || "无法刷新作品数据"
      );
    }
  };

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setChapterContent(newContent);

    // 立即更新本地字数统计
    if (currentChapter) {
      // 从HTML中提取纯文本计算字数
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = newContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      const newWordCount = plainText.length;

      const updatedChapter = {
        ...currentChapter,
        content: newContent,
        wordCount: newWordCount,
      };
      setCurrentChapter(updatedChapter);

      // 同时更新列表中的章节字数
      updateChapterInList(currentChapter.id, { wordCount: newWordCount });
    }

    // 触发自动保存
    triggerAutoSave(newContent);
  };

  // 手动保存
  const handleManualSave = async () => {
    if (!currentChapter || autoSaving) return;

    // 清除自动保存定时器
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    setAutoSaving(true);
    try {
      // 更新章节内容
      await novelsApi.updateChapterContent(currentChapter.id, chapterContent);

      setLastSaveTime(new Date());
      showSuccess("保存成功", "章节内容已保存");
    } catch (error: any) {
      console.error("保存失败:", error);
      showError(
        "保存失败",
        error.response?.data?.message || "无法保存章节内容"
      );
    } finally {
      setAutoSaving(false);
    }
  };

  // 实时保存到云端（500ms防抖，避免过于频繁）
  const triggerAutoSave = (content: string) => {
    if (!currentChapter) return;

    // 清除之前的定时器
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // 500ms后保存（短暂防抖，避免每个字符都请求）
    saveTimerRef.current = setTimeout(async () => {
      setAutoSaving(true);
      try {
        await novelsApi.updateChapterContent(currentChapter.id, content);
        setLastSaveTime(new Date());
      } catch (error: any) {
        console.error("保存失败:", error);
        showError(
          "保存失败",
          error.response?.data?.message || "无法保存章节内容"
        );
      } finally {
        setAutoSaving(false);
      }
    }, 500); // 500ms防抖，既及时又不过于频繁
  };

  // 切换章节（从云端实时获取）
  const handleChapterClick = async (chapter: Chapter) => {
    // 先取消之前的自动保存定时器，避免切换时触发保存
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    try {
      // 从云端获取最新的章节内容
      const freshChapter = await novelsApi.getChapter(chapter.id);

      // 一次性更新章节和内容，避免中间状态
      setCurrentChapter({
        ...chapter,
        content: freshChapter.content || "",
        wordCount: freshChapter.wordCount || 0,
      });
      setChapterContent(freshChapter.content || "");

      // 同步更新本地章节列表中的数据
      updateChapterInList(chapter.id, {
        content: freshChapter.content || "",
        wordCount: freshChapter.wordCount || 0,
      });
    } catch (error: any) {
      console.error("加载章节失败:", error);
      showError(
        "加载失败",
        error.response?.data?.message || "无法加载章节内容"
      );
      // 失败时使用缓存的内容
      setCurrentChapter(chapter);
      setChapterContent(chapter.content || "");
    }
  };

  // 更新列表中的章节信息（辅助函数）
  const updateChapterInList = (
    chapterId: number,
    updates: Partial<Chapter>
  ) => {
    // 更新独立章节
    setStandaloneChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, ...updates } : ch))
    );

    // 更新分卷内章节
    setVolumes((prev) =>
      prev.map((vol) => ({
        ...vol,
        chapters: vol.chapters.map((ch) =>
          ch.id === chapterId ? { ...ch, ...updates } : ch
        ),
      }))
    );
  };

  // 应用AI生成内容到编辑器
  const handleApplyToEditor = (content: string) => {
    if (!currentChapter) {
      showError("请先选择一个章节");
      return;
    }

    if (editorContentRef.current) {
      editorContentRef.current.insertText(content);
    }
  };

  // 自动计算总字数（当章节列表变化时）
  React.useEffect(() => {
    const allChapters = [
      ...standaloneChapters,
      ...volumes.flatMap((v) => v.chapters),
    ];
    const total = allChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
    setTotalWordCount(total);
  }, [standaloneChapters, volumes]);

  // 处理章节标题变化
  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentChapter) return;

    const newTitle = e.target.value;

    // 立即更新当前章节
    setCurrentChapter({
      ...currentChapter,
      title: newTitle,
    });

    // 立即更新列表中的章节标题
    updateChapterInList(currentChapter.id, { title: newTitle });

    // 失焦时保存标题
    if (e.type === "blur") {
      try {
        await novelsApi.updateChapterTitle(currentChapter.id, newTitle);
        setLastSaveTime(new Date());
      } catch (error: any) {
        console.error("保存标题失败:", error);
        showError(
          "保存失败",
          error.response?.data?.message || "无法保存章节标题"
        );
      }
    }
  };

  // 处理保存章节梗概
  const handleSaveSummary = async (chapterId: number, summary: string) => {
    try {
      await novelsApi.updateChapterSummary(chapterId, summary);

      // 更新当前章节
      if (currentChapter && currentChapter.id === chapterId) {
        setCurrentChapter({
          ...currentChapter,
          summary,
        });
      }

      // 更新列表中的章节
      updateChapterInList(chapterId, { summary });

      setLastSaveTime(new Date());
      showSuccess("保存成功", "章节梗概已保存");
    } catch (error: any) {
      console.error("保存梗概失败:", error);
      showError(
        "保存失败",
        error.response?.data?.message || "无法保存章节梗概"
      );
      throw error; // 重新抛出错误，让组件知道保存失败
    }
  };

  // 创建分卷
  const handleCreateVolume = async (name: string, description?: string) => {
    if (!novelId) return;

    try {
      await novelsApi.createVolume(Number(novelId), { name, description });

      // 静默刷新数据（不显示加载界面）
      await refreshData();

      showSuccess("创建成功", `分卷"${name}"已创建`);
    } catch (error: any) {
      console.error("创建分卷失败:", error);
      showError("创建失败", error.response?.data?.message || "无法创建分卷");
      throw error;
    }
  };

  /**
   * 中文数字转阿拉伯数字的映射
   */
  const chineseToNumber = (chinese: string): number => {
    const map: Record<string, number> = {
      零: 0,
      一: 1,
      二: 2,
      三: 3,
      四: 4,
      五: 5,
      六: 6,
      七: 7,
      八: 8,
      九: 9,
      十: 10,
      百: 100,
      千: 1000,
      万: 10000,
    };

    if (chinese === "十") return 10;
    let result = 0;
    let temp = 0;

    for (let i = 0; i < chinese.length; i++) {
      const char = chinese[i];
      const num = map[char];

      if (num >= 10) {
        if (temp === 0) temp = 1;
        if (num === 10) {
          result += temp * num;
          temp = 0;
        } else {
          result += temp * num;
          temp = 0;
        }
      } else {
        temp = temp * 10 + num;
      }
    }

    return result + temp;
  };

  /**
   * 阿拉伯数字转中文数字
   */
  const numberToChinese = (num: number): string => {
    if (num <= 10) {
      return ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"][
        num
      ];
    }
    if (num < 20) {
      return (
        "十" +
        ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"][num - 10]
      );
    }
    if (num < 100) {
      const tens = Math.floor(num / 10);
      const ones = num % 10;
      return (
        ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"][tens] +
        "十" +
        (ones > 0
          ? ["", "一", "二", "三", "四", "五", "六", "七", "八", "九"][ones]
          : "")
      );
    }
    // 大于100的数字直接返回阿拉伯数字
    return num.toString();
  };

  /**
   * 从章节标题中提取数字序号
   * @returns 如果能识别出序号返回数字，否则返回 null
   */
  const extractChapterNumber = (title: string): number | null => {
    // 匹配各种数字格式
    const patterns = [
      /第(\d+)章/,
      /第(\d+)节/,
      /第([一二三四五六七八九十百千万]+)章/,
      /第([一二三四五六七八九十百千万]+)节/,
      /chapter\s*(\d+)/i,
      /(\d+)\./,
      /^(\d+)/,
    ];

    // 尝试匹配并提取数字
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        const numberStr = match[1];
        let currentNumber: number;

        // 判断是中文数字还是阿拉伯数字
        if (/^\d+$/.test(numberStr)) {
          currentNumber = parseInt(numberStr, 10);
        } else {
          currentNumber = chineseToNumber(numberStr);
        }

        return currentNumber;
      }
    }

    return null;
  };

  /**
   * 根据章节标题和序号生成下一章标题
   */
  const generateNextChapterTitle = (
    baseTitle: string,
    currentNumber: number
  ): string => {
    const nextNumber = currentNumber + 1;

    // 匹配各种数字格式，用于替换
    const patterns = [
      /第(\d+)章/,
      /第(\d+)节/,
      /第([一二三四五六七八九十百千万]+)章/,
      /第([一二三四五六七八九十百千万]+)节/,
      /chapter\s*(\d+)/i,
      /(\d+)\./,
      /^(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = baseTitle.match(pattern);
      if (match) {
        const numberStr = match[1];

        // 根据原格式生成新标题
        if (match[0].includes("章")) {
          // 判断原来是中文数字还是阿拉伯数字
          if (/^\d+$/.test(numberStr)) {
            return baseTitle.replace(pattern, `第${nextNumber}章`);
          } else {
            const nextChinese = numberToChinese(nextNumber);
            return baseTitle.replace(pattern, `第${nextChinese}章`);
          }
        } else if (match[0].includes("节")) {
          if (/^\d+$/.test(numberStr)) {
            return baseTitle.replace(pattern, `第${nextNumber}节`);
          } else {
            const nextChinese = numberToChinese(nextNumber);
            return baseTitle.replace(pattern, `第${nextChinese}节`);
          }
        } else if (/chapter/i.test(match[0])) {
          return baseTitle.replace(pattern, `Chapter ${nextNumber}`);
        } else {
          return baseTitle.replace(pattern, `${nextNumber}`);
        }
      }
    }

    // 如果没有匹配到格式，直接生成"第X章"
    return `第${nextNumber}章`;
  };

  /**
   * 查找前面有序号的章节
   * @param chapters 章节列表（已排序）
   * @param currentIndex 当前章节在列表中的索引
   * @returns 找到的章节序号，如果没找到返回 0（表示应该创建"第1章"）
   */
  const findPreviousChapterNumber = (
    chapters: Chapter[],
    currentIndex: number
  ): { number: number; baseTitle: string } => {
    // 从当前章节开始往前查找
    for (let i = currentIndex; i >= 0; i--) {
      const chapterNumber = extractChapterNumber(chapters[i].title);
      if (chapterNumber !== null) {
        return { number: chapterNumber, baseTitle: chapters[i].title };
      }
    }

    // 如果都找不到，返回 0
    return { number: 0, baseTitle: "第0章" };
  };

  // 快速创建章节（在指定章节后）
  const handleQuickCreateChapter = async (afterChapter: Chapter) => {
    if (!novelId) return;

    try {
      let nextTitle = "";
      let chapterNumber = extractChapterNumber(afterChapter.title);

      // 如果当前章节无法识别序号，往前查找
      if (chapterNumber === null) {
        if (afterChapter.volumeId === null) {
          // 独立章节：在独立章节列表中查找
          const currentIndex = standaloneChapters.findIndex(
            (ch) => ch.id === afterChapter.id
          );
          if (currentIndex !== -1) {
            const result = findPreviousChapterNumber(
              standaloneChapters,
              currentIndex
            );
            chapterNumber = result.number;
            nextTitle = generateNextChapterTitle(
              result.baseTitle,
              chapterNumber
            );
          }
        } else {
          // 分卷内章节：在该分卷内查找
          const volume = volumes.find((v) => v.id === afterChapter.volumeId);
          if (volume) {
            const currentIndex = volume.chapters.findIndex(
              (ch) => ch.id === afterChapter.id
            );
            if (currentIndex !== -1) {
              const result = findPreviousChapterNumber(
                volume.chapters,
                currentIndex
              );
              chapterNumber = result.number;
              nextTitle = generateNextChapterTitle(
                result.baseTitle,
                chapterNumber
              );
            }
          }
        }
      } else {
        // 当前章节能识别序号，直接生成下一章
        nextTitle = generateNextChapterTitle(afterChapter.title, chapterNumber);
      }

      // 如果还是没有标题，使用默认值
      if (!nextTitle) {
        nextTitle = "第1章";
      }

      // 如果是独立章节，计算globalOrder
      let globalOrder: number | undefined = undefined;
      if (afterChapter.volumeId === null) {
        globalOrder = (afterChapter.globalOrder || 0) + 1;
      }

      const newChapter = await novelsApi.createChapter({
        novelId: Number(novelId),
        title: nextTitle,
        volumeId: afterChapter.volumeId,
        content: "",
        globalOrder,
      });

      // 静默刷新数据
      await refreshData();

      // 自动切换到新创建的章节
      setTimeout(() => {
        handleChapterClick(newChapter as Chapter);
      }, 100);

      showSuccess("创建成功", `已创建章节：${nextTitle}`);
    } catch (error: any) {
      console.error("快速创建章节失败:", error);
      showError("创建失败", error.response?.data?.message || "无法创建章节");
    }
  };

  // 快速创建分卷内章节
  const handleQuickCreateChapterInVolume = async (
    volumeId: number,
    afterLastChapter?: Chapter
  ) => {
    if (!novelId) return;

    try {
      let nextTitle = "第1章";

      if (afterLastChapter) {
        let chapterNumber = extractChapterNumber(afterLastChapter.title);

        // 如果最后一章无法识别序号，往前查找
        if (chapterNumber === null) {
          const volume = volumes.find((v) => v.id === volumeId);
          if (volume && volume.chapters.length > 0) {
            const lastIndex = volume.chapters.length - 1;
            const result = findPreviousChapterNumber(
              volume.chapters,
              lastIndex
            );
            chapterNumber = result.number;
            nextTitle = generateNextChapterTitle(
              result.baseTitle,
              chapterNumber
            );
          }
        } else {
          // 能识别序号，直接生成下一章
          nextTitle = generateNextChapterTitle(
            afterLastChapter.title,
            chapterNumber
          );
        }
      }

      const newChapter = await novelsApi.createChapter({
        novelId: Number(novelId),
        title: nextTitle,
        volumeId,
        content: "",
      });

      // 静默刷新数据
      await refreshData();

      // 自动切换到新创建的章节
      setTimeout(() => {
        handleChapterClick(newChapter as Chapter);
      }, 100);

      showSuccess("创建成功", `已创建章节：${nextTitle}`);
    } catch (error: any) {
      console.error("快速创建章节失败:", error);
      showError("创建失败", error.response?.data?.message || "无法创建章节");
    }
  };

  // 创建章节
  const handleCreateChapter = async (
    title: string,
    volumeId: number | null
  ) => {
    if (!novelId) return;

    try {
      // 如果是独立章节，计算globalOrder
      let globalOrder: number | undefined = undefined;
      if (volumeId === null) {
        // 获取当前最大的globalOrder
        const allGlobalOrders = [
          ...standaloneChapters.map((c) => c.globalOrder || 0),
          ...volumes.map((v) => v.globalOrder || 0),
        ];
        const maxGlobalOrder =
          allGlobalOrders.length > 0 ? Math.max(...allGlobalOrders) : 0;
        globalOrder = maxGlobalOrder + 1;
      }

      const newChapter = await novelsApi.createChapter({
        novelId: Number(novelId),
        title,
        volumeId,
        content: "",
        globalOrder,
      });

      // 静默刷新数据（不显示加载界面）
      await refreshData();

      // 从刷新后的数据中找到新创建的章节（通过ID）并自动选中
      // 需要等待state更新，使用setTimeout延迟执行
      setTimeout(() => {
        const allChaptersAfterRefresh = [
          ...standaloneChapters,
          ...volumes.flatMap((v) => v.chapters),
        ];
        const createdChapter = allChaptersAfterRefresh.find(
          (c) => c.id === newChapter.id
        );
        if (createdChapter) {
          setCurrentChapter(createdChapter);
          setChapterContent(createdChapter.content);
        }
      }, 100);

      showSuccess("创建成功", `章节"${title}"已创建`);
    } catch (error: any) {
      console.error("创建章节失败:", error);
      showError("创建失败", error.response?.data?.message || "无法创建章节");
      throw error;
    }
  };

  // 添加章节到指定分卷
  const handleAddChapterToVolume = (volumeId: number) => {
    // 设置预选的分卷ID并打开创建章节模态框
    setPreselectedVolumeId(volumeId);
    setShowCreateChapterModal(true);
  };

  // 删除分卷
  const handleDeleteVolume = async (volumeId: number) => {
    const volume = volumes.find((v) => v.id === volumeId);
    if (!volume) return;

    // 显示自定义确认对话框
    setConfirmDialog({
      isOpen: true,
      title: "删除分卷",
      message: `确定要删除分卷"${volume.name}"吗？\n\n⚠️ 警告：分卷内的所有章节也将被删除！`,
      type: "danger",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          await novelsApi.deleteVolume(volumeId);
          await refreshData();
          showSuccess("删除成功", `分卷"${volume.name}"已删除`);
        } catch (error: any) {
          console.error("删除分卷失败:", error);
          showError(
            "删除失败",
            error.response?.data?.message || "无法删除分卷"
          );
        }
      },
    });
  };

  // 删除章节
  const handleDeleteChapter = async (chapterId: number) => {
    const chapter = [
      ...standaloneChapters,
      ...volumes.flatMap((v) => v.chapters),
    ].find((c) => c.id === chapterId);

    if (!chapter) return;

    // 显示自定义确认对话框
    setConfirmDialog({
      isOpen: true,
      title: "删除章节",
      message: `确定要删除章节"${chapter.title}"吗？\n\n此操作无法撤销。`,
      type: "danger",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          await novelsApi.deleteChapter(chapterId);

          // 如果删除的是当前章节，清空编辑器
          if (currentChapter?.id === chapterId) {
            setCurrentChapter(null);
            setChapterContent("");
          }

          await refreshData();
          showSuccess("删除成功", `章节"${chapter.title}"已删除`);
        } catch (error: any) {
          console.error("删除章节失败:", error);
          showError(
            "删除失败",
            error.response?.data?.message || "无法删除章节"
          );
        }
      },
    });
  };

  // 处理手机端排序（乐观更新）
  const handleMobileSort = async (updates: SortUpdate[]) => {
    if (!novelId) return;

    // 1. 立即更新前端状态（乐观更新）
    const newVolumes = [...volumes];
    const newStandaloneChapters = [...standaloneChapters];

    updates.forEach((update) => {
      if (update.type === "chapter") {
        // 查找章节
        let chapter: Chapter | undefined;

        // 在独立章节中查找
        const standaloneIndex = newStandaloneChapters.findIndex(
          (ch) => ch.id === update.id
        );
        if (standaloneIndex !== -1) {
          chapter = newStandaloneChapters[standaloneIndex];
        } else {
          // 在分卷中查找
          for (const vol of newVolumes) {
            const chIndex = vol.chapters.findIndex((ch) => ch.id === update.id);
            if (chIndex !== -1) {
              chapter = vol.chapters[chIndex];
              break;
            }
          }
        }

        if (chapter) {
          // 更新章节属性
          if (update.globalOrder !== undefined)
            chapter.globalOrder = update.globalOrder;
          if (update.order !== undefined) chapter.order = update.order;
          if (update.volumeId !== undefined) chapter.volumeId = update.volumeId;
        }
      } else if (update.type === "volume") {
        // 更新分卷
        const volume = newVolumes.find((v) => v.id === update.id);
        if (volume && update.globalOrder !== undefined) {
          volume.globalOrder = update.globalOrder;
        }
      }
    });

    // 立即更新状态
    setVolumes(newVolumes);
    setStandaloneChapters(newStandaloneChapters);
    showSuccess("排序成功", "章节顺序已更新");

    // 2. 后台并行调用 API（不阻塞 UI）
    (async () => {
      try {
        // 使用 Promise.all 并行发送所有请求
        const promises = updates.map((update) => {
          if (update.type === "chapter") {
            const updateData: any = {};
            if (update.volumeId !== undefined)
              updateData.volumeId = update.volumeId;
            if (update.globalOrder !== undefined)
              updateData.globalOrder = update.globalOrder;
            if (update.order !== undefined) updateData.order = update.order;

            return novelsApi.updateChapter(update.id, updateData);
          } else if (update.type === "volume") {
            const updateData: any = {};
            if (update.globalOrder !== undefined)
              updateData.globalOrder = update.globalOrder;

            return novelsApi.updateVolume(update.id, updateData);
          }
          return Promise.resolve();
        });

        await Promise.all(promises);
      } catch (error: any) {
        console.error("❌ 后台更新失败，回滚:", error);
        // 失败时重新加载数据
        await refreshData();
        showError("同步失败", "正在重新加载数据");
      }
    })();
  };

  // PC端智能排序（正序/倒序）
  const handlePCSmartSort = async (order: "asc" | "desc") => {
    const updates: any[] = [];

    // 数字提取函数（复用移动端逻辑）
    const extract = (title: string): number => {
      const chineseNumbers: { [key: string]: string } = {
        零: "0",
        一: "1",
        二: "2",
        三: "3",
        四: "4",
        五: "5",
        六: "6",
        七: "7",
        八: "8",
        九: "9",
        十: "10",
        百: "100",
        千: "1000",
        万: "10000",
      };

      const patterns = [
        /第([零一二三四五六七八九十百千万\d]+)[卷章节]/,
        /([零一二三四五六七八九十百千万\d]+)[卷章节]/,
        /[卷章节]([零一二三四五六七八九十百千万\d]+)/,
        /(\d+)/,
      ];

      for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match) {
          const numStr = match[1];
          if (/^\d+$/.test(numStr)) return parseInt(numStr, 10);

          let result = 0;
          let temp = "";
          const map: { [key: string]: number } = {
            十: 10,
            百: 100,
            千: 1000,
            万: 10000,
          };

          for (const char of numStr) {
            if (map[char] !== undefined) {
              result += (temp ? parseInt(temp, 10) : 1) * map[char];
              temp = "";
            } else if (chineseNumbers[char] !== undefined) {
              temp += chineseNumbers[char];
            }
          }
          result += temp ? parseInt(temp, 10) : 0;
          return result || 0;
        }
      }
      return 0;
    };

    // 分别对独立章节和分卷排序
    const sortedStandalone = [...standaloneChapters]
      .map((ch) => ({ ...ch, extractedNum: extract(ch.title) }))
      .sort((a, b) => {
        const diff = a.extractedNum - b.extractedNum;
        return order === "asc" ? diff : -diff;
      });

    const sortedVolumes = [...volumes]
      .map((vol) => ({ ...vol, extractedNum: extract(vol.name) }))
      .sort((a, b) => {
        const diff = a.extractedNum - b.extractedNum;
        return order === "asc" ? diff : -diff;
      });

    // 独立章节在前，分卷在后
    let globalOrder = 1;

    // 更新独立章节的 globalOrder
    sortedStandalone.forEach((ch) => {
      updates.push({
        type: "chapter",
        id: ch.id,
        globalOrder: globalOrder++,
      });
    });

    // 更新分卷的 globalOrder，并排序分卷内的章节
    sortedVolumes.forEach((vol) => {
      updates.push({
        type: "volume",
        id: vol.id,
        globalOrder: globalOrder++,
      });

      // 排序该分卷内的章节
      const sortedChaptersInVolume = [...vol.chapters]
        .map((ch) => ({ ...ch, extractedNum: extract(ch.title) }))
        .sort((a, b) => {
          const diff = a.extractedNum - b.extractedNum;
          return order === "asc" ? diff : -diff;
        });

      // 更新分卷内章节的 order
      sortedChaptersInVolume.forEach((ch, index) => {
        updates.push({
          type: "chapter",
          id: ch.id,
          volumeId: vol.id,
          order: index + 1,
        });
      });
    });

    // 调用统一的排序处理
    await handleMobileSort(updates);
  };

  // 拖拽开始
  const handleDragStart = (type: "volume" | "chapter", id: number) => {
    setDragState({
      ...dragState,
      draggedItem: { type, id },
    });
  };

  // 拖拽经过
  const handleDragOver = (
    e: React.DragEvent,
    type: "volume" | "chapter" | "standalone",
    id: number,
    position: "before" | "after"
  ) => {
    e.preventDefault(); // 必须调用以允许 drop
    e.stopPropagation(); // 阻止事件冒泡

    const { draggedItem } = dragState;
    if (!draggedItem) return;

    // 简化逻辑：允许所有拖拽，不显示视觉反馈
    // 章节拖到分卷行 = 加入该分卷
    // 章节拖到分卷行之间 = 成为独立章节
    setDragState({
      ...dragState,
      dropTarget: { type, id, position },
    });
  };

  // 拖拽结束
  const handleDragEnd = async () => {
    // 如果没有拖拽项或目标，直接重置状态（不做任何修改）
    if (!dragState.draggedItem) {
      setDragState({ draggedItem: null, dropTarget: null });
      return;
    }

    // 如果没有有效的drop目标，也不做任何修改
    if (!dragState.dropTarget) {
      setDragState({ draggedItem: null, dropTarget: null });
      return;
    }

    const { draggedItem, dropTarget } = dragState;

    // 如果拖到自己身上，不做任何操作
    if (
      draggedItem.type === dropTarget.type &&
      draggedItem.id === dropTarget.id
    ) {
      setDragState({ draggedItem: null, dropTarget: null });
      return;
    }

    // 章节拖拽
    if (draggedItem.type === "chapter") {
      const newVolumes = [...volumes];
      const newStandalone = [...standaloneChapters];
      let draggedChapter: Chapter | null = null;
      let isFromVolume = false;
      let sourceVolumeIndex = -1;
      let sourceChapterIndex = -1;
      let sourceStandaloneIndex = -1;

      // 找到被拖拽的章节（从分卷中）
      for (let i = 0; i < newVolumes.length; i++) {
        const chapterIndex = newVolumes[i].chapters.findIndex(
          (c) => c.id === draggedItem.id
        );
        if (chapterIndex !== -1) {
          sourceVolumeIndex = i;
          sourceChapterIndex = chapterIndex;
          draggedChapter = newVolumes[i].chapters[chapterIndex];
          isFromVolume = true;
          break;
        }
      }

      // 如果不在分卷中，从独立章节中找
      if (!draggedChapter) {
        sourceStandaloneIndex = newStandalone.findIndex(
          (c) => c.id === draggedItem.id
        );
        if (sourceStandaloneIndex !== -1) {
          draggedChapter = newStandalone[sourceStandaloneIndex];
        }
      }

      if (!draggedChapter) {
        // 找不到章节，重置状态但不修改数据
        setDragState({ draggedItem: null, dropTarget: null });
        return;
      }

      // 移除原位置的章节
      if (isFromVolume && sourceVolumeIndex !== -1) {
        newVolumes[sourceVolumeIndex].chapters.splice(sourceChapterIndex, 1);
      } else if (sourceStandaloneIndex !== -1) {
        newStandalone.splice(sourceStandaloneIndex, 1);
      } else {
        // 无法确定来源，不做任何修改
        setDragState({ draggedItem: null, dropTarget: null });
        return;
      }

      // 处理目标位置
      if (dropTarget.type === "standalone") {
        // 拖到独立章节区域
        draggedChapter.volumeId = null;

        const targetChapter = newStandalone.find((c) => c.id === dropTarget.id);
        if (targetChapter && targetChapter.globalOrder !== undefined) {
          // 根据目标章节的 globalOrder 设置新的 globalOrder
          if (dropTarget.position === "before") {
            draggedChapter.globalOrder = targetChapter.globalOrder - 0.5;
          } else {
            draggedChapter.globalOrder = targetChapter.globalOrder + 0.5;
          }
        } else {
          // 没有找到目标章节，设置默认值
          draggedChapter.globalOrder = newStandalone.length;
        }

        newStandalone.push(draggedChapter);
        // 更新独立章节的order
        newStandalone.forEach((chapter, index) => {
          chapter.order = index + 1;
        });
        setStandaloneChapters(newStandalone);
      } else if (dropTarget.type === "chapter") {
        // 拖到分卷内的章节
        let targetVolumeIndex = -1;
        let targetChapterIndex = -1;

        for (let i = 0; i < newVolumes.length; i++) {
          const chapterIndex = newVolumes[i].chapters.findIndex(
            (c) => c.id === dropTarget.id
          );
          if (chapterIndex !== -1) {
            targetVolumeIndex = i;
            targetChapterIndex = chapterIndex;
            break;
          }
        }

        if (targetVolumeIndex !== -1) {
          const insertIndex =
            dropTarget.position === "before"
              ? targetChapterIndex
              : targetChapterIndex + 1;
          draggedChapter.volumeId = newVolumes[targetVolumeIndex].id;
          delete draggedChapter.globalOrder; // 分卷内章节不需要 globalOrder
          newVolumes[targetVolumeIndex].chapters.splice(
            insertIndex,
            0,
            draggedChapter
          );
        }
        setStandaloneChapters(newStandalone);
      } else if (dropTarget.type === "volume") {
        // 拖到分卷标题行或底部区域 → 总是成为独立章节
        const targetVolumeIndex = newVolumes.findIndex(
          (v) => v.id === dropTarget.id
        );
        if (targetVolumeIndex !== -1) {
          const targetVolume = newVolumes[targetVolumeIndex];

          draggedChapter.volumeId = null;
          if (dropTarget.position === "before") {
            // 拖到分卷上方 → 独立章节（插入到分卷前）
            draggedChapter.globalOrder = targetVolume.globalOrder - 0.5;
          } else {
            // 拖到分卷下方（标题下半部分或底部区域） → 独立章节（插入到分卷后）
            draggedChapter.globalOrder = targetVolume.globalOrder + 0.5;
          }
          newStandalone.push(draggedChapter);
        }
        setStandaloneChapters(newStandalone);
      }

      // 更新分卷内章节的order
      newVolumes.forEach((volume) => {
        volume.chapters.forEach((chapter, index) => {
          chapter.order = index + 1;
        });
      });

      setVolumes(newVolumes);
    }

    // 分卷拖拽
    if (draggedItem.type === "volume") {
      const newVolumes = [...volumes];
      const draggedVolume = newVolumes.find((v) => v.id === draggedItem.id);

      if (draggedVolume) {
        if (dropTarget.type === "volume") {
          // 拖到另一个分卷
          const targetVolume = newVolumes.find((v) => v.id === dropTarget.id);
          if (targetVolume) {
            if (dropTarget.position === "before") {
              draggedVolume.globalOrder = targetVolume.globalOrder - 0.5;
            } else {
              draggedVolume.globalOrder = targetVolume.globalOrder + 0.5;
            }
          }
        } else if (dropTarget.type === "standalone") {
          // 拖到独立章节
          const targetChapter = standaloneChapters.find(
            (c) => c.id === dropTarget.id
          );
          if (targetChapter && targetChapter.globalOrder !== undefined) {
            if (dropTarget.position === "before") {
              draggedVolume.globalOrder = targetChapter.globalOrder - 0.5;
            } else {
              draggedVolume.globalOrder = targetChapter.globalOrder + 0.5;
            }
          }
        }

        // 更新order
        newVolumes.forEach((volume, index) => {
          volume.order = index + 1;
        });

        setVolumes(newVolumes);
      }
    }

    // 使用setTimeout确保state更新完成后再保存
    setTimeout(async () => {
      try {
        // 获取最新的volumes和standaloneChapters（从闭包中）
        const currentVolumes =
          draggedItem.type === "volume"
            ? volumes.map((v) =>
                v.id === draggedItem.id
                  ? {
                      ...v,
                      globalOrder:
                        volumes.find((vol) => vol.id === draggedItem.id)
                          ?.globalOrder ?? v.globalOrder,
                    }
                  : v
              )
            : volumes;

        const currentStandalone =
          draggedItem.type === "chapter"
            ? standaloneChapters
            : standaloneChapters;

        // 规范化 globalOrder：将所有小数转换为连续的整数
        const mixedItems = [
          ...currentStandalone.map((c) => ({
            type: "chapter" as const,
            data: { ...c },
            order: c.globalOrder ?? 0,
          })),
          ...currentVolumes.map((v) => ({
            type: "volume" as const,
            data: { ...v },
            order: v.globalOrder ?? 0,
          })),
        ].sort((a, b) => a.order - b.order);

        // 重新分配连续的整数 globalOrder
        mixedItems.forEach((item, index) => {
          item.data.globalOrder = Math.round(index + 1);
        });

        // 收集所有需要更新的章节
        const chaptersToUpdate: Array<{
          id: number;
          order?: number;
          globalOrder?: number;
          volumeId?: number | null;
        }> = [];

        // 添加所有独立章节（使用规范化后的 globalOrder）
        mixedItems
          .filter((item) => item.type === "chapter")
          .forEach((item) => {
            chaptersToUpdate.push({
              id: item.data.id,
              order: item.data.order,
              globalOrder: item.data.globalOrder, // 现在是整数
              volumeId: null,
            });
          });

        // 添加所有分卷内章节
        currentVolumes.forEach((vol) => {
          vol.chapters.forEach((ch) => {
            chaptersToUpdate.push({
              id: ch.id,
              order: ch.order,
              volumeId: ch.volumeId,
            });
          });
        });

        // 收集所有需要更新的分卷（使用规范化后的 globalOrder）
        const volumesToUpdate = mixedItems
          .filter((item) => item.type === "volume")
          .map((item) => ({
            id: item.data.id,
            order: item.data.order,
            globalOrder: item.data.globalOrder, // 现在是整数
          }));

        // 批量更新
        await Promise.all([
          chaptersToUpdate.length > 0 &&
            novelsApi.batchUpdateChapters(chaptersToUpdate),
          volumesToUpdate.length > 0 &&
            novelsApi.batchUpdateVolumes(volumesToUpdate),
        ]);

        setLastSaveTime(new Date());
      } catch (error: any) {
        console.error("保存顺序失败:", error);
        showError(
          "保存失败",
          error.response?.data?.message || "无法保存拖拽顺序"
        );
      }
    }, 100); // 等待100ms确保state更新

    setDragState({ draggedItem: null, dropTarget: null });
  };

  // 返回
  const handleBack = () => {
    navigate("/dashboard/works");
  };

  // 处理左侧边栏拖动
  const handleLeftMouseDown = () => {
    setIsResizingLeft(true);
  };

  // 处理右侧边栏拖动
  const handleRightMouseDown = () => {
    setIsResizingRight(true);
  };

  // 监听全局鼠标移动和释放
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        const newWidth = e.clientX;
        // 限制宽度范围：200px - 500px
        if (newWidth >= 200 && newWidth <= 500) {
          setLeftWidth(newWidth);
        }
      }
      if (isResizingRight) {
        const newWidth = window.innerWidth - e.clientX;
        // 限制宽度范围：200px - 600px
        if (newWidth >= 200 && newWidth <= 600) {
          setRightWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      // 防止选中文字
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizingLeft, isResizingRight]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 处理分卷折叠切换
  const handleVolumeToggle = (volumeId: number) => {
    setVolumes(
      volumes.map((v) =>
        v.id === volumeId ? { ...v, isCollapsed: !v.isCollapsed } : v
      )
    );
  };

  // 主容器背景：使用 getEditorBackgroundStyle 工具函数
  // 注意：这里不再需要自定义 getBackgroundStyle，直接使用工具函数

  return (
    <div
      className={`flex flex-col h-screen relative overflow-hidden ${
        !editorSettings?.backgroundColor && !editorSettings?.backgroundImage
          ? "bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50"
          : ""
      }`}
      style={getEditorBackgroundStyle(editorSettings, "full")}
    >
      {/* 背景装饰元素 - 仅在无自定义背景时显示 */}
      {!editorSettings?.backgroundColor && !editorSettings?.backgroundImage && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        </div>
      )}

      {/* 顶部栏 */}
      <EditorHeader
        novelName={novelName}
        totalWordCount={totalWordCount}
        currentChapterWordCount={currentChapter?.wordCount || 0}
        autoSaving={autoSaving}
        lastSaveTime={lastSaveTime}
        onBack={handleBack}
        onManualSave={handleManualSave}
        onViewHistory={() => setShowVersionHistory(true)}
        onViewCharacters={() => setShowCharacters(true)}
        onViewWorldSettings={() => setShowWorldSettings(true)}
        onViewMemos={() => setShowMemos(true)}
        onViewEditorSettings={() => setShowEditorSettings(true)}
        hasCurrentChapter={!!currentChapter}
        editorSettings={editorSettings}
      />

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* PC端：左侧章节列表 */}
        <div className="hidden lg:block h-full">
          <ChapterList
            width={leftWidth}
            volumes={volumes}
            standaloneChapters={standaloneChapters}
            currentChapter={currentChapter}
            dragState={dragState}
            onVolumeToggle={handleVolumeToggle}
            onChapterClick={(chapter) => {
              handleChapterClick(chapter);
              setShowMobileChapters(false); // 移动端点击章节后关闭抽屉
            }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onCreateVolume={() => setShowCreateVolumeModal(true)}
            onCreateChapter={() => {
              setPreselectedVolumeId(null);
              setShowCreateChapterModal(true);
            }}
            onAddChapterToVolume={handleAddChapterToVolume}
            onDeleteVolume={handleDeleteVolume}
            onDeleteChapter={handleDeleteChapter}
            onSmartSort={handlePCSmartSort}
            editorSettings={editorSettings}
            onQuickCreateChapter={handleQuickCreateChapter}
            onQuickCreateChapterInVolume={handleQuickCreateChapterInVolume}
          />
        </div>

        {/* PC端：左侧拖动条 */}
        <div className="hidden lg:block h-full">
          <ResizeDivider onMouseDown={handleLeftMouseDown} />
        </div>

        {/* 中间：内容编辑区域（移动端和PC端都显示）*/}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <EditorContent
            ref={editorContentRef}
            currentChapter={currentChapter}
            chapterContent={chapterContent}
            currentVolume={
              currentChapter?.volumeId
                ? volumes.find((v) => v.id === currentChapter.volumeId) || null
                : null
            }
            onTitleChange={handleTitleChange}
            onContentChange={handleContentChange}
            onChangeVolume={() => setShowChangeVolume(true)}
            onCreateChapter={() => {
              setPreselectedVolumeId(null);
              setShowCreateChapterModal(true);
            }}
            onSaveSummary={handleSaveSummary}
            editorSettings={editorSettings}
          />
        </div>

        {/* 文本选中悬浮工具栏 */}
        {/* TODO: 文本选中工具栏功能待实现 */}

        {/* PC端：右侧拖动条 */}
        <div className="hidden lg:block h-full">
          <ResizeDivider onMouseDown={handleRightMouseDown} />
        </div>

        {/* PC端：右侧AI助手 */}
        <div className="hidden lg:block h-full">
          <AIAssistant
            width={rightWidth}
            novelId={novelId ? Number(novelId) : undefined}
            onApplyToEditor={handleApplyToEditor}
            chapters={[
              ...standaloneChapters,
              ...volumes.flatMap((v) => v.chapters),
            ]}
            volumes={volumes}
            editorSettings={editorSettings}
          />
        </div>
      </div>

      {/* 移动端：底部工具栏 */}
      <MobileToolbar
        onOpenChapters={() => setShowMobileChapters(true)}
        onOpenAI={() => setShowMobileAI(true)}
        onOpenMore={() => setShowMobileMore(true)}
        isSaving={autoSaving}
        editorSettings={editorSettings}
      />

      {/* 移动端：章节列表抽屉 */}
      <MobileDrawer
        isOpen={showMobileChapters}
        onClose={() => setShowMobileChapters(false)}
        title="章节列表"
        side="left"
        editorSettings={editorSettings}
      >
        {/* 移动端提示和操作 - 使用背景设置 */}
        <div
          className={`px-4 py-2 border-b border-blue-100 flex-shrink-0`}
          style={getEditorBackgroundStyle(editorSettings, "left")}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-xs text-blue-700">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              点击右侧按钮进行手动排序
            </p>
            <button
              onClick={() => setShowMobileSortModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
              排序
            </button>
          </div>
        </div>

        <ChapterList
          width={0} // 移动端宽度由抽屉控制
          volumes={volumes}
          standaloneChapters={standaloneChapters}
          currentChapter={currentChapter}
          dragState={dragState}
          onVolumeToggle={handleVolumeToggle}
          onChapterClick={(chapter) => {
            handleChapterClick(chapter);
            setShowMobileChapters(false); // 点击后关闭抽屉
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onCreateVolume={() => {
            setShowCreateVolumeModal(true);
            // 不关闭抽屉
          }}
          onCreateChapter={() => {
            setPreselectedVolumeId(null);
            setShowCreateChapterModal(true);
            // 不关闭抽屉
          }}
          onAddChapterToVolume={(volumeId) => {
            handleAddChapterToVolume(volumeId);
            // 不关闭抽屉
          }}
          onDeleteVolume={handleDeleteVolume}
          onDeleteChapter={handleDeleteChapter}
          onSmartSort={handlePCSmartSort}
          onOpenMobileSort={() => setShowMobileSortModal(true)}
          editorSettings={editorSettings}
          onQuickCreateChapter={handleQuickCreateChapter}
          onQuickCreateChapterInVolume={handleQuickCreateChapterInVolume}
        />
      </MobileDrawer>

      {/* 移动端：AI助手全屏Sheet */}
      <MobileBottomSheet
        isOpen={showMobileAI}
        onClose={() => setShowMobileAI(false)}
        fullScreen={true}
        editorSettings={editorSettings}
      >
        <AIAssistant
          width={0}
          novelId={novelId ? Number(novelId) : undefined}
          onApplyToEditor={handleApplyToEditor}
          onClose={() => setShowMobileAI(false)}
          chapters={[
            ...standaloneChapters,
            ...volumes.flatMap((v) => v.chapters),
          ]}
          volumes={volumes}
          editorSettings={editorSettings}
        />
      </MobileBottomSheet>

      {/* 移动端：编辑工具底部Sheet */}
      <MobileBottomSheet
        isOpen={showMobileMore}
        onClose={() => setShowMobileMore(false)}
        title="编辑工具"
        editorSettings={editorSettings}
      >
        <MobileEditorTools
          onAutoFormat={() => {
            editorContentRef.current?.autoFormat();
            setShowMobileMore(false);
          }}
          onViewCharacters={() => {
            setShowCharacters(true);
            setShowMobileMore(false);
          }}
          onViewWorldSettings={() => {
            setShowWorldSettings(true);
            setShowMobileMore(false);
          }}
          onViewMemos={() => {
            setShowMemos(true);
            setShowMobileMore(false);
          }}
          onViewEditorSettings={() => {
            setShowEditorSettings(true);
            setShowMobileMore(false);
          }}
          disabled={!currentChapter}
        />
      </MobileBottomSheet>

      {/* 移动端：修改分卷底部Sheet */}
      <MobileBottomSheet
        isOpen={showChangeVolume}
        onClose={() => setShowChangeVolume(false)}
        title="修改所属分卷"
        editorSettings={editorSettings}
      >
        <ChangeVolumeSheet
          volumes={volumes}
          currentVolumeId={currentChapter?.volumeId || null}
          onSelect={async (volumeId) => {
            if (!currentChapter) return;

            // 立即关闭Sheet，优化体验
            setShowChangeVolume(false);

            // 乐观更新：立即更新本地状态
            const updatedChapter = { ...currentChapter, volumeId };
            setCurrentChapter(updatedChapter);

            // 立即更新章节在列表中的位置
            if (volumeId === null) {
              // 移到独立章节列表
              setStandaloneChapters((prev) => [...prev, updatedChapter]);
              setVolumes((prev) =>
                prev.map((vol) => ({
                  ...vol,
                  chapters: vol.chapters.filter(
                    (ch) => ch.id !== currentChapter.id
                  ),
                }))
              );
            } else {
              // 移到指定分卷
              setStandaloneChapters((prev) =>
                prev.filter((ch) => ch.id !== currentChapter.id)
              );
              setVolumes((prev) =>
                prev.map((vol) => {
                  if (vol.id === volumeId) {
                    // 添加到目标分卷
                    return {
                      ...vol,
                      chapters: [...vol.chapters, updatedChapter],
                    };
                  } else {
                    // 从其他分卷移除
                    return {
                      ...vol,
                      chapters: vol.chapters.filter(
                        (ch) => ch.id !== currentChapter.id
                      ),
                    };
                  }
                })
              );
            }

            try {
              // 后台静默更新到服务器
              await novelsApi.updateChapter(currentChapter.id, {
                volumeId: volumeId,
              });
              showSuccess(
                "修改成功",
                volumeId === null ? "已设为独立章节" : "已移动到分卷"
              );
            } catch (error: any) {
              console.error("修改分卷失败:", error);
              // 失败时回滚 - 重新加载数据
              await refreshData();
              showError(
                "修改失败",
                error.response?.data?.message || "无法修改章节分卷"
              );
            }
          }}
        />
      </MobileBottomSheet>

      {/* 创建分卷模态框 */}
      <CreateVolumeModal
        isOpen={showCreateVolumeModal}
        onClose={() => setShowCreateVolumeModal(false)}
        onCreate={handleCreateVolume}
      />

      {/* 创建章节模态框 */}
      <CreateChapterModal
        isOpen={showCreateChapterModal}
        volumes={volumes}
        preselectedVolumeId={preselectedVolumeId}
        onClose={() => {
          setShowCreateChapterModal(false);
          setPreselectedVolumeId(null); // 关闭时清除预选状态
        }}
        onCreate={handleCreateChapter}
      />

      {/* 移动端排序模态窗 */}
      <MobileSortModal
        isOpen={showMobileSortModal}
        onClose={() => setShowMobileSortModal(false)}
        volumes={volumes}
        standaloneChapters={standaloneChapters}
        onSort={handleMobileSort}
      />

      {/* 历史版本模态窗 */}
      {currentChapter && (
        <VersionHistoryModal
          isOpen={showVersionHistory}
          onClose={() => setShowVersionHistory(false)}
          chapterId={currentChapter.id}
          chapterTitle={currentChapter.title}
          onRestore={async () => {
            // 保存恢复前的状态，用于失败时回滚
            const previousChapter = { ...currentChapter };
            const previousContent = chapterContent;
            const chapterId = currentChapter.id;

            try {
              // 1. 禁用自动保存，防止在恢复过程中触发保存
              if (saveTimerRef.current) {
                window.clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
              }

              // 2. 刷新章节列表数据
              await refreshData();

              // 3. 从后端重新获取该章节的最新数据（恢复后的内容）
              const updatedChapter = await novelsApi.getChapter(chapterId);

              // 4. 更新当前章节状态
              setCurrentChapter({
                id: updatedChapter.id,
                title: updatedChapter.title,
                volumeId: updatedChapter.volumeId,
                content: updatedChapter.content || "",
                wordCount: updatedChapter.wordCount || 0,
                order: updatedChapter.order,
                globalOrder: updatedChapter.globalOrder,
              });

              // 5. 更新编辑器内容
              setChapterContent(updatedChapter.content || "");

              // 6. 更新最后保存时间
              setLastSaveTime(new Date());

              // 7. 显示成功提示
              showSuccess(
                "恢复成功",
                `已恢复到历史版本，字数：${updatedChapter.wordCount} 字`
              );
            } catch (error: any) {
              console.error("恢复版本失败:", error);

              // 回滚到恢复前的状态
              setCurrentChapter(previousChapter);
              setChapterContent(previousContent);

              showError(
                "恢复失败",
                error.response?.data?.message || "无法恢复到该版本"
              );
              throw error; // 重新抛出错误，让历史版本窗口知道失败了
            }
          }}
        />
      )}

      {/* 人物卡页面 */}
      {showCharacters && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            <CharactersPage onClose={() => setShowCharacters(false)} />
          </div>
        </div>
      )}

      {/* 世界观页面 */}
      {showWorldSettings && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            <WorldSettingsPage onClose={() => setShowWorldSettings(false)} />
          </div>
        </div>
      )}

      {/* 备忘录页面 */}
      {showMemos && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
            <MemosPage onClose={() => setShowMemos(false)} />
          </div>
        </div>
      )}

      {/* 编辑器设置模态框 */}
      <EditorSettingsModal
        isOpen={showEditorSettings}
        onClose={() => setShowEditorSettings(false)}
        onSettingsUpdated={(settings) => {
          setEditorSettings(settings);
        }}
      />

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText="确认删除"
        cancelText="取消"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
};

export default NovelEditor;
