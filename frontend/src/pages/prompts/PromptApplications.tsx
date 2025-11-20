import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { promptApplicationsApi } from "../../services/prompts.api";
import { useToast } from "../../contexts/ToastContext";
import type { PromptApplication, ApplicationStatus } from "../../types/prompt";

type TabType = "my-applications" | "pending-review";

/**
 * @deprecated 提示词申请管理页面 - 已废弃
 * 请使用 dashboard/prompts/:id/permissions 进行权限管理
 */
const PromptApplications: React.FC = () => {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>("my-applications");
  const [myApplications, setMyApplications] = useState<PromptApplication[]>([]);
  const [pendingApplications, setPendingApplications] = useState<
    PromptApplication[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | "all">(
    "all"
  );

  // 审核对话框
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewingApplication, setReviewingApplication] =
    useState<PromptApplication | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadApplications();
  }, [activeTab]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === "my-applications") {
        const data = await promptApplicationsApi.getMyApplications();
        setMyApplications(data);
      } else {
        const data = await promptApplicationsApi.getPendingApplications();
        setPendingApplications(data);
      }
    } catch (err: any) {
      console.error("Failed to load applications:", err);
      setError(err.response?.data?.message || "加载申请失败");
      showError("加载申请失败");
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (application: PromptApplication) => {
    setReviewingApplication(application);
    setReviewNote("");
    setShowReviewDialog(true);
  };

  const submitReview = async (status: "approved" | "rejected") => {
    if (!reviewingApplication) return;

    try {
      setReviewing(true);
      await promptApplicationsApi.reviewApplication(reviewingApplication.id, {
        status,
        reviewNote: reviewNote || undefined,
      });
      showSuccess(status === "approved" ? "已通过申请" : "已拒绝申请");
      setShowReviewDialog(false);
      setReviewingApplication(null);
      setReviewNote("");
      loadApplications();
    } catch (err: any) {
      showError(err.response?.data?.message || "审核失败");
    } finally {
      setReviewing(false);
    }
  };

  const applications =
    activeTab === "my-applications" ? myApplications : pendingApplications;
  const filteredApplications =
    filterStatus === "all"
      ? applications
      : applications.filter((a) => a.status === filterStatus);

  const statusCounts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            待审核
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            已通过
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            已拒绝
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">申请管理</h1>
          <p className="text-gray-600">管理提示词使用申请</p>
        </div>

        {/* 标签页 */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab("my-applications")}
              className={`px-6 py-3 rounded-lg transition-all font-medium ${
                activeTab === "my-applications"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              我的申请
            </button>
            <button
              onClick={() => setActiveTab("pending-review")}
              className={`px-6 py-3 rounded-lg transition-all font-medium ${
                activeTab === "pending-review"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              待我审核
              {pendingApplications.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {pendingApplications.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 状态筛选 */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            {[
              { key: "all", label: "全部", count: statusCounts.all },
              { key: "pending", label: "待审核", count: statusCounts.pending },
              {
                key: "approved",
                label: "已通过",
                count: statusCounts.approved,
              },
              {
                key: "rejected",
                label: "已拒绝",
                count: statusCounts.rejected,
              },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key as typeof filterStatus)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  filterStatus === key
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "hover:bg-gray-100"
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* 错误状态 */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p>{error}</p>
          </div>
        )}

        {/* 空状态 */}
        {!error && filteredApplications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <FileText className="w-16 h-16 mb-4 text-gray-300" />
            <p className="text-lg">暂无申请记录</p>
          </div>
        )}

        {/* 申请列表 */}
        {!error && filteredApplications.length > 0 && (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3
                        className="text-lg font-bold text-gray-900 hover:text-blue-600 
                                 cursor-pointer transition-colors"
                        onClick={() =>
                          navigate(`/dashboard/prompts/${application.promptId}`)
                        }
                      >
                        {application.prompt?.name}
                      </h3>
                      {getStatusBadge(application.status)}
                    </div>

                    {activeTab === "pending-review" && application.user && (
                      <p className="text-sm text-gray-600 mb-2">
                        申请人：
                        {application.user.nickname || application.user.username}
                      </p>
                    )}

                    <p className="text-sm text-gray-500">
                      申请时间：
                      {new Date(application.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {/* 操作按钮 */}
                  {activeTab === "pending-review" &&
                    application.status === "pending" && (
                      <button
                        onClick={() => handleReview(application)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                               transition-colors"
                      >
                        审核
                      </button>
                    )}
                </div>

                {/* 申请理由 */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    申请理由：
                  </p>
                  <p className="text-gray-600">{application.reason}</p>
                </div>

                {/* 审核结果 */}
                {application.status !== "pending" && (
                  <div
                    className={`rounded-lg p-4 ${
                      application.status === "approved"
                        ? "bg-green-50 border border-green-200"
                        : "bg-red-50 border border-red-200"
                    }`}
                  >
                    <p
                      className="text-sm font-medium mb-2 ${
                      application.status === 'approved' ? 'text-green-800' : 'text-red-800'
                    }"
                    >
                      审核结果：
                    </p>
                    {application.reviewNote && (
                      <p
                        className={
                          application.status === "approved"
                            ? "text-green-700"
                            : "text-red-700"
                        }
                      >
                        {application.reviewNote}
                      </p>
                    )}
                    {application.reviewer && (
                      <p className="text-sm text-gray-500 mt-2">
                        审核人：
                        {application.reviewer.nickname ||
                          application.reviewer.username}{" "}
                        ·
                        {application.reviewedAt &&
                          new Date(application.reviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 审核对话框 */}
      {showReviewDialog && reviewingApplication && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">审核申请</h3>

            {/* 提示词信息 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">提示词：</p>
              <p className="font-semibold text-gray-900">
                {reviewingApplication.prompt?.name}
              </p>
            </div>

            {/* 申请人信息 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">申请人：</p>
              <p className="text-gray-900">
                {reviewingApplication.user?.nickname ||
                  reviewingApplication.user?.username}
              </p>
            </div>

            {/* 申请理由 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                申请理由：
              </p>
              <p className="text-gray-700">{reviewingApplication.reason}</p>
            </div>

            {/* 审核备注 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                审核备注（选填）
              </label>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="请输入审核备注..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none 
                         focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => submitReview("approved")}
                disabled={reviewing}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center"
              >
                {reviewing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    处理中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    通过
                  </>
                )}
              </button>
              <button
                onClick={() => submitReview("rejected")}
                disabled={reviewing}
                className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center"
              >
                {reviewing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    处理中...
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 mr-2" />
                    拒绝
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowReviewDialog(false);
                  setReviewingApplication(null);
                  setReviewNote("");
                }}
                disabled={reviewing}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 
                         transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptApplications;
