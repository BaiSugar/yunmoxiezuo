import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  BookOpen,
  FileText,
  Plus,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { novelsApi } from "../../../services/novels.api";

interface Work {
  id: number;
  name: string;
  coverImage?: string;
  chapterCount?: number;
}

interface Chapter {
  id: number;
  title: string;
  order: number;
  content?: string;
}

interface ApplyToWorkModalProps {
  isOpen: boolean;
  content: string;
  title?: string;
  onClose: () => void;
}

type CopyMode = "new" | "replace" | "append";

/**
 * 应用到作品模态窗 - 现代化UI设计
 */
const ApplyToWorkModal: React.FC<ApplyToWorkModalProps> = ({
  isOpen,
  content,
  title = "AI生成内容",
  onClose,
}) => {
  const { success: showSuccess, error: showError } = useToast();
  const [step, setStep] = useState<1 | 2>(1); // 1: 选择作品, 2: 选择模式和章节
  const [works, setWorks] = useState<Work[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedWork, setSelectedWork] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [copyMode, setCopyMode] = useState<CopyMode>("new");
  const [newChapterTitle, setNewChapterTitle] = useState(title || "");
  const [loading, setLoading] = useState(false);
  const [loadingWorks, setLoadingWorks] = useState(true);

  // 加载用户作品列表
  useEffect(() => {
    if (!isOpen) return;

    const fetchWorks = async () => {
      setLoadingWorks(true);
      try {
        const result = await novelsApi.getMyNovels({
          page: 1,
          pageSize: 100,
        });
        // 处理返回格式（可能是数组或分页对象）
        const worksData = Array.isArray(result) ? result : result.data;
        setWorks(worksData || []);
      } catch (error) {
        console.error("获取作品列表失败:", error);
        showError("获取作品列表失败");
      } finally {
        setLoadingWorks(false);
      }
    };

    fetchWorks();
  }, [isOpen, showError]);

  // 加载选中作品的章节列表
  useEffect(() => {
    if (!selectedWork) {
      setChapters([]);
      return;
    }

    const fetchChapters = async () => {
      try {
        const data = await novelsApi.getChapters(selectedWork);
        setChapters(data || []);
      } catch (error) {
        console.error("获取章节列表失败:", error);
        showError("获取章节列表失败");
      }
    };

    fetchChapters();
  }, [selectedWork, showError]);

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedWork(null);
      setSelectedChapter(null);
      setCopyMode("new");
      setNewChapterTitle(title || "");
    }
  }, [isOpen, title]);

  const handleNext = () => {
    if (!selectedWork) {
      showError("请选择作品");
      return;
    }
    setStep(2);
  };

  const handleApply = async () => {
    if (!selectedWork) {
      showError("请选择作品");
      return;
    }

    if (copyMode !== "new" && !selectedChapter) {
      showError("请选择章节");
      return;
    }

    if (copyMode === "new" && !newChapterTitle.trim()) {
      showError("请输入章节标题");
      return;
    }

    setLoading(true);

    try {
      if (copyMode === "new") {
        // 创建新章节
        await novelsApi.createChapter({
          novelId: selectedWork,
          volumeId: null,
          title: newChapterTitle,
          content,
          globalOrder: chapters.length + 1,
        });
        showSuccess("✨ 已创建新章节并保存内容");
      } else {
        // 更新现有章节
        let updateContent: string;

        if (copyMode === "replace") {
          updateContent = content;
        } else {
          // 追加模式
          const chapterData = await novelsApi.getChapter(selectedChapter!);
          const currentContent = chapterData.content || "";
          updateContent = currentContent + "\n\n" + content;
        }

        await novelsApi.updateChapterContent(selectedChapter!, updateContent);
        showSuccess(
          copyMode === "replace" ? "✨ 已替换章节内容" : "✨ 已追加到章节末尾"
        );
      }

      onClose();
    } catch (error) {
      console.error("应用失败:", error);
      showError("应用失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedWorkData = works.find((w) => w.id === selectedWork);

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      {/* 模态窗 */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* 头部 - 渐变背景 */}
        <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">应用到作品</h2>
                <p className="text-sm text-white/80 mt-0.5">
                  将生成内容保存到您的作品中
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* 进度指示器 */}
          <div className="relative mt-6 flex items-center">
            <div className="flex items-center flex-1">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step === 1
                    ? "bg-white text-blue-600 shadow-lg"
                    : "bg-white/20 text-white"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 1 ? "bg-blue-600 text-white" : "bg-white/30"
                  }`}
                >
                  {selectedWork && step === 2 ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    "1"
                  )}
                </div>
                <span className="text-sm font-medium">选择作品</span>
              </div>
            </div>

            <ChevronRight
              className={`w-5 h-5 mx-2 ${
                step === 2 ? "text-white" : "text-white/40"
              }`}
            />

            <div className="flex items-center flex-1">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step === 2
                    ? "bg-white text-purple-600 shadow-lg"
                    : "bg-white/20 text-white/60"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === 2 ? "bg-purple-600 text-white" : "bg-white/30"
                  }`}
                >
                  2
                </div>
                <span className="text-sm font-medium">配置保存</span>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 ? (
            /* 步骤1: 选择作品 */
            <div>
              <div className="mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  选择目标作品
                </h3>
              </div>

              {loadingWorks ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
                    <p className="text-gray-500">加载中...</p>
                  </div>
                </div>
              ) : works.length === 0 ? (
                <div className="text-center py-20">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">暂无作品</p>
                  <p className="text-gray-400 text-sm">
                    请先创建作品再使用此功能
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {works.map((work) => (
                    <button
                      key={work.id}
                      onClick={() => setSelectedWork(work.id)}
                      className={`group relative p-5 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                        selectedWork === work.id
                          ? "border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg"
                          : "border-gray-200 hover:border-blue-300 hover:shadow-md bg-white"
                      }`}
                    >
                      {/* 选中标记 */}
                      {selectedWork === work.id && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate mb-1">
                            {work.name}
                          </h4>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* 步骤2: 选择模式和章节 */
            <div className="space-y-6">
              {/* 选中的作品信息 */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">目标作品</div>
                    <div className="font-semibold text-gray-900">
                      {selectedWorkData?.name}
                    </div>
                  </div>
                </div>
              </div>

              {/* 保存模式 */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    保存模式
                  </h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setCopyMode("new")}
                    className={`group p-4 rounded-xl border-2 transition-all ${
                      copyMode === "new"
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        copyMode === "new"
                          ? "bg-blue-500"
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }`}
                    >
                      <Plus
                        className={`w-6 h-6 ${
                          copyMode === "new" ? "text-white" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div
                      className={`text-sm font-semibold text-center ${
                        copyMode === "new" ? "text-blue-900" : "text-gray-700"
                      }`}
                    >
                      新建章节
                    </div>
                  </button>

                  <button
                    onClick={() => setCopyMode("replace")}
                    className={`group p-4 rounded-xl border-2 transition-all ${
                      copyMode === "replace"
                        ? "border-orange-500 bg-orange-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        copyMode === "replace"
                          ? "bg-orange-500"
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }`}
                    >
                      <FileText
                        className={`w-6 h-6 ${
                          copyMode === "replace"
                            ? "text-white"
                            : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div
                      className={`text-sm font-semibold text-center ${
                        copyMode === "replace"
                          ? "text-orange-900"
                          : "text-gray-700"
                      }`}
                    >
                      替换内容
                    </div>
                  </button>

                  <button
                    onClick={() => setCopyMode("append")}
                    className={`group p-4 rounded-xl border-2 transition-all ${
                      copyMode === "append"
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                        copyMode === "append"
                          ? "bg-green-500"
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }`}
                    >
                      <Plus
                        className={`w-6 h-6 ${
                          copyMode === "append" ? "text-white" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <div
                      className={`text-sm font-semibold text-center ${
                        copyMode === "append"
                          ? "text-green-900"
                          : "text-gray-700"
                      }`}
                    >
                      追加内容
                    </div>
                  </button>
                </div>
              </div>

              {/* 新建章节标题 */}
              {copyMode === "new" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    章节标题
                  </label>
                  <input
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="请输入章节标题..."
                  />
                </div>
              )}

              {/* 选择章节 */}
              {copyMode !== "new" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    选择章节
                  </label>
                  {chapters.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">该作品暂无章节</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                      {chapters.map((chapter) => (
                        <button
                          key={chapter.id}
                          onClick={() => setSelectedChapter(chapter.id)}
                          className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                            selectedChapter === chapter.id
                              ? "border-blue-500 bg-blue-50 shadow-md"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {chapter.title}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                第 {chapter.order} 章
                              </div>
                            </div>
                            {selectedChapter === chapter.id && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ml-3">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-all font-medium"
            >
              上一步
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
          >
            取消
          </button>
          <button
            onClick={step === 1 ? handleNext : handleApply}
            disabled={
              loading ||
              !selectedWork ||
              (step === 2 && copyMode !== "new" && !selectedChapter) ||
              (step === 2 && copyMode === "new" && !newChapterTitle.trim())
            }
            className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                处理中...
              </span>
            ) : step === 1 ? (
              "下一步"
            ) : (
              "确认应用"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ApplyToWorkModal;
