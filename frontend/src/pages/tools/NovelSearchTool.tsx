import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  BookOpen,
  Loader2,
  ArrowLeft,
  FileText,
  Minus,
  Plus,
  List,
  X,
  Link as LinkIcon,
  FileSearch,
  Key,
} from "lucide-react";
import {
  searchNovel,
  getNovelDetail,
  checkToolAccess,
} from "../../services/tools.api";
import { SearchType, type NovelBook } from "../../types/tool";
import { useToast } from "../../contexts/ToastContext";
import CopyToWorkModal from "./components/CopyToWorkModal";

type ViewMode = "home" | "search" | "detail";

const NovelSearchTool: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError, success: showSuccess } = useToast();

  // 视图状态
  const [viewMode, setViewMode] = useState<ViewMode>("home");

  // 搜索相关
  const [searchType, setSearchType] = useState<SearchType>(SearchType.TITLE);
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("");
  const [results, setResults] = useState<NovelBook[]>([]);
  const [loading, setLoading] = useState(false);

  // 详情相关
  const [bookDetail, setBookDetail] = useState<NovelBook | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // UI控制
  const [showToc, setShowToc] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [fontSize, setFontSize] = useState(22);
  const [showToolbar, setShowToolbar] = useState(true);
  const [toolbarTimer, setToolbarTimer] = useState<number | null>(null);

  // 权限检查
  const [accessChecking, setAccessChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (toolbarTimer) clearTimeout(toolbarTimer);
    };
  }, [toolbarTimer]);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await checkToolAccess();
        if (response.code === "success" && response.data?.hasAccess) {
          setHasAccess(true);
        } else {
          showError("此功能需要开通会员");
          setTimeout(() => navigate("/dashboard/tools"), 2000);
        }
      } catch (error: any) {
        showError("无法访问此工具");
        setTimeout(() => navigate("/dashboard/tools"), 2000);
      } finally {
        setAccessChecking(false);
      }
    };
    checkAccess();
  }, [navigate, showError]);

  // 解析目录
  const tableOfContents = useMemo(() => {
    if (!bookDetail?.content) return [];
    const tocItems: { title: string; index: number }[] = [];
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = bookDetail.content;
    const paragraphs = tempDiv.querySelectorAll("p");
    paragraphs.forEach((p, index) => {
      const text = p.textContent?.trim() || "";
      if (
        /^\d+$/.test(text) ||
        /^第[一二三四五六七八九十百千万\d]+章/.test(text) ||
        /^第[一二三四五六七八九十百千万\d]+节/.test(text) ||
        /^序章|^楔子|^引子|^导语|^前言/.test(text)
      ) {
        tocItems.push({ title: text, index });
      }
    });
    return tocItems;
  }, [bookDetail?.content]);

  const scrollToChapter = (index: number) => {
    const paragraphs = document.querySelectorAll(".novel-content p");
    if (paragraphs[index]) {
      paragraphs[index].scrollIntoView({ behavior: "smooth", block: "start" });
      setShowToc(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      showError("请输入搜索内容");
      return;
    }
    setLoading(true);
    try {
      const response = await searchNovel({
        searchType,
        query: query.trim(),
        platform: platform.trim() || undefined,
      });
      if (response.code === "success") {
        setResults(response.data || []);
        setViewMode("search");
        if (response.data && response.data.length > 0) {
          showSuccess(`找到 ${response.data.length} 条结果`);
        }
      } else {
        showError(response.message || "搜索失败");
      }
    } catch (error: any) {
      showError("搜索失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (book: NovelBook) => {
    if (!book.bookId) return;
    setDetailLoading(true);
    setViewMode("detail");
    try {
      const response = await getNovelDetail(book.bookId, book.platform);
      if (response.code === "success" && response.data) {
        setBookDetail({
          ...book,
          title: response.data.title || book.title,
          content: response.data.content as unknown as string,
          totalParagraphs: response.data.totalParagraphs,
        });
      } else {
        showError("获取详情失败");
        setViewMode("search");
      }
    } catch (error: any) {
      showError("获取详情失败");
      setViewMode("search");
    } finally {
      setDetailLoading(false);
    }
  };

  if (accessChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            需要会员权限
          </h2>
          <p className="text-gray-600">正在跳转...</p>
        </div>
      </div>
    );
  }

  // 工具栏自动隐藏
  const handleContentClick = () => {
    setShowToolbar(!showToolbar);
    resetToolbarTimer();
  };

  const resetToolbarTimer = () => {
    if (toolbarTimer) clearTimeout(toolbarTimer);
    const timer = window.setTimeout(() => {
      setShowToolbar(false);
    }, 3000);
    setToolbarTimer(timer);
  };

  const handleToolbarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    resetToolbarTimer();
  };

  // 详情页 - 沉浸式阅读
  if (viewMode === "detail") {
    return (
      <div 
        className="relative min-h-screen bg-[#f5f2ed] -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8"
        onClick={handleContentClick}
      >
        {/* 顶部工具栏 - 固定悬浮 */}
        <div 
          className={`sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-2xl transition-transform duration-300 ${
            showToolbar ? 'translate-y-0' : '-translate-y-full'
          }`}
          onClick={handleToolbarClick}
        >
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setViewMode("search")}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
                <button
                  onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                  className="p-2 hover:bg-gray-100 transition-colors border-r border-gray-200"
                  title="减小字号"
                >
                  <Minus className="w-4 h-4 text-gray-600" />
                </button>
                <div className="px-3 py-2 bg-gray-50 text-xs text-gray-600 font-medium min-w-[50px] text-center">
                  {fontSize}px
                </div>
                <button
                  onClick={() => setFontSize(Math.min(24, fontSize + 2))}
                  className="p-2 hover:bg-gray-100 transition-colors border-l border-gray-200"
                  title="增大字号"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              {tableOfContents.length > 0 && (
                <button
                  onClick={() => setShowToc(!showToc)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-md transition-colors"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">目录</span>
                </button>
              )}
              <button
                onClick={() => setShowCopyModal(true)}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">复制</span>
              </button>
            </div>
          </div>
        </div>

        {showToc && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowToc(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 sm:p-6 border-b">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <List className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  目录
                </h3>
                <button
                  onClick={() => setShowToc(false)}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {tableOfContents.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToChapter(item.index)}
                    className="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg mb-2 transition-colors"
                  >
                    {item.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 点击提示 - 仅工具栏隐藏时显示 */}
        {!showToolbar && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white px-4 py-2 rounded-full text-sm animate-pulse pointer-events-none">
            点击屏幕显示工具栏
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {detailLoading ? (
            <div className="text-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
            </div>
          ) : bookDetail ? (
            <article className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-12 lg:p-20">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 text-center leading-tight">
                {bookDetail.title}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500 mb-8 sm:mb-16 pb-6 sm:pb-8 border-b border-orange-200 sm:border-b-2">
                {bookDetail.author && <span>作者：{bookDetail.author}</span>}
                {bookDetail.totalParagraphs && (
                  <span>共 {bookDetail.totalParagraphs} 段</span>
                )}
                <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm bg-orange-50 text-orange-700 rounded-full font-medium">
                  {bookDetail.platform}
                </span>
              </div>
              <div
                className="novel-content prose prose-sm sm:prose-lg max-w-none text-gray-800"
                style={{
                  fontSize: `${Math.max(14, fontSize - 2)}px`,
                  lineHeight: 1.8,
                }}
                dangerouslySetInnerHTML={{ __html: bookDetail.content || "" }}
              />
            </article>
          ) : (
            <div className="text-center py-20">
              <BookOpen className="w-20 h-20 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">无法加载内容</p>
            </div>
          )}
        </div>

        {showCopyModal && bookDetail && (
          <CopyToWorkModal
            content={bookDetail.content || ""}
            title={bookDetail.title}
            onClose={() => setShowCopyModal(false)}
          />
        )}
      </div>
    );
  }

  // 搜索结果页
  if (viewMode === "search") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <button
            onClick={() => setViewMode("home")}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 mb-4 sm:mb-6 text-sm sm:text-base text-gray-700 hover:bg-white/80 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            重新搜索
          </button>

          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              搜索结果{" "}
              <span className="text-base sm:text-lg font-normal text-gray-500">
                ({results.length} 条)
              </span>
            </h2>
          </div>

          {results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {results.map((book, index) => (
                <div
                  key={index}
                  onClick={() => book.bookId && handleViewDetail(book)}
                  className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-transparent hover:border-orange-200 active:scale-[0.98]"
                >
                  <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-lg sm:rounded-xl flex items-center justify-center text-white text-lg sm:text-2xl font-bold shadow-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
                        {book.title}
                      </h3>
                      {book.author && book.author !== "未知" && (
                        <p className="text-xs sm:text-sm text-gray-600">
                          作者：{book.author}
                        </p>
                      )}
                    </div>
                  </div>

                  {book.preview && book.preview !== "未知" && (
                    <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3 leading-relaxed">
                      {book.preview}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                    <span className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 rounded-lg font-medium">
                      {book.platform}
                    </span>
                    {book.bookId && (
                      <span className="text-xs sm:text-sm text-orange-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                        阅读
                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 sm:py-32 bg-white/80 rounded-2xl sm:rounded-3xl">
              <BookOpen className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 text-gray-300" />
              <p className="text-lg sm:text-xl text-gray-500 mb-2">
                未找到相关结果
              </p>
              <button
                onClick={() => setViewMode("home")}
                className="mt-4 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-orange-500 text-white rounded-xl hover:bg-orange-600 active:scale-95 transition-all"
              >
                重新搜索
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 首页 - 卡片式搜索入口
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-96 h-96 bg-red-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* 头部 */}
        <div className="mb-6 sm:mb-10">
          {/* 返回按钮左对齐 */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate("/dashboard/tools")}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回工具列表
            </button>

            {/* 如果有搜索结果，显示返回结果按钮 */}
            {results.length > 0 && (
              <button
                onClick={() => setViewMode("search")}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                查看搜索结果 ({results.length})
              </button>
            )}
          </div>

          {/* 标题居中 */}
          <div className="text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg mb-3">
              <Search className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              短文搜索
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              探索故事会平台精彩内容
            </p>
          </div>
        </div>

        {/* 搜索方式选择 - 紧凑卡片布局 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {/* 书名搜索 */}
          <div
            onClick={() => setSearchType(SearchType.TITLE)}
            className={`group relative bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
              searchType === SearchType.TITLE
                ? "border-blue-400"
                : "border-transparent hover:border-blue-200"
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex-shrink-0 p-2.5 sm:p-3 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg text-white shadow-md">
                <BookOpen className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">
                  书名搜索
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  输入书名快速查找
                </p>
              </div>
            </div>
            {searchType === SearchType.TITLE && (
              <div className="space-y-2.5 sm:space-y-3 animate-in slide-in-from-top-2">
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="平台名称（可选）"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="请输入书名"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-200 outline-none transition-all"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "开始搜索"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 链接搜索 */}
          <div
            onClick={() => setSearchType(SearchType.URL)}
            className={`group relative bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
              searchType === SearchType.URL
                ? "border-purple-400"
                : "border-transparent hover:border-purple-200"
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex-shrink-0 p-2.5 sm:p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg text-white shadow-md">
                <LinkIcon className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">
                  链接搜索
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  粘贴链接直达内容
                </p>
              </div>
            </div>
            {searchType === SearchType.URL && (
              <div className="space-y-2.5 sm:space-y-3 animate-in slide-in-from-top-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="请输入分享链接"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:border-purple-400 focus:ring-1 focus:ring-purple-200 outline-none transition-all"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "解析链接"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 内容搜索 */}
          <div
            onClick={() => setSearchType(SearchType.CONTENT)}
            className={`group relative bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
              searchType === SearchType.CONTENT
                ? "border-green-400"
                : "border-transparent hover:border-green-200"
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex-shrink-0 p-2.5 sm:p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg text-white shadow-md">
                <FileSearch className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">
                  内容搜索
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  通过片段查找原文
                </p>
              </div>
            </div>
            {searchType === SearchType.CONTENT && (
              <div className="space-y-2.5 sm:space-y-3 animate-in slide-in-from-top-2">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="请输入文章片段..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:border-green-400 focus:ring-1 focus:ring-green-200 outline-none transition-all resize-none"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "搜索内容"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 口令搜索 */}
          <div
            onClick={() => setSearchType(SearchType.KEYWORD)}
            className={`group relative bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
              searchType === SearchType.KEYWORD
                ? "border-amber-400"
                : "border-transparent hover:border-amber-200"
            }`}
          >
            <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="flex-shrink-0 p-2.5 sm:p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg text-white shadow-md">
                <Key className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1">
                  口令搜索
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  输入口令快速定位
                </p>
              </div>
            </div>
            {searchType === SearchType.KEYWORD && (
              <div className="space-y-2.5 sm:space-y-3 animate-in slide-in-from-top-2">
                <input
                  type="text"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  placeholder="平台名称（可选）"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition-all"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="请输入口令码"
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:border-amber-400 focus:ring-1 focus:ring-amber-200 outline-none transition-all"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    "使用口令"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 sm:mt-8 text-center px-4">
          <p className="text-gray-500 text-xs">💡 点击卡片开始搜索</p>
        </div>
      </div>
    </div>
  );
};

export default NovelSearchTool;
