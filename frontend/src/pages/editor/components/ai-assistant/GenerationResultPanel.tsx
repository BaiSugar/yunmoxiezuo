import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  MessageCircle,
  Sparkles,
  StopCircle,
  Copy,
  Check,
  ArrowDown,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ApplyToWorkModal from "../../../../pages/creative-workshop/components/ApplyToWorkModal";
import type { EditorSettings } from "../../../../types/editor-settings";

interface GenerationResultPanelProps {
  content: string;
  isGenerating: boolean;
  categoryName?: string;
  onBack: () => void;
  onSwitchToChat: () => void;
  onRegenerate?: () => void;
  onStopGeneration?: () => void;
  onApplyToWork?: (content: string) => void;
  editorSettings?: EditorSettings | null; // 编辑器设置（作品编辑页专用）
}

/**
 * AI生成结果面板 - 内嵌在AI助手中的结果展示
 */
export const GenerationResultPanel: React.FC<GenerationResultPanelProps> = ({
  content,
  isGenerating,
  categoryName = "AI",
  onBack,
  onSwitchToChat,
  onRegenerate,
  onStopGeneration,
  onApplyToWork,
  editorSettings,
}) => {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true); // 是否自动滚动到底部

  // 根据编辑器设置生成内容样式
  const getContentStyle = () => {
    if (!editorSettings) return {};
    return {
      fontFamily:
        editorSettings.fontFamily || "system-ui, -apple-system, sans-serif",
      fontSize: `${editorSettings.fontSize || 16}px`,
      lineHeight: editorSettings.lineHeight || 1.8,
    };
  };

  // 检测用户是否手动滚动
  const handleScroll = () => {
    if (!contentRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    // 如果用户滚动到距离底部 50px 以内，重新启用自动滚动
    // 如果用户向上滚动超过 50px，禁用自动滚动
    if (distanceFromBottom < 50) {
      setAutoScroll(true);
    } else {
      setAutoScroll(false);
    }
  };

  // 流式显示内容（直接显示传入的内容，不做二次累加）
  // content 从上层组件传入，已经是累加后的完整内容
  useEffect(() => {
    // 只有在自动滚动启用时才滚动到底部
    if (autoScroll && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, autoScroll]);

  // 重置滚动状态（新内容生成时默认启用自动滚动）
  useEffect(() => {
    if (isGenerating) {
      setAutoScroll(true);
    }
  }, [isGenerating]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("复制失败:", err);
    }
  };

  const handleApply = () => {
    if (onApplyToWork) {
      onApplyToWork(content);
    } else {
      setShowApplyModal(true);
    }
  };

  // 手动滚动到底部
  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-blue-50/30 to-purple-50/30">
      {/* 头部 - 精简版 */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-3 sm:px-4 py-1.5 sm:py-2 shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Sparkles className="w-3.5 h-3.5 text-white flex-shrink-0" />
            <h2 className="text-xs sm:text-sm font-semibold text-white truncate">
              {categoryName}生成结果
              <span className="ml-2 text-xs text-white/70">
                {isGenerating ? "生成中..." : ""}
              </span>
            </h2>
          </div>

          {/* 复制按钮 */}
          {!isGenerating && content && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-all text-white text-xs font-medium flex-shrink-0"
              title="复制内容"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  <span className="hidden sm:inline">已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="hidden sm:inline">复制</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 内容区 - Markdown渲染（无卡片） */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-2 sm:px-3 py-3 sm:py-4 relative"
        style={editorSettings ? getContentStyle() : undefined}
      >
        {/* 滚动到底部按钮（用户向上滚动时显示） */}
        {!autoScroll && isGenerating && (
          <button
            onClick={scrollToBottom}
            className="fixed bottom-20 right-6 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all text-xs"
            title="滚动到底部"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span className="font-medium">回到底部</span>
          </button>
        )}

        {/* 直接渲染内容，应用编辑器设置 */}
        <div className="prose prose-sm sm:prose-base md:prose-lg prose-blue max-w-none whitespace-pre-wrap break-words">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 自定义渲染组件
              h1: ({ children }) => (
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 mt-3 sm:mt-4 pb-2 border-b-2 border-blue-200">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 mt-3 sm:mt-4">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 mt-2 sm:mt-3">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-gray-800 mb-3 sm:mb-4 whitespace-pre-wrap break-words">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 text-gray-800">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 text-gray-800">
                  {children}
                </ol>
              ),
              code: ({ inline, children, ...props }: any) =>
                inline ? (
                  <code
                    className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs sm:text-sm font-mono"
                    {...props}
                  >
                    {children}
                  </code>
                ) : (
                  <code
                    className="block p-3 sm:p-4 bg-gray-800 text-gray-100 rounded-lg text-xs sm:text-sm font-mono overflow-x-auto mb-3 sm:mb-4"
                    {...props}
                  >
                    {children}
                  </code>
                ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-blue-400 pl-3 sm:pl-4 py-2 my-3 sm:my-4 bg-blue-50/50 text-gray-700 italic">
                  {children}
                </blockquote>
              ),
            }}
          >
            {content || "*等待生成中...*"}
          </ReactMarkdown>

          {/* 生成中的光标效果 */}
          {isGenerating && (
            <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1"></span>
          )}
        </div>
      </div>

      {/* 底部操作栏 - 精简版 */}
      <div className="border-t border-gray-200 bg-white/95 backdrop-blur-sm px-3 sm:px-4 py-2 sm:py-2.5 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 返回按钮 */}
            <button
              onClick={onBack}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all text-xs sm:text-sm"
              title="返回配置"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">返回</span>
            </button>

            {/* 停止生成按钮 */}
            {isGenerating && onStopGeneration && (
              <button
                onClick={onStopGeneration}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all text-xs sm:text-sm"
              >
                <StopCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>停止</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 重新生成 */}
            {!isGenerating && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-all text-xs sm:text-sm"
                title="重新生成"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">重新生成</span>
              </button>
            )}

            {/* 追问 */}
            {!isGenerating && (
              <button
                onClick={onSwitchToChat}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 border border-blue-400 text-blue-700 hover:bg-blue-50 rounded-lg transition-all text-xs sm:text-sm"
                title="追问"
              >
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>追问</span>
              </button>
            )}

            {/* 应用按钮 */}
            {!isGenerating && content && (
              <button
                onClick={handleApply}
                className="flex items-center gap-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-medium shadow-md text-xs sm:text-sm"
              >
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>应用到作品</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 应用到作品模态框 */}
      <ApplyToWorkModal
        isOpen={showApplyModal}
        content={content}
        title={`${categoryName}生成内容`}
        onClose={() => setShowApplyModal(false)}
      />
    </div>
  );
};
