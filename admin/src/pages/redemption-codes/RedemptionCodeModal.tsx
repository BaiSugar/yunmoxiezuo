import { useState, useEffect } from "react";
import {
  createRedemptionCode,
  updateRedemptionCode,
} from "../../api/redemption-codes";
import { getMembershipPlanList } from "../../api/memberships";
import type {
  RedemptionCode,
  CreateRedemptionCodeDto,
} from "../../types/redemption-code";
import { CodeType } from "../../types/redemption-code";
import type { MembershipPlan } from "../../types/membership";
import { showToast } from "../../components/common/ToastContainer";

interface RedemptionCodeModalProps {
  code: RedemptionCode | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RedemptionCodeModal({
  code,
  onClose,
  onSuccess,
}: RedemptionCodeModalProps) {
  const isEdit = !!code;

  const [formData, setFormData] = useState<CreateRedemptionCodeDto>({
    type: CodeType.TOKEN,
    tokenAmount: 100000,
    maxUseCount: 1,
  });

  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // 加载会员套餐列表
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await getMembershipPlanList({ isActive: true });
        setMembershipPlans(response.data || []);
      } catch (error: any) {
        console.error("加载会员套餐失败:", error);
        showToast("加载会员套餐失败", "error");
      }
    };
    loadPlans();
  }, []);

  useEffect(() => {
    if (code) {
      setFormData({
        type: code.type,
        membershipPlanId: code.membershipPlanId || undefined,
        tokenAmount: code.tokenAmount,
        batchId: code.batchId || undefined,
        maxUseCount: code.maxUseCount,
        validFrom: code.validFrom
          ? new Date(code.validFrom).toISOString().slice(0, 16)
          : undefined,
        validTo: code.validTo
          ? new Date(code.validTo).toISOString().slice(0, 16)
          : undefined,
        remark: code.remark || undefined,
      });
    }
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 验证表单
      if (
        formData.type === CodeType.MEMBERSHIP ||
        formData.type === CodeType.MIXED
      ) {
        if (!formData.membershipPlanId) {
          showToast("请选择会员套餐", "error");
          setSubmitting(false);
          return;
        }
      }

      if (
        formData.type === CodeType.TOKEN ||
        formData.type === CodeType.MIXED
      ) {
        if (!formData.tokenAmount || formData.tokenAmount <= 0) {
          showToast("请输入有效的字数", "error");
          setSubmitting(false);
          return;
        }
      }

      if (isEdit) {
        await updateRedemptionCode(code.id, formData);
        showToast("更新成功", "success");
      } else {
        await createRedemptionCode(formData);
        showToast("创建成功", "success");
      }
      onSuccess();
    } catch (error: any) {
      showToast(error.message || (isEdit ? "更新失败" : "创建失败"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? "编辑卡密" : "创建卡密"}
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {/* 卡密类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                卡密类型 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value as CodeType })
                }
                required
                disabled={isEdit}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value={CodeType.MEMBERSHIP}>会员卡密</option>
                <option value={CodeType.TOKEN}>字数卡密</option>
                <option value={CodeType.MIXED}>混合卡密（会员+字数）</option>
              </select>
              {isEdit && (
                <p className="text-xs text-gray-500 mt-1">
                  卡密类型创建后不可修改
                </p>
              )}
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                <p className="font-medium mb-1">📝 说明：</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    <strong>会员卡密</strong>：仅兑换会员权益，需选择会员套餐
                  </li>
                  <li>
                    <strong>字数卡密</strong>：仅兑换字数余额，需设置字数
                  </li>
                  <li>
                    <strong>混合卡密</strong>：同时兑换会员和字数，最常用
                  </li>
                </ul>
              </div>
            </div>

            {/* 会员套餐 */}
            {(formData.type === CodeType.MEMBERSHIP ||
              formData.type === CodeType.MIXED) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  会员套餐 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.membershipPlanId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      membershipPlanId: Number(e.target.value),
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择会员套餐</option>
                  {membershipPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} (等级{plan.level})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 字数 */}
            {(formData.type === CodeType.TOKEN ||
              formData.type === CodeType.MIXED) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  赠送字数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.tokenAmount || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tokenAmount: Number(e.target.value),
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="100000"
                />
              </div>
            )}

            {/* 使用次数 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大使用次数 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.maxUseCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxUseCount: Number(e.target.value),
                  })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <p className="font-medium mb-1">⚠️ 重要规则：</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>
                    <strong>值为 1</strong>：一次性卡密，只能被1个用户使用
                  </li>
                  <li>
                    <strong>值为 N</strong>：限量卡密，最多被N个用户使用
                  </li>
                  <li>
                    <strong>值为 -1</strong>：无限使用，不限制用户总数
                  </li>
                  <li className="text-red-600 font-medium">
                    ⚠️
                    每个账号在任何情况下都只能使用一次同一卡密，无论maxUseCount是多少
                  </li>
                </ul>
              </div>
            </div>

            {/* 有效期 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  生效时间
                </label>
                <input
                  type="datetime-local"
                  value={formData.validFrom || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validFrom: e.target.value || undefined,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">留空=立即生效</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  过期时间
                </label>
                <input
                  type="datetime-local"
                  value={formData.validTo || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      validTo: e.target.value || undefined,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">留空=永久有效</p>
              </div>
            </div>

            {/* 批次号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                批次号
              </label>
              <input
                type="text"
                value={formData.batchId || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    batchId: e.target.value || undefined,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="用于分组管理"
              />
            </div>

            {/* 备注 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注
              </label>
              <textarea
                value={formData.remark || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    remark: e.target.value || undefined,
                  })
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="可选的备注信息...建议填写如：双十一活动、新用户注册礼包、限量推广100份"
              />
            </div>
          </div>

          <div className="flex gap-3 p-6 pt-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "保存中..." : isEdit ? "保存修改" : "创建卡密"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
