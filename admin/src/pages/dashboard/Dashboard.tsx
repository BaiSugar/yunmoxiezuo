import { useState, useEffect } from "react";
import { useAppSelector } from "../../store/hooks";
import { Link } from "react-router-dom";
import { getUserRoleName } from "../../utils/user";
import { getTokenStatistics } from "../../api/admin-token-balances";
import { getMembershipStatistics } from "../../api/admin-memberships";
import UserGrowthChart from "../../components/charts/UserGrowthChart";
import MembershipDistributionChart from "../../components/charts/MembershipDistributionChart";
import TokenUsageChart from "../../components/charts/TokenUsageChart";

export default function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const [tokenStats, setTokenStats] = useState<any>(null);
  const [membershipStats, setMembershipStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 加载统计数据
  const loadStatistics = async () => {
    setLoading(true);
    try {
      const [tokenData, membershipData] = await Promise.all([
        getTokenStatistics().catch(() => null),
        getMembershipStatistics().catch(() => null),
      ]);
      setTokenStats(tokenData);
      setMembershipStats(membershipData);
    } catch (error) {
      console.error("加载统计数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  // 格式化数字
  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(2) + "亿";
    }
    return num.toLocaleString();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 欢迎卡片 - 毛玻璃效果 */}
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white mb-4 sm:mb-6 shadow-2xl shadow-blue-500/30 relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>

        <div className="relative flex flex-col sm:flex-row items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
              欢迎回来，{user?.nickname || user?.username}！👋
            </h1>
            <p className="text-blue-50 text-xs sm:text-sm lg:text-base">
              今天是{" "}
              {new Date().toLocaleDateString("zh-CN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex-shrink-0">
            <img
              src={
                user?.avatar ||
                "https://ui-avatars.com/api/?name=" +
                  (user?.nickname || user?.username || "U") +
                  "&size=128"
              }
              alt="avatar"
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full ring-4 ring-white/30 shadow-xl"
            />
          </div>
        </div>
      </div>

      {/* 统计数据卡片 - 毛玻璃效果 */}
      {!loading && (tokenStats || membershipStats) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          {/* 总用户数 */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">
                  总用户数
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {tokenStats?.totalUsers || 0}
                </p>
              </div>
            </div>
          </div>

          {/* 总字数余额 */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">
                  总字数余额
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatNumber(tokenStats?.totalTokens || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* 已使用字数 */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">
                  已使用字数
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {formatNumber(tokenStats?.totalUsedTokens || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* 会员用户 */}
          <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">
                  活跃会员
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {membershipStats?.activeMembers || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 快捷导航 - 毛玻璃效果 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Link
          to="/users"
          className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
        >
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
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
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 truncate">
                用户管理
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">
                管理系统用户
              </p>
            </div>
          </div>
        </Link>

        {/* 统一样式的快捷导航卡片 */}
        {[
          {
            to: "/token-management",
            gradient: "from-green-400 to-green-600",
            title: "字数管理",
            desc: "管理用户字数",
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
          },
          {
            to: "/membership-management",
            gradient: "from-purple-400 to-purple-600",
            title: "会员管理",
            desc: "管理用户会员",
            icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
          },
          {
            to: "/roles",
            gradient: "from-orange-400 to-orange-600",
            title: "角色管理",
            desc: "管理用户角色",
            icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
          },
          {
            to: "/permissions",
            gradient: "from-pink-400 to-pink-600",
            title: "权限管理",
            desc: "管理系统权限",
            icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
          },
          {
            to: "/ai-models",
            gradient: "from-indigo-400 to-indigo-600",
            title: "AI模型",
            desc: "管理AI模型",
            icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
          },
          {
            to: "/announcements",
            gradient: "from-red-400 to-red-600",
            title: "公告管理",
            desc: "发布系统公告",
            icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
          },
          {
            to: "/redemption-codes",
            gradient: "from-teal-400 to-teal-600",
            title: "卡密管理",
            desc: "管理兑换码",
            icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
          },
        ].map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div
                className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={card.icon}
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-0.5 truncate">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {card.desc}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 图表统计 */}
      {!loading && (tokenStats || membershipStats) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* 字数使用图 */}
          {tokenStats && (
            <TokenUsageChart
              totalTokens={tokenStats.totalTokens || 0}
              usedTokens={tokenStats.totalUsedTokens || 0}
            />
          )}

          {/* 会员分布图 */}
          {membershipStats && (
            <MembershipDistributionChart
              data={membershipStats.planDistribution}
            />
          )}
        </div>
      )}

      {/* 用户增长趋势 */}
      <div className="mb-6">
        <UserGrowthChart />
      </div>

      {/* 系统信息 - 毛玻璃效果 */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
          系统信息
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl border border-blue-100/50">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">当前用户</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {user?.username}
            </p>
          </div>
          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl border border-purple-100/50">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">用户角色</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
              {getUserRoleName(user)}
            </p>
          </div>
          <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl border border-green-100/50">
            <p className="text-xs sm:text-sm text-gray-500 mb-1">账号状态</p>
            <p className="text-base sm:text-lg font-semibold text-green-600">
              正常
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
