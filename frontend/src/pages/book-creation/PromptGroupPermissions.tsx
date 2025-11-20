import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, UserMinus, Check, X, Clock } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import promptGroupApi from "../../services/prompt-groups.api";
import type {
  PromptGroup,
  PromptGroupPermission,
  PromptGroupApplication,
} from "../../types/prompt-group";

/**
 * 提示词组权限管理页面
 */
const PromptGroupPermissions: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();
  const [group, setGroup] = useState<PromptGroup | null>(null);
  const [permissions] = useState<PromptGroupPermission[]>([]);
  const [applications] = useState<PromptGroupApplication[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"permissions" | "applications">(
    "permissions"
  );

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const groupData = await promptGroupApi.getById(parseInt(id));
      setGroup(groupData);

      // TODO: 添加获取权限列表和申请列表的API
      // const perms = await promptGroupApi.getPermissions(parseInt(id));
      // setPermissions(perms);

      // const apps = await promptGroupApi.getApplications(parseInt(id));
      // setApplications(apps);
     } catch (err: any) {
       error("加载失败", err.response?.data?.message || "加载数据失败");
       navigate("/dashboard/book-creation/prompt-groups");
    } finally {
      setLoading(false);
    }
  };

  const handleReviewApplication = async (
    applicationId: number,
    approved: boolean
  ) => {
    try {
      await promptGroupApi.reviewApplication(applicationId, {
        status: approved ? "approved" : "rejected",
        reviewNote: approved ? "申请已通过" : "申请被拒绝",
      });
      success(
        approved ? "已批准" : "已拒绝",
        `申请${approved ? "已通过" : "已被拒绝"}`
      );
      loadData();
    } catch (err: any) {
      error("操作失败", err.response?.data?.message || "审核申请失败");
    }
  };

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-gray-500 mt-4">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
         {/* 返回按钮 */}
         <button
           onClick={() => navigate("/dashboard/book-creation/prompt-groups")}
           className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
         >
           <ArrowLeft className="w-5 h-5" />
           返回提示词组列表
         </button>

        {/* 主内容 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-600 mt-1">权限管理</p>
          </div>

          {/* Tab切换 */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab("permissions")}
              className={`pb-3 px-4 transition-all ${
                activeTab === "permissions"
                  ? "border-b-2 border-purple-500 text-purple-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              已授权用户
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`pb-3 px-4 transition-all ${
                activeTab === "applications"
                  ? "border-b-2 border-purple-500 text-purple-600 font-medium"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              待审核申请
              {applications.filter((a) => a.status === "pending").length >
                0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {applications.filter((a) => a.status === "pending").length}
                </span>
              )}
            </button>
          </div>

          {/* 已授权用户 */}
          {activeTab === "permissions" && (
            <div>
              {permissions.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">还没有授权用户</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {permissions.map((perm) => (
                    <div
                      key={perm.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {perm.user?.nickname ||
                            perm.user?.username ||
                            `用户${perm.userId}`}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          授权时间：{new Date(perm.grantedAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          // TODO: 实现撤销权限
                          if (confirm("确定要撤销此用户的权限吗？")) {
                            // await promptGroupApi.revokePermission(group.id, perm.userId);
                            success("撤销成功", "权限已撤销");
                            loadData();
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <UserMinus className="w-4 h-4" />
                        撤销权限
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 待审核申请 */}
          {activeTab === "applications" && (
            <div>
              {applications.filter((a) => a.status === "pending").length ===
              0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <p className="text-gray-500">暂无待审核申请</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications
                    .filter((a) => a.status === "pending")
                    .map((app) => (
                      <div key={app.id} className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {app.user?.nickname ||
                                app.user?.username ||
                                `用户${app.userId}`}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              申请时间：
                              {new Date(app.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-lg">
                            <Clock className="w-3 h-3" />
                            待审核
                          </span>
                        </div>

                        {app.reason && (
                          <div className="mb-3 p-3 bg-white rounded-lg">
                            <div className="text-sm text-gray-700">
                              <strong>申请理由：</strong>
                              {app.reason}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleReviewApplication(app.id, true)
                            }
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            批准
                          </button>
                          <button
                            onClick={() =>
                              handleReviewApplication(app.id, false)
                            }
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            拒绝
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 已处理的申请 */}
              {applications.filter((a) => a.status !== "pending").length >
                0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    已处理申请
                  </h3>
                  <div className="space-y-3">
                    {applications
                      .filter((a) => a.status !== "pending")
                      .map((app) => (
                        <div
                          key={app.id}
                          className="p-4 bg-gray-50 rounded-xl opacity-60"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {app.user?.nickname ||
                                  app.user?.username ||
                                  `用户${app.userId}`}
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                {app.status === "approved"
                                  ? "已批准"
                                  : "已拒绝"}{" "}
                                - {new Date(app.reviewedAt!).toLocaleString()}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 text-xs rounded-lg ${
                                app.status === "approved"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {app.status === "approved" ? "已批准" : "已拒绝"}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptGroupPermissions;
