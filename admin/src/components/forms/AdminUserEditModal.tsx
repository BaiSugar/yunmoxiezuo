import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, User as UserIcon, Coins, Crown, Ban, Shield } from "lucide-react";
import type { User } from "../../types/user";
import { getUserBalance } from "../../api/token-balances";
import { getUserActiveMembership } from "../../api/memberships";

interface AdminUserEditModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
}

interface UserBalance {
  totalTokens: number;
  frozenTokens: number;
  giftTokens: number;
  dailyFreeQuota: number;
}

interface UserMembership {
  id: number;
  planId: number;
  level: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  plan?: {
    id: number;
    name: string;
  };
}

/**
 * 超级管理员用户编辑模态框
 * 可以管理用户的字数、会员、状态等
 */
export function AdminUserEditModal({
  isOpen,
  user,
  onClose,
}: AdminUserEditModalProps) {
  const [activeTab, setActiveTab] = useState<
    "basic" | "balance" | "membership" | "status"
  >("basic");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [membership, setMembership] = useState<UserMembership | null>(null);

  // 加载用户余额和会员信息
  useEffect(() => {
    if (isOpen && user) {
      loadUserData();
    }
  }, [isOpen, user]);

  const loadUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 加载字数余额
      const balanceData = await getUserBalance(user.id);
      setBalance(balanceData);

      // 加载会员信息
      try {
        const membershipData = await getUserActiveMembership(user.id);
        setMembership(membershipData);
      } catch {
        setMembership(null);
      }
    } catch (error) {
      console.error("加载用户数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const tabs = [
    { key: "basic" as const, label: "基本信息", icon: UserIcon },
    { key: "balance" as const, label: "字数余额", icon: Coins },
    { key: "membership" as const, label: "会员管理", icon: Crown },
    { key: "status" as const, label: "状态管理", icon: Shield },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">管理用户</h2>
              <p className="text-sm text-gray-600 mt-1">
                编辑 <span className="font-medium">{user.username}</span>{" "}
                的详细信息
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-1 p-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-white text-blue-600 shadow-sm font-medium"
                      : "text-gray-600 hover:bg-white/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 内容区 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-240px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">加载中...</span>
            </div>
          ) : (
            <>
              {/* 基本信息 */}
              {activeTab === "basic" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        用户名
                      </label>
                      <div className="px-4 py-2.5 bg-gray-100 rounded-lg text-gray-900">
                        {user.username}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        邮箱
                      </label>
                      <div className="px-4 py-2.5 bg-gray-100 rounded-lg text-gray-900">
                        {user.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        昵称
                      </label>
                      <div className="px-4 py-2.5 bg-gray-100 rounded-lg text-gray-900">
                        {user.nickname || "-"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        用户ID
                      </label>
                      <div className="px-4 py-2.5 bg-gray-100 rounded-lg text-gray-900">
                        {user.id}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      个人简介
                    </label>
                    <div className="px-4 py-2.5 bg-gray-100 rounded-lg text-gray-900 min-h-[80px]">
                      {user.bio || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      注册时间
                    </label>
                    <div className="px-4 py-2.5 bg-gray-100 rounded-lg text-gray-900">
                      {new Date(user.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                </div>
              )}

              {/* 字数余额 */}
              {activeTab === "balance" && balance && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="text-sm text-gray-600 mb-1">总字数</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {balance.totalTokens.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl">
                      <div className="text-sm text-gray-600 mb-1">冻结字数</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {balance.frozenTokens.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl">
                      <div className="text-sm text-gray-600 mb-1">赠送字数</div>
                      <div className="text-2xl font-bold text-green-600">
                        {balance.giftTokens.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <div className="text-sm text-gray-600 mb-1">
                        每日免费额度
                      </div>
                      <div className="text-2xl font-bold text-orange-600">
                        {balance.dailyFreeQuota.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>提示：</strong>
                      字数充值和扣除功能请在"字数管理"模块中操作
                    </p>
                  </div>
                </div>
              )}

              {/* 会员管理 */}
              {activeTab === "membership" && (
                <div className="space-y-4">
                  {membership ? (
                    <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Crown className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-gray-900">
                            {membership.plan?.name || "会员"}
                          </div>
                          <div className="text-sm text-gray-600">
                            等级: {membership.level}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            生效时间
                          </div>
                          <div className="font-medium text-gray-900">
                            {new Date(membership.startDate).toLocaleString(
                              "zh-CN"
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600 mb-1">
                            过期时间
                          </div>
                          <div className="font-medium text-gray-900">
                            {new Date(membership.endDate).toLocaleString(
                              "zh-CN"
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            membership.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {membership.isActive ? "生效中" : "已失效"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <Crown className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>该用户暂无会员</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>提示：</strong>
                      会员开通和管理请在"会员管理"模块中操作
                    </p>
                  </div>
                </div>
              )}

              {/* 状态管理 */}
              {activeTab === "status" && (
                <div className="space-y-4">
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          账户状态
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          管理用户的账户状态和权限
                        </p>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full font-medium ${
                          user.status === "active"
                            ? "bg-green-100 text-green-800"
                            : user.status === "banned"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.status === "active"
                          ? "正常"
                          : user.status === "banned"
                          ? "已封禁"
                          : "未激活"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          邮箱验证
                        </label>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            user.emailVerified
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {user.emailVerified ? "已验证" : "未验证"}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          最后登录
                        </label>
                        <div className="px-4 py-2 bg-gray-100 rounded-lg text-gray-900">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleString("zh-CN")
                            : "从未登录"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-medium text-gray-900">
                        角色权限
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map((role) => (
                        <span
                          key={role.id}
                          className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-gray-900"
                        >
                          {role.name}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                      角色分配请使用"分配角色"功能
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Ban className="w-5 h-5 text-red-600" />
                      <h4 className="font-medium text-red-900">危险操作</h4>
                    </div>
                    <p className="text-sm text-gray-700">
                      封禁和解封用户请使用用户列表中的操作按钮
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 底部 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
