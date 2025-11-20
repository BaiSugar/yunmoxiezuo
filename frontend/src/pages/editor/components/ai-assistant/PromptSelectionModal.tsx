import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  X,
  Search,
  TrendingUp,
  Clock,
  Calendar,
  Star,
  Lock,
  ArrowLeft,
  Flag,
  Eye,
  Zap,
  ThumbsUp,
  Bookmark,
} from "lucide-react";
import {
  promptsApi,
  promptCategoriesApi,
  promptApplicationsApi,
} from "../../../../services/prompts.api";
import { useToast } from "../../../../contexts/ToastContext";
import { useAuth } from "../../../../contexts/AuthContext";
import { ReportPromptDialog } from "../../../../components/ReportPromptDialog";
import type { Prompt, PromptCategory } from "../../../../types/prompt";

interface PromptSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (prompt: Prompt) => void | Promise<void>; // 支持同步和异步回调
  selectedPromptId?: number | null;
  fixedCategoryId?: number; // 固定的分类ID（创意工坊模式）
}

type TabType = "all" | "my" | "favorites";
type SortType =
  | "hotValue"
  | "createdAt"
  | "viewCount"
  | "useCount"
  | "likeCount";

/**
 * 提示词选择模态窗口
 */
export const PromptSelectionModal: React.FC<PromptSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedPromptId: _selectedPromptId, // 预留参数，暂未使用
  fixedCategoryId, // 固定的分类ID
}) => {
  const { error: showError, success: showSuccess } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [sortBy, setSortBy] = useState<SortType>("hotValue");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  // 申请对话框状态
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyReason, setApplyReason] = useState("");
  const [applying, setApplying] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  // 点赞和收藏状态
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const pageSize = 20;

  // 加载分类列表
  useEffect(() => {
    if (!isOpen) return;

    const loadCategories = async () => {
      try {
        const data = await promptCategoriesApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("加载分类列表失败:", error);
      }
    };

    loadCategories();
  }, [isOpen]);

  // 加载提示词列表
  useEffect(() => {
    if (!isOpen) return;

    const loadPrompts = async () => {
      setLoading(true);
      try {
        let data: any;

        if (activeTab === "my") {
          // 加载我的提示词
          // 只有全部分类时才不发送分类id，否则传递分类id
          const categoryId = fixedCategoryId || selectedCategoryId || undefined;
          data = await promptsApi.getMyPrompts(
            categoryId ? { categoryId } : undefined
          );
          setPrompts(Array.isArray(data) ? data : []);
        } else if (activeTab === "favorites") {
          // 加载我的收藏
          // 只有全部分类时才不发送分类id，否则传递分类id
          const categoryId = fixedCategoryId || selectedCategoryId || undefined;
          data = await promptsApi.getMyFavorites(
            categoryId ? { categoryId } : undefined
          );
          setPrompts(Array.isArray(data) ? data : []);
        } else {
          // 加载所有提示词
          const response = await promptsApi.getPrompts({
            page: currentPage,
            pageSize,
            // 优先使用fixedCategoryId，确保创意工坊模式下第一次就按分类过滤
            categoryId: fixedCategoryId || selectedCategoryId || undefined,
            keyword: searchKeyword || undefined,
            sortBy,
            sortOrder: "DESC",
          });
          setPrompts(response.data || []);
          setTotalPages(response.pagination?.totalPages || 1);
          setTotal(response.pagination?.total || 0);
        }
      } catch (error) {
        console.error("加载提示词列表失败:", error);
        showError("加载提示词列表失败");
        setPrompts([]);
      } finally {
        setLoading(false);
      }
    };

    loadPrompts();
  }, [
    isOpen,
    activeTab,
    sortBy,
    searchKeyword,
    selectedCategoryId,
    fixedCategoryId, // 添加fixedCategoryId依赖
    currentPage,
    showError,
  ]);

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

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setSearchKeyword("");
      // 如果有固定分类，使用固定分类；否则重置为null
      setSelectedCategoryId(fixedCategoryId || null);
      setCurrentPage(1);
    }
  }, [isOpen, fixedCategoryId]);

  if (!isOpen) return null;

  // 点击提示词查看详情
  const handleViewPrompt = async (prompt: Prompt) => {
    try {
      // 调用配置API获取完整信息（包括contents和parameters，但不包含敏感的content文本）
      const promptConfig = await promptsApi.getPromptConfig(prompt.id);
      // 合并基本信息和详细配置
      const fullPrompt = { ...prompt, ...promptConfig };
      setSelectedPrompt(fullPrompt);

      // 初始化点赞和收藏状态
      setIsLiked(fullPrompt.isLiked || false);
      setIsFavorited(fullPrompt.isFavorited || false);
      setLikeCount(fullPrompt.likeCount || 0);
      setFavoriteCount((fullPrompt as any).favoriteCount || 0);
    } catch (error) {
      console.error("加载提示词详情失败:", error);
      // 如果失败，仍然显示基本信息
      setSelectedPrompt(prompt);
      setIsLiked(prompt.isLiked || false);
      setIsFavorited(prompt.isFavorited || false);
      setLikeCount(prompt.likeCount || 0);
      setFavoriteCount((prompt as any).favoriteCount || 0);
    }
  };

  // 使用提示词
  const handleUsePrompt = async () => {
    if (!selectedPrompt) return;

    // 检查状态：草稿状态的非作者提示词无法使用
    if (
      selectedPrompt.status === "draft" &&
      selectedPrompt.authorId !== user?.id
    ) {
      showError("该提示词为草稿状态，无法使用。请联系作者发布后再使用。");
      return;
    }

    // 检查是否被封禁
    if (selectedPrompt.isBanned) {
      showError("该提示词已被封禁，无法使用");
      return;
    }

    try {
      // 调用配置API获取配置信息
      // 如果后端返回成功，说明用户有权使用该提示词（无需检查contents）
      const promptConfig = await promptsApi.getPromptConfig(selectedPrompt.id);

      // 调用 onSelect 并捕获可能的错误
      try {
        const result = onSelect(promptConfig);
        // 如果 onSelect 返回 Promise，等待它完成
        if (result && typeof (result as any).then === "function") {
          await result;
        }
      } catch (error) {
        console.error("选择提示词失败:", error);
        showError("选择提示词失败，请重试");
        return;
      }

      onClose();
    } catch (error: any) {
      console.error("加载提示词配置失败:", error);
      // 更友好的错误提示
      const errorMessage =
        error.response?.data?.message || error.message || "加载失败，请重试";
      if (errorMessage.includes("草稿") || errorMessage.includes("draft")) {
        showError("该提示词为草稿状态，无法使用。请联系作者发布后再使用。");
      } else if (
        errorMessage.includes("权限") ||
        errorMessage.includes("permission")
      ) {
        showError("您没有权限使用此提示词，请先申请权限。");
      } else {
        showError(errorMessage);
      }
    }
  };

  // 打开申请对话框
  const handleApplyPrompt = () => {
    if (!selectedPrompt) return;
    setShowApplyDialog(true);
  };

  // 提交申请
  const handleApplySubmit = async () => {
    if (!selectedPrompt || !applyReason.trim()) {
      showError("请填写申请理由");
      return;
    }

    try {
      setApplying(true);
      await promptApplicationsApi.applyForPrompt(selectedPrompt.id, {
        reason: applyReason,
      });
      showSuccess("申请已提交，等待作者审核");
      setShowApplyDialog(false);
      setApplyReason("");
    } catch (err: any) {
      showError(err.response?.data?.message || "申请失败");
    } finally {
      setApplying(false);
    }
  };

  // 点赞/取消点赞
  const handleToggleLike = async () => {
    if (!selectedPrompt) return;

    try {
      if (isLiked) {
        await promptsApi.unlikePrompt(selectedPrompt.id);
        setIsLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
        showSuccess("已取消点赞");
      } else {
        await promptsApi.likePrompt(selectedPrompt.id);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        showSuccess("点赞成功");
      }
    } catch (error: any) {
      showError(error.response?.data?.message || "操作失败");
    }
  };

  // 收藏/取消收藏
  const handleToggleFavorite = async () => {
    if (!selectedPrompt) return;

    try {
      if (isFavorited) {
        await promptsApi.unfavoritePrompt(selectedPrompt.id);
        setIsFavorited(false);
        setFavoriteCount((prev) => Math.max(0, prev - 1));
        showSuccess("已取消收藏");
      } else {
        await promptsApi.favoritePrompt(selectedPrompt.id);
        setIsFavorited(true);
        setFavoriteCount((prev) => prev + 1);
        showSuccess("收藏成功");
      }
    } catch (error: any) {
      showError(error.response?.data?.message || "操作失败");
    }
  };

  const tabs = [
    { key: "all" as TabType, label: "全部", icon: null },
    { key: "my" as TabType, label: "我的", icon: null },
    { key: "favorites" as TabType, label: "收藏", icon: Star },
  ];

  const sortOptions = [
    { key: "hotValue" as SortType, label: "热门", icon: TrendingUp },
    { key: "viewCount" as SortType, label: "浏览最多", icon: Clock },
    { key: "createdAt" as SortType, label: "最新发布", icon: Calendar },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 sm:p-4"
      onClick={(e) => {
        // 只在桌面端（有内边距时）允许点击背景关闭
        if (e.target === e.currentTarget && window.innerWidth >= 640) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-gradient-to-br from-white to-gray-50 shadow-2xl flex flex-col sm:flex-row transition-all overflow-hidden
          w-full h-full sm:h-[90vh] sm:max-h-[800px] sm:rounded-3xl
          sm:max-w-[95vw] max-h-screen ${
            selectedPrompt
              ? "lg:max-w-[90vw] xl:max-w-[1600px]"
              : "lg:max-w-[1200px]"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 左侧主内容 */}
        <div
          className={`flex flex-col flex-1 sm:flex-shrink-0 min-h-0 overflow-hidden ${
            selectedPrompt ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-2.5 sm:p-4 md:p-6 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex-1 min-w-0 pr-2">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-0.5 truncate">
                选择提示词
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                从社区中选择合适的提示词，快速开始创作
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition-all hover:rotate-90 flex-shrink-0"
              title="关闭"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            </button>
          </div>

          {/* 搜索和筛选 */}
          <div className="px-2.5 sm:px-4 md:px-6 pt-2 sm:pt-3 md:pt-4 pb-2 sm:pb-3 bg-gradient-to-b from-white to-gray-50/50 border-b border-gray-200/80 flex-shrink-0">
            {/* 搜索和分类 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 mb-2 sm:mb-3 md:mb-4">
              {/* 搜索框 */}
              <div className="relative group">
                <Search className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="搜索提示词名称或描述..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl 
                           focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300
                           text-xs sm:text-sm placeholder:text-gray-400 shadow-sm hover:shadow transition-all"
                />
              </div>

              {/* 分类筛选 */}
              <select
                value={selectedCategoryId || ""}
                onChange={(e) => {
                  setSelectedCategoryId(
                    e.target.value ? Number(e.target.value) : null
                  );
                  setCurrentPage(1);
                }}
                disabled={!!fixedCategoryId} // 固定分类时禁用选择器
                className={`px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg sm:rounded-xl 
                         focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300
                         text-xs sm:text-sm shadow-sm hover:shadow transition-all ${
                           fixedCategoryId
                             ? "cursor-not-allowed opacity-60"
                             : "cursor-pointer"
                         }`}
              >
                <option value="">全部分类</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 标签页和排序 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 md:gap-4">
              {/* 标签页 */}
              <div className="flex items-center gap-1 sm:gap-2 p-0.5 sm:p-1 bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setCurrentPage(1);
                    }}
                    className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.key
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 sm:gap-1.5">
                      {tab.icon && (
                        <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                      <span className="truncate">{tab.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 排序选项 */}
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
                {sortOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setSortBy(option.key)}
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-xs font-medium transition-all duration-200
                              flex items-center gap-1 sm:gap-1.5 whitespace-nowrap ${
                                sortBy === option.key
                                  ? "bg-blue-50 text-blue-600 border border-blue-200 shadow-sm"
                                  : "text-gray-600 hover:bg-white hover:shadow-sm border border-gray-200/60"
                              }`}
                  >
                    <option.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    <span className="hidden sm:inline">{option.label}</span>
                    <span className="sm:hidden">
                      {option.label.slice(0, 2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 提示词列表和分页 - 移动端优化滑动 */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* 列表区域 - 可滚动 */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-2.5 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 -webkit-overflow-scrolling-touch">
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-gray-500">加载中...</div>
                </div>
              ) : prompts.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="text-gray-400 text-sm mb-2">暂无提示词</div>
                    {searchKeyword && (
                      <div className="text-gray-400 text-xs">
                        尝试调整搜索条件
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={`grid gap-1.5 sm:gap-2 md:gap-3 ${
                    selectedPrompt
                      ? "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                      : "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4"
                  }`}
                >
                  {prompts.map((prompt) => (
                    <button
                      key={prompt.id}
                      onClick={() => handleViewPrompt(prompt)}
                      className={`group p-3.5 sm:p-4 rounded-2xl border-2 transition-all duration-200 text-left 
                              w-full h-44 sm:h-48 flex flex-col relative overflow-hidden
                              hover:shadow-lg hover:-translate-y-0.5 ${
                                selectedPrompt?.id === prompt.id
                                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg shadow-blue-500/10"
                                  : "border-gray-200/80 hover:border-blue-300 bg-white hover:bg-gradient-to-br hover:from-white hover:to-blue-50/30"
                              }`}
                    >
                      {/* 背景装饰 */}
                      <div
                        className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl transition-opacity ${
                          selectedPrompt?.id === prompt.id
                            ? "opacity-20"
                            : "opacity-0 group-hover:opacity-10"
                        } bg-blue-400`}
                      />

                      {/* 头部 */}
                      <div className="flex items-start justify-between mb-2.5 relative z-10">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-bold text-gray-900 truncate text-base leading-tight">
                              {prompt.name}
                            </h4>
                            {/* 状态标签 */}
                            {prompt.status === "draft" &&
                              user?.id !== prompt.authorId && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md flex-shrink-0 text-xs">
                                  草稿
                                </span>
                              )}
                            {prompt.requireApplication &&
                              user?.id !== prompt.authorId &&
                              !prompt.hasPermission && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 rounded-md flex-shrink-0">
                                  <Lock className="w-3 h-3 text-orange-600" />
                                </span>
                              )}
                          </div>
                          {prompt.author && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-medium">
                                {prompt.author.nickname?.charAt(0) || "U"}
                              </div>
                              <span className="truncate">
                                {prompt.author.nickname}
                              </span>
                            </div>
                          )}
                        </div>
                        {prompt.category && (
                          <span
                            className="flex-shrink-0 ml-2 px-2.5 py-1 bg-gradient-to-r from-gray-100 to-gray-50 
                                       text-gray-700 text-xs rounded-lg font-medium border border-gray-200/50"
                          >
                            {prompt.category.name}
                          </span>
                        )}
                      </div>

                      {/* 统计信息 */}
                      <div className="flex items-center gap-3 text-xs mt-auto pt-2.5 border-t border-gray-100 relative z-10 flex-wrap">
                        <span className="flex items-center gap-1 text-gray-500">
                          <span className="text-gray-400">🔥</span>
                          <span className="font-semibold text-orange-600">
                            {prompt.hotValue || 0}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <span className="text-gray-400">浏览</span>
                          <span className="font-semibold text-gray-700">
                            {prompt.viewCount || 0}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <span className="text-gray-400">使用</span>
                          <span className="font-semibold text-blue-600">
                            {prompt.useCount || 0}
                          </span>
                        </span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <span className="text-gray-400">赞</span>
                          <span className="font-semibold text-rose-600">
                            {prompt.likeCount || 0}
                          </span>
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 分页组件 - 固定在底部，仅在"全部"标签下显示 */}
            {!loading &&
              prompts.length > 0 &&
              activeTab === "all" &&
              totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 md:gap-3 py-2 sm:py-3 md:py-4 border-t border-gray-200/50 px-2 sm:px-4 bg-white flex-shrink-0">
                  {/* 上一页按钮 */}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg border border-gray-200 text-xs sm:text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一页
                  </button>

                  {/* 页码按钮组 */}
                  <div className="flex items-center justify-center gap-0.5 sm:gap-1 flex-wrap">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all ${
                            currentPage === pageNum
                              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* 下一页按钮 */}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg border border-gray-200 text-xs sm:text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    下一页
                  </button>

                  {/* 总数显示 */}
                  <div className="text-xs text-gray-500 sm:ml-2 w-full sm:w-auto text-center sm:text-left px-2">
                    共 {total} 个结果
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* 右侧详情面板 - 移动端优化 */}
        {selectedPrompt && (
          <div className="fixed sm:relative inset-0 sm:inset-auto w-full sm:w-[40%] md:w-[35%] lg:w-[400px] sm:min-w-[280px] sm:max-w-[400px] flex-shrink-0 bg-gradient-to-b from-white to-gray-50 sm:border-l border-gray-200/50 flex flex-col z-10 overflow-y-auto overscroll-contain shadow-2xl sm:shadow-none -webkit-overflow-scrolling-touch min-h-0">
            {/* 详情头部 */}
            <div className="px-4 sm:px-6 py-5 bg-white border-b border-gray-200/80">
              <div className="flex items-start gap-3 mb-3">
                {/* 移动端返回按钮 */}
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="sm:hidden p-2 hover:bg-gray-100 rounded-xl transition-all flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words leading-tight">
                      {selectedPrompt.name}
                    </h3>
                    {selectedPrompt.requireApplication &&
                      user?.id !== selectedPrompt.authorId &&
                      !selectedPrompt.hasPermission && (
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-lg border border-orange-200/50 flex-shrink-0">
                          <Lock className="w-3.5 h-3.5 text-orange-600" />
                          <span className="text-xs text-orange-700 font-semibold">
                            需申请
                          </span>
                        </span>
                      )}
                  </div>
                  {selectedPrompt.author && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                        {selectedPrompt.author.nickname?.charAt(0) || "U"}
                      </div>
                      <span className="font-medium">
                        {selectedPrompt.author.nickname}
                      </span>
                    </div>
                  )}
                </div>

                {/* 桌面端关闭按钮 */}
                <button
                  onClick={() => setSelectedPrompt(null)}
                  className="hidden sm:block p-2 hover:bg-gray-100 rounded-xl transition-all hover:rotate-90 flex-shrink-0"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* 分类和统计 - 移动端适配 */}
              <div className="flex flex-col gap-2 sm:gap-3 mt-3 sm:mt-4">
                {/* 分类标签 */}
                {selectedPrompt.category && (
                  <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 text-xs rounded-lg font-medium border border-gray-200/50 w-fit">
                    {selectedPrompt.category.name}
                  </span>
                )}
                {/* 统计信息和操作按钮 - 移动端优化 */}
                <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
                  {/* 统计信息 */}
                  <div className="flex items-center gap-2 sm:gap-4 text-xs flex-wrap">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-orange-500 flex-shrink-0" />
                      <span className="text-gray-400 text-xs">热度</span>
                      <span className="font-bold text-orange-600">
                        {selectedPrompt.hotValue || 0}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-400 text-xs">浏览</span>
                      <span className="font-bold text-gray-700">
                        {selectedPrompt.viewCount || 0}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500 flex-shrink-0" />
                      <span className="text-gray-400 text-xs">使用</span>
                      <span className="font-bold text-blue-600">
                        {selectedPrompt.useCount || 0}
                      </span>
                    </span>
                  </div>

                  {/* 交互按钮 - 点赞和收藏 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleLike}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        isLiked
                          ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-rose-500 hover:text-rose-600"
                      }`}
                      title={isLiked ? "取消点赞" : "点赞"}
                    >
                      <ThumbsUp
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${
                          isLiked ? "fill-current" : ""
                        }`}
                      />
                      <span className="text-xs sm:text-sm font-semibold">
                        {likeCount}
                      </span>
                    </button>
                    <button
                      onClick={handleToggleFavorite}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        isFavorited
                          ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/30"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-yellow-500 hover:text-yellow-600"
                      }`}
                      title={isFavorited ? "取消收藏" : "收藏"}
                    >
                      <Bookmark
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${
                          isFavorited ? "fill-current" : ""
                        }`}
                      />
                      <span className="text-xs sm:text-sm font-semibold">
                        {favoriteCount}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 详情内容 - 移动端优化滑动 */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-5 space-y-4 -webkit-overflow-scrolling-touch min-h-0">
              {selectedPrompt.description && (
                <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
                  <h4 className="text-sm font-bold text-gray-900 mb-2.5 flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></span>
                    描述
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // 自定义样式
                        h1: ({ children }) => (
                          <h1 className="text-lg font-bold text-gray-900 mt-4 mb-2">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-base font-bold text-gray-900 mt-3 mb-2">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-sm font-bold text-gray-900 mt-2 mb-1">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside text-sm text-gray-600 mb-2 space-y-1">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside text-sm text-gray-600 mb-2 space-y-1">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-sm text-gray-600">{children}</li>
                        ),
                        code: ({ children }) => (
                          <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="p-3 bg-gray-100 rounded-lg text-xs font-mono overflow-x-auto mb-2">
                            {children}
                          </pre>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-blue-500 pl-3 py-1 text-sm text-gray-600 italic mb-2">
                            {children}
                          </blockquote>
                        ),
                        a: ({ href, children }) => (
                          <a
                            href={href}
                            className="text-blue-600 hover:text-blue-700 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {children}
                          </a>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-gray-900">
                            {children}
                          </strong>
                        ),
                        em: ({ children }) => (
                          <em className="italic text-gray-700">{children}</em>
                        ),
                      }}
                    >
                      {selectedPrompt.description}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* 参数列表 - 始终显示（不受内容公开性影响） */}
              {/* 方式1：从contents中提取（内容公开时） */}
              {/* 方式2：直接从parameters字段读取（内容不公开时） */}
              {((selectedPrompt as any).parameters?.length > 0 ||
                (selectedPrompt.contents &&
                  selectedPrompt.contents.some(
                    (content) =>
                      content.parameters && content.parameters.length > 0
                  ))) && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-5 border border-blue-200 shadow-sm">
                  <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span className="text-base">📋</span>
                    参数列表
                  </h4>
                  <div className="space-y-2">
                    {/* 如果有单独的parameters字段（内容不公开时） */}
                    {(selectedPrompt as any).parameters?.length > 0
                      ? (selectedPrompt as any).parameters.map(
                          (param: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 py-2 px-3 bg-white rounded-lg border border-blue-100"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                    {"{{" + param.name + "}}"}
                                  </span>
                                  {param.required && (
                                    <span className="text-red-600 text-xs font-medium">
                                      *必填
                                    </span>
                                  )}
                                </div>
                                {param.description && (
                                  <p className="text-gray-600 text-xs mt-1.5">
                                    {param.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        )
                      : // 从contents中提取（内容公开时）
                        selectedPrompt.contents
                          ?.filter(
                            (content) =>
                              content.isEnabled &&
                              content.parameters &&
                              content.parameters.length > 0
                          )
                          .flatMap((content) =>
                            content.parameters?.map((param, index) => (
                              <div
                                key={`${content.id}-${index}`}
                                className="flex items-start gap-2 py-2 px-3 bg-white rounded-lg border border-blue-100"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-semibold text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                      {"{{" + param.name + "}}"}
                                    </span>
                                    {param.required && (
                                      <span className="text-red-600 text-xs font-medium">
                                        *必填
                                      </span>
                                    )}
                                  </div>
                                  {param.description && (
                                    <p className="text-gray-600 text-xs mt-1.5">
                                      {param.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                  </div>
                </div>
              )}

              {/* 提示词内容 - 根据isContentPublic决定是否显示 */}
              {selectedPrompt.isContentPublic ? (
                selectedPrompt.contents &&
                selectedPrompt.contents.length > 0 && (
                  <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-sm">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-purple-600 rounded-full"></span>
                      提示词内容
                      <span className="ml-auto text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {selectedPrompt.contents.length} 条
                      </span>
                    </h4>
                    <div className="space-y-2.5">
                      {selectedPrompt.contents.map((content, index) => (
                        <div
                          key={content.id}
                          className="p-3.5 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </span>
                            <div className="text-xs font-semibold text-gray-900">
                              {content.name}
                            </div>
                            <span className="ml-auto px-2 py-0.5 bg-white/80 text-gray-600 text-xs rounded-md font-medium border border-gray-200/50">
                              {content.role}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 line-clamp-3 leading-relaxed pl-8">
                            {content.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                  <Lock className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <p className="text-amber-800 font-medium text-sm mb-1">
                    该提示词内容不公开
                  </p>
                  <p className="text-amber-600 text-xs">
                    作者选择不公开展示提示词的具体内容
                  </p>
                  {selectedPrompt.requireApplication && (
                    <p className="text-amber-600 text-xs mt-2">
                      💡 提示：使用此提示词需要向作者申请权限
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 底部操作按钮 */}
            <div className="px-4 sm:px-6 py-4 bg-white border-t border-gray-200/80">
              {/* 草稿状态提示 - 非作者 */}
              {selectedPrompt.status === "draft" &&
              user?.id !== selectedPrompt.authorId ? (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                  <p className="text-gray-600 text-sm mb-1">
                    该提示词为草稿状态
                  </p>
                  <p className="text-gray-500 text-xs">
                    请联系作者发布后再使用
                  </p>
                </div>
              ) : selectedPrompt.isBanned ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-600 text-sm mb-1">该提示词已被封禁</p>
                  {selectedPrompt.bannedReason && (
                    <p className="text-red-500 text-xs mt-1">
                      原因：{selectedPrompt.bannedReason}
                    </p>
                  )}
                </div>
              ) : selectedPrompt.requireApplication &&
                user?.id !== selectedPrompt.authorId &&
                !selectedPrompt.hasPermission ? (
                <button
                  onClick={handleApplyPrompt}
                  className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl 
                             hover:from-orange-600 hover:to-orange-700 transition-all duration-200
                             font-semibold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40
                             hover:-translate-y-0.5 active:translate-y-0"
                >
                  🔒 申请使用权限
                </button>
              ) : (
                <button
                  onClick={handleUsePrompt}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl 
                             hover:from-blue-600 hover:to-blue-700 transition-all duration-200
                             font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                             hover:-translate-y-0.5 active:translate-y-0"
                >
                  ✨ 使用此提示词
                </button>
              )}

              {/* 举报按钮 - 非作者可以举报 */}
              {selectedPrompt &&
                user &&
                selectedPrompt.authorId !== user.id && (
                  <div className="mt-4">
                    <button
                      onClick={() => setShowReportDialog(true)}
                      className="w-full px-4 py-2.5 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 
                               transition-all border border-orange-200 flex items-center justify-center space-x-2"
                    >
                      <Flag className="w-4 h-4" />
                      <span>举报此提示词</span>
                    </button>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}

      {/* 申请对话框 */}
      {showApplyDialog &&
        selectedPrompt &&
        createPortal(
          <div className="fixed inset-0 z-[10000] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              {/* 背景遮罩 */}
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                onClick={() => !applying && setShowApplyDialog(false)}
              />

              {/* 对话框内容 */}
              <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  申请使用：{selectedPrompt.name}
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    申请理由 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={applyReason}
                    onChange={(e) => setApplyReason(e.target.value)}
                    placeholder="请简要说明您的使用场景和目的..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={applying}
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleApplySubmit}
                    disabled={applying || !applyReason.trim()}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {applying ? "提交中..." : "提交申请"}
                  </button>
                  <button
                    onClick={() => {
                      setShowApplyDialog(false);
                      setApplyReason("");
                    }}
                    disabled={applying}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 
                           disabled:opacity-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 举报对话框 - 使用createPortal渲染到全局 */}
      {showReportDialog &&
        selectedPrompt &&
        createPortal(
          <ReportPromptDialog
            promptId={selectedPrompt.id}
            promptName={selectedPrompt.name}
            isOpen={showReportDialog}
            onClose={() => setShowReportDialog(false)}
          />,
          document.body
        )}
    </>
  );
};
