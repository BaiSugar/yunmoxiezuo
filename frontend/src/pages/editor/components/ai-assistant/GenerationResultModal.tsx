import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ArrowLeft,
  MessageCircle,
  Sparkles,
  StopCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ApplyToWorkModal from "../../../../pages/creative-workshop/components/ApplyToWorkModal";

interface GenerationResultModalProps {
  isOpen: boolean;
  content: string;
  isGenerating: boolean;
  categoryName?: string;
  onClose: () => void;
  onSwitchToChat: () => void;
  onStopGeneration?: () => void;
  onApplyToWork?: (content: string) => void;
}

/**
 * AI生成结果模态窗 - 流式显示，支持Markdown渲染
 */
export const GenerationResultModal: React.FC<GenerationResultModalProps> = ({
  isOpen,
  content,
  isGenerating,
  categoryName = "AI",
  onClose,
  onSwitchToChat,
  onStopGeneration,
  onApplyToWork,
}) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastLengthRef = useRef(0);

  // 打字机效果 - 流式显示内容
  useEffect(() => {
    if (!isOpen) {
      setDisplayedContent("");
      lastLengthRef.current = 0;
      return;
    }

    // 如果生成已完成，直接显示全部内容
    if (!isGenerating && content) {
      setDisplayedContent(content);
      lastLengthRef.current = content.length;
      return;
    }

    // 流式更新：只添加新增的内容
    if (content.length > lastLengthRef.current) {
      const newContent = content.slice(lastLengthRef.current);
      let index = 0;

      const timer = setInterval(() => {
        if (index < newContent.length) {
          setDisplayedContent((prev) => prev + newContent[index]);
          index++;

          // 自动滚动到底部
          if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
          }
        } else {
          clearInterval(timer);
          lastLengthRef.current = content.length;
        }
      }, 20); // 20ms 打字速度

      return () => clearInterval(timer);
    }
  }, [content, isOpen, isGenerating]);

  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleApply = () => {
    if (onApplyToWork) {
      onApplyToWork(displayedContent);
    } else {
      setShowApplyModal(true);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* 模态窗 */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-6 py-5">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {categoryName}生成结果
                </h2>
                <p className="text-sm text-white/80 mt-0.5">
                  {isGenerating ? "正在生成中..." : "生成完成"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl transition-all"
              title="关闭"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* 内容区 - Markdown渲染 */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-gray-50 to-blue-50/30"
        >
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg prose-blue max-w-none whitespace-pre-wrap break-words">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // 自定义渲染组件
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-6 pb-2 border-b-2 border-blue-200">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-bold text-gray-800 mb-3 mt-5">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-gray-700 mb-2 mt-4">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-gray-700 leading-relaxed mb-4 text-base whitespace-pre-wrap break-words">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">
                      {children}
                    </ol>
                  ),
                  code: ({ inline, children, ...props }: any) =>
                    inline ? (
                      <code
                        className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-sm font-mono"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <code
                        className="block p-4 bg-gray-800 text-gray-100 rounded-lg text-sm font-mono overflow-x-auto mb-4"
                        {...props}
                      >
                        {children}
                      </code>
                    ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-400 pl-4 py-2 my-4 bg-blue-50/50 text-gray-700 italic">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {displayedContent || "*等待生成中...*"}
              </ReactMarkdown>

              {/* 生成中的光标效果 */}
              {isGenerating && (
                <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1"></span>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* 返回按钮 */}
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl transition-all font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </button>

              {/* 停止生成按钮 */}
              {isGenerating && onStopGeneration && (
                <button
                  onClick={onStopGeneration}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-medium"
                >
                  <StopCircle className="w-4 h-4" />
                  停止生成
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* 切换对话模式 */}
              <button
                onClick={onSwitchToChat}
                className="flex items-center gap-2 px-5 py-2.5 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl transition-all font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                切换对话模式
              </button>

              {/* 应用按钮 */}
              {!isGenerating && displayedContent && (
                <button
                  onClick={handleApply}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  <Sparkles className="w-4 h-4" />
                  应用到作品
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 应用到作品模态框 */}
      <ApplyToWorkModal
        isOpen={showApplyModal}
        content={displayedContent}
        title={`${categoryName}生成内容`}
        onClose={() => setShowApplyModal(false)}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
};
