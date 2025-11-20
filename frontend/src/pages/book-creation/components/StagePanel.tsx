import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BookCreationTask } from "../../../types/book-creation";
import { bookCreationApi } from "../../../services/book-creation.api";
import { useToast } from "../../../contexts/ToastContext";
import { Sparkles, FileText, List, BookOpen, CheckSquare } from "lucide-react";

interface Props {
  task: BookCreationTask;
  viewingStage: string; // 当前查看的阶段
  onRefresh: () => void;
  progressEvent?: any;
  isStreaming?: boolean;
  streamingContent?: string;
}

/**
 * 阶段面板组件
 * 根据当前阶段显示不同的内容
 */
const StagePanel: React.FC<Props> = ({
  task,
  viewingStage,
  onRefresh,
  progressEvent,
  isStreaming: isStreamingFromParent,
  streamingContent: streamingContentFromParent,
}) => {
  const { success, error } = useToast();
  const [optimizing, setOptimizing] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [optimizeStreamingContent, setOptimizeStreamingContent] = useState("");
  const [isOptimizeStreaming, setIsOptimizeStreaming] = useState(false);
  const cancelStreamRef = React.useRef<(() => void) | null>(null);

  // 使用父组件传入的流式状态（用于阶段执行）
  const isStreaming = isStreamingFromParent || isOptimizeStreaming;
  const streamingContent =
    streamingContentFromParent || optimizeStreamingContent;

  // 监听 WebSocket 进度事件
  React.useEffect(() => {
    if (progressEvent) {
      console.log("[StagePanel] 收到进度事件:", progressEvent);

      // 如果是阶段完成事件，清空优化流式内容
      if (progressEvent.event === "stage_completed") {
        console.log("[StagePanel] 阶段完成，清空优化流式内容");
        setIsOptimizeStreaming(false);
        setOptimizeStreamingContent("");
        setOptimizing(false);
      }
    }
  }, [progressEvent]);

  // 组件卸载时取消流式请求
  React.useEffect(() => {
    return () => {
      if (cancelStreamRef.current) {
        console.log("[StagePanel] 组件卸载，取消流式请求");
        cancelStreamRef.current();
      }
    };
  }, []);

  const handleOptimize = async (stageType?: string) => {
    if (!feedback.trim()) {
      error("输入错误", "请输入优化反馈");
      return;
    }

    // 验证 task.id
    console.log(
      "[StagePanel] handleOptimize - task.id:",
      task.id,
      "type:",
      typeof task.id
    );
    if (!task.id || isNaN(Number(task.id))) {
      error("数据错误", `任务ID无效: ${task.id}`);
      return;
    }

    // 确定要优化的阶段类型：如果传入了 stageType 参数，使用它；否则使用 currentStage
    // 注意：当第一阶段完成后，currentStage 会变成 stage_2_title，但用户可能想优化第一阶段
    // 所以在 renderStage1 中调用时，应该传入 "stage_1_idea"
    const targetStageType = stageType || task.currentStage;

    try {
      setOptimizing(true);
      setIsOptimizeStreaming(true);
      setOptimizeStreamingContent("");

      console.log(
        "[StagePanel] 开始流式优化，taskId:",
        task.id,
        "stage:",
        targetStageType,
        "(currentStage:",
        task.currentStage,
        ")"
      );

      // 使用流式API
      const cancelFn = await bookCreationApi.optimizeStageStream(
        task.id,
        targetStageType,
        feedback,
        // 接收内容片段
        (content) => {
          console.log("[StagePanel] 收到内容片段，长度:", content.length);
          setOptimizeStreamingContent((prev) => prev + content);
        },
        // 完成回调
        () => {
          console.log("[StagePanel] 流式优化完成");
          setIsOptimizeStreaming(false);
          setOptimizing(false);
          success("优化完成", "AI优化已完成");
          setFeedback("");
          cancelStreamRef.current = null; // 清除引用
          // 延迟刷新，让用户看到完整内容
          setTimeout(() => {
            onRefresh();
            setOptimizeStreamingContent(""); // 刷新后清空
          }, 1000);
        },
        // 错误回调
        (err) => {
          console.error("[StagePanel] 流式优化失败:", err);
          setIsOptimizeStreaming(false);
          setOptimizing(false);
          error("优化失败", err.message || "优化失败");
          cancelStreamRef.current = null; // 清除引用
        }
      );

      // 保存取消函数的引用
      cancelStreamRef.current = cancelFn;

      console.log("[StagePanel] 流式请求已发起");
    } catch (err: any) {
      console.error("[StagePanel] 流式优化异常:", err);
      setIsOptimizeStreaming(false);
      setOptimizing(false);
      error("优化失败", err.response?.data?.message || "优化失败");
    }
  };

  // 阶段1：想法扩展
  const renderStage1 = () => {
    const isGenerating = task.status === "idea_generating";
    const isPaused = task.status === "paused";
    const hasBrainstorm = task.processedData?.brainstorm;
    const isWaitingNextStage =
      task.status === "waiting_next_stage" &&
      viewingStage === "stage_1_idea" &&
      task.currentStage === "stage_2_title";

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-900">阶段1：想法扩展</h2>
        </div>

        {/* 阶段完成提示 */}
        {isWaitingNextStage && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-amber-900">
                ⚠️ 想法扩展完成，等待执行下一阶段
              </h3>
            </div>
          </div>
        )}

        {hasBrainstorm ? (
          <>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-medium text-gray-700 mb-3">📚 生成结果</h3>
              <div className="prose prose-sm max-w-none text-gray-800 markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed">{children}</p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-xl font-semibold mt-4 mb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold mt-3 mb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold mt-3 mb-2">
                        {children}
                      </h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1 mb-3">
                        {children}
                      </ol>
                    ),
                    code: ({ inline, children, ...props }: any) =>
                      inline ? (
                        <code
                          className="px-1.5 py-0.5 bg-gray-200 rounded text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className="block p-3 bg-gray-800 text-gray-100 rounded text-sm overflow-x-auto"
                          {...props}
                        >
                          {children}
                        </code>
                      ),
                    pre: ({ children }) => (
                      <pre className="mb-3">{children}</pre>
                    ),
                  }}
                >
                  {task.processedData.brainstorm}
                </ReactMarkdown>
              </div>
            </div>

            {/* 流式优化内容显示 */}
            {(isStreaming || streamingContent) && (
              <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-300">
                <div className="flex items-center gap-2 mb-3">
                  {isStreaming ? (
                    <>
                      <Sparkles className="w-5 h-5 text-blue-600 animate-spin" />
                      <h3 className="font-medium text-blue-900">
                        AI正在优化中...
                      </h3>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-green-600" />
                      <h3 className="font-medium text-green-900">优化已完成</h3>
                    </>
                  )}
                </div>
                <div className="prose prose-sm max-w-none text-gray-800 markdown-content bg-white p-4 rounded-lg">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {streamingContent || "正在等待AI响应..."}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* 优化反馈 */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="font-medium text-gray-700 mb-3">
                觉得不满意？提供反馈进行优化：
              </h3>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="例如：希望增加更多悬念和复杂的世界观设定..."
                className="w-full h-24 px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                maxLength={1000}
                disabled={optimizing}
              />
              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-500">
                  {feedback.length}/1000
                </span>
                <button
                  onClick={() => handleOptimize("stage_1_idea")}
                  disabled={optimizing || !feedback.trim()}
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {optimizing && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {optimizing ? "优化中..." : "优化脑洞"}
                </button>
              </div>
            </div>
          </>
        ) : isPaused ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <p className="text-yellow-800">
              ⚠️ 任务已创建，但未开始执行。请点击下方"开始执行阶段1"按钮。
            </p>
          </div>
        ) : isGenerating ? (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-blue-800">正在生成脑洞，请稍候...</p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-600">等待执行...</p>
          </div>
        )}
      </div>
    );
  };

  // 阶段2：书名简介
  const renderStage2 = () => {
    const isGenerating = task.status === "title_generating";

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-6 h-6 text-purple-500" />
          <h2 className="text-xl font-bold text-gray-900">阶段2：书名和简介</h2>
        </div>

        {/* 流式生成内容显示 */}
        {(isStreaming || streamingContent) && (
          <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-300">
            <div className="flex items-center gap-2 mb-3">
              {isStreaming ? (
                <>
                  <Sparkles className="w-5 h-5 text-purple-600 animate-spin" />
                  <h3 className="font-medium text-purple-900">
                    AI正在生成书名和简介...
                  </h3>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-green-900">生成已完成</h3>
                </>
              )}
            </div>
            <div className="prose prose-sm max-w-none text-gray-800 markdown-content bg-white p-4 rounded-lg">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {streamingContent || "正在等待AI响应..."}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {task.processedData?.selectedTitle ? (
          <>
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-medium text-gray-700 mb-3">书名：</h3>
              <div className="text-2xl font-bold text-gray-900 mb-6">
                {task.processedData.selectedTitle}
              </div>

              {task.processedData.titles &&
                task.processedData.titles.length > 1 && (
                  <>
                    <h3 className="font-medium text-gray-700 mb-3">
                      其他候选书名：
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {task.processedData.titles
                        .filter(
                          (t: string) => t !== task.processedData.selectedTitle
                        )
                        .map((title: string, index: number) => (
                          <span
                            key={index}
                            className="bg-white px-4 py-2 rounded-lg border border-gray-200 text-gray-700"
                          >
                            {title}
                          </span>
                        ))}
                    </div>
                  </>
                )}

              <h3 className="font-medium text-gray-700 mb-3">简介：</h3>
              <div className="prose prose-sm max-w-none text-gray-800 markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p className="mb-3 leading-relaxed">{children}</p>
                    ),
                    h1: ({ children }) => (
                      <h1 className="text-xl font-semibold mt-4 mb-2">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-lg font-semibold mt-3 mb-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-base font-semibold mt-3 mb-2">
                        {children}
                      </h3>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside space-y-1 mb-3">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside space-y-1 mb-3">
                        {children}
                      </ol>
                    ),
                    code: ({ inline, children, ...props }: any) =>
                      inline ? (
                        <code
                          className="px-1.5 py-0.5 bg-gray-200 rounded text-sm"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className="block p-3 bg-gray-800 text-gray-100 rounded text-sm overflow-x-auto"
                          {...props}
                        >
                          {children}
                        </code>
                      ),
                    pre: ({ children }) => (
                      <pre className="mb-3">{children}</pre>
                    ),
                  }}
                >
                  {task.processedData.synopsis}
                </ReactMarkdown>
              </div>
            </div>
          </>
        ) : isGenerating ? (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-3"></div>
            <p className="text-purple-800">正在生成书名和简介，请稍候...</p>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-600">等待执行...</p>
          </div>
        )}
      </div>
    );
  };

  // 阶段3：大纲生成
  const renderStage3 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <List className="w-6 h-6 text-green-500" />
        <h2 className="text-xl font-bold text-gray-900">阶段3：大纲生成</h2>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <p className="text-green-800">
          大纲生成包括三个步骤：主大纲、卷纲、细纲。
          完成后可在"大纲"标签页查看详细结构。
        </p>
      </div>
    </div>
  );

  // 阶段4：正文生成
  const renderStage4 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-6 h-6 text-orange-500" />
        <h2 className="text-xl font-bold text-gray-900">阶段4：正文生成</h2>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <p className="text-orange-800">
          正在批量生成章节正文，这可能需要较长时间，请耐心等待...
        </p>
        {task.processedData?.generationSummary && (
          <div className="mt-4 text-sm">
            <p>
              已生成: {task.processedData.generationSummary.totalGenerated} 章
            </p>
            <p>失败: {task.processedData.generationSummary.totalFailed} 章</p>
          </div>
        )}
      </div>
    </div>
  );

  // 阶段5：审稿优化
  const renderStage5 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CheckSquare className="w-6 h-6 text-pink-500" />
        <h2 className="text-xl font-bold text-gray-900">阶段5：审稿优化</h2>
      </div>

      <div className="bg-pink-50 border border-pink-200 rounded-xl p-6">
        <p className="text-pink-800">正在审稿并优化所有章节，提升内容质量...</p>
        {task.processedData?.reviewSummary && (
          <div className="mt-4 text-sm space-y-1">
            <p>总章节: {task.processedData.reviewSummary.totalChapters}</p>
            <p>已审稿: {task.processedData.reviewSummary.reviewed}</p>
            <p>已优化: {task.processedData.reviewSummary.optimized}</p>
            {task.processedData.reviewSummary.averageScore && (
              <p>
                平均评分:{" "}
                {task.processedData.reviewSummary.averageScore.toFixed(1)}/100
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mt-6 shadow-lg border border-gray-100">
      {viewingStage === "stage_1_idea" && renderStage1()}
      {viewingStage === "stage_2_title" && renderStage2()}
      {viewingStage === "stage_3_outline" && renderStage3()}
      {viewingStage === "stage_4_content" && renderStage4()}
      {viewingStage === "stage_5_review" && renderStage5()}
    </div>
  );
};

export default StagePanel;
