import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Shield,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import {
  promptsApi,
  promptPermissionsApi,
  promptApplicationsApi,
} from "../../services/prompts.api";
import { useToast } from "../../contexts/ToastContext";
import type {
  Prompt,
  PromptPermission,
  PermissionType,
  PromptApplication,
  ApplicationStatus,
} from "../../types/prompt";

/**
 * 提示词权限管理页面
 */
const PromptPermissions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [permissions, setPermissions] = useState<PromptPermission[]>([]);
  const [applications, setApplications] = useState<PromptApplication[]>([]);
  const [activeTab, setActiveTab] = useState<"permissions" | "applications">(
    "applications"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 添加权限对话框
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [userId, setUserId] = useState("");
  const [permissionType, setPermissionType] = useState<PermissionType>("use");
  const [adding, setAdding] = useState(false);

  // 审核对话框
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewingApplication, setReviewingApplication] =
    useState<PromptApplication | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">(
    "approved"
  );
  const [reviewNote, setReviewNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  // 撤销权限确认对话框
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [revokingUserId, setRevokingUserId] = useState<number | null>(null);

  useEffect(() => {
    if (id) {
      loadData(parseInt(id));
    }
  }, [id]);

  const loadData = async (promptId: number) => {
    try {
      setLoading(true);
      setError(null);

      const [promptData, permissionsData, applicationsData] = await Promise.all(
        [
          promptsApi.getPrompt(promptId),
          promptPermissionsApi.getPermissions(promptId),
          promptApplicationsApi.getPromptApplications(promptId),
        ]
      );

      setPrompt(promptData);
      setPermissions(permissionsData);
      setApplications(applicationsData);
    } catch (err: any) {
      console.error("Failed to load data:", err);
      setError(err.response?.data?.message || "加载数据失败");
      showError("加载数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async () => {
    if (!prompt || !userId.trim()) {
      showError("请输入用户ID");
      return;
    }

    try {
      setAdding(true);
      await promptPermissionsApi.grantPermission(prompt.id, {
        userId: parseInt(userId),
        permission: permissionType,
      });
      showSuccess("授权成功");
      setShowAddDialog(false);
      setUserId("");
      setPermissionType("use");
      loadData(prompt.id);
    } catch (err: any) {
      showError(err.response?.data?.message || "授权失败");
    } finally {
      setAdding(false);
    }
  };

  const handleRevokePermission = async (permissionUserId: number) => {
    setRevokingUserId(permissionUserId);
    setShowRevokeDialog(true);
  };

  const confirmRevokePermission = async () => {
    if (!prompt || !revokingUserId) return;

    try {
      await promptPermissionsApi.revokePermission(prompt.id, revokingUserId);
      showSuccess("撤销成功");
      setShowRevokeDialog(false);
      setRevokingUserId(null);
      loadData(prompt.id);
    } catch (err: any) {
      showError(err.response?.data?.message || "撤销失败");
    }
  };

  const openReviewDialog = (
    application: PromptApplication,
    status: "approved" | "rejected"
  ) => {
    setReviewingApplication(application);
    setReviewStatus(status);
    setReviewNote("");
    setShowReviewDialog(true);
  };

  const handleReviewApplication = async () => {
    if (!prompt || !reviewingApplication) return;

    try {
      setReviewing(true);
      await promptApplicationsApi.reviewApplication(reviewingApplication.id, {
        status: reviewStatus,
        reviewNote: reviewNote.trim() || undefined,
      });
      showSuccess(
        reviewStatus === "approved" ? "✅ 已通过申请" : "❌ 已拒绝申请"
      );
      setShowReviewDialog(false);
      setReviewingApplication(null);
      setReviewNote("");
      loadData(prompt.id);
    } catch (err: any) {
      showError(err.response?.data?.message || "审核失败");
    } finally {
      setReviewing(false);
    }
  };

  const getStatusLabel = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return "待审核";
      case "approved":
        return "已通过";
      case "rejected":
        return "已拒绝";
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
    }
  };

  const pendingApplications = applications.filter(
    (app) => app.status === "pending"
  );

  const getPermissionLabel = (permission: PermissionType) => {
    switch (permission) {
      case "view":
        return "查看";
      case "use":
        return "使用";
      case "edit":
        return "编辑";
    }
  };

  const getPermissionColor = (permission: PermissionType) => {
    switch (permission) {
      case "view":
        return "bg-gray-100 text-gray-800";
      case "use":
        return "bg-blue-100 text-blue-800";
      case "edit":
        return "bg-purple-100 text-purple-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !prompt) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600 mb-4">{error || "提示词不存在"}</p>
        <button
          onClick={() => navigate("/dashboard/prompts?tab=my")}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          返回列表
        </button>
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

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate("/dashboard/prompts?tab=my")}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回列表</span>
        </button>

        {/* 头部 */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            权限管理
          </h1>
          <p className="text-sm sm:text-base text-gray-600 line-clamp-1">
            {prompt.name}
          </p>
        </div>

        {/* Tab切换 */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === "applications"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>申请列表</span>
                {pendingApplications.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {pendingApplications.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("permissions")}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === "permissions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>已授权用户</span>
                <span className="text-xs text-gray-400">
                  ({permissions.length})
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 添加权限按钮 */}
        {activeTab === "permissions" && (
          <div className="mb-4 sm:mb-6">
            <button
              onClick={() => setShowAddDialog(true)}
              className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 
                       transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center sm:justify-start space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>授予权限</span>
            </button>
          </div>
        )}

        {/* 申请列表 */}
        {activeTab === "applications" &&
          (applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-gray-500">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-gray-300" />
              <p className="text-base sm:text-lg">暂无申请记录</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-4 sm:p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* 用户信息 */}
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <User className="w-10 h-10 p-2 bg-gray-100 rounded-full text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {application.user?.nickname ||
                            application.user?.username ||
                            `用户 #${application.userId}`}
                        </div>
                        {application.user?.email && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {application.user.email}
                          </div>
                        )}
                        <div className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">申请理由：</span>
                          {application.reason}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          申请时间：
                          {new Date(application.createdAt).toLocaleString()}
                        </div>
                        {application.reviewedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            审核时间：
                            {new Date(application.reviewedAt).toLocaleString()}
                            {application.reviewNote &&
                              ` · ${application.reviewNote}`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 状态和操作 */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {getStatusLabel(application.status)}
                      </span>

                      {application.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              openReviewDialog(application, "approved")
                            }
                            className="flex-1 sm:flex-none px-4 py-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg 
                                     transition-colors flex items-center justify-center space-x-1.5"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>通过</span>
                          </button>
                          <button
                            onClick={() =>
                              openReviewDialog(application, "rejected")
                            }
                            className="flex-1 sm:flex-none px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg 
                                     transition-colors flex items-center justify-center space-x-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>拒绝</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* 权限列表 */}
        {activeTab === "permissions" &&
          (permissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-gray-500">
              <Shield className="w-12 h-12 sm:w-16 sm:h-16 mb-4 text-gray-300" />
              <p className="text-base sm:text-lg">暂无权限记录</p>
              <p className="text-xs sm:text-sm mt-2 px-4 text-center">
                点击上方按钮为用户授予权限
              </p>
            </div>
          ) : (
            <>
              {/* 移动端：卡片展示 */}
              <div className="md:hidden space-y-3">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg p-4"
                  >
                    {/* 用户信息 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <User className="w-10 h-10 p-2 bg-gray-100 rounded-full text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 truncate">
                            {permission.user?.nickname ||
                              permission.user?.username ||
                              `用户 #${permission.userId}`}
                          </div>
                          {permission.user?.email && (
                            <div className="text-xs text-gray-500 truncate">
                              {permission.user.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${getPermissionColor(
                          permission.permission
                        )}`}
                      >
                        {getPermissionLabel(permission.permission)}
                      </span>
                    </div>

                    {/* 授权时间 */}
                    <div className="text-xs text-gray-500 mb-3">
                      授权时间：
                      {new Date(permission.createdAt).toLocaleString()}
                    </div>

                    {/* 操作按钮 */}
                    <button
                      onClick={() => handleRevokePermission(permission.userId)}
                      className="w-full px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg 
                             transition-colors flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>撤销权限</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* 桌面端：表格展示 */}
              <div className="hidden md:block bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        用户
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        权限类型
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        授权时间
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {permissions.map((permission) => (
                      <tr
                        key={permission.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="font-medium text-gray-900">
                                {permission.user?.nickname ||
                                  permission.user?.username ||
                                  `用户 #${permission.userId}`}
                              </div>
                              {permission.user?.email && (
                                <div className="text-sm text-gray-500">
                                  {permission.user.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getPermissionColor(
                              permission.permission
                            )}`}
                          >
                            {getPermissionLabel(permission.permission)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-600">
                          {new Date(permission.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center">
                            <button
                              onClick={() =>
                                handleRevokePermission(permission.userId)
                              }
                              className="px-4 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors
                                   flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>撤销</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ))}

        {/* 统计信息 */}
        <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500">
          {activeTab === "applications"
            ? `共 ${applications.length} 个申请记录（${pendingApplications.length} 个待审核）`
            : `共 ${permissions.length} 个用户拥有权限`}
        </div>
      </div>

      {/* 添加权限对话框 */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              授予权限
            </h3>

            <div className="space-y-4 mb-5 sm:mb-6">
              {/* 用户ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="请输入用户ID"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  提示：可在用户管理中查看用户ID
                </p>
              </div>

              {/* 权限类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  权限类型
                </label>
                <select
                  value={permissionType}
                  onChange={(e) =>
                    setPermissionType(e.target.value as PermissionType)
                  }
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg 
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="view">查看</option>
                  <option value="use">使用</option>
                  <option value="edit">编辑</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {permissionType === "view" && "用户可以查看提示词内容"}
                  {permissionType === "use" && "用户可以使用提示词（推荐）"}
                  {permissionType === "edit" && "用户可以编辑提示词"}
                </p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleAddPermission}
                disabled={adding || !userId.trim()}
                className="w-full sm:flex-1 px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-blue-500 text-white rounded-lg 
                         hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                    授权中...
                  </>
                ) : (
                  "确认授权"
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setUserId("");
                  setPermissionType("use");
                }}
                disabled={adding}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg 
                         hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 审核对话框 */}
      {showReviewDialog && reviewingApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* 标题 */}
              <h3 className="text-xl font-bold mb-4">
                {reviewStatus === "approved" ? "✅ 通过申请" : "❌ 拒绝申请"}
              </h3>

              {/* 申请信息 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">申请者：</span>
                    <span className="font-medium">
                      {reviewingApplication.user?.username || "未知"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">申请时间：</span>
                    <span>
                      {new Date(
                        reviewingApplication.createdAt
                      ).toLocaleString()}
                    </span>
                  </div>
                  {reviewingApplication.reason && (
                    <div>
                      <span className="text-gray-500">申请理由：</span>
                      <p className="mt-1 text-gray-700">
                        {reviewingApplication.reason}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 审核备注输入 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  审核备注{" "}
                  {reviewStatus === "rejected" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={
                    reviewStatus === "approved"
                      ? "可以写一些使用建议（可选）"
                      : "请说明拒绝原因，帮助申请者了解情况"
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <div className="mt-2 text-xs text-gray-500">
                  {reviewStatus === "approved"
                    ? "💡 提示：可以写一些使用技巧或注意事项"
                    : "⚠️ 建议说明拒绝原因，以便申请者改进"}
                </div>
              </div>

              {/* 按钮 */}
              <div className="flex gap-3">
                <button
                  onClick={handleReviewApplication}
                  disabled={
                    reviewing ||
                    (reviewStatus === "rejected" && !reviewNote.trim())
                  }
                  className={`flex-1 px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2
                    ${
                      reviewStatus === "approved"
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {reviewing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>处理中...</span>
                    </>
                  ) : (
                    <>
                      {reviewStatus === "approved" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <XCircle className="w-5 h-5" />
                      )}
                      <span>
                        {reviewStatus === "approved" ? "确认通过" : "确认拒绝"}
                      </span>
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
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 撤销权限确认对话框 */}
      {showRevokeDialog && revokingUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">确认撤销权限</h3>
                  <p className="text-sm text-gray-500 mt-1">此操作不可撤销</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6">
                确定要撤销该用户的权限吗？撤销后，用户将无法继续使用此提示词。
              </p>

              <div className="flex gap-3">
                <button
                  onClick={confirmRevokePermission}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>确认撤销</span>
                </button>
                <button
                  onClick={() => {
                    setShowRevokeDialog(false);
                    setRevokingUserId(null);
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptPermissions;
