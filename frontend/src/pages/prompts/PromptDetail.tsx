import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  ThumbsUp,
  Zap,
  User,
  Lock,
  Heart,
  Share2,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  FileText,
  Bookmark,
  Flag,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { promptsApi, promptApplicationsApi } from "../../services/prompts.api";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";
import { ReportPromptDialog } from "../../components/ReportPromptDialog";
import type { Prompt } from "../../types/prompt";

/**
 * 描述渲染组件 - 使用react-markdown渲染
 */
const DescriptionRenderer: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
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
        }}
      >
        {content}
      </ReactMarkdown>
      <style>{`
        .markdown-content h1 { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #111827; }
        .markdown-content h2 { font-size: 1.125rem; font-weight: 700; margin-top: 0.75rem; margin-bottom: 0.5rem; color: #111827; }
        .markdown-content h3 { font-size: 1rem; font-weight: 700; margin-top: 0.5rem; margin-bottom: 0.25rem; color: #111827; }
        .markdown-content p { margin: 0.5rem 0; color: #374151; line-height: 1.625; }
        .markdown-content code { padding: 0.125rem 0.375rem; background-color: #f3f4f6; color: #1f2937; border-radius: 0.25rem; font-size: 0.875rem; font-family: 'Courier New', monospace; }
        .markdown-content pre { margin: 0.5rem 0; }
        .markdown-content pre code { display: block; padding: 0.75rem 1rem; background-color: #1f2937; color: #f3f4f6; border-radius: 0.5rem; overflow-x: auto; }
        .markdown-content a { color: #2563eb; text-decoration: underline; }
        .markdown-content a:hover { color: #1e40af; }
        .markdown-content ul, .markdown-content ol { padding-left: 1.5rem; margin: 0.5rem 0; color: #374151; }
        .markdown-content li { margin: 0.25rem 0; line-height: 1.625; }
        .markdown-content blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; margin: 0.5rem 0; color: #6b7280; font-style: italic; }
        .markdown-content strong { font-weight: 700; color: #111827; }
        .markdown-content em { font-style: italic; }
        .markdown-content hr { margin: 1rem 0; border: none; border-top: 2px solid #e5e7eb; }
      `}</style>
    </div>
  );
};

/**
 * 提示词详情页面
 */
const PromptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorView, setIsAuthorView] = useState(true); // true=作者视图, false=普通用户视图
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [applyReason, setApplyReason] = useState("");
  const [applying, setApplying] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  useEffect(() => {
    if (id) {
      const promptId = parseInt(id);
      if (!isNaN(promptId)) {
        loadPrompt(promptId);
      } else {
        setError("无效的提示词ID");
        setLoading(false);
      }
    }
  }, [id]);

  const loadPrompt = async (promptId: number) => {
    // 验证promptId
    if (!promptId || isNaN(promptId)) {
      setError("无效的提示词ID");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await promptsApi.getPrompt(promptId);

      setPrompt(data);
      setLikeCount(data.likeCount || 0);
      setIsLiked((data as any).isLiked || false);
      setIsFavorited((data as any).isFavorited || false);
    } catch (err: any) {
      console.error("Failed to load prompt:", err);
      let errorMsg = "加载提示词失败";

      if (err.response) {
        switch (err.response.status) {
          case 403:
            errorMsg = err.response.data?.message || "此提示词尚未发布或已归档";
            break;
          case 404:
            errorMsg = "提示词不存在";
            break;
          default:
            errorMsg = err.response.data?.message || "加载提示词失败";
        }
      }

      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!prompt || !user) {
      showError("请先登录");
      return;
    }

    try {
      if (isLiked) {
        await promptsApi.unlikePrompt(prompt.id);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
        showSuccess("已取消点赞");
      } else {
        await promptsApi.likePrompt(prompt.id);
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
        showSuccess("点赞成功");
      }
    } catch (err: any) {
      showError(err.response?.data?.message || "操作失败");
    }
  };

  const handleFavorite = async () => {
    if (!prompt || !user) {
      showError("请先登录");
      return;
    }

    try {
      if (isFavorited) {
        await promptsApi.unfavoritePrompt(prompt.id);
        setIsFavorited(false);
        showSuccess("已取消收藏");
      } else {
        await promptsApi.favoritePrompt(prompt.id);
        setIsFavorited(true);
        showSuccess("收藏成功");
      }
    } catch (err: any) {
      showError(err.response?.data?.message || "操作失败");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const { copyToClipboard } = await import("../../utils/clipboard");
    const success = await copyToClipboard(url);

    if (success) {
      showSuccess("链接已复制到剪贴板");
    } else {
      showError("复制失败，请手动复制");
    }
  };

  const handleUse = async () => {
    if (!prompt || !user) {
      showError("请先登录");
      return;
    }

    // 检查是否需要申请权限（基于 requireApplication 字段）
    // 在预览模式下，即使是作者也要走申请流程
    const needsApplication =
      prompt.requireApplication &&
      (!showAsAuthor || prompt.authorId !== user.id) &&
      !prompt.hasPermission; // 已有权限则无需申请

    if (needsApplication) {
      setShowApplyDialog(true);
      return;
    }

    // 有权限或不需要申请：跳转到作品管理页面使用提示词
    try {
      //await promptsApi.usePrompt(prompt.id);
      // 跳转到作品管理页面
      navigate("/dashboard/works");
    } catch (err: any) {
      showError(err.response?.data?.message || "使用失败");
    }
  };

  const handleApply = async () => {
    if (!prompt || !applyReason.trim()) {
      showError("请填写申请理由");
      return;
    }

    // 预览模式下，不允许实际提交申请
    if (isAuthor && !isAuthorView) {
      showError("预览模式下无法提交申请。这是演示申请流程的效果。");
      return;
    }

    // 后端也会检查，作者不能给自己的提示词提交申请
    if (isAuthor) {
      showError("你是作者，不能给自己的提示词提交申请");
      return;
    }

    try {
      setApplying(true);
      await promptApplicationsApi.applyForPrompt(prompt.id, {
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

  const handleEdit = () => {
    if (prompt) {
      navigate(`/dashboard/prompts/${prompt.id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!prompt || !window.confirm("确定要删除这个提示词吗？")) {
      return;
    }

    try {
      await promptsApi.deletePrompt(prompt.id);
      showSuccess("删除成功");
      navigate("/dashboard/prompts");
    } catch (err: any) {
      showError(err.response?.data?.message || "删除失败");
    }
  };

  const isAuthor = user && prompt && user.id === prompt.authorId;
  const showAsAuthor = isAuthor && isAuthorView; // 是否以作者身份显示

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">{error || "提示词不存在"}</p>
        <button
          onClick={() => navigate("/dashboard/prompts")}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          返回广场
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full sm:max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* 导航按钮 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <button
            onClick={() => navigate("/dashboard/prompts")}
            className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">返回广场</span>
          </button>
          {user && showAsAuthor && (
            <button
              onClick={() => navigate("/dashboard/prompts?tab=my")}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-gray-200 
                       rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all shadow-sm text-sm sm:text-base whitespace-nowrap"
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">我的提示词</span>
              <span className="sm:hidden">我的</span>
            </button>
          )}
        </div>

        {/* 作者提示 */}
        {isAuthor && (
          <div className="bg-blue-50/70 backdrop-blur-xl border border-blue-200/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col items-start gap-3">
              <div className="flex items-start gap-2 sm:gap-3 w-full">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-blue-900 text-xs sm:text-sm md:text-base">
                    {isAuthorView
                      ? "你是作者，正在查看完整内容"
                      : "预览模式：其他用户看到的内容"}
                  </h3>
                  <p className="text-xs text-blue-700 mt-0.5">
                    {isAuthorView
                      ? "你可以查看所有内容"
                      : "完全模拟普通用户视角"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthorView(!isAuthorView)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{isAuthorView ? "预览普通视图" : "返回作者视图"}</span>
              </button>
            </div>
          </div>
        )}

        {/* 主内容卡片 */}
        <div className="bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/50 shadow-xl p-4 sm:p-6 md:p-8">
          {/* 头部信息 */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex-1 min-w-0">
              {/* 分类标签 */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                {prompt.category?.icon && (
                  <span className="text-base sm:text-xl">
                    {prompt.category.icon}
                  </span>
                )}
                <span>{prompt.category?.name}</span>
              </div>

              {/* 标题 */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4 break-words">
                {prompt.name}
              </h1>

              {/* 作者信息 */}
              <div className="flex items-center gap-2 sm:gap-3">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                <span className="text-sm sm:text-base text-gray-600">
                  {prompt.author?.nickname || prompt.author?.username || "匿名"}
                </span>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* 作者操作 - 仅在作者视图下显示 */}
              {showAsAuthor && (
                <>
                  <button
                    onClick={handleEdit}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </button>
                </>
              )}
              {/* 举报按钮 - 非作者可以举报 */}
              {!isAuthor && user && (
                <button
                  onClick={() => setShowReportDialog(true)}
                  className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                  title="举报"
                >
                  <Flag className="w-5 h-5 text-orange-600" />
                </button>
              )}
            </div>
          </div>

          {/* 统计信息 */}
          <div className="flex items-center space-x-6 py-4 border-y border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-orange-500">🔥</span>
              <span className="font-semibold text-orange-500">
                {prompt.hotValue} 热度
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{prompt.viewCount} 浏览</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{prompt.useCount} 使用</span>
            </div>
            <div className="flex items-center space-x-2">
              <ThumbsUp className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">{likeCount} 点赞</span>
            </div>
          </div>

          {/* 提示词描述 */}
          {prompt.description && (
            <div className="mt-6">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <span className="mr-2">📝</span>
                  提示词描述
                </h3>
                <DescriptionRenderer content={prompt.description} />
              </div>
            </div>
          )}

          {/* 参数列表 - 始终显示（不受内容公开性影响） */}
          {((prompt as any).parameters?.length > 0 ||
            (prompt.contents &&
              prompt.contents.some(
                (content) => content.parameters && content.parameters.length > 0
              ))) && (
            <div className="mt-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-base font-bold text-blue-900 mb-4 flex items-center">
                  <span className="mr-2">📋</span>
                  参数列表
                </h3>
                <div className="space-y-2">
                  {/* 如果有单独的parameters字段（内容不公开时） */}
                  {(prompt as any).parameters?.length > 0
                    ? (prompt as any).parameters.map(
                        (param: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 py-2.5 px-4 bg-white rounded-lg border border-blue-100"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-sm font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                                  {"{{" + param.name + "}}"}
                                </span>
                                {param.required && (
                                  <span className="text-red-600 text-xs font-medium">
                                    *必填
                                  </span>
                                )}
                              </div>
                              {param.description && (
                                <p className="text-gray-600 text-sm mt-1.5">
                                  {param.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )
                    : // 从contents中提取（内容公开时）
                      prompt.contents
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
                              className="flex items-start gap-3 py-2.5 px-4 bg-white rounded-lg border border-blue-100"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-sm font-semibold text-blue-900 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                                    {"{{" + param.name + "}}"}
                                  </span>
                                  {param.required && (
                                    <span className="text-red-600 text-xs font-medium">
                                      *必填
                                    </span>
                                  )}
                                </div>
                                {param.description && (
                                  <p className="text-gray-600 text-sm mt-1.5">
                                    {param.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                </div>
              </div>
            </div>
          )}

          {/* 内容预览 */}
          <div className="mt-8">
            <div className="flex items-center mb-4">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
              <h2 className="text-xl font-bold text-gray-900 mx-4 flex items-center">
                <span className="mr-2"></span>
                提示词内容
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
            </div>

            {prompt.isContentPublic || showAsAuthor ? (
              <div className="space-y-6">
                {prompt.contents && prompt.contents.length > 0 ? (
                  <div className="space-y-4">
                    {prompt.contents
                      .filter((content) => content.isEnabled)
                      .sort((a, b) => a.order - b.order)
                      .map((content) => (
                        <div
                          key={content.id}
                          className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-gray-200 transition-all shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold text-gray-900">
                                {content.name}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  content.type === "text"
                                    ? "bg-blue-100 text-blue-700"
                                    : content.type === "character"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                              >
                                {content.type === "text"
                                  ? "文本"
                                  : content.type === "character"
                                  ? "人物卡"
                                  : "世界观"}
                              </span>
                            </div>
                            <span className="text-xs font-medium uppercase text-gray-400">
                              {content.role}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {content.content}
                          </p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500">暂无内容</p>
                )}
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
                <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <p className="text-amber-800 font-medium mb-2">
                  该提示词内容不公开
                </p>
                <p className="text-amber-600 text-sm">
                  作者选择不公开展示提示词的具体内容
                </p>
                {prompt.requireApplication && (
                  <p className="text-amber-600 text-sm mt-2">
                    💡 提示：使用此提示词需要向作者申请权限
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            {/* 移动端：垂直布局 */}
            <div className="md:hidden space-y-3">
              {/* 主操作按钮 */}
              <button
                onClick={handleUse}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 
                         transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>
                  {prompt.requireApplication &&
                  !showAsAuthor &&
                  !prompt.hasPermission
                    ? "申请使用"
                    : "立即使用"}
                </span>
              </button>

              {/* 次要操作按钮：3列网格 */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleLike}
                  className={`px-3 py-2.5 rounded-xl transition-all flex flex-col items-center space-y-1 ${
                    isLiked
                      ? "bg-red-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                  />
                  <span className="text-xs">{isLiked ? "已赞" : "点赞"}</span>
                </button>

                <button
                  onClick={handleFavorite}
                  className={`px-3 py-2.5 rounded-xl transition-all flex flex-col items-center space-y-1 ${
                    isFavorited
                      ? "bg-yellow-500 text-white"
                      : "bg-white border border-gray-300 text-gray-700"
                  }`}
                >
                  <Bookmark
                    className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`}
                  />
                  <span className="text-xs">
                    {isFavorited ? "已藏" : "收藏"}
                  </span>
                </button>

                <button
                  onClick={handleShare}
                  className="px-3 py-2.5 bg-white border border-gray-300 rounded-xl 
                           transition-all flex flex-col items-center space-y-1 text-gray-700 hover:bg-gray-50"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-xs">分享</span>
                </button>
              </div>
            </div>

            {/* 桌面端：水平布局 */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={handleUse}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 
                         transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>
                  {prompt.requireApplication &&
                  !showAsAuthor &&
                  !prompt.hasPermission
                    ? "申请使用"
                    : "立即使用"}
                </span>
              </button>

              <button
                onClick={handleLike}
                className={`px-6 py-3 rounded-xl transition-all flex items-center space-x-2 ${
                  isLiked
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                <span>{isLiked ? "已点赞" : "点赞"}</span>
              </button>

              <button
                onClick={handleFavorite}
                className={`px-6 py-3 rounded-xl transition-all flex items-center space-x-2 ${
                  isFavorited
                    ? "bg-yellow-500 text-white hover:bg-yellow-600"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Bookmark
                  className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`}
                />
                <span>{isFavorited ? "已收藏" : "收藏"}</span>
              </button>

              <button
                onClick={handleShare}
                className="px-6 py-3 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 
                         transition-all flex items-center space-x-2"
              >
                <Share2 className="w-5 h-5" />
                <span>分享</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 申请对话框 */}
      {showApplyDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              申请使用权限
            </h3>
            <p className="text-gray-600 mb-4">
              请说明您的使用目的，作者会尽快审核
            </p>

            <textarea
              value={applyReason}
              onChange={(e) => setApplyReason(e.target.value)}
              placeholder="请输入申请理由..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none 
                       focus:ring-2 focus:ring-blue-500 resize-none"
            />

            <div className="flex items-center space-x-3 mt-6">
              <button
                onClick={handleApply}
                disabled={applying || !applyReason.trim()}
                className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    提交中...
                  </>
                ) : (
                  "提交申请"
                )}
              </button>
              <button
                onClick={() => setShowApplyDialog(false)}
                disabled={applying}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 
                         transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 举报对话框 */}
      {prompt && (
        <ReportPromptDialog
          promptId={prompt.id}
          promptName={prompt.name}
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
        />
      )}
    </div>
  );
};

export default PromptDetail;
