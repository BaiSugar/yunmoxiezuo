import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  GripVertical,
  Eye,
  EyeOff,
  Edit2,
  ArrowUp,
  ArrowDown,
  X,
  HelpCircle,
  FileText,
  AlertCircle,
  Send,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { promptsApi, promptCategoriesApi } from "../../services/prompts.api";
import { useToast } from "../../contexts/ToastContext";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SimpleRichTextEditor from "../../components/prompts/SimpleRichTextEditor";
import type {
  PromptCategory,
  CreatePromptDto,
  UpdatePromptDto,
  MessageRole,
  ContentType,
  PromptStatus,
  PromptParameter,
} from "../../types/prompt";

interface ContentItem {
  id?: number;
  name: string;
  role: MessageRole;
  content: string;
  order: number;
  type: ContentType;
  referenceId?: number;
  isEnabled: boolean;
  parameters: PromptParameter[];
}

/**
 * 提示词创建/编辑页面 - 左右分栏布局
 */
const PromptEditor: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const isEditMode = !!id;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<PromptCategory[]>([]);

  // 表单数据
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [isContentPublic, setIsContentPublic] = useState(true);
  const [requireApplication, setRequireApplication] = useState(false);
  const [status, setStatus] = useState<PromptStatus>("draft");
  const [needsReview, setNeedsReview] = useState(false);
  const [reviewSubmittedAt, setReviewSubmittedAt] = useState<string | null>(
    null
  );
  const [contents, setContents] = useState<ContentItem[]>([
    {
      name: "系统提示",
      role: "system",
      content: "",
      order: 0,
      type: "text",
      isEnabled: true,
      parameters: [],
    },
    {
      name: "人物卡",
      role: "user",
      content: "",
      order: 1,
      type: "character",
      isEnabled: false,
      parameters: [],
    },
    {
      name: "世界观",
      role: "user",
      content: "",
      order: 2,
      type: "worldview",
      isEnabled: false,
      parameters: [],
    },
  ]);

  // 当前编辑的内容项索引（-1表示编辑描述，>=0表示编辑内容项）
  const [editingIndex, setEditingIndex] = useState<number>(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 手机端编辑模式控制
  const [showMobileEditor, setShowMobileEditor] = useState(false);

  // 确认对话框
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // 角色说明提示
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  // 名称提示说明
  const [showNameInfo, setShowNameInfo] = useState(false);

  // 卡片点击处理
  const handleCardClick = (
    e: React.MouseEvent | React.TouchEvent,
    index: number
  ) => {
    // 如果点击的是操作按钮区域，不触发
    if ((e.target as HTMLElement).closest(".action-buttons")) return;
    // 如果点击的是拖拽手柄，不触发
    if ((e.target as HTMLElement).closest(".drag-handle")) return;
    // 如果正在拖拽，不触发点击
    if (isDragging) return;

    setEditingIndex(index);
    setShowMobileEditor(true);
  };

  useEffect(() => {
    loadCategories();
    if (isEditMode && id) {
      loadPrompt(parseInt(id));
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const data = await promptCategoriesApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
      showError("加载分类失败");
    }
  };

  const loadPrompt = async (promptId: number) => {
    try {
      const data = await promptsApi.getPrompt(promptId);

      setName(data.name);
      setDescription(data.description || "");
      setCategoryId(data.categoryId);
      setIsPublic(data.isPublic);
      setIsContentPublic(data.isContentPublic);
      setRequireApplication(data.requireApplication || false);
      setStatus(data.status);
      setNeedsReview(data.needsReview || false);
      setReviewSubmittedAt(data.reviewSubmittedAt || null);

      if (data.contents && data.contents.length > 0) {
        setContents(
          data.contents.map((content) => ({
            id: content.id,
            name: content.name,
            role: content.role,
            content: content.content,
            order: content.order,
            type: content.type,
            isEnabled: content.isEnabled,
            parameters: content.parameters || [],
          }))
        );
      }
    } catch (err: any) {
      console.error("Failed to load prompt:", err);
      showError("加载提示词失败");
      navigate("/dashboard/prompts");
    } finally {
      setLoading(false);
    }
  };

  const handleAddContent = () => {
    const newContent: ContentItem = {
      name: `内容 ${contents.length + 1}`,
      role: "user",
      content: "",
      order: contents.length,
      type: "text",
      isEnabled: true,
      parameters: [],
    };
    setContents([...contents, newContent]);
    setEditingIndex(contents.length);
  };

  const handleDeleteContent = (index: number) => {
    const content = contents[index];

    // 内置插槽不能删除
    if (content.type === "character" || content.type === "worldview") {
      showError("系统内置插槽不能删除，可以选择隐藏");
      return;
    }

    if (contents.length === 1) {
      showError("至少需要保留一个内容项");
      return;
    }

    const newContents = contents.filter((_, i) => i !== index);
    setContents(newContents.map((c, i) => ({ ...c, order: i })));
    if (editingIndex === index) {
      setEditingIndex(Math.max(0, index - 1));
    } else if (editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const updateContent = (index: number, updates: Partial<ContentItem>) => {
    const newContents = [...contents];
    newContents[index] = { ...newContents[index], ...updates };
    setContents(newContents);
  };

  // 拖拽排序
  const handleDragStart = (index: number) => {
    setIsDragging(true);
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newContents = [...contents];
    const draggedItem = newContents[draggedIndex];
    newContents.splice(draggedIndex, 1);
    newContents.splice(index, 0, draggedItem);

    setContents(newContents.map((c, i) => ({ ...c, order: i })));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    // 延迟重置拖拽状态，避免影响点击事件
    setTimeout(() => setIsDragging(false), 100);
  };

  // 上移内容项
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newContents = [...contents];
    [newContents[index - 1], newContents[index]] = [
      newContents[index],
      newContents[index - 1],
    ];
    setContents(newContents.map((c, i) => ({ ...c, order: i })));
    if (editingIndex === index) {
      setEditingIndex(index - 1);
    } else if (editingIndex === index - 1) {
      setEditingIndex(index);
    }
  };

  // 下移内容项
  const handleMoveDown = (index: number) => {
    if (index === contents.length - 1) return;
    const newContents = [...contents];
    [newContents[index], newContents[index + 1]] = [
      newContents[index + 1],
      newContents[index],
    ];
    setContents(newContents.map((c, i) => ({ ...c, order: i })));
    if (editingIndex === index) {
      setEditingIndex(index + 1);
    } else if (editingIndex === index + 1) {
      setEditingIndex(index);
    }
  };

  // 提取参数（支持 {{}} 和 ${} 两种格式）
  const extractParameters = (content: string): PromptParameter[] => {
    const params: PromptParameter[] = [];
    const seen = new Set<string>();

    // 匹配 {{参数名}} 格式
    const doubleRegex = /\{\{([^{}]+)\}\}/g;
    let match;
    while ((match = doubleRegex.exec(content)) !== null) {
      const paramName = match[1].trim();
      if (paramName && !seen.has(paramName)) {
        seen.add(paramName);
        params.push({
          name: paramName,
          description: "",
          required: true,
        });
      }
    }

    // 匹配 ${参数名} 格式
    const dollarRegex = /\$\{([^{}]+)\}/g;
    while ((match = dollarRegex.exec(content)) !== null) {
      const paramName = match[1].trim();
      if (paramName && !seen.has(paramName)) {
        seen.add(paramName);
        params.push({
          name: paramName,
          description: "",
          required: true,
        });
      }
    }

    return params;
  };

  const handleContentChange = (content: string) => {
    const params = extractParameters(content);
    updateContent(editingIndex, { content, parameters: params });
  };

  const handleSwitchToDraft = async () => {
    setShowConfirmDialog(true);
  };

  const confirmSwitchToDraft = async () => {
    setShowConfirmDialog(false);
    await handleSaveWithStatus("draft");
  };

  const handlePublish = async () => {
    await handleSaveWithStatus("published");
  };

  const handleSave = async () => {
    await handleSaveWithStatus(status);
  };

  const handleSubmitReview = async () => {
    if (!id) return;

    try {
      setSaving(true);
      const updatedPrompt = await promptsApi.submitForReview(parseInt(id));
      setReviewSubmittedAt(updatedPrompt.reviewSubmittedAt || null);
      showSuccess("已提交审核，管理员将收到通知并尽快处理");
    } catch (error: any) {
      showError(error.message || "提交审核失败");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWithStatus = async (newStatus: PromptStatus) => {
    if (!name.trim()) {
      showError("请输入提示词名称");
      return;
    }
    if (!categoryId) {
      showError("请选择分类");
      return;
    }

    setSaving(true);
    try {
      // 保存所有内容（包括禁用的），保持完整状态
      const validContents = contents.map((content) => ({
        name: content.name,
        role: content.role,
        content: content.content || "", // 确保content不是undefined
        order: content.order,
        type: content.type,
        isEnabled: content.isEnabled,
        parameters: content.parameters || [],
      }));

      const data: Partial<CreatePromptDto | UpdatePromptDto> = {
        name: name.trim(),
        description: description.trim(),
        categoryId,
        isPublic,
        isContentPublic,
        requireApplication,
        status: newStatus,
        contents: validContents,
      };

      if (isEditMode && id) {
        await promptsApi.updatePrompt(parseInt(id), data);
        setStatus(newStatus); // 更新本地状态
        showSuccess("更新成功");
        // 如果是发布状态，返回我的提示词列表
        if (newStatus === "published") {
          navigate("/dashboard/prompts?tab=my");
        } else {
          navigate(`/dashboard/prompts/${id}/edit`);
        }
      } else {
        const newPrompt = await promptsApi.createPrompt(
          data as CreatePromptDto
        );
        setStatus(newStatus); // 更新本地状态
        showSuccess("创建成功");
        // 如果是发布状态，返回我的提示词列表
        if (newStatus === "published") {
          navigate("/dashboard/prompts?tab=my");
        } else {
          navigate(`/dashboard/prompts/${newPrompt.id}/edit`);
        }
        return;
      }
    } catch (err: any) {
      console.error("Failed to save prompt:", err);
      showError(err.response?.data?.message || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const editingContent = contents[editingIndex] || contents[0];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 审核中警告横幅 */}
      {needsReview && (
        <div className="bg-amber-50 border-b border-amber-200 p-4 sm:p-6">
          <div className="flex items-start space-x-3 mx-2 sm:mx-0">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              {reviewSubmittedAt ? (
                // 已提交审核
                <>
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    该提示词正在等待管理员审核
                  </h3>
                  <p className="text-sm text-amber-800">
                    您已于 {new Date(reviewSubmittedAt).toLocaleString("zh-CN")}{" "}
                    提交审核，请耐心等待管理员处理。
                    在审核期间，您仍可以继续修改内容，但无法发布。
                  </p>
                </>
              ) : (
                // 刚被举报下架，还未提交审核
                <>
                  <h3 className="text-sm font-semibold text-amber-900 mb-1">
                    该提示词因违规被下架
                  </h3>
                  <p className="text-sm text-amber-800">
                    您的提示词因被举报已自动下架。请修改违规内容后，点击右上角的"提交审核"按钮，
                    提交后管理员会进行审核。
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 顶部操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-200 bg-white gap-3">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">返回</span>
          </button>
          <button
            onClick={() => navigate("/dashboard/prompts?tab=my")}
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 
                     rounded-lg hover:bg-gray-50 transition-all text-sm"
          >
            <FileText className="w-4 h-4" />
            <span>我的提示词</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {isEditMode ? "编辑提示词" : "创建提示词"}
          </h1>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {isEditMode ? (
            // 编辑模式的按钮
            <>
              {status === "published" && (
                <button
                  onClick={handleSwitchToDraft}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 
                           transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  title="将提示词切换为草稿状态，将在广场下架"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm sm:text-base">切换为草稿</span>
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm sm:text-base">更新</span>
              </button>
              {needsReview ? (
                // 需要审核：显示"提交审核"按钮
                <button
                  onClick={handleSubmitReview}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 
                           transition-colors shadow-lg shadow-amber-500/30 disabled:opacity-50 flex items-center justify-center space-x-2"
                  title="提交管理员审核"
                >
                  <Send className="w-4 h-4" />
                  <span className="text-sm sm:text-base">提交审核</span>
                </button>
              ) : status === "draft" ? (
                // 草稿状态且不需要审核：显示"发布"按钮
                <button
                  onClick={handlePublish}
                  disabled={saving}
                  className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 
                           transition-colors shadow-lg shadow-green-500/30 disabled:opacity-50 flex items-center justify-center space-x-2"
                  title="发布到广场"
                >
                  <Save className="w-4 h-4" />
                  <span className="text-sm sm:text-base">发布</span>
                </button>
              ) : null}
            </>
          ) : (
            // 创建模式的按钮
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 
                         transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm sm:text-base">保存草稿</span>
              </button>
              <button
                onClick={handlePublish}
                disabled={saving}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm sm:text-base">发布</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 左右分栏布局 */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 左侧面板 */}
        <div
          className={`w-full lg:w-[480px] border-b lg:border-b-0 lg:border-r border-gray-200 bg-white flex flex-col overflow-hidden ${
            showMobileEditor ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 基本信息 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                基本信息
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="提示词名称"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg 
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700">
                      描述
                    </label>
                    <button
                      onClick={() => {
                        setShowMobileEditor(true);
                        setEditingIndex(-1); // -1 表示编辑描述
                      }}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>编辑</span>
                    </button>
                  </div>
                  <div
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg 
                                bg-white min-h-[80px] max-h-[200px] overflow-y-auto"
                  >
                    {description ? (
                      <div className="prose prose-sm max-w-none markdown-preview">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {description}
                        </ReactMarkdown>
                        <style>{`
                          .markdown-preview h1 { font-size: 1.25rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.75rem; }
                          .markdown-preview h2 { font-size: 1.125rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
                          .markdown-preview h3 { font-size: 1rem; font-weight: 600; margin-top: 0.75rem; margin-bottom: 0.5rem; }
                          .markdown-preview p { margin: 0.5rem 0; line-height: 1.625; }
                          .markdown-preview code { padding: 0.125rem 0.375rem; background-color: #f3f4f6; border-radius: 0.25rem; font-size: 0.75rem; }
                          .markdown-preview pre code { display: block; padding: 0.5rem; background-color: #1f2937; color: #f3f4f6; border-radius: 0.375rem; }
                          .markdown-preview ul, .markdown-preview ol { padding-left: 1.5rem; margin: 0.5rem 0; }
                          .markdown-preview li { margin: 0.25rem 0; }
                          .markdown-preview strong { font-weight: 600; }
                          .markdown-preview a { color: #2563eb; text-decoration: underline; }
                        `}</style>
                      </div>
                    ) : (
                      <span className="text-gray-400">
                        暂无描述（点击编辑按钮添加）
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    支持 Markdown 格式
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      分类 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={categoryId || ""}
                      onChange={(e) =>
                        setCategoryId(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg 
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">选择分类</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 发布设置 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                发布设置
              </h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      公开到广场
                    </div>
                    <div className="text-xs text-gray-500">
                      在提示词广场展示
                    </div>
                  </div>
                </label>

                <label
                  className={`flex items-center space-x-2 ${
                    requireApplication
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isContentPublic}
                    onChange={(e) => setIsContentPublic(e.target.checked)}
                    disabled={requireApplication}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      公开内容
                    </div>
                    <div className="text-xs text-gray-500">
                      详情页显示完整内容
                      {requireApplication && (
                        <span className="text-orange-600">
                          {" "}
                          （需要申请使用时不可公开内容）
                        </span>
                      )}
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireApplication}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setRequireApplication(checked);
                      // 如果勾选需要申请，自动取消内容公开
                      if (checked) {
                        setIsContentPublic(false);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      需要申请使用
                    </div>
                    <div className="text-xs text-gray-500">
                      用户需申请后才能使用（申请后内容仍不可见）
                    </div>
                  </div>
                </label>

                {/* 提示信息 */}
                {isPublic && isContentPublic && !requireApplication && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700">
                      ✓ 广场可见，内容可见，可直接使用
                    </p>
                  </div>
                )}
                {isPublic && !isContentPublic && !requireApplication && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      ✓ 广场可见，内容不可见，可直接使用
                    </p>
                  </div>
                )}
                {isPublic && !isContentPublic && requireApplication && (
                  <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-xs text-orange-700">
                      ✓ 广场可见，内容不可见，需申请使用（申请后内容仍不可见）
                    </p>
                  </div>
                )}
                {!isPublic && (
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600">
                      ℹ️ 私有模式：仅自己可见和使用
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 提示词内容列表 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  提示词内容
                </h3>
                <button
                  onClick={handleAddContent}
                  className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                           transition-colors"
                  title="添加内容"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {contents.map((content, index) => (
                  <div
                    key={index}
                    draggable={window.innerWidth >= 640}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => handleCardClick(e, index)}
                    onTouchStart={(e) => {
                      // 触摸事件，手机端更灵敏
                      handleCardClick(e, index);
                    }}
                    className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-2 p-3 rounded-lg border-2 cursor-pointer
                             transition-all ${
                               editingIndex === index
                                 ? "border-blue-500 bg-blue-50"
                                 : "border-gray-200 bg-white hover:border-gray-300"
                             } ${draggedIndex === index ? "opacity-50" : ""}`}
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className="drag-handle hidden sm:block">
                        <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-grab" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm font-medium truncate ${
                            content.isEnabled
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {content.name}
                          {(content.type === "character" ||
                            content.type === "worldview") && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded">
                              插槽
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-xs ${
                            content.isEnabled
                              ? "text-gray-500"
                              : "text-gray-400"
                          }`}
                        >
                          {content.role === "system"
                            ? "系统"
                            : content.role === "user"
                            ? "用户"
                            : "助手"}
                          {" · "}
                          {content.type === "text" && "文本"}
                          {content.type === "character" && "人物卡"}
                          {content.type === "worldview" && "世界观"}
                          {content.parameters.length > 0 &&
                            ` · ${content.parameters.length} 个参数`}
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div
                      className="action-buttons flex items-center flex-wrap gap-1 sm:space-x-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* 上移 */}
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="上移"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      {/* 下移 */}
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === contents.length - 1}
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="下移"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      {/* 显示/隐藏 */}
                      <button
                        onClick={() =>
                          updateContent(index, {
                            isEnabled: !content.isEnabled,
                          })
                        }
                        className={`p-1.5 rounded transition-colors ${
                          content.isEnabled
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        title={content.isEnabled ? "显示中" : "已隐藏"}
                      >
                        {content.isEnabled ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>

                      {/* 编辑（仅文本类型）*/}
                      {content.type === "text" && (
                        <button
                          onClick={() => {
                            setEditingIndex(index);
                            setShowMobileEditor(true);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* 删除（只有文本类型才显示）*/}
                      {content.type === "text" && contents.length > 1 && (
                        <button
                          onClick={() => handleDeleteContent(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧编辑区 */}
        <div
          className={`flex-1 flex-col bg-gray-50 overflow-hidden ${
            showMobileEditor ? "flex" : "hidden lg:flex"
          }`}
        >
          {editingIndex === -1 ? (
            // 编辑描述
            <>
              <div className="p-3 sm:p-4 bg-white border-b border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    编辑描述
                  </h2>
                  <button
                    onClick={() => setShowMobileEditor(false)}
                    className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto -webkit-overflow-scrolling-touch min-h-0">
                <div className="max-w-4xl mx-auto">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    描述内容（支持 Markdown）
                  </label>
                  <SimpleRichTextEditor
                    value={description}
                    onChange={setDescription}
                    placeholder="输入提示词描述，支持 Markdown 格式..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 左侧会实时显示 Markdown 渲染效果
                  </p>
                </div>
              </div>
            </>
          ) : (
            editingContent && (
              <>
                {/* 编辑区头部 */}
                <div className="p-3 sm:p-4 bg-white border-b border-gray-200 flex-shrink-0">
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <button
                      onClick={() => setShowMobileEditor(false)}
                      className="lg:hidden p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingContent.type === "text" ? (
                        <div>
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                            <label className="text-xs font-medium text-gray-700 whitespace-nowrap flex-shrink-0">
                              内容名称
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowNameInfo(!showNameInfo)}
                              className="p-0.5 text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
                              title="查看名称说明"
                            >
                              <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={editingContent.name}
                            onChange={(e) =>
                              updateContent(editingIndex, {
                                name: e.target.value,
                              })
                            }
                            className="w-full text-sm sm:text-base lg:text-lg font-semibold text-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 
                                   border-2 border-blue-300 rounded-lg bg-blue-50/30
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                                   placeholder:text-gray-400"
                            placeholder="例如：系统提示、角色设定、写作规则..."
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            内容名称（系统内置）
                          </label>
                          <div
                            className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 
                                      bg-purple-50 border-2 border-purple-200 rounded-lg flex items-center flex-wrap gap-2"
                          >
                            <span className="break-words">
                              {editingContent.name}
                            </span>
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded flex-shrink-0">
                              插槽（不可编辑）
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 名称说明 */}
                      {editingContent.type === "text" && showNameInfo && (
                        <div className="mt-2 p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1.5 sm:space-y-2">
                          <div className="flex items-start space-x-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-amber-800 leading-relaxed break-words">
                                <strong className="text-amber-900">
                                  重要提示：
                                </strong>
                                <br />
                                这个名称<strong>仅用于您识别</strong>
                                左侧列表中的内容项，方便管理。
                                <span className="block mt-1 text-amber-700">
                                  ✓ 发送给AI的是下方的
                                  <strong>"内容文本"</strong>
                                  <br />✗ 名称本身<strong>不会</strong>发送给AI
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-2 sm:mt-3 space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-1 min-w-0 w-full sm:w-auto">
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                                消息角色
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowRoleInfo(!showRoleInfo)}
                                className="p-0.5 text-gray-400 hover:text-blue-500 transition-colors"
                                title="查看角色说明"
                              >
                                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                            <select
                              value={editingContent.role}
                              onChange={(e) =>
                                updateContent(editingIndex, {
                                  role: e.target.value as MessageRole,
                                })
                              }
                              className="flex-1 sm:flex-none text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-white border-2 border-gray-300 rounded-lg 
                                     hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                                     focus:border-blue-500 transition-all cursor-pointer"
                            >
                              <option value="system">系统 (System)</option>
                              <option value="user">用户 (User)</option>
                              <option value="assistant">
                                助手 (Assistant)
                              </option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                            <label className="text-xs font-medium text-gray-600 whitespace-nowrap">
                              类型
                            </label>
                            {editingContent.type === "text" ? (
                              <span className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg whitespace-nowrap">
                                文本
                              </span>
                            ) : (
                              <span className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-lg whitespace-nowrap">
                                {editingContent.type === "character"
                                  ? "👤 人物卡"
                                  : "🌍 世界观"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 角色说明 */}
                        {showRoleInfo && (
                          <div className="p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1.5 sm:space-y-2">
                            <div className="flex items-start space-x-2">
                              <span className="text-lg"></span>
                              <div>
                                <strong className="text-amber-900">
                                  系统 (System)：
                                </strong>
                                <p className="text-amber-800">
                                  设置AI的行为规则、角色定位和回复风格。通常用于第一条消息。
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-lg"></span>
                              <div>
                                <strong className="text-amber-900">
                                  用户 (User)：
                                </strong>
                                <p className="text-amber-800">
                                  模拟用户的输入内容。在提示词中提供示例或上下文。
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-lg"></span>
                              <div>
                                <strong className="text-amber-900">
                                  助手 (Assistant)：
                                </strong>
                                <p className="text-amber-800">
                                  模拟AI的回复示例。用于引导AI的输出格式和风格。
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 编辑区内容 */}
                <div className="flex-1 p-3 sm:p-4 overflow-y-auto -webkit-overflow-scrolling-touch min-h-0">
                  <div className="max-w-4xl mx-auto">
                    {editingContent.type === "text" ? (
                      // 文本类型：正常编辑
                      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <label className="block text-xs sm:text-sm font-medium text-gray-700">
                            内容文本
                          </label>
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const textarea = document.querySelector(
                                  `textarea[placeholder*="输入提示词内容"]`
                                ) as HTMLTextAreaElement;
                                if (!textarea) return;

                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const text = editingContent.content;
                                const before = text.substring(0, start);
                                const after = text.substring(end);

                                const newText = before + "{{}}" + after;
                                handleContentChange(newText);

                                // 延迟设置光标位置，等待状态更新
                                setTimeout(() => {
                                  textarea.focus();
                                  const cursorPos = start + 2; // 光标定位到 {{ 和 }} 之间
                                  textarea.setSelectionRange(
                                    cursorPos,
                                    cursorPos
                                  );
                                }, 0);
                              }}
                              className="px-2 sm:px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 
                                     transition-colors flex items-center gap-1 flex-shrink-0"
                              title="在光标位置插入参数占位符（双花括号格式）"
                            >
                              <span className="font-mono">{"{{}}"}</span>
                              <span className="hidden sm:inline">插入参数</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const textarea = document.querySelector(
                                  `textarea[placeholder*="输入提示词内容"]`
                                ) as HTMLTextAreaElement;
                                if (!textarea) return;

                                const start = textarea.selectionStart;
                                const end = textarea.selectionEnd;
                                const text = editingContent.content;
                                const before = text.substring(0, start);
                                const after = text.substring(end);

                                const newText = before + "${}" + after;
                                handleContentChange(newText);

                                // 延迟设置光标位置，等待状态更新
                                setTimeout(() => {
                                  textarea.focus();
                                  const cursorPos = start + 2; // 光标定位到 ${ 和 } 之间
                                  textarea.setSelectionRange(
                                    cursorPos,
                                    cursorPos
                                  );
                                }, 0);
                              }}
                              className="px-2 sm:px-2.5 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 
                                     transition-colors flex items-center gap-1 flex-shrink-0"
                              title="在光标位置插入参数占位符（美元符号格式）"
                            >
                              <span className="font-mono">{"${}"}</span>
                              <span className="hidden sm:inline">插入参数</span>
                            </button>
                          </div>
                        </div>
                        <textarea
                          value={editingContent.content}
                          onChange={(e) => handleContentChange(e.target.value)}
                          placeholder="输入提示词内容，使用 {{参数名}} 或 ${参数名} 定义参数"
                          rows={12}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg 
                                 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-xs sm:text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-2 break-words">
                          支持两种格式定义动态参数：{"{{参数名}}"} 或{" "}
                          {"${参数名}"}，例如：{"{{用户名}}"} / {"${用户名}"},{" "}
                          {"{{主题}}"} / {"${主题}"}
                        </p>
                      </div>
                    ) : editingContent.type === "character" ? (
                      // 人物卡插槽 - 内置插槽，内容由用户提供
                      <div className="bg-white rounded-xl border border-purple-200 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                          <label className="block text-base sm:text-lg font-semibold text-gray-900">
                            人物卡插槽
                          </label>
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 sm:px-3 py-1 rounded-full font-medium">
                            系统内置
                          </span>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg">👤</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-purple-900 mb-2">
                                使用说明
                              </h4>
                              <p className="text-sm text-purple-700 leading-relaxed">
                                这是一个系统内置的插槽，用于接收用户的人物卡信息。
                                <br />
                                用户在使用此提示词时，可以自行提供人物卡内容。
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600">
                          <div className="flex items-start space-x-2">
                            <span className="text-purple-500">•</span>
                            <span>
                              您只需要控制是否启用此插槽（点击左侧的眼睛图标）
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-purple-500">•</span>
                            <span>具体的人物卡内容由用户在对话时提供</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-purple-500">•</span>
                            <span>此插槽无法删除，但可以隐藏</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // 世界观插槽 - 内置插槽，内容由用户提供
                      <div className="bg-white rounded-xl border border-purple-200 p-4 sm:p-6">
                        <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
                          <label className="block text-base sm:text-lg font-semibold text-gray-900">
                            世界观插槽
                          </label>
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 sm:px-3 py-1 rounded-full font-medium">
                            系统内置
                          </span>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-lg">🌍</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-purple-900 mb-2">
                                使用说明
                              </h4>
                              <p className="text-sm text-purple-700 leading-relaxed">
                                这是一个系统内置的插槽，用于接收用户的世界观设定。
                                <br />
                                用户在使用此提示词时，可以自行提供世界观内容。
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600">
                          <div className="flex items-start space-x-2">
                            <span className="text-purple-500">•</span>
                            <span>
                              您只需要控制是否启用此插槽（点击左侧的眼睛图标）
                            </span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-purple-500">•</span>
                            <span>具体的世界观内容由用户在对话时提供</span>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-purple-500">•</span>
                            <span>此插槽无法删除，但可以隐藏</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 参数列表 */}
                    {editingContent.parameters.length > 0 && (
                      <div className="mt-3 sm:mt-4 bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                        <h4 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                          检测到的参数 ({editingContent.parameters.length})
                        </h4>
                        <div className="space-y-2 sm:space-y-3">
                          {editingContent.parameters.map((param, pIndex) => (
                            <div
                              key={pIndex}
                              className="p-2.5 sm:p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center flex-wrap gap-2 mb-2">
                                <span className="text-xs sm:text-sm font-medium text-gray-900 break-all">
                                  {"{{" + param.name + "}}"}
                                </span>
                                <label className="flex items-center space-x-1 text-xs flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={param.required}
                                    onChange={(e) => {
                                      const newParams = [
                                        ...editingContent.parameters,
                                      ];
                                      newParams[pIndex] = {
                                        ...param,
                                        required: e.target.checked,
                                      };
                                      updateContent(editingIndex, {
                                        parameters: newParams,
                                      });
                                    }}
                                    className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                                  />
                                  <span className="text-gray-600">必填</span>
                                </label>
                              </div>
                              <input
                                type="text"
                                value={param.description}
                                onChange={(e) => {
                                  const newParams = [
                                    ...editingContent.parameters,
                                  ];
                                  newParams[pIndex] = {
                                    ...param,
                                    description: e.target.value,
                                  };
                                  updateContent(editingIndex, {
                                    parameters: newParams,
                                  });
                                }}
                                placeholder="参数描述"
                                className="w-full px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded 
                                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )
          )}
        </div>
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="切换为草稿"
        message="确定要将此提示词切换为草稿状态吗？切换后将在广场下架，其他用户将无法看到。"
        confirmText="确认切换"
        cancelText="取消"
        type="warning"
        onConfirm={confirmSwitchToDraft}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </div>
  );
};

export default PromptEditor;
