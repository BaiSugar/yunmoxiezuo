import React, { useState, useEffect, useRef } from "react";
import { FileText, X, Save } from "lucide-react";

interface ChapterSummaryEditorProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
  chapterTitle: string;
  initialSummary: string;
  onSave: (summary: string) => Promise<void>;
}

/**
 * 章节梗概编辑器
 * 显示为悬浮窗，不影响下方内容编辑器
 */
export const ChapterSummaryEditor: React.FC<ChapterSummaryEditorProps> = ({
  isOpen,
  onClose,
  chapterId: _chapterId, // 保留以备将来使用（调试/日志等）
  chapterTitle,
  initialSummary,
  onSave,
}) => {
  const [summary, setSummary] = useState(initialSummary);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 当打开时，更新summary值并聚焦
  useEffect(() => {
    if (isOpen) {
      setSummary(initialSummary);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialSummary]);

  // ESC键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(summary);
      onClose();
    } catch (error) {
      console.error("保存梗概失败:", error);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-14 left-0 right-0 sm:left-0 sm:right-0 z-50 px-1.5 sm:px-1.5">
      {/* 悬浮卡片 */}
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-blue-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 w-full">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white">章节梗概</h3>
                <p className="text-xs text-blue-100 truncate">{chapterTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
              title="关闭"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="请输入章节梗概，简要描述本章节的主要内容和情节发展..."
            rows={6}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 border-2 border-gray-200 rounded-xl 
                     focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 
                     resize-none transition-all placeholder:text-gray-400"
          />

          <div className="mt-3 text-xs text-gray-500">
            💡 提示：梗概用于AI生成时的上下文引用，可节省token消耗
          </div>
        </div>

        {/* 底部操作 */}
        <div className="px-4 pb-4 flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 
                     hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl 
                     font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl 
                     hover:shadow-blue-500/40 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "保存中..." : "保存"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 
                     rounded-xl font-medium transition-colors
                     disabled:opacity-50"
          >
            取消
          </button>
        </div>
      </div>

      {/* 三角箭头指示器 */}
      <div className="absolute -top-2 left-4 w-4 h-4 bg-blue-500 transform rotate-45 border-t-2 border-l-2 border-blue-200"></div>
    </div>
  );
};
