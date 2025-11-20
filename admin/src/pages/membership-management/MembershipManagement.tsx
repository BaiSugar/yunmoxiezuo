import { useState, useEffect } from "react";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { exportToCSV } from "../../utils/export";
import {
  getUsersMembershipInfo,
  type UserMembershipInfo,
} from "../../api/admin-memberships";
import ActivateMembershipModal from "../../components/forms/ActivateMembershipModal";

export default function MembershipManagement() {
  const [users, setUsers] = useState<UserMembershipInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState({
    search: "",
    planType: "",
    status: "",
    autoRenew: "",
  });

  // 选中的用户ID（用于查看详情）
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // 开通会员模态框
  const [activateModal, setActivateModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    username: string;
  }>({ isOpen: false, userId: null, username: "" });

  // 加载用户会员信息
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsersMembershipInfo({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        planType: filters.planType || undefined,
        status: filters.status || undefined,
        autoRenew: filters.autoRenew || undefined,
      });

      setUsers(response.users);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  // 导出数据
  const handleExport = () => {
    const data = users.map((user) => ({
      userId: user.id,
      username: user.username,
      email: user.email,
      currentPlan: user.membership?.planName || "无",
      planType: user.membership?.planType || "-",
      startDate: user.membership?.startDate || "-",
      endDate: user.membership?.endDate || "-",
      status: user.membership?.isActive ? "活跃" : "无/过期",
      autoRenew: user.membership?.autoRenew ? "是" : "否",
      historyCount: user.membershipHistory.length,
    }));

    const columns = [
      { key: "userId" as const, label: "用户ID" },
      { key: "username" as const, label: "用户名" },
      { key: "email" as const, label: "邮箱" },
      { key: "currentPlan" as const, label: "当前会员" },
      { key: "planType" as const, label: "会员类型" },
      { key: "startDate" as const, label: "开始时间" },
      { key: "endDate" as const, label: "结束时间" },
      { key: "status" as const, label: "状态" },
      { key: "autoRenew" as const, label: "自动续费" },
      { key: "historyCount" as const, label: "历史记录数" },
    ];

    exportToCSV(data, "用户会员管理", columns);
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("zh-CN");
  };

  // 获取会员状态标签
  const getMembershipBadge = (
    membership?: UserMembershipInfo["membership"]
  ) => {
    if (!membership) {
      return (
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
          无会员
        </span>
      );
    }

    if (membership.isActive) {
      const planTypeColors = {
        basic: "bg-blue-100 text-blue-600",
        premium: "bg-green-100 text-green-600",
        professional: "bg-purple-100 text-purple-600",
        enterprise: "bg-yellow-100 text-yellow-600",
      };

      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            planTypeColors[
              membership.planType as keyof typeof planTypeColors
            ] || "bg-gray-100 text-gray-600"
          }`}
        >
          {membership.planName}
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
        已过期
      </span>
    );
  };

  // 获取剩余天数
  const getRemainingDays = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // 打开开通会员模态框
  const handleOpenActivate = (userId: number, username: string) => {
    setActivateModal({ isOpen: true, userId, username });
  };

  // 关闭模态框
  const handleCloseActivate = () => {
    setActivateModal({ isOpen: false, userId: null, username: "" });
  };

  // 开通成功回调
  const handleActivateSuccess = () => {
    handleCloseActivate();
    loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState message={error} onRetry={loadUsers} />;
  if (users.length === 0)
    return <EmptyState title="暂无用户数据" description="系统中还没有用户" />;

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            会员管理
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            管理所有用户的会员状态和记录
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            导出数据
          </button>
        </div>
      </div>

      {/* 筛选条件 */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="搜索用户名或邮箱"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.planType}
            onChange={(e) =>
              setFilters({ ...filters, planType: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部套餐类型</option>
            <option value="basic">基础会员</option>
            <option value="premium">高级会员</option>
            <option value="professional">专业会员</option>
            <option value="enterprise">企业会员</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="active">活跃</option>
            <option value="expired">已过期</option>
            <option value="none">无会员</option>
          </select>
          <select
            value={filters.autoRenew}
            onChange={(e) =>
              setFilters({ ...filters, autoRenew: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部续费状态</option>
            <option value="true">自动续费</option>
            <option value="false">手动续费</option>
          </select>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={loadUsers}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">总用户数</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">活跃会员</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((user) => user.membership?.isActive).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">即将到期</p>
              <p className="text-2xl font-bold text-gray-900">
                {
                  users.filter(
                    (user) =>
                      user.membership?.isActive &&
                      getRemainingDays(user.membership.endDate) <= 30
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">自动续费</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((user) => user.membership?.autoRenew).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  当前会员
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  有效期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  续费设置
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  历史记录
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.username}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getMembershipBadge(user.membership)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.membership ? (
                      <div className="text-sm text-gray-900">
                        <div>开始: {formatDate(user.membership.startDate)}</div>
                        <div>结束: {formatDate(user.membership.endDate)}</div>
                        {user.membership.isActive && (
                          <div className="text-gray-500">
                            剩余: {getRemainingDays(user.membership.endDate)} 天
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">无会员</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.membership ? (
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.membership.autoRenew
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {user.membership.autoRenew ? "自动续费" : "手动续费"}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.membershipHistory.length} 条记录
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedUserId(user.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      详情
                    </button>
                    <button
                      onClick={() => handleOpenActivate(user.id, user.username)}
                      className="text-green-600 hover:text-green-900"
                    >
                      开通会员
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 详情模态框 */}
      {selectedUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  用户会员详情
                </h3>
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {(() => {
                const selectedUser = users.find((u) => u.id === selectedUserId);
                if (!selectedUser) return null;

                return (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        用户信息
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p>
                          <span className="font-medium">用户名:</span>{" "}
                          {selectedUser.username}
                        </p>
                        <p>
                          <span className="font-medium">邮箱:</span>{" "}
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        当前会员
                      </h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        {selectedUser.membership ? (
                          <div>
                            <p>
                              <span className="font-medium">套餐:</span>{" "}
                              {selectedUser.membership.planName}
                            </p>
                            <p>
                              <span className="font-medium">类型:</span>{" "}
                              {selectedUser.membership.planType}
                            </p>
                            <p>
                              <span className="font-medium">开始时间:</span>{" "}
                              {formatDate(selectedUser.membership.startDate)}
                            </p>
                            <p>
                              <span className="font-medium">结束时间:</span>{" "}
                              {formatDate(selectedUser.membership.endDate)}
                            </p>
                            <p>
                              <span className="font-medium">状态:</span>{" "}
                              {selectedUser.membership.isActive
                                ? "活跃"
                                : "已过期"}
                            </p>
                            <p>
                              <span className="font-medium">自动续费:</span>{" "}
                              {selectedUser.membership.autoRenew ? "是" : "否"}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-500">无会员</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        历史记录
                      </h4>
                      <div className="space-y-2">
                        {selectedUser.membershipHistory.map((record) => (
                          <div
                            key={record.id}
                            className="bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{record.planName}</p>
                                <p className="text-sm text-gray-500">
                                  {formatDate(record.startDate)} -{" "}
                                  {formatDate(record.endDate)}
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  record.status === "active"
                                    ? "bg-green-100 text-green-600"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {record.status === "active" ? "活跃" : "已过期"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 开通会员模态框 */}
      {activateModal.isOpen && activateModal.userId && (
        <ActivateMembershipModal
          userId={activateModal.userId}
          username={activateModal.username}
          onClose={handleCloseActivate}
          onSuccess={handleActivateSuccess}
        />
      )}
    </div>
  );
}
