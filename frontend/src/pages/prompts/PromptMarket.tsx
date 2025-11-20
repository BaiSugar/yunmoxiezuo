import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Plus,
  Loader2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  FileText,
  Globe,
  Edit,
  Trash2,
  Eye,
  Users,
  Bookmark,
  Settings,
  Flag,
  Clock,
  ThumbsUp,
  Zap,
  Flame,
} from "lucide-react";
import PromptCard from "../../components/prompts/PromptCard";
import Pagination from "../../components/common/Pagination";
import { BatchManagePromptsModal } from "../../components/BatchManagePromptsModal";
import {
  promptsApi,
  promptCategoriesApi,
  promptApplicationsApi,
} from "../../services/prompts.api";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import type {
  Prompt,
  PromptCategory,
  QueryPromptsParams,
} from "../../types/prompt";

/**
 * 提示词广场页面（包含广场和我的提示词两个标签）
 */
const PromptMarket: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // 标签切换：market（广场）、my（我的提示词）或 favorites（我的收藏）
  const [activeTab, setActiveTab] = useState<"market" | "my" | "favorites">(
    () => {
      const tab = searchParams.get("tab");
      if (tab === "my") return "my";
      if (tab === "favorites") return "favorites";
      return "market";
    }
  );

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选和搜索
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    () => {
      try {
        const saved = localStorage.getItem(
          `promptMarket_categoryId_${activeTab}`
        );
        return saved ? Number(saved) : null;
      } catch {
        return null;
      }
    }
  );
  const [sortBy, setSortBy] = useState<
    "hotValue" | "createdAt" | "viewCount" | "useCount" | "likeCount"
  >(() => {
    try {
      const saved = localStorage.getItem(`promptMarket_sortBy_${activeTab}`);
      if (
        saved === "hotValue" ||
        saved === "createdAt" ||
        saved === "viewCount" ||
        saved === "useCount" ||
        saved === "likeCount"
      ) {
        return saved;
      }
    } catch {
      // ignore
    }
    return "hotValue";
  });
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">(() => {
    try {
      const saved = localStorage.getItem(`promptMarket_sortOrder_${activeTab}`);
      return saved === "ASC" ? "ASC" : "DESC";
    } catch {
      return "DESC";
    }
  });

  // 分页
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  // 申请对话框
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [applyReason, setApplyReason] = useState("");
  const [applying, setApplying] = useState(false);

  // 批量管理模态窗
  const [showBatchManageModal, setShowBatchManageModal] = useState(false);

  // 保存筛选和排序状态到 localStorage
  useEffect(() => {
    try {
      if (selectedCategoryId !== null) {
        localStorage.setItem(
          `promptMarket_categoryId_${activeTab}`,
          String(selectedCategoryId)
        );
      } else {
        localStorage.removeItem(`promptMarket_categoryId_${activeTab}`);
      }
    } catch (err) {
      console.error("Failed to save categoryId to localStorage:", err);
    }
  }, [selectedCategoryId, activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem(`promptMarket_sortBy_${activeTab}`, sortBy);
    } catch (err) {
      console.error("Failed to save sortBy to localStorage:", err);
    }
  }, [sortBy, activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem(`promptMarket_sortOrder_${activeTab}`, sortOrder);
    } catch (err) {
      console.error("Failed to save sortOrder to localStorage:", err);
    }
  }, [sortOrder, activeTab]);

  // 切换标签时，从 localStorage 加载对应标签的状态
  useEffect(() => {
    try {
      // 加载分类
      const savedCategoryId = localStorage.getItem(
        `promptMarket_categoryId_${activeTab}`
      );
      setSelectedCategoryId(savedCategoryId ? Number(savedCategoryId) : null);

      // 加载排序字段
      const savedSortBy = localStorage.getItem(
        `promptMarket_sortBy_${activeTab}`
      );
      if (
        savedSortBy === "hotValue" ||
        savedSortBy === "createdAt" ||
        savedSortBy === "viewCount" ||
        savedSortBy === "useCount" ||
        savedSortBy === "likeCount"
      ) {
        setSortBy(savedSortBy);
      } else {
        setSortBy("hotValue");
      }

      // 加载排序方向
      const savedSortOrder = localStorage.getItem(
        `promptMarket_sortOrder_${activeTab}`
      );
      setSortOrder(savedSortOrder === "ASC" ? "ASC" : "DESC");
    } catch (err) {
      console.error("Failed to load state from localStorage:", err);
    }
  }, [activeTab]);

  // 加载分类数据
  useEffect(() => {
    loadCategories();
  }, []);

  // 加载提示词数据
  useEffect(() => {
    loadPrompts();
  }, [activeTab, currentPage, selectedCategoryId, sortBy, sortOrder]);

  // 搜索时重置到第一页
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        loadPrompts();
      } else {
        setCurrentPage(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCategories = async () => {
    try {
      const data = await promptCategoriesApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const loadPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "my") {
        // 加载我的提示词并排序（支持分类筛选）
        let data = await promptsApi.getMyPrompts({
          categoryId: selectedCategoryId || undefined,
        });
        console.log("📝 我的提示词数据（PromptMarket）:", data);
        if (data.length > 0) {
          console.log("第一个提示词:", data[0]);
          console.log("待审核数量:", data[0].pendingApplicationsCount);
        }

        // 客户端排序
        data = data.sort((a, b) => {
          let aValue: number;
          let bValue: number;

          // 处理日期类型
          if (sortBy === "createdAt") {
            aValue = new Date(a[sortBy]).getTime();
            bValue = new Date(b[sortBy]).getTime();
          } else {
            aValue = Number(a[sortBy]) || 0;
            bValue = Number(b[sortBy]) || 0;
          }

          if (sortOrder === "ASC") {
            return aValue - bValue;
          } else {
            return bValue - aValue;
          }
        });

        setPrompts(data);
        setTotal(data.length);
        setTotalPages(1);
      } else if (activeTab === "favorites") {
        // 加载我的收藏
        const data = await promptsApi.getMyFavorites();
        setPrompts(data);
        setTotal(data.length);
        setTotalPages(1);
      } else {
        // 加载广场提示词
        const params: QueryPromptsParams = {
          page: currentPage,
          pageSize,
          isPublic: true,
          status: "published", // 只显示已发布的提示词
          sortBy,
          sortOrder,
        };

        if (searchQuery) {
          params.keyword = searchQuery;
        }
        if (selectedCategoryId) {
          params.categoryId = selectedCategoryId;
        }

        const response = await promptsApi.getPrompts(params);
        setPrompts(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (err: any) {
      console.error("Failed to load prompts:", err);
      setError(err.response?.data?.message || "加载提示词失败");
      showError("加载提示词失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
  };

  const handlePromptClick = (prompt: Prompt) => {
    navigate(`/dashboard/prompts/${prompt.id}`);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("确定要删除这个提示词吗？")) {
      return;
    }

    try {
      await promptsApi.deletePrompt(id);
      showSuccess("删除成功");
      loadPrompts();
    } catch (err: any) {
      showError(err.response?.data?.message || "删除失败");
    }
  };

  const handleTabChange = (tab: "market" | "my" | "favorites") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchQuery("");

    // 更新 URL 参数
    setSearchParams({ tab });
    // 注意：selectedCategoryId、sortBy、sortOrder 会通过 useEffect 从 localStorage 自动加载
  };

  const handleApplyClick = (prompt: Prompt) => {
    if (!user) {
      showError("请先登录");
      return;
    }
    setSelectedPrompt(prompt);
    setShowApplyDialog(true);
  };

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
      setSelectedPrompt(null);
    } catch (err: any) {
      showError(err.response?.data?.message || "申请失败");
    } finally {
      setApplying(false);
    }
  };

  const handleSortChange = (field: typeof sortBy) => {
    if (sortBy === field) {
      // 切换排序方向
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      // 切换排序字段
      setSortBy(field);
      setSortOrder("DESC");
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* 头部 */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          提示词
        </h1>

        {/* 标签切换 */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => handleTabChange("market")}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors whitespace-nowrap flex-shrink-0 text-sm font-medium ${
              activeTab === "market"
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span>广场</span>
          </button>
          {user && (
            <>
              <button
                onClick={() => handleTabChange("my")}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors whitespace-nowrap flex-shrink-0 text-sm font-medium ${
                  activeTab === "my"
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span>我的提示词</span>
              </button>
              <button
                onClick={() => handleTabChange("favorites")}
                className={`flex items-center gap-2 px-4 py-2 rounded transition-colors whitespace-nowrap flex-shrink-0 text-sm font-medium ${
                  activeTab === "favorites"
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Bookmark className="w-4 h-4 flex-shrink-0" />
                <span>我的收藏</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 搜索、筛选和操作区 - favorites标签下不显示 */}
      {activeTab !== "favorites" && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-5">
          {/* 搜索和操作栏 */}
          <div className={`flex flex-col gap-4 ${activeTab === "market" ? "mb-5" : ""}`}>
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索提示词名称或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg
                         focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            {/* 排序选择和操作按钮 */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* 排序按钮组 */}
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5 overflow-x-auto scrollbar-hide flex-1 sm:flex-none">
                <div className="flex items-center gap-1 flex-1 sm:flex-none">
                  {[
                    {
                      value: "hotValue",
                      label: "热度",
                      icon: Flame,
                      shortLabel: "热度",
                    },
                    {
                      value: "createdAt",
                      label: "最新",
                      icon: Clock,
                      shortLabel: "最新",
                    },
                    {
                      value: "viewCount",
                      label: "浏览",
                      icon: Eye,
                      shortLabel: "浏览",
                    },
                    {
                      value: "useCount",
                      label: "使用",
                      icon: Zap,
                      shortLabel: "使用",
                    },
                    {
                      value: "likeCount",
                      label: "点赞",
                      icon: ThumbsUp,
                      shortLabel: "点赞",
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isActive = sortBy === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleSortChange(option.value as typeof sortBy)
                        }
                        className={`flex items-center gap-1 px-2 py-1.5 rounded transition-colors text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                          isActive
                            ? "bg-gray-900 text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                        title={`按${option.label}排序`}
                      >
                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="hidden sm:inline">{option.label}</span>
                      </button>
                    );
                  })}

                  {/* 排序方向切换 */}
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC")
                    }
                    className="flex items-center justify-center px-2 py-1.5 rounded transition-colors text-xs flex-shrink-0 text-gray-600 hover:bg-gray-50"
                    title={sortOrder === "ASC" ? "升序" : "降序"}
                  >
                    {sortOrder === "ASC" ? (
                      <ArrowUp className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* 操作按钮组 */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:ml-auto">
                {/* 批量管理按钮 - 仅在“我的提示词”标签下显示 */}
                {activeTab === "my" && (
                  <button
                    onClick={() => setShowBatchManageModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg
                             transition-colors text-sm font-medium flex-shrink-0"
                    title="批量管理"
                  >
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline">批量管理</span>
                  </button>
                )}

                {/* 我的举报按钮 */}
                <button
                  onClick={() => navigate("/dashboard/prompts/my-reports")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg
                           transition-colors text-sm font-medium text-gray-700 flex-shrink-0"
                  title="我的举报"
                >
                  <Flag className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden md:inline">我的举报</span>
                </button>

                {/* 创建提示词按钮 */}
                <button
                  onClick={() => navigate("/dashboard/prompts/create")}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg
                           transition-colors font-medium text-sm flex-shrink-0"
                >
                  <Plus className="w-4 h-4 flex-shrink-0" />
                  <span>创建提示词</span>
                </button>
              </div>
            </div>
          </div>

          {/* 分类筛选 */}
          {(activeTab === "market" || activeTab === "my") && (
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                <button
                  onClick={() => handleCategoryChange(null)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex-shrink-0 text-sm font-medium ${
                    !selectedCategoryId
                      ? "bg-gray-900 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  全部
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 flex-shrink-0 text-sm font-medium ${
                      selectedCategoryId === category.id
                        ? "bg-gray-900 text-white"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {category.icon && <span>{category.icon}</span>}
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 内容区 */}
      <div>
        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* 错误状态 */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p>{error}</p>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && prompts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            {activeTab === "favorites" ? (
              <>
                <Bookmark className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg">还没有收藏任何提示词</p>
                <p className="text-sm mt-2">
                  在提示词详情页点击收藏按钮即可添加
                </p>
                <button
                  onClick={() => handleTabChange("market")}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  去逛逛
                </button>
              </>
            ) : (
              <>
                <p className="text-lg">暂无提示词</p>
                <button
                  onClick={() => navigate("/dashboard/prompts/create")}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  创建第一个提示词
                </button>
              </>
            )}
          </div>
        )}

        {/* 提示词列表 */}
        {!loading && !error && prompts.length > 0 && (
          <>
            {activeTab === "market" || activeTab === "favorites" ? (
              // 广场：卡片展示
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {prompts.map((prompt) => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onClick={handlePromptClick}
                    onApply={handleApplyClick}
                    currentUserId={user?.id}
                  />
                ))}
              </div>
            ) : (
              // 我的提示词：桌面端表格 + 移动端卡片
              <>
                {/* 移动端：卡片展示 */}
                <div className="md:hidden space-y-4">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {prompt.category?.icon && (
                              <span className="text-xl">
                                {prompt.category.icon}
                              </span>
                            )}
                            <h3 className="font-semibold text-gray-900">
                              {prompt.name}
                            </h3>
                          </div>
                          {prompt.description && (
                            <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                              {prompt.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <span>{prompt.category?.name}</span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                            prompt.isBanned
                              ? "bg-red-100 text-red-800"
                              : prompt.status === "published"
                              ? "bg-green-100 text-green-800"
                              : prompt.status === "draft"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {prompt.isBanned
                            ? "已封禁"
                            : prompt.status === "published"
                            ? "已发布"
                            : prompt.status === "draft"
                            ? "草稿"
                            : "已归档"}
                        </span>
                      </div>

                      {/* 统计数据 */}
                      <div className="flex items-center justify-around py-3 mb-3 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {prompt.viewCount}
                          </div>
                          <div className="text-xs text-gray-500">浏览</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {prompt.useCount}
                          </div>
                          <div className="text-xs text-gray-500">使用</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {prompt.likeCount}
                          </div>
                          <div className="text-xs text-gray-500">点赞</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-orange-500">
                            {prompt.hotValue}
                          </div>
                          <div className="text-xs text-gray-500">热度</div>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/dashboard/prompts/${prompt.id}`)
                          }
                          className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 
                                       transition-colors flex items-center justify-center space-x-1"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="text-sm">查看</span>
                        </button>
                        <button
                          onClick={() =>
                            navigate(`/dashboard/prompts/${prompt.id}/edit`)
                          }
                          className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 
                                       transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="text-sm">编辑</span>
                        </button>
                        <button
                          onClick={() =>
                            navigate(
                              `/dashboard/prompts/${prompt.id}/permissions`
                            )
                          }
                          className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 
                                       transition-colors flex items-center justify-center"
                          title="权限"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 
                                       transition-colors flex items-center justify-center"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 桌面端：表格展示 */}
                <div className="hidden md:block bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                          名称
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                          分类
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                          状态
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                          待审核
                        </th>
                        <th className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleSortChange("viewCount")}
                            className="inline-flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                          >
                            <span>浏览</span>
                            {sortBy === "viewCount" &&
                              (sortOrder === "DESC" ? (
                                <ArrowDown className="w-4 h-4" />
                              ) : (
                                <ArrowUp className="w-4 h-4" />
                              ))}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleSortChange("useCount")}
                            className="inline-flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                          >
                            <span>使用</span>
                            {sortBy === "useCount" &&
                              (sortOrder === "DESC" ? (
                                <ArrowDown className="w-4 h-4" />
                              ) : (
                                <ArrowUp className="w-4 h-4" />
                              ))}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleSortChange("likeCount")}
                            className="inline-flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                          >
                            <span>点赞</span>
                            {sortBy === "likeCount" &&
                              (sortOrder === "DESC" ? (
                                <ArrowDown className="w-4 h-4" />
                              ) : (
                                <ArrowUp className="w-4 h-4" />
                              ))}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleSortChange("hotValue")}
                            className="inline-flex items-center space-x-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors"
                          >
                            <span>热度</span>
                            {sortBy === "hotValue" &&
                              (sortOrder === "DESC" ? (
                                <ArrowDown className="w-4 h-4" />
                              ) : (
                                <ArrowUp className="w-4 h-4" />
                              ))}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {prompts.map((prompt) => (
                        <tr
                          key={prompt.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              {prompt.category?.icon && (
                                <span className="text-xl">
                                  {prompt.category.icon}
                                </span>
                              )}
                              <div>
                                <div className="font-medium text-gray-900">
                                  {prompt.name}
                                </div>
                                {prompt.description && (
                                  <div className="text-sm text-gray-500 line-clamp-1">
                                    {prompt.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {prompt.category?.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                prompt.isBanned
                                  ? "bg-red-100 text-red-800"
                                  : prompt.status === "published"
                                  ? "bg-green-100 text-green-800"
                                  : prompt.status === "draft"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {prompt.isBanned
                                ? "已封禁"
                                : prompt.status === "published"
                                ? "已发布"
                                : prompt.status === "draft"
                                ? "草稿"
                                : "已归档"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {prompt.pendingApplicationsCount !== undefined &&
                            prompt.pendingApplicationsCount > 0 ? (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                {prompt.pendingApplicationsCount} 个待审核
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {prompt.viewCount}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {prompt.useCount}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600">
                            {prompt.likeCount}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-semibold text-orange-500">
                              {prompt.hotValue}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() =>
                                  navigate(`/dashboard/prompts/${prompt.id}`)
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="查看"
                              >
                                <Eye className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/dashboard/prompts/${prompt.id}/edit`
                                  )
                                }
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                title="编辑"
                              >
                                <Edit className="w-4 h-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() =>
                                  navigate(
                                    `/dashboard/prompts/${prompt.id}/permissions`
                                  )
                                }
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors relative"
                                title={`权限管理${
                                  prompt.pendingApplicationsCount
                                    ? ` (${prompt.pendingApplicationsCount}个待审核)`
                                    : ""
                                }`}
                              >
                                <Users className="w-4 h-4 text-green-600" />
                                {(prompt.pendingApplicationsCount ?? 0) > 0 && (
                                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center shadow-lg z-10">
                                    {prompt.pendingApplicationsCount! > 9
                                      ? "9+"
                                      : prompt.pendingApplicationsCount}
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(prompt.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}

            {/* 统计信息 */}
            <div className="mt-4 text-center text-sm text-gray-500">
              共 {total} 个提示词
            </div>
          </>
        )}
      </div>

      {/* 申请对话框 */}
      {showApplyDialog && selectedPrompt && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setShowApplyDialog(false)}
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
        </div>
      )}

      {/* 批量管理模态窗 */}
      <BatchManagePromptsModal
        isOpen={showBatchManageModal}
        onClose={() => setShowBatchManageModal(false)}
        onSuccess={() => {
          // 批量更新成功后刷新列表
          loadPrompts();
        }}
      />
    </div>
  );
};

export default PromptMarket;
