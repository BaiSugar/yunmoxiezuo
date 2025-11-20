import { useState, useEffect } from "react";
import { getMembershipPlanList, activateMembership } from "../../api/memberships";
import { showToast } from "../common/ToastContainer";
import type { MembershipPlan } from "../../types/membership";

interface ActivateMembershipModalProps {
  userId: number;
  username: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ActivateMembershipModal({
  userId,
  username,
  onClose,
  onSuccess,
}: ActivateMembershipModalProps) {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    planId: 0,
    duration: 0, // 0表示使用套餐默认时长
  });

  const loadPlans = async () => {
    try {
      const response = await getMembershipPlanList({ isActive: true });
      setPlans(response.data || []);
      if (response.data && response.data.length > 0) {
        setFormData({ ...formData, planId: response.data[0].id });
      }
    } catch (error: any) {
      console.error("加载套餐列表失败:", error);
      showToast(error.message || "加载套餐列表失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.planId === 0) {
      showToast("请选择套餐", "error");
      return;
    }

    setSubmitting(true);
    try {
      await activateMembership(userId, {
        planId: formData.planId,
        duration: formData.duration > 0 ? formData.duration : undefined,
      });
      showToast(`为用户 ${username} 开通会员成功`, "success");
      onSuccess();
    } catch (error: any) {
      showToast(error.message || "开通失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const selectedPlan = plans.find((p) => p.id === formData.planId);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              开通会员 - {username}
            </h2>
            <button
              onClick={onClose}
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
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-gray-500">加载中...</div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  选择套餐 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.planId}
                  onChange={(e) =>
                    setFormData({ ...formData, planId: Number(e.target.value) })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={0}>请选择套餐</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ¥{plan.price} / {plan.duration}天
                    </option>
                  ))}
                </select>
              </div>

              {selectedPlan && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">套餐详情</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>• 等级: Level {selectedPlan.level}</p>
                    <p>• 类型: {selectedPlan.type}</p>
                    <p>
                      • 赠送字数: {selectedPlan.tokenQuota.toLocaleString()}
                    </p>
                    <p>• 有效期: {selectedPlan.duration} 天</p>
                    {selectedPlan.dailyTokenLimit > 0 && (
                      <p>
                        • 每日上限:{" "}
                        {selectedPlan.dailyTokenLimit.toLocaleString()}
                      </p>
                    )}
                    {selectedPlan.canUseAdvancedModels && (
                      <p>• 可使用高级模型</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  自定义时长（天）
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="0表示使用套餐默认时长"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0表示使用套餐默认时长，大于0则覆盖套餐时长
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting || formData.planId === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? "处理中..." : "确认开通"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
