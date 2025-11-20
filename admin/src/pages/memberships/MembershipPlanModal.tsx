import { useState, useEffect } from "react";
import {
  createMembershipPlan,
  updateMembershipPlan,
} from "../../api/memberships";
import type {
  MembershipPlan,
  CreateMembershipPlanDto,
} from "../../types/membership";
import { showToast } from "../../components/common/ToastContainer";

interface MembershipPlanModalProps {
  plan: MembershipPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MembershipPlanModal({
  plan,
  onClose,
  onSuccess,
}: MembershipPlanModalProps) {
  const isEdit = !!plan;

  const [formData, setFormData] = useState<CreateMembershipPlanDto>({
    name: "",
    type: "basic",
    level: 1,
    price: 0,
    duration: 30,
    tokenQuota: 1000000,
    dailyTokenLimit: 0,
    maxConcurrentChats: 3,
    canUseAdvancedModels: false,
    priority: 5,
    features: {},
    sort: 0,
    description: "",
    purchaseUrl: "",
    freeInputCharsPerRequest: 0,
    outputFree: false,
  });

  // features 的 JSON 字符串表示（用于编辑）
  const [featuresJson, setFeaturesJson] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (plan) {
      const features = plan.features || {};
      setFormData({
        name: plan.name,
        type: plan.type || "basic",
        level: plan.level,
        price: plan.price,
        duration: plan.duration,
        tokenQuota: plan.tokenQuota,
        dailyTokenLimit: plan.dailyTokenLimit,
        maxConcurrentChats: plan.maxConcurrentChats,
        canUseAdvancedModels: plan.canUseAdvancedModels,
        priority: plan.priority,
        features,
        sort: plan.sort,
        description: plan.description || "",
        purchaseUrl: plan.purchaseUrl || "",
        freeInputCharsPerRequest: plan.freeInputCharsPerRequest || 0,
        outputFree: plan.outputFree || false,
      });
      // 将 features 对象转为 JSON 字符串显示
      setFeaturesJson(Object.keys(features).length > 0 ? JSON.stringify(features, null, 2) : "");
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 清理数据：移除空字符串的可选字段，确保数字类型正确
      const cleanData: any = {
        name: formData.name,
        type: formData.type || 'basic',
        level: Number(formData.level),
        price: Number(formData.price),
        duration: Number(formData.duration),
        tokenQuota: Number(formData.tokenQuota),
      };

      // 可选字段：只在有值时添加（0 也是有效值）
      if (formData.dailyTokenLimit !== undefined) {
        cleanData.dailyTokenLimit = Number(formData.dailyTokenLimit);
      }
      if (formData.maxConcurrentChats !== undefined) {
        cleanData.maxConcurrentChats = Number(formData.maxConcurrentChats);
      }
      if (formData.canUseAdvancedModels !== undefined) {
        cleanData.canUseAdvancedModels = formData.canUseAdvancedModels;
      }
      if (formData.priority !== undefined) {
        cleanData.priority = Number(formData.priority);
      }
      // 解析 features JSON
      if (featuresJson && featuresJson.trim()) {
        try {
          cleanData.features = JSON.parse(featuresJson);
        } catch (e) {
          showToast("其他权益 JSON 格式错误", "error");
          setSubmitting(false);
          return;
        }
      }
      if (formData.sort !== undefined) {
        cleanData.sort = Number(formData.sort);
      }
      if (formData.description && formData.description.trim()) {
        cleanData.description = formData.description.trim();
      }
      if (formData.purchaseUrl && formData.purchaseUrl.trim()) {
        cleanData.purchaseUrl = formData.purchaseUrl.trim();
      }
      if (formData.freeInputCharsPerRequest !== undefined) {
        cleanData.freeInputCharsPerRequest = Number(formData.freeInputCharsPerRequest);
      }
      if (formData.outputFree !== undefined) {
        cleanData.outputFree = formData.outputFree;
      }

      if (isEdit) {
        await updateMembershipPlan(plan.id, cleanData);
        showToast("更新成功", "success");
      } else {
        await createMembershipPlan(cleanData);
        showToast("创建成功", "success");
      }
      onSuccess();
    } catch (error: any) {
      console.error('Submit error:', error);
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
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? "编辑套餐" : "创建套餐"}
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

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="space-y-6">
            {/* 基础信息 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500 bg-blue-50 px-3 py-2 rounded-t-lg">
                📋 基础信息
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    套餐名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：专业版"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    套餐类型 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：basic, premium, vip"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    自定义套餐标识，如：basic, vip1, diamond
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会员等级 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: Number(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">数字越大等级越高</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sort}
                    onChange={(e) =>
                      setFormData({ ...formData, sort: Number(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">数字越小越靠前</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    价格（元） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="99.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    有效期（天） <span className="text-red-500">*</span>
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
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">0表示永久有效</p>
                </div>
              </div>
            </div>

            {/* 字数配额 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-green-500 bg-green-50 px-3 py-2 rounded-t-lg">
                💰 字数配额
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    总字数配额 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.tokenQuota}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tokenQuota: Number(e.target.value),
                      })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="1000000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    赠送的总字数（tokens）
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    每日字数上限
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.dailyTokenLimit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dailyTokenLimit: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                  />
                  <p className="text-xs text-gray-500 mt-1">0表示无限制</p>
                </div>
              </div>
            </div>

            {/* 会员特权（字数优惠） */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-purple-500 bg-purple-50 px-3 py-2 rounded-t-lg">
                ⭐ 会员特权
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    每次请求免费输入字符数
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.freeInputCharsPerRequest}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        freeInputCharsPerRequest: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    会员每次请求免费的输入字符数，0表示无优惠
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.outputFree}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          outputFree: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      输出完全免费（勾选后输出不消耗字数）
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    高级会员特权：生成的内容不消耗字数额度
                  </p>
                </div>
              </div>
            </div>

            {/* 功能权益 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-orange-500 bg-orange-50 px-3 py-2 rounded-t-lg">
                🎯 功能权益
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最大并发对话数
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxConcurrentChats}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxConcurrentChats: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    同时进行的对话数量
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    队列优先级（1-10）
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    数字越大优先级越高
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.canUseAdvancedModels}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          canUseAdvancedModels: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      允许使用高级模型
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 其他信息 */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2 border-gray-500 bg-gray-50 px-3 py-2 rounded-t-lg">
                📝 其他信息
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    套餐描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="简要描述套餐特点和适用人群..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    购买地址
                  </label>
                  <input
                    type="url"
                    value={formData.purchaseUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, purchaseUrl: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/buy/plan-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    用户点击购买后跳转的地址
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    其他权益（JSON 格式）
                  </label>
                  <textarea
                    value={featuresJson}
                    onChange={(e) => setFeaturesJson(e.target.value)}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder='{\n  "apiAccess": true,\n  "customService": true,\n  "prioritySupport": true\n}'
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    自定义权益字段，必须是有效的 JSON 格式
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
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
              {submitting ? "保存中..." : isEdit ? "保存修改" : "创建套餐"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
