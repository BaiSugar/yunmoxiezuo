import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Upload,
  Filter,
  Grid,
  List,
  Loader2,
  AlertCircle,
} from "lucide-react";
import NovelCard, {
  type Novel,
  type NovelGenre,
  type NovelStatus,
  type NovelForm,
} from "../../components/novels/NovelCard";
import CreateNovelModal from "../../components/novels/CreateNovelModal.tsx";
import EditNovelModal from "../../components/novels/EditNovelModal";
import DeleteConfirmDialog from "../../components/novels/DeleteConfirmDialog";
import { novelsApi } from "../../services/novels.api";
import { useToast } from "../../contexts/ToastContext";
import NovelFilterPanel from "../../components/novels/NovelFilterPanel.tsx";
import Pagination from "../../components/common/Pagination";
import PermissionButton from "../../components/common/PermissionButton";
import { usePermission } from "../../hooks/usePermission";
import { PERMISSIONS } from "../../utils/permission";

const VIEW_MODE_KEY = "novels_view_mode";

/**
 * 作品管理页面
 */
const Works: React.FC = () => {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const { hasPermission } = usePermission();
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNovels, setTotalNovels] = useState(0);
  const pageSize = 12; // 每页显示12个作品

  // 筛选条件
  const [filters, setFilters] = useState<{
    genres: NovelGenre[];
    statuses: NovelStatus[];
    forms: NovelForm[];
  }>({
    genres: [],
    statuses: [],
    forms: [],
  });

  // 从localStorage读取视图模式，默认为grid
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return saved === "grid" || saved === "list" ? saved : "grid";
  });

  // 当视图模式改变时保存到localStorage
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  // 加载作品数据
  useEffect(() => {
    loadNovels();
  }, [currentPage]); // 页码变化时重新加载

  // 搜索或筛选条件变化时，重置到第1页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  const loadNovels = async () => {
    try {
      setLoading(true);
      setError(null);

      // 调用API获取分页数据
      const result = await novelsApi.getMyNovels({
        page: currentPage,
        pageSize,
      });

      // 判断返回的是分页数据还是数组（向后兼容）
      if (Array.isArray(result)) {
        // 旧版本：返回所有数据
        setNovels(result);
        setTotalNovels(result.length);
        setTotalPages(1);
      } else {
        // 新版本：返回分页数据
        setNovels(result.data);
        setTotalNovels(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      }
    } catch (err: any) {
      console.error("加载作品失败:", err);
      setError(err.response?.data?.message || "加载作品失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 处理作品点击 - 跳转到编辑器
  const handleNovelClick = (novel: Novel) => {
    // 检查查看权限
    if (!hasPermission(PERMISSIONS.NOVEL.VIEW)) {
      showError("您没有权限查看作品，请联系管理员！");
      return;
    }
    navigate(`/editor/${novel.id}`);
  };

  // 处理编辑作品
  const handleEditNovel = (novel: Novel) => {
    setSelectedNovel(novel);
    setShowEditModal(true);
  };

  // 处理删除作品
  const handleDeleteNovel = (novel: Novel) => {
    setSelectedNovel(novel);
    setShowDeleteDialog(true);
  };

  // 确认删除作品
  const confirmDeleteNovel = async () => {
    if (!selectedNovel) return;

    try {
      await novelsApi.deleteNovel(selectedNovel.id);
      showSuccess("删除成功", `作品《${selectedNovel.name}》已删除`);
      loadNovels(); // 刷新列表
    } catch (err: any) {
      console.error("删除作品失败:", err);
    }
  };

  // 过滤作品（搜索 + 筛选）
  const filteredNovels = novels.filter((novel) => {
    // 搜索过滤
    const matchesSearch = novel.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // 类型筛选（作品的类型数组中包含任意一个筛选的类型）
    const matchesGenre =
      filters.genres.length === 0 ||
      novel.genres.some((genre) => filters.genres.includes(genre));

    // 形式筛选
    const matchesForm =
      filters.forms.length === 0 || filters.forms.includes(novel.form);

    // 状态筛选
    const matchesStatus =
      filters.statuses.length === 0 || filters.statuses.includes(novel.status);

    return matchesSearch && matchesGenre && matchesForm && matchesStatus;
  });

  // 检查是否有激活的筛选条件
  const hasActiveFilters =
    filters.genres.length > 0 ||
    filters.statuses.length > 0 ||
    filters.forms.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* 顶部操作栏 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* 左侧：搜索框 */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors text-sm"
                placeholder="搜索作品..."
              />
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            {/* 筛选按钮 */}
            <button
              onClick={() => setShowFilterPanel(true)}
              className="relative p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-700" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-white text-xs rounded-full flex items-center justify-center">
                  {filters.genres.length + filters.statuses.length}
                </span>
              )}
            </button>

            {/* 视图切换 */}
            <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-gray-900 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* 导入按钮 - 需要创建权限 */}
            <PermissionButton
              permission={PERMISSIONS.NOVEL.CREATE}
              onClick={() => setShowImportModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors text-gray-700 text-sm"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">导入</span>
            </PermissionButton>

            {/* 创建按钮 - 需要创建权限 */}
            <PermissionButton
              permission={PERMISSIONS.NOVEL.CREATE}
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors text-white text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">创建作品</span>
            </PermissionButton>
          </div>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilterPanel && (
        <NovelFilterPanel
          isOpen={showFilterPanel}
          onClose={() => setShowFilterPanel(false)}
          filters={filters}
          onFiltersChange={setFilters}
          onReset={() => setFilters({ genres: [], statuses: [], forms: [] })}
        />
      )}

      {/* 统计信息和筛选标签 */}
      {!loading && !error && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {hasActiveFilters ? (
                <>
                  筛选结果：
                  <span className="font-semibold text-gray-900">
                    {filteredNovels.length}
                  </span>{" "}
                  部作品
                  <span className="text-gray-400 mx-1">/</span>
                  <span className="text-gray-500">共 {totalNovels} 部</span>
                </>
              ) : (
                <>
                  共{" "}
                  <span className="font-semibold text-gray-900">
                    {totalNovels}
                  </span>{" "}
                  部作品
                  {totalPages > 1 && (
                    <span className="text-gray-400 ml-2">
                      (第 {currentPage}/{totalPages} 页)
                    </span>
                  )}
                </>
              )}
            </span>
            {hasActiveFilters && (
              <button
                onClick={() =>
                  setFilters({ genres: [], statuses: [], forms: [] })
                }
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                清除筛选
              </button>
            )}
          </div>

          {/* 已选筛选条件标签 */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
              {filters.genres.map((genre) => {
                const labels: Record<NovelGenre, string> = {
                  fantasy: "玄幻",
                  traditional_fantasy: "传统玄幻",
                  urban: "都市",
                  history: "历史",
                  fictional: "架空",
                  mystery: "悬疑",
                  scifi: "科幻",
                  sports: "体育",
                  wuxia: "武侠",
                  apocalypse: "末日",
                  fanfiction: "动漫衍生",
                  film_tv: "影视",
                  espionage: "谍战",
                };
                return (
                  <span
                    key={genre}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                  >
                    类型: {labels[genre]}
                  </span>
                );
              })}
              {filters.forms.map((form) => {
                const labels: Record<NovelForm, string> = {
                  novel: "长篇",
                  short_story: "短篇",
                  script: "剧本",
                  other: "其他",
                };
                return (
                  <span
                    key={form}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
                  >
                    形式: {labels[form]}
                  </span>
                );
              })}
              {filters.statuses.map((status) => {
                const labels = {
                  ongoing: "连载中",
                  completed: "已完结",
                  archived: "已归档",
                  paused: "已暂停",
                };
                return (
                  <span
                    key={status}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs"
                  >
                    状态: {labels[status]}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="bg-white border border-gray-200 rounded-lg p-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-gray-400 animate-spin" />
            <p className="text-gray-500 text-sm">加载中...</p>
          </div>
        </div>
      )}

      {/* 错误状态 */}
      {error && (
        <div className="bg-white border border-gray-200 rounded-lg p-12">
          <div className="text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-500" />
            <p className="text-gray-900 font-medium mb-2">加载失败</p>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
            <button
              onClick={loadNovels}
              className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      )}

      {/* 作品列表 */}
      {!loading && !error && filteredNovels.length > 0 && (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {filteredNovels.map((novel) => (
              <NovelCard
                key={novel.id}
                novel={novel}
                viewMode={viewMode}
                onClick={() => handleNovelClick(novel)}
                onEdit={() => handleEditNovel(novel)}
                onDelete={() => handleDeleteNovel(novel)}
              />
            ))}
          </div>

          {/* 分页组件 */}
          {!hasActiveFilters && !searchQuery && totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* 空状态 */}
      {!loading && !error && filteredNovels.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-12">
          <div className="text-center">
            <div className="text-5xl mb-3">📚</div>
            <p className="text-gray-500 mb-2">
              {searchQuery ? "未找到相关作品" : "暂无作品"}
            </p>
            <p className="text-sm text-gray-400 mb-6">
              {searchQuery
                ? "试试其他关键词"
                : "创建你的第一部作品"}
            </p>
            {!searchQuery && (
              <PermissionButton
                permission={PERMISSIONS.NOVEL.CREATE}
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center space-x-2 px-5 py-2 bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors text-white text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>创建作品</span>
              </PermissionButton>
            )}
          </div>
        </div>
      )}

      {/* 创建作品模态框 */}
      <CreateNovelModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          loadNovels(); // 刷新列表
        }}
      />

      {/* 导入作品模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">导入作品</h3>
            <p className="text-gray-500 text-sm mb-6">功能开发中...</p>
            <button
              onClick={() => setShowImportModal(false)}
              className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm rounded-lg transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 编辑作品模态框 */}
      {selectedNovel && (
        <EditNovelModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            loadNovels(); // 刷新列表
          }}
          novel={selectedNovel}
        />
      )}

      {/* 删除确认对话框 */}
      {selectedNovel && (
        <DeleteConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDeleteNovel}
          title="删除作品"
          itemName={selectedNovel.name}
        />
      )}
    </div>
  );
};

export default Works;
