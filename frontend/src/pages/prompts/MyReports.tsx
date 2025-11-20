import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Flag,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { promptReportsApi } from "../../services/prompts.api";
import { useToast } from "../../contexts/ToastContext";
import Pagination from "../../components/common/Pagination";

interface Report {
  id: number;
  promptId: number;
  promptName?: string;
  prompt?: {
    id: number;
    name: string;
  };
  reason: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  reviewNote?: string | null; // 审核备注（拒绝原因）
  createdAt: string;
  updatedAt: string;
}

const REASON_LABELS: Record<string, string> = {
  spam: "垃圾信息",
  inappropriate: "不当内容",
  violence: "暴力内容",
  hate_speech: "仇恨言论",
  pornography: "色情内容",
  copyright: "版权侵犯",
  fraud: "欺诈内容",
  other: "其他",
};

const STATUS_CONFIG = {
  pending: {
    label: "待处理",
    icon: Clock,
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
  },
  approved: {
    label: "已通过",
    icon: CheckCircle,
    color: "text-green-600 bg-green-50 border-green-200",
  },
  rejected: {
    label: "已拒绝",
    icon: XCircle,
    color: "text-red-600 bg-red-50 border-red-200",
  },
};

/**
 * 我的举报页面
 */
const MyReports: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadReports();
  }, [currentPage]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await promptReportsApi.getMyReports(
        currentPage,
        pageSize
      );
      setReports(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error("加载举报记录失败:", err);
      showError(err.response?.data?.message || "加载举报记录失败");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    return (
      STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ||
      STATUS_CONFIG.pending
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {/* 头部 */}
        <div className="mb-4 sm:mb-6">
          <button
            onClick={() => navigate("/dashboard/prompts")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 sm:mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">返回提示词广场</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Flag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                我的举报
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                查看您提交的举报记录和处理状态
              </p>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white/70 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/50 shadow-lg p-3 sm:p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-blue-500" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Flag className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">暂无举报记录</p>
            </div>
          ) : (
            <>
              {/* 举报列表 */}
              <div className="space-y-3 sm:space-y-4">
                {reports.map((report) => {
                  const statusConfig = getStatusConfig(report.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={report.id}
                      className="border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-3 sm:gap-4 flex-wrap">
                        {/* 左侧信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                            <h3 className="text-sm sm:text-base font-semibold text-gray-900 break-words">
                              {report.prompt?.name ||
                                report.promptName ||
                                `提示词 #${report.promptId}`}
                            </h3>
                            <span
                              className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium border flex-shrink-0 ${statusConfig.color}`}
                            >
                              <StatusIcon className="w-3 h-3" />
                              {statusConfig.label}
                            </span>
                          </div>

                          <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">举报原因：</span>
                              <span>
                                {REASON_LABELS[report.reason] || report.reason}
                              </span>
                            </div>

                            {report.description && (
                              <div className="flex items-start gap-2">
                                <span className="font-medium flex-shrink-0">
                                  详细说明：
                                </span>
                                <span className="break-words">
                                  {report.description}
                                </span>
                              </div>
                            )}

                            {/* 拒绝原因 - 当状态为已拒绝时显示 */}
                            {report.status === "rejected" &&
                              report.reviewNote && (
                                <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                                  <span className="font-medium text-red-700 flex-shrink-0">
                                    拒绝原因：
                                  </span>
                                  <span className="text-red-800 break-words">
                                    {report.reviewNote}
                                  </span>
                                </div>
                              )}

                            {/* 通过说明 - 当状态为已通过时显示审核备注（如果有） */}
                            {report.status === "approved" &&
                              report.reviewNote && (
                                <div className="flex items-start gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
                                  <span className="font-medium text-green-700 flex-shrink-0">
                                    审核说明：
                                  </span>
                                  <span className="text-green-800 break-words">
                                    {report.reviewNote}
                                  </span>
                                </div>
                              )}

                            <div className="flex items-center gap-3 sm:gap-4 text-gray-500 flex-wrap">
                              <span>
                                提交时间：
                                {new Date(report.createdAt).toLocaleString(
                                  "zh-CN"
                                )}
                              </span>
                              {report.updatedAt !== report.createdAt && (
                                <span>
                                  更新时间：
                                  {new Date(report.updatedAt).toLocaleString(
                                    "zh-CN"
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 分页 */}
              {totalPages > 1 && (
                <div className="mt-4 sm:mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyReports;
