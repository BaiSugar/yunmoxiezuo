import { useState, useEffect } from "react";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { exportToCSV } from "../../utils/export";
import {
  getUsersTokenInfo,
  type UserTokenInfo,
} from "../../api/admin-token-balances";
import TokenRechargeModal from "../../components/forms/TokenRechargeModal";
import UserTokenDetailModal from "../../components/forms/UserTokenDetailModal";

export default function TokenManagement() {
  const [users, setUsers] = useState<UserTokenInfo[]>([]);
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
    minTokens: "",
    maxTokens: "",
    hasMembership: "",
  });

  // 模态框状态
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    username: string;
  }>({ isOpen: false, userId: null, username: "" });

  const [rechargeModal, setRechargeModal] = useState<{
    isOpen: boolean;
    userId: number | null;
    username: string;
  }>({ isOpen: false, userId: null, username: "" });

  // 加载用户字数信息
  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUsersTokenInfo({
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search || undefined,
        minTokens: filters.minTokens ? Number(filters.minTokens) : undefined,
        maxTokens: filters.maxTokens ? Number(filters.maxTokens) : undefined,
        hasMembership: filters.hasMembership || undefined,
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
      totalTokens: user.totalTokens,
      usedTokens: user.usedTokens,
      frozenTokens: user.frozenTokens,
      giftTokens: user.giftTokens,
      dailyFreeQuota: user.dailyFreeQuota,
      dailyUsedQuota: user.dailyUsedQuota,
      hasMembership: user.membership?.isActive ? "是" : "否",
      membershipExpires: user.membership?.expiresAt || "-",
    }));

    const columns = [
      { key: "userId" as const, label: "用户ID" },
      { key: "username" as const, label: "用户名" },
      { key: "email" as const, label: "邮箱" },
      { key: "totalTokens" as const, label: "总字数" },
      { key: "usedTokens" as const, label: "已使用" },
      { key: "frozenTokens" as const, label: "冻结字数" },
      { key: "giftTokens" as const, label: "赠送字数" },
      { key: "dailyFreeQuota" as const, label: "每日免费额度" },
      { key: "dailyUsedQuota" as const, label: "已使用免费额度" },
      { key: "hasMembership" as const, label: "会员状态" },
      { key: "membershipExpires" as const, label: "会员到期时间" },
    ];

    exportToCSV(data, "用户字数管理", columns);
  };

  // 格式化字数
  const formatTokens = (tokens: number) => {
    if (tokens >= 100000000) {
      // 超过1亿，显示为"x.xx亿"
      return (tokens / 100000000).toFixed(2) + "亿";
    }
    return tokens.toLocaleString();
  };

  // 获取会员状态标签
  const getMembershipBadge = (membership?: UserTokenInfo["membership"]) => {
    if (!membership) {
      return (
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
          无会员
        </span>
      );
    }

    if (membership.isActive) {
      return (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-600 rounded-full">
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

  // 获取字数使用率
  const getUsageRate = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  // 打开详情模态框
  const handleOpenDetail = (userId: number, username: string) => {
    setDetailModal({ isOpen: true, userId, username });
  };

  // 打开充值模态框
  const handleOpenRecharge = (userId: number, username: string) => {
    setRechargeModal({ isOpen: true, userId, username });
  };

  // 关闭模态框
  const handleCloseModals = () => {
    setDetailModal({ isOpen: false, userId: null, username: "" });
    setRechargeModal({ isOpen: false, userId: null, username: "" });
  };

  // 充值成功回调
  const handleRechargeSuccess = () => {
    handleCloseModals();
    loadUsers();
  };

  // 监听分页变化
  useEffect(() => {
    loadUsers();
  }, [pagination.page]);

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
            字数管理
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            管理所有用户的字数余额和消耗情况
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
          <input
            type="number"
            placeholder="最小字数"
            value={filters.minTokens}
            onChange={(e) =>
              setFilters({ ...filters, minTokens: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="最大字数"
            value={filters.maxTokens}
            onChange={(e) =>
              setFilters({ ...filters, maxTokens: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filters.hasMembership}
            onChange={(e) =>
              setFilters({ ...filters, hasMembership: e.target.value })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部会员状态</option>
            <option value="true">有会员</option>
            <option value="false">无会员</option>
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
              <p className="text-sm font-medium text-gray-500">总字数余额</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTokens(
                  users.reduce(
                    (sum, user) => sum + Number(user.totalTokens || 0),
                    0
                  )
                )}
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">已使用字数</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTokens(
                  users.reduce(
                    (sum, user) => sum + Number(user.usedTokens || 0),
                    0
                  )
                )}
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
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">会员用户</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((user) => user.membership?.isActive).length}
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
                  字数余额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  使用情况
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  每日免费
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  会员状态
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
                    <div className="text-sm text-gray-900">
                      <div>总字数: {formatTokens(user.totalTokens)}</div>
                      <div className="text-gray-500">
                        赠送: {formatTokens(user.giftTokens)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>已使用: {formatTokens(user.usedTokens)}</div>
                      <div className="text-gray-500">
                        使用率:{" "}
                        {getUsageRate(user.usedTokens, user.totalTokens)}%
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>额度: {formatTokens(user.dailyFreeQuota)}</div>
                      <div className="text-gray-500">
                        已用: {formatTokens(user.dailyUsedQuota)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getMembershipBadge(user.membership)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleOpenDetail(user.id, user.username)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      详情
                    </button>
                    <button
                      onClick={() => handleOpenRecharge(user.id, user.username)}
                      className="text-green-600 hover:text-green-900"
                    >
                      充值
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {!loading && users.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                共 {pagination.total} 条记录，第 {pagination.page} /{" "}
                {pagination.totalPages} 页
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 用户详情模态框 */}
      {detailModal.isOpen && detailModal.userId && (
        <UserTokenDetailModal
          userId={detailModal.userId}
          username={detailModal.username}
          onClose={handleCloseModals}
        />
      )}

      {/* 充值模态框 */}
      {rechargeModal.isOpen && rechargeModal.userId && (
        <TokenRechargeModal
          userId={rechargeModal.userId}
          username={rechargeModal.username}
          onClose={handleCloseModals}
          onSuccess={handleRechargeSuccess}
        />
      )}
    </div>
  );
}
