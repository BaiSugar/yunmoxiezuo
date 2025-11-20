import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  Play,
  Pause,
  XCircle,
  CheckCircle,
  Sparkles,
  Edit3,
  ArrowRight,
} from "lucide-react";
import { bookCreationApi } from "../../services/book-creation.api";
import { useBookCreationStore } from "../../stores/bookCreationStore";
import { useToast } from "../../contexts/ToastContext";
import { io, Socket } from "socket.io-client";
import StagePanel from "./components/StagePanel";
import ProgressTracker from "./components/ProgressTracker";
import ReviewReportCard from "./components/ReviewReportCard";
import { PromptSelectionModal } from "../editor/components/ai-assistant/PromptSelectionModal";
import TitleSelectorModal from "./components/TitleSelectorModal";
import type { Prompt } from "../../types/prompt";

/**
 * 任务详情页
 */
const TaskDetailPage: React.FC = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const {
    currentTask,
    setCurrentTask,
    progressEvent,
    setProgressEvent,
    setWsConnected,
  } = useBookCreationStore();

  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [optimizationFeedback, setOptimizationFeedback] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeStreamingContent, setOptimizeStreamingContent] = useState("");
  const [viewingStage, setViewingStage] = useState<string | null>(null); // 当前查看的阶段
  const cancelStreamRef = React.useRef<(() => void) | null>(null);
  const cancelOptimizeStreamRef = React.useRef<(() => void) | null>(null);

  // 步进式生成相关状态
  const [generatingChapter, setGeneratingChapter] = useState(false);
  const [currentReviewReport, setCurrentReviewReport] = useState<any>(null);
  const [currentChapter, setCurrentChapter] = useState<any>(null);

  // 提示词选择相关状态
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [currentStageForPrompt, setCurrentStageForPrompt] = useState<{
    type: string;
    label: string;
    configField: string;
  } | null>(null);

  // 书名选择相关状态
  const [showTitleSelector, setShowTitleSelector] = useState(false);

  useEffect(() => {
    if (!taskId) return;

    loadTask();
    connectWebSocket();

    return () => {
      socket?.disconnect();
      // 清理流式请求
      if (cancelStreamRef.current) {
        console.log("[TaskDetailPage] 组件卸载，取消流式请求");
        cancelStreamRef.current();
      }
      if (cancelOptimizeStreamRef.current) {
        console.log("[TaskDetailPage] 组件卸载，取消优化流式请求");
        cancelOptimizeStreamRef.current();
      }
    };
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const response = await bookCreationApi.getTask(parseInt(taskId!));
      setCurrentTask(response);

      // 如果还没有设置查看阶段，默认查看当前阶段
      // 但如果当前阶段是 waiting_next_stage 状态，说明上一阶段刚完成，应该查看上一阶段
      if (viewingStage === null) {
        if (response.status === "waiting_next_stage") {
          // 根据当前阶段倒推上一阶段
          const stageSequence = [
            "stage_1_idea",
            "stage_2_title",
            "stage_3_outline",
            "stage_4_content",
            "stage_5_review",
          ];
          const currentIndex = stageSequence.indexOf(response.currentStage);
          const previousStage =
            currentIndex > 0
              ? stageSequence[currentIndex - 1]
              : response.currentStage;
          setViewingStage(previousStage);
        } else {
          setViewingStage(response.currentStage);
        }
      }

      // 检查是否需要显示书名选择器
      // 条件：阶段2已完成，有 titles 但没有 selectedTitle，且当前阶段是 stage_2_title
      if (
        response.currentStage === "stage_2_title" &&
        response.processedData?.titles &&
        response.processedData.titles.length > 0 &&
        !response.processedData.selectedTitle
      ) {
        console.log("[TaskDetailPage] 检测到需要显示书名选择器");
        setShowTitleSelector(true);
      }
    } catch (err: any) {
      error("加载失败", err.response?.data?.message || "加载任务失败");
      navigate("/dashboard/book-creation");
    } finally {
      setLoading(false);
    }
  };

  // 检查阶段是否有数据
  const hasStageData = (stageType: string): boolean => {
    if (!currentTask?.processedData) return false;

    switch (stageType) {
      case "stage_1_idea":
        return !!currentTask.processedData.brainstorm;
      case "stage_2_title":
        return !!(
          currentTask.processedData.selectedTitle ||
          (currentTask.processedData.titles &&
            currentTask.processedData.titles.length > 0)
        );
      case "stage_3_outline":
        return !!currentTask.processedData.outline;
      case "stage_4_content":
        return !!currentTask.processedData.generationSummary;
      case "stage_5_review":
        return !!currentTask.processedData.reviewSummary;
      default:
        return false;
    }
  };

  // 处理阶段切换
  const handleStageClick = (stageType: string) => {
    // 只有有数据的阶段才能点击查看
    if (hasStageData(stageType)) {
      setViewingStage(stageType);
      // 清空优化相关状态
      setIsOptimizing(false);
      setOptimizeStreamingContent("");
      setOptimizationFeedback("");
    }
  };

  const connectWebSocket = () => {
    console.log("[WebSocket] 开始连接...");
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    console.log("[WebSocket] Token存在:", !!token);
    console.log("[WebSocket] Token长度:", token?.length || 0);
    console.log("[WebSocket] Token前10字符:", token?.substring(0, 10) || "无");

    if (!token) {
      console.error("❌ [WebSocket] Token不存在，无法连接！");
      error("连接失败", "未登录或登录已过期，请重新登录");
      return;
    }

    // 确定 WebSocket 服务器地址
    let socketUrl: string;

    // 优先使用专门的 WebSocket URL 环境变量
    if (import.meta.env.VITE_WS_URL) {
      socketUrl = import.meta.env.VITE_WS_URL;
      console.log("[WebSocket] 使用配置的WS_URL:", socketUrl);
    }
    // 如果 API_BASE_URL 是完整URL（包含http://或https://），直接使用
    else if (import.meta.env.VITE_API_BASE_URL?.match(/^https?:\/\//)) {
      socketUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api.*$/, "");
      console.log("[WebSocket] 从API_BASE_URL提取:", socketUrl);
    }
    // 开发环境：直接连接后端服务器
    else if (import.meta.env.DEV) {
      socketUrl = "http://localhost:5000";
      console.log("[WebSocket] 开发环境，连接后端:", socketUrl);
    }
    // 生产环境：使用当前域名
    else {
      socketUrl = window.location.origin;
      console.log("[WebSocket] 生产环境，使用当前域名:", socketUrl);
    }

    console.log("[WebSocket] 最终连接URL:", socketUrl);
    console.log("[WebSocket] Auth配置:", {
      token: token ? "已设置" : "未设置",
    });

    const ws = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      path: "/socket.io",
    });

    ws.on("connect", () => {
      console.log("🔌 [WebSocket] 已连接, Socket ID:", ws.id);
      console.log("⏳ [WebSocket] 等待认证完成...");
    });

    ws.on("connect_error", (err: any) => {
      console.error("❌ [WebSocket] 连接错误:", err);
      console.error("❌ [WebSocket] 错误类型:", err.type);
      console.error("❌ [WebSocket] 错误数据:", err.data);
      if (err.data?.message) {
        error("WebSocket连接错误", err.data.message);
      }
    });

    ws.on("message", (msg) => {
      console.log("📨 [WebSocket] 收到系统消息:", msg);

      // 认证成功，发送加入房间请求
      if (msg.type === "connection:success") {
        console.log("✅ [WebSocket] 认证成功，用户:", msg.data?.username);
        setWsConnected(true);
        const tid = parseInt(taskId!);
        console.log(`📞 [WebSocket] 发送加入房间请求: book-creation-${tid}`);
        ws.emit("join_book_creation_room", { taskId: tid });
      }

      // 如果是错误消息，显示详细信息
      if (msg.type === "error") {
        console.error("❌ [WebSocket] 错误详情:", msg.data);
        error("WebSocket错误", msg.data?.message || "连接出错");
      }
    });

    ws.on("disconnect", (reason) => {
      console.log("🔌 [WebSocket] 断开连接, 原因:", reason);
      setWsConnected(false);
    });

    ws.on("book_creation_progress", (data) => {
      console.log("📩 [WebSocket] 收到进度消息:", data);
      setProgressEvent(data);

      // 如果阶段完成，刷新任务数据
      if (data.event === "stage_completed" || data.event === "task_completed") {
        console.log("✅ [WebSocket] 阶段完成，刷新任务数据...");

        // 保存当前完成的阶段
        const completedStage = data.stage;

        // 如果是阶段2完成，先标记需要显示书名选择器
        const shouldShowTitleSelector =
          data.stage === "stage_2_title" &&
          (data.data?.result?.titles || data.data?.titles);

        // 刷新任务数据
        loadTask().then(() => {
          // 阶段完成后，保持 viewingStage 在当前完成的阶段，不自动跳转
          if (completedStage && viewingStage === null) {
            setViewingStage(completedStage);
          }

          // 刷新完成后，如果需要显示书名选择器，则显示
          if (shouldShowTitleSelector) {
            console.log("[WebSocket] 阶段2完成，显示书名选择器");
            setShowTitleSelector(true);
          }
        });
      }

      // 如果优化完成，清理优化流式内容
      if (data.event === "optimize_completed") {
        console.log("✅ [WebSocket] 优化完成");
        setIsOptimizing(false);
        setOptimizeStreamingContent("");
        if (cancelOptimizeStreamRef.current) {
          cancelOptimizeStreamRef.current();
          cancelOptimizeStreamRef.current = null;
        }
        // 刷新任务数据
        loadTask();
      }

      // 处理章节生成完成事件
      if (data.event === "chapter_generation_completed") {
        console.log("✅ [WebSocket] 章节生成完成");
        // WebSocket推送的审稿报告
        setCurrentReviewReport(data.data.reviewReport);
        setGeneratingChapter(false);
        loadTask(); // 刷新任务数据
      }
    });

    setSocket(ws);
  };

  // 检查阶段是否需要配置提示词
  const checkPromptConfigBeforeExecute = (stage: string): boolean => {
    if (currentTask?.promptGroupId) {
      // 使用提示词组，不需要额外配置
      return true;
    }

    const promptConfig = currentTask?.promptConfig || {};

    // 映射阶段到配置字段
    const stageToConfigMap: Record<string, { field: string; label: string }> = {
      stage_1_idea: { field: "ideaPromptId", label: "脑洞生成提示词" },
      stage_2_title: { field: "titlePromptId", label: "书名简介生成提示词" },
      stage_3_outline: {
        field: "mainOutlinePromptId",
        label: "主大纲生成提示词",
      },
      stage_4_content: {
        field: "contentPromptId",
        label: "章节正文生成提示词",
      },
      stage_5_review: { field: "reviewPromptId", label: "章节审稿提示词" },
    };

    // 步进式生成还需要检查梗概提示词
    if (stage === "stage_4_content" && !(promptConfig as any).summaryPromptId) {
      setCurrentStageForPrompt({
        type: "summary",
        label: "章节梗概生成提示词",
        configField: "summaryPromptId",
      });
      setShowPromptSelector(true);
      return false;
    }

    const config = stageToConfigMap[stage];
    if (!config) return true;

    const isConfigured = !!(promptConfig as any)[config.field];

    if (!isConfigured) {
      // 显示提示词选择器
      setCurrentStageForPrompt({
        type: stage,
        label: config.label,
        configField: config.field,
      });
      setShowPromptSelector(true);
      return false;
    }

    return true;
  };

  const handleExecuteNextStage = async () => {
    // 检查是否需要配置提示词
    const nextStage = currentTask?.currentStage || "";
    if (!checkPromptConfigBeforeExecute(nextStage)) {
      return; // 需要配置提示词，等待用户选择
    }

    try {
      setExecuting(true);
      setStreamingContent("");

      // 判断是否使用流式执行（阶段1和阶段2支持流式，且WebSocket已连接）
      const supportsStreaming = ["stage_1_idea", "stage_2_title"].includes(
        nextStage
      );
      const wsConnected = !!socket?.connected;

      console.log(
        `[TaskDetailPage] 执行阶段 ${nextStage}, 流式支持: ${supportsStreaming}, WebSocket连接: ${wsConnected}`
      );

      if (supportsStreaming && wsConnected) {
        // 使用流式执行
        console.log("[TaskDetailPage] 使用流式执行");
        setIsStreaming(true);

        const cancelFn = await bookCreationApi.executeStageStream(
          parseInt(taskId!),
          nextStage,
          // 接收内容片段
          (content) => {
            console.log("[TaskDetailPage] 收到内容片段，长度:", content.length);
            setStreamingContent((prev) => prev + content);
          },
          // 完成回调
          (metadata) => {
            console.log("[TaskDetailPage] 流式执行完成", metadata);
            setIsStreaming(false);
            setExecuting(false);

            // 显示字数消耗信息
            if (
              metadata?.inputChars !== undefined ||
              metadata?.outputChars !== undefined
            ) {
              const totalChars =
                (metadata?.inputChars || 0) + (metadata?.outputChars || 0);
              success("执行完成", `阶段执行完成，消耗字数: ${totalChars}`);
            } else {
              success("执行完成", "阶段执行完成");
            }

            cancelStreamRef.current = null;
            // 延迟刷新，确保后端状态更新完成
            setTimeout(() => {
              loadTask();
              setStreamingContent(""); // 刷新后清空流式内容
            }, 2000);
          },
          // 错误回调
          (err) => {
            console.error("[TaskDetailPage] 流式执行失败:", err);
            setIsStreaming(false);
            setExecuting(false);
            error("执行失败", err.message || "执行失败");
            cancelStreamRef.current = null;
          }
        );

        // 保存取消函数的引用
        cancelStreamRef.current = cancelFn;
        success("执行中", "正在流式执行阶段，请查看实时输出...");
      } else {
        // 使用非流式执行（阶段3、4、5或WebSocket未连接）
        console.log("[TaskDetailPage] 使用非流式执行");
        await bookCreationApi.executeStage(parseInt(taskId!));
        success("执行中", "阶段执行中，请稍候...");
        setExecuting(false);
      }
    } catch (err: any) {
      error("执行失败", err.response?.data?.message || "执行失败");
      setExecuting(false);
      setIsStreaming(false);
    }
  };

  // 处理提示词选择
  const handlePromptSelected = async (prompt: Prompt) => {
    if (!currentStageForPrompt) return;

    try {
      setShowPromptSelector(false);

      // 更新提示词配置
      await bookCreationApi.updatePromptConfig(parseInt(taskId!), {
        [currentStageForPrompt.configField]: prompt.id,
      });

      success("配置成功", "提示词配置已保存");

      // 刷新任务数据
      await loadTask();

      // 自动执行阶段
      setExecuting(true);
      await bookCreationApi.executeStage(parseInt(taskId!));
      success("执行中", "阶段执行中，请稍候...");
    } catch (err: any) {
      error("执行失败", err.response?.data?.message || "执行失败");
    } finally {
      setExecuting(false);
      setCurrentStageForPrompt(null);
    }
  };

  const handlePause = async () => {
    try {
      await bookCreationApi.pauseTask(parseInt(taskId!));
      success("暂停成功", "任务已暂停");
      loadTask();
    } catch (err: any) {
      error("暂停失败", err.response?.data?.message || "暂停失败");
    }
  };

  const handleResume = async () => {
    try {
      // 检查 currentStage 是否已经更新到下一个阶段
      // 如果是，表示是从上一阶段完成后的第一次点击，应该直接执行下一阶段
      const currentStage = currentTask?.currentStage;
      const hasProcessedData =
        currentTask?.processedData?.brainstorm ||
        currentTask?.processedData?.selectedTitle;

      // 如果 currentStage 是 stage_2_title 且已有 brainstorm 数据，表示是从阶段1完成后的第一次执行
      // 此时应该直接执行下一阶段，而不是调用 /resume API
      if (
        (currentStage === "stage_2_title" ||
          currentStage === "stage_3_outline") &&
        hasProcessedData
      ) {
        console.log("[TaskDetailPage] 直接执行下一阶段");
        await handleExecuteNextStage();
      } else {
        // 否则是真正的恢复操作（用户主动点击“恢复”按钮）
        console.log("[TaskDetailPage] 恢复任务");
        await bookCreationApi.resumeTask(parseInt(taskId!));
        success("恢复成功", "任务已恢复");
        loadTask();
      }
    } catch (err: any) {
      error("恢复失败", err.response?.data?.message || "恢复失败");
    }
  };

  const handleCancel = async () => {
    if (!confirm("确定要取消这个任务吗？此操作不可恢复。")) return;

    try {
      await bookCreationApi.cancelTask(parseInt(taskId!));
      success("取消成功", "任务已取消");
      navigate("/dashboard/book-creation");
    } catch (err: any) {
      error("取消失败", err.response?.data?.message || "取消失败");
    }
  };

  // 🆕 步进式生成下一章
  const handleGenerateNextChapter = async () => {
    try {
      setGeneratingChapter(true);
      setCurrentReviewReport(null); // 清空之前的报告

      const result = await bookCreationApi.generateNextChapter(
        parseInt(taskId!)
      );

      setCurrentChapter(result.chapter);
      setCurrentReviewReport(result.reviewReport);

      success(
        "生成成功",
        `第 ${result.chapter.order} 章已生成，请查看审稿报告`
      );
    } catch (err: any) {
      error("生成失败", err.response?.data?.message || "生成章节失败");
    } finally {
      setGeneratingChapter(false);
    }
  };

  // 🆕 继续下一章
  const handleContinueNextChapter = async () => {
    try {
      setGeneratingChapter(true);
      setCurrentReviewReport(null);

      const result = await bookCreationApi.continueNextChapter(
        parseInt(taskId!)
      );

      setCurrentChapter(result.chapter);
      setCurrentReviewReport(result.reviewReport);

      success(
        "生成成功",
        `第 ${result.chapter.order} 章已生成，请查看审稿报告`
      );
    } catch (err: any) {
      error("生成失败", err.response?.data?.message || "生成章节失败");
    } finally {
      setGeneratingChapter(false);
    }
  };

  // 🆕 在编辑器中打开章节
  const handleOpenInEditor = () => {
    if (!currentTask?.novelId || !currentChapter?.id) return;

    // 跳转到编辑器
    window.open(
      `/editor?novelId=${currentTask.novelId}&chapterId=${currentChapter.id}`,
      "_blank"
    );
  };

  if (loading || !currentTask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-600 mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  const isTaskActive = !["completed", "failed", "cancelled"].includes(
    currentTask.status
  );
  const isPaused = currentTask.status === "paused";
  const isWaitingNextStage = currentTask.status === "waiting_next_stage";
  const shouldShowContinueButton = isPaused || isWaitingNextStage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <button
          onClick={() => navigate("/dashboard/book-creation")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回任务列表
        </button>

        {/* 任务信息卡片 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mb-6 shadow-lg border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {currentTask.processedData?.selectedTitle || "未命名任务"}
              </h1>
              <p className="text-gray-600">
                {currentTask.processedData?.synopsis || "AI创作中..."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {currentTask.status === "completed" && (
                <span className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  已完成
                </span>
              )}
            </div>
          </div>

          {/* 进度追踪器 */}
          <ProgressTracker
            task={currentTask}
            progressEvent={progressEvent}
            viewingStage={viewingStage || currentTask.currentStage}
            onStageClick={handleStageClick}
            hasStageData={hasStageData}
          />

          {/* 统计信息 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-sm text-blue-600 mb-1">已消耗字数</div>
              <div className="text-2xl font-bold text-blue-700">
                {currentTask.totalCharactersConsumed.toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-sm text-purple-600 mb-1">创建时间</div>
              <div className="text-lg font-bold text-purple-700">
                {new Date(currentTask.createdAt).toLocaleString()}
              </div>
            </div>
            {currentTask.novelId && (
              <div className="bg-green-50 rounded-xl p-4">
                <div className="text-sm text-green-600 mb-1">关联作品</div>
                <div className="text-lg font-bold text-green-700">
                  作品 #{currentTask.novelId}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 阶段面板 */}
        <StagePanel
          task={currentTask}
          viewingStage={viewingStage || currentTask.currentStage}
          onRefresh={loadTask}
          progressEvent={progressEvent}
          isStreaming={isStreaming}
          streamingContent={streamingContent}
        />

        {/* 🆆 阶段完成，等待执行下一阶段 */}
        {/* 当任务处于等待下一阶段状态时，如果查看的是上一阶段（已完成），显示优化选项 */}
        {isWaitingNextStage &&
          (() => {
            // 检查 viewingStage 是否是上一阶段
            const stageSequence = [
              "stage_1_idea",
              "stage_2_title",
              "stage_3_outline",
              "stage_4_content",
              "stage_5_review",
            ];
            const currentIndex = stageSequence.indexOf(
              currentTask.currentStage
            );
            const viewingIndex = viewingStage
              ? stageSequence.indexOf(viewingStage)
              : -1;
            // 如果查看的是上一阶段，或者查看的就是当前阶段（首次加载）
            return (
              viewingIndex === currentIndex - 1 ||
              (viewingStage === currentTask.currentStage &&
                viewingIndex === currentIndex)
            );
          })() && (
            <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                <h3 className="text-xl font-bold text-amber-900">
                  ⚠️{" "}
                  {viewingStage === "stage_1_idea"
                    ? "想法扩展"
                    : viewingStage === "stage_2_title"
                    ? "书名简介"
                    : viewingStage === "stage_3_outline"
                    ? "大纲生成"
                    : viewingStage === "stage_4_content"
                    ? "正文生成"
                    : "审稿优化"}
                  完成，等待执行下一阶段
                </h3>
              </div>

              {/* 可折叠的上一步结果 */}
              {(() => {
                // 根据 viewingStage 判断显示哪个阶段的结果
                let showBrainstorm = false;
                let showTitle = false;

                if (viewingStage === "stage_1_idea") {
                  showBrainstorm = !!currentTask.processedData?.brainstorm;
                } else if (viewingStage === "stage_2_title") {
                  showTitle = !!(
                    currentTask.processedData?.selectedTitle ||
                    (currentTask.processedData?.titles &&
                      currentTask.processedData.titles.length > 0)
                  );
                  showBrainstorm = !!currentTask.processedData?.brainstorm;
                }

                if (!showBrainstorm && !showTitle) {
                  return null;
                }

                return (
                  <details
                    className="bg-white rounded-xl border border-amber-100 mb-4 group"
                    open
                  >
                    <summary className="p-4 font-semibold text-gray-900 cursor-pointer hover:bg-amber-50 transition-colors">
                      📚{" "}
                      {viewingStage === "stage_1_idea"
                        ? "想法扩展"
                        : viewingStage === "stage_2_title"
                        ? "书名简介"
                        : viewingStage === "stage_3_outline"
                        ? "大纲生成"
                        : viewingStage === "stage_4_content"
                        ? "正文生成"
                        : "审稿优化"}
                      生成结果 (点击折叠/展开)
                    </summary>
                    <div className="px-4 pb-4 border-t border-amber-100">
                      {showBrainstorm &&
                        currentTask.processedData?.brainstorm && (
                          <div className="mb-3">
                            <h5 className="font-semibold text-gray-700 mb-2">
                              📚 想法扩展
                            </h5>
                            <div className="text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto bg-gray-50 p-3 rounded">
                              {currentTask.processedData.brainstorm}
                            </div>
                          </div>
                        )}
                      {showTitle &&
                        currentTask.processedData?.selectedTitle && (
                          <div>
                            <h5 className="font-semibold text-gray-700 mb-2">
                              📚 书名
                            </h5>
                            <div className="text-gray-700 bg-gray-50 p-3 rounded mb-2">
                              {currentTask.processedData.selectedTitle}
                            </div>
                            {currentTask.processedData?.synopsis && (
                              <>
                                <h5 className="font-semibold text-gray-700 mb-2">
                                  📚 简介
                                </h5>
                                <div className="text-gray-700 whitespace-pre-wrap max-h-60 overflow-y-auto bg-gray-50 p-3 rounded">
                                  {currentTask.processedData.synopsis}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                      {/* 流式优化内容显示 */}
                      {(isOptimizing || optimizeStreamingContent) && (
                        <div className="mt-4 bg-blue-50 rounded-xl p-4 border-2 border-blue-300">
                          <div className="flex items-center gap-2 mb-3">
                            {isOptimizing ? (
                              <>
                                <Sparkles className="w-5 h-5 text-blue-600 animate-spin" />
                                <h3 className="font-medium text-blue-900">
                                  AI正在优化中...
                                </h3>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5 text-green-600" />
                                <h3 className="font-medium text-green-900">
                                  优化已完成
                                </h3>
                              </>
                            )}
                          </div>
                          <div className="prose prose-sm max-w-none text-gray-800 markdown-content bg-white p-4 rounded-lg max-h-96 overflow-y-auto">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {optimizeStreamingContent || "正在等待AI响应..."}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                );
              })()}

              {/* 优化输入框 */}
              <div className="bg-white rounded-xl p-4 mb-4 border border-amber-100">
                <label className="block font-semibold text-gray-900 mb-2">
                  📝 优化建议（可选）
                </label>
                <textarea
                  value={optimizationFeedback || ""}
                  onChange={(e) => setOptimizationFeedback(e.target.value)}
                  placeholder="输入优化建议，或直接点击继续下一阶段执行"
                  className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  disabled={isOptimizing}
                />
                {optimizationFeedback && (
                  <button
                    onClick={async () => {
                      try {
                        // 根据 viewingStage 确定要优化的阶段
                        // 如果查看的是上一阶段，就优化上一阶段
                        let targetStage =
                          viewingStage || currentTask.currentStage;

                        // 如果 viewingStage 是上一阶段，直接使用它
                        if (viewingStage) {
                          targetStage = viewingStage;
                        } else {
                          // 否则根据当前阶段倒推上一阶段
                          const stageSequence = [
                            "stage_1_idea",
                            "stage_2_title",
                            "stage_3_outline",
                            "stage_4_content",
                            "stage_5_review",
                          ];
                          const currentIndex = stageSequence.indexOf(
                            currentTask.currentStage
                          );
                          if (currentIndex > 0) {
                            targetStage = stageSequence[currentIndex - 1];
                          }
                        }

                        console.log(
                          "[TaskDetailPage] 优化阶段 - currentStage:",
                          currentTask.currentStage,
                          "targetStage:",
                          targetStage
                        );

                        setIsOptimizing(true);
                        setOptimizeStreamingContent("");

                        // 使用流式API进行优化
                        const cancelFn =
                          await bookCreationApi.optimizeStageStream(
                            parseInt(taskId!),
                            targetStage,
                            optimizationFeedback,
                            // 接收内容片段
                            (content) => {
                              console.log(
                                "[TaskDetailPage] 收到优化内容片段，长度:",
                                content.length
                              );
                              setOptimizeStreamingContent(
                                (prev) => prev + content
                              );
                            },
                            // 完成回调
                            () => {
                              console.log("[TaskDetailPage] 流式优化完成");
                              setIsOptimizing(false);
                              success("优化完成", "AI优化已完成");
                              setOptimizationFeedback("");
                              cancelOptimizeStreamRef.current = null;
                              // 延迟刷新，让用户看到完整内容
                              setTimeout(() => {
                                loadTask();
                                setOptimizeStreamingContent(""); // 刷新后清空
                              }, 1000);
                            },
                            // 错误回调
                            (err) => {
                              console.error(
                                "[TaskDetailPage] 流式优化失败:",
                                err
                              );
                              setIsOptimizing(false);
                              setOptimizeStreamingContent("");
                              error("优化失败", err.message || "优化失败");
                              cancelOptimizeStreamRef.current = null;
                            }
                          );

                        // 保存取消函数的引用
                        cancelOptimizeStreamRef.current = cancelFn;
                      } catch (err: any) {
                        console.error("[TaskDetailPage] 优化异常:", err);
                        setIsOptimizing(false);
                        setOptimizeStreamingContent("");
                        error(
                          "优化失败",
                          err.response?.data?.message || "优化失败"
                        );
                      }
                    }}
                    disabled={isOptimizing || !optimizationFeedback.trim()}
                    className="mt-3 w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isOptimizing && (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <Sparkles className="w-4 h-4" />
                    {isOptimizing ? "优化中..." : "确认优化"}
                  </button>
                )}
              </div>
            </div>
          )}

        {/* 🆕 审稿报告展示 */}
        {currentReviewReport && currentChapter && (
          <div className="mt-6">
            <ReviewReportCard
              reviewReport={currentReviewReport}
              chapterTitle={currentChapter.title}
              chapterOrder={currentChapter.order}
            />

            {/* 人工决策按钮 */}
            <div className="mt-4 bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-4">
                👤 人工决策：审稿报告已生成，请选择下一步操作
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 在编辑器中编辑 */}
                <button
                  onClick={handleOpenInEditor}
                  className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl border-2 border-blue-200 transition-all"
                >
                  <Edit3 className="w-6 h-6 text-blue-600" />
                  <span className="font-medium text-blue-900">手动编辑</span>
                  <span className="text-xs text-blue-600">
                    在编辑器中修改章节
                  </span>
                </button>

                {/* 让AI优化 */}
                <button
                  onClick={async () => {
                    try {
                      await bookCreationApi.optimizeChapter(
                        parseInt(taskId!),
                        currentChapter.id,
                        currentReviewReport
                      );
                      success("优化成功", "AI已根据审稿报告优化章节");
                      loadTask();
                    } catch (err: any) {
                      error(
                        "优化失败",
                        err.response?.data?.message || "优化失败"
                      );
                    }
                  }}
                  className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl border-2 border-purple-200 transition-all"
                >
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  <span className="font-medium text-purple-900">AI优化</span>
                  <span className="text-xs text-purple-600">
                    根据审稿报告自动优化
                  </span>
                </button>

                {/* 继续下一章 */}
                <button
                  onClick={handleContinueNextChapter}
                  disabled={generatingChapter}
                  className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl border-2 border-green-200 transition-all disabled:opacity-50"
                >
                  <ArrowRight className="w-6 h-6 text-green-600" />
                  <span className="font-medium text-green-900">满意，继续</span>
                  <span className="text-xs text-green-600">
                    {generatingChapter ? "生成中..." : "生成下一章"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🆕 步进式生成按钮（在阶段4时显示） */}
        {currentTask.currentStage === "stage_4_content" &&
          !currentReviewReport && (
            <div className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="text-xl font-bold mb-2">
                📖 步进式章节生成（人工干预模式）
              </h3>
              <p className="text-blue-100 mb-4">
                生成一章 → 梗概 → AI审稿 → 返回报告 → 人工确认 → 继续下一章
              </p>
              <button
                onClick={handleGenerateNextChapter}
                disabled={generatingChapter}
                className="bg-white text-purple-600 px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                {generatingChapter ? "生成中..." : "生成下一章"}
              </button>
            </div>
          )}

        {/* 操作按钮 */}
        {isTaskActive && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 mt-6 shadow-lg border border-gray-100">
            {/* 单个提示词模式提示 */}
            {!currentTask.promptGroupId && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800 text-sm">
                  💡 <strong>单个提示词模式：</strong>
                  执行各阶段前需要选择对应的提示词
                </p>
              </div>
            )}

            <div className="flex gap-4">
              {!shouldShowContinueButton ? (
                <>
                  <button
                    onClick={handleExecuteNextStage}
                    disabled={
                      executing || currentTask.status.includes("generating")
                    }
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    <Play className="w-5 h-5" />
                    {executing || currentTask.status.includes("generating")
                      ? "执行中..."
                      : currentTask.currentStage === "stage_1_idea" &&
                        !currentTask.processedData?.brainstorm
                      ? "开始执行阶段1"
                      : "继续下一阶段"}
                  </button>
                  <button
                    onClick={handlePause}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition-all"
                  >
                    <Pause className="w-5 h-5" />
                    暂停
                  </button>
                </>
              ) : null}
              {shouldShowContinueButton && (
                <button
                  onClick={handleResume}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                >
                  <Play className="w-5 h-5" />
                  {isWaitingNextStage ? "继续下一阶段" : "恢复任务"}
                </button>
              )}
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-red-500 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition-all"
              >
                <XCircle className="w-5 h-5" />
                取消任务
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 提示词选择器 */}
      <PromptSelectionModal
        isOpen={showPromptSelector}
        onClose={() => {
          setShowPromptSelector(false);
          setCurrentStageForPrompt(null);
        }}
        onSelect={handlePromptSelected}
      />

      {/* 书名选择器 */}
      {showTitleSelector && currentTask?.processedData?.titles && (
        <TitleSelectorModal
          titles={currentTask.processedData.titles}
          synopsis={currentTask.processedData.synopsis || ""}
          selectedTitle={
            currentTask.processedData.selectedTitle ||
            currentTask.processedData.titles[0]
          }
          onConfirm={async (title, synopsis) => {
            try {
              // 调用API更新书名和简介
              await bookCreationApi.updateTitleSynopsis(
                parseInt(taskId!),
                title,
                synopsis
              );

              setShowTitleSelector(false);
              success("更新成功", `书名：${title}，已进入下一阶段`);

              // 刷新任务数据
              await loadTask();
            } catch (err: any) {
              error("更新失败", err.response?.data?.message || "更新书名失败");
            }
          }}
          onCancel={() => setShowTitleSelector(false)}
        />
      )}
    </div>
  );
};

export default TaskDetailPage;
