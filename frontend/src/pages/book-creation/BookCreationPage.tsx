import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wand2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
  PackageOpen,
  HelpCircle,
} from "lucide-react";
import { bookCreationApi } from "../../services/book-creation.api";
import type { BookCreationTask, TaskStatus } from "../../types/book-creation";
import { useToast } from "../../contexts/ToastContext";

/**
 * 一键成书任务列表页
 */
const BookCreationPage: React.FC = () => {
  const navigate = useNavigate();
  const { error } = useToast();
  const [tasks, setTasks] = useState<BookCreationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskStatus | "">("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadTasks();
  }, [filter, page]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      if (filter) params.status = filter;

      const response = await bookCreationApi.getTasks(params);
      setTasks(response.data);
      setTotal(response.total);
    } catch (err: any) {
      error("加载失败", err.response?.data?.message || "加载任务失败");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    const badges: Record<
      TaskStatus,
      { icon: React.ReactNode; text: string; color: string }
    > = {
      idea_generating: {
        icon: <Clock className="w-4 h-4" />,
        text: "想法生成中",
        color: "bg-blue-500",
      },
      title_generating: {
        icon: <Clock className="w-4 h-4" />,
        text: "书名生成中",
        color: "bg-blue-500",
      },
      outline_generating: {
        icon: <Clock className="w-4 h-4" />,
        text: "大纲生成中",
        color: "bg-blue-500",
      },
      content_generating: {
        icon: <Clock className="w-4 h-4" />,
        text: "正文生成中",
        color: "bg-purple-500",
      },
      review_optimizing: {
        icon: <Clock className="w-4 h-4" />,
        text: "审稿优化中",
        color: "bg-purple-500",
      },
      completed: {
        icon: <CheckCircle className="w-4 h-4" />,
        text: "已完成",
        color: "bg-green-500",
      },
      failed: {
        icon: <XCircle className="w-4 h-4" />,
        text: "失败",
        color: "bg-red-500",
      },
      cancelled: {
        icon: <XCircle className="w-4 h-4" />,
        text: "已取消",
        color: "bg-gray-500",
      },
      paused: {
        icon: <Pause className="w-4 h-4" />,
        text: "已暂停",
        color: "bg-yellow-500",
      },
      waiting_next_stage: {
        icon: <Clock className="w-4 h-4" />,
        text: "等待下一阶段",
        color: "bg-amber-500",
      },
    };

    const badge = badges[status];

    // 防御性检查：如果状态未定义，返回默认badge
    if (!badge) {
      console.warn(`未定义的状态: ${status}`);
      return (
        <span className="bg-gray-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
          <Clock className="w-4 h-4" />
          {status}
        </span>
      );
    }

    return (
      <span
        className={`${badge.color} text-white px-3 py-1 rounded-full text-sm flex items-center gap-1`}
      >
        {badge.icon}
        {badge.text}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Wand2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">一键成书</h1>
                <p className="text-gray-600 mt-1">
                  AI辅助创作，从想法到完整作品
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate("/dashboard/book-creation/help")}
                className="bg-white text-gray-700 border border-gray-300 px-4 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-50 transition-all"
              >
                <HelpCircle className="w-5 h-5" />
                帮助文档
              </button>
              <button
                onClick={() =>
                  navigate("/dashboard/book-creation/prompt-groups")
                }
                className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition-all"
              >
                <PackageOpen className="w-5 h-5" />
                提示词组管理
              </button>
              <button
                onClick={() => navigate("/dashboard/book-creation/new")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                创建任务
              </button>
            </div>
          </div>

          {/* 筛选器 */}
          <div className="flex gap-2 flex-wrap">
            {(
              [
                "",
                "idea_generating",
                "outline_generating",
                "content_generating",
                "completed",
                "paused",
              ] as const
            ).map((status) => (
              <button
                key={status || "all"}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  filter === status
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-white/80 text-gray-700 hover:bg-white"
                }`}
              >
                {status === ""
                  ? "全部"
                  : status === "idea_generating"
                  ? "生成中"
                  : status === "outline_generating"
                  ? "大纲中"
                  : status === "content_generating"
                  ? "正文中"
                  : status === "completed"
                  ? "已完成"
                  : "已暂停"}
              </button>
            ))}
          </div>
        </div>

        {/* 任务列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 text-center">
            <Wand2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              还没有任务，开始创建你的第一部作品吧！
            </p>
            <button
              onClick={() => navigate("/dashboard/book-creation/new")}
              className="mt-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              创建任务
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/dashboard/book-creation/${task.id}`)}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all border border-gray-100 hover:border-blue-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {task.processedData?.selectedTitle || "未命名任务"}
                      </h3>
                      {getStatusBadge(task.status)}
                    </div>

                    <p className="text-gray-600 line-clamp-2 mb-3">
                      {task.processedData?.synopsis ||
                        task.processedData?.brainstorm ||
                        "暂无简介"}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span>
                        创建于: {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        消耗: {task.totalCharactersConsumed.toLocaleString()}字
                      </span>
                      {task.novel && <span>作品ID: {task.novel.id}</span>}
                    </div>
                  </div>

                  <div className="ml-6">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-500">
                        {Math.round(
                          ((task.stages?.filter((s) => s.status === "completed")
                            .length || 0) /
                            5) *
                            100
                        )}
                        %
                      </div>
                      <div className="text-sm text-gray-500">完成度</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {total > 10 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white/80 rounded-lg disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-4 py-2 bg-white/80 rounded-lg">
              {page} / {Math.ceil(total / 10)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / 10)}
              className="px-4 py-2 bg-white/80 rounded-lg disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookCreationPage;
