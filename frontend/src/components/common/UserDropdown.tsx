import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Coins,
  Crown,
  Gift,
} from "lucide-react";
import UserSettingsModal from "../settings/UserSettingsModal";
import { tokenBalancesApi } from "../../services/token-balances.api";
import { membershipsApi } from "../../services/memberships.api";
import { redemptionCodesApi } from "../../services/redemption-codes.api";

interface UserDropdownProps {
  className?: string;
}

/**
 * 用户下拉菜单组件
 * 显示用户头像和下拉菜单
 */
const UserDropdown: React.FC<UserDropdownProps> = ({ className = "" }) => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [dailyQuota, setDailyQuota] = useState<any>(null);
  const [membership, setMembership] = useState<any>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Email脱敏处理
  const maskEmail = (email?: string): string => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!domain) return email;

    // 保留前2个字符，其余用***代替
    if (localPart.length <= 2) {
      return `${localPart}***@${domain}`;
    }
    const maskedLocal = localPart.substring(0, 2) + "***";
    return `${maskedLocal}@${domain}`;
  };

  // 获取字数包余额和每日免费额度
  useEffect(() => {
    const fetchBalance = async () => {
      if (user) {
        try {
          const data = await tokenBalancesApi.getBalance();
          setBalance((data.totalTokens || 0) - (data.frozenTokens || 0));

          // 获取每日免费额度
          const quotaData = await tokenBalancesApi.getDailyQuota();
          setDailyQuota(quotaData);
        } catch (error) {
          console.error("获取余额失败:", error);
        }
      }
    };
    fetchBalance();
  }, [user]);

  // 获取会员信息
  useEffect(() => {
    const fetchMembership = async () => {
      if (user) {
        try {
          const data = await membershipsApi.getMyActiveMembership();
          setMembership(data);
        } catch (error) {
          // 没有会员时会返回错误，这是正常的
          setMembership(null);
        }
      }
    };
    fetchMembership();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ESC键关闭兑换码模态框
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isRedeemModalOpen) {
        handleCloseRedeemModal();
      }
    };

    if (isRedeemModalOpen) {
      document.addEventListener("keydown", handleEsc);
      // 防止背景滚动
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isRedeemModalOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error("登出失败:", error);
    }
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
    setIsOpen(false);
  };

  const handleRedeemClick = () => {
    setIsRedeemModalOpen(true);
    setIsOpen(false);
  };

  const handleCloseRedeemModal = () => {
    setIsRedeemModalOpen(false);
    setRedeemCode("");
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error("请输入兑换码");
      return;
    }

    setIsRedeeming(true);
    try {
      const result = await redemptionCodesApi.redeem(redeemCode.trim());
      toast.success(result.message || "兑换成功！");
      setRedeemCode("");
      setIsRedeemModalOpen(false);

      // 刷新余额、每日免费额度和会员信息
      const balanceData = await tokenBalancesApi.getBalance();
      setBalance(
        (balanceData.totalTokens || 0) - (balanceData.frozenTokens || 0)
      );

      const quotaData = await tokenBalancesApi.getDailyQuota();
      setDailyQuota(quotaData);

      try {
        const membershipData = await membershipsApi.getMyActiveMembership();
        setMembership(membershipData);
      } catch (error) {
        setMembership(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "兑换失败");
    } finally {
      setIsRedeeming(false);
    }
  };

  // 格式化字数 - 显示具体数字
  const formatBalance = (num: number): string => {
    return num.toLocaleString();
  };

  // 计算会员剩余天数
  const getMembershipDaysLeft = (): number | null => {
    if (!membership?.endDate) return null;
    const now = new Date();
    const endDate = new Date(membership.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <>
      <div className={`relative ${className}`} ref={dropdownRef}>
        {/* 用户头像按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-medium text-gray-900">
              {user?.nickname || user?.username}
            </div>
            <div className="text-xs text-gray-500">
              {maskEmail(user?.email)}
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* 下拉菜单 */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-50">
            {/* 用户信息 */}
            <div className="px-4 py-3 border-b border-gray-200/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">
                    {user?.nickname || user?.username}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {maskEmail(user?.email)}
                  </div>
                  {user?.id && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      ID: {user.id}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 会员信息 */}
            {membership && (
              <div className="px-4 py-3 border-b border-gray-200/50">
                <div className="flex items-center space-x-2 mb-1">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {membership.plan?.name || "会员"}
                  </span>
                </div>
                {getMembershipDaysLeft() !== null && (
                  <div className="text-xs text-gray-500">
                    剩余 {getMembershipDaysLeft()} 天
                  </div>
                )}
              </div>
            )}

            {/* 字数包余额和每日免费额度 */}
            <div className="px-4 py-3 border-b border-gray-200/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Coins className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-gray-700">字数余额</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {formatBalance(balance)} 字
                </span>
              </div>

              {/* 每日免费额度 */}
              {dailyQuota && dailyQuota.dailyFreeQuota > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200/50">
                  <span className="text-xs text-gray-600">每日免费</span>
                  <span className="text-xs font-medium text-green-600">
                    剩余 {formatBalance(dailyQuota.dailyRemainingQuota)} /{" "}
                    {formatBalance(dailyQuota.dailyFreeQuota)} 字
                  </span>
                </div>
              )}
            </div>

            {/* 菜单项 */}
            <div className="py-2">
              <button
                onClick={handleRedeemClick}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50 transition-colors"
              >
                <Gift className="w-4 h-4" />
                <span>兑换码</span>
              </button>

              <button
                onClick={handleSettings}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100/50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>个人设置</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>退出登录</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 个人设置模态框 */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 兑换码模态框 - 使用 Portal 渲染到 body */}
      {isRedeemModalOpen &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
            onClick={handleCloseRedeemModal}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={handleCloseRedeemModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isRedeeming}
              >
                <svg
                  className="w-5 h-5"
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

              <h3 className="text-xl font-bold text-gray-900 mb-4">兑换码</h3>
              <p className="text-sm text-gray-600 mb-4">
                请输入您的兑换码，可兑换会员或字数包
              </p>
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="输入兑换码（如：ABCD-1234-EFGH-5678）"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                disabled={isRedeeming}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isRedeeming) {
                    handleRedeem();
                  }
                }}
              />
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseRedeemModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={isRedeeming}
                >
                  取消
                </button>
                <button
                  onClick={handleRedeem}
                  disabled={isRedeeming || !redeemCode.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRedeeming ? "兑换中..." : "确认兑换"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default UserDropdown;
