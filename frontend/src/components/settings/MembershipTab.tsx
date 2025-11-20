import React, { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import {
  Crown,
  Calendar,
  Clock,
  Zap,
  Gift,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { membershipsApi } from "../../services/memberships.api";
import PurchaseModal from "../purchase/PurchaseModal";

interface UserMembership {
  id: number;
  planId: number;
  level: number;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  plan: {
    id: number;
    name: string;
    level: number;
    price: number;
    duration: number;
    outputFree: boolean;
    freeInputCharsPerRequest: number;
    description?: string;
  };
}

/**
 * 会员信息标签页
 */
const MembershipTab: React.FC = () => {
  const { error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  useEffect(() => {
    loadMembership();
  }, []);

  const loadMembership = async () => {
    try {
      setLoading(true);
      const data = await membershipsApi.getMyActiveMembership();
      setMembership(data);
    } catch (error: any) {
      // 没有会员时返回 null，不显示错误
      if (error.response?.status !== 404) {
        showError(error.response?.data?.message || "加载会员信息失败");
      }
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "永久";
    return new Date(date).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getMembershipLevelInfo = (level: number) => {
    const levels = [
      { level: 0, name: "普通用户", color: "gray", gradient: "from-gray-400 to-gray-600" },
      { level: 1, name: "铜牌会员", color: "orange", gradient: "from-orange-400 to-orange-600" },
      { level: 2, name: "银牌会员", color: "gray", gradient: "from-gray-300 to-gray-500" },
      { level: 3, name: "金牌会员", color: "yellow", gradient: "from-yellow-400 to-yellow-600" },
      { level: 4, name: "钻石会员", color: "blue", gradient: "from-blue-400 to-blue-600" },
    ];
    return levels.find((l) => l.level === level) || levels[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // 未开通会员
  if (!membership) {
    return (
      <>
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>
            <span>会员信息</span>
          </h3>

          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="w-10 h-10 text-gray-400" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">您还未开通会员</h4>
            <p className="text-gray-500 mb-6">
              开通会员后，可享受更多特权和优惠
            </p>
            <button
              onClick={() => setShowPurchaseModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              立即开通会员
            </button>
          </div>
        </div>

        {/* 购买中心模态框 - 默认打开会员标签 */}
        <PurchaseModal
          isOpen={showPurchaseModal}
          onClose={() => setShowPurchaseModal(false)}
          defaultTab="membership"
        />
      </>
    );
  }

  const levelInfo = getMembershipLevelInfo(membership.level);
  const daysRemaining = getDaysRemaining(membership.endDate);
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 7;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
        <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>
        <span>会员信息</span>
      </h3>

      {/* 会员状态卡片 */}
      <div className={`p-6 bg-gradient-to-br ${levelInfo.gradient} rounded-2xl shadow-lg`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-white">{membership.plan.name}</h4>
              <p className="text-white/80 text-sm">{levelInfo.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
            {membership.isActive ? (
              <>
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">已激活</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-white" />
                <span className="text-sm text-white font-medium">未激活</span>
              </>
            )}
          </div>
        </div>

        {/* 有效期信息 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">开通时间</span>
            </div>
            <div className="text-lg font-bold text-white">
              {formatDate(membership.startDate)}
            </div>
          </div>
          <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="w-4 h-4 text-white/80" />
              <span className="text-sm text-white/80">到期时间</span>
            </div>
            <div className="text-lg font-bold text-white">
              {formatDate(membership.endDate)}
            </div>
          </div>
        </div>

        {/* 剩余天数提示 */}
        {daysRemaining !== null && (
          <div className={`p-3 rounded-xl ${isExpiringSoon ? "bg-red-500/20" : "bg-white/10"} backdrop-blur-sm`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isExpiringSoon && <AlertCircle className="w-5 h-5 text-white" />}
                <span className="text-white font-medium">
                  {daysRemaining > 0
                    ? `剩余 ${daysRemaining} 天`
                    : daysRemaining === 0
                    ? "今天到期"
                    : "已过期"}
                </span>
              </div>
              {isExpiringSoon && (
                <button
                  onClick={() => setShowPurchaseModal(true)}
                  className="px-4 py-1.5 bg-white text-yellow-600 rounded-lg text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  立即续费
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 会员特权 */}
      <div>
        <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span>会员特权</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 输出免费 */}
          {membership.plan.outputFree && (
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 mb-1">输出免费</h5>
                  <p className="text-sm text-gray-600">
                    AI生成的输出内容完全免费，不消耗字数
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 免费输入额度 */}
          {membership.plan.freeInputCharsPerRequest > 0 && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h5 className="font-bold text-gray-900 mb-1">免费输入额度</h5>
                  <p className="text-sm text-gray-600">
                    每次请求前{" "}
                    <span className="font-bold text-blue-600">
                      {membership.plan.freeInputCharsPerRequest.toLocaleString()}
                    </span>{" "}
                    字输入免费
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 套餐描述 */}
        {membership.plan.description && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-700">{membership.plan.description}</p>
          </div>
        )}
      </div>

      {/* 购买中心模态框 - 默认打开会员标签 */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        defaultTab="membership"
      />
    </div>
  );
};

export default MembershipTab;
