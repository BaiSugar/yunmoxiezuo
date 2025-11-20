import { useState, useEffect } from "react";
import { batchGenerateCodes } from "../../api/redemption-codes";
import { getMembershipPlanList } from "../../api/memberships";
import type { BatchGenerateCodesDto } from "../../types/redemption-code";
import { CodeType } from "../../types/redemption-code";
import type { MembershipPlan } from "../../types/membership";
import { showToast } from "../../components/common/ToastContainer";

interface BatchGenerateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BatchGenerateModal({
  onClose,
  onSuccess,
}: BatchGenerateModalProps) {
  const [formData, setFormData] = useState<BatchGenerateCodesDto>({
    type: CodeType.TOKEN,
    tokenAmount: 100000,
    count: 10,
    maxUseCount: 1,
    batchId: `BATCH-${Date.now()}`,
  });

  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  // 加载会员套餐列表
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await getMembershipPlanList({ isActive: true });
        setMembershipPlans(response.data || []);
      } catch (error) {
        console.error("加载会员套餐失败:", error);
      }
    };
    loadPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 验证表单
      if (formData.type === CodeType.MEMBERSHIP || formData.type === CodeType.MIXED) {
        if (!formData.membershipPlanId) {
          showToast("请选择会员套餐", "error");
          setSubmitting(false);
          return;
        }
      }

      if (formData.type === CodeType.TOKEN || formData.type === CodeType.MIXED) {
        if (!formData.tokenAmount || formData.tokenAmount <= 0) {
          showToast("请输入有效的字数", "error");
          setSubmitting(false);
          return;
        }
      }

      if (formData.count <= 0 || formData.count > 1000) {
        showToast("生成数量必须在1-1000之间", "error");
        setSubmitting(false);
        return;
      }

      const codes = await batchGenerateCodes(formData);
      setGeneratedCodes(codes.map(c => c.code));
      showToast(`成功生成${codes.length}个卡密`, "success");
    } catch (error: any) {
      showToast(error.message || "生成失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyAll = () => {
    const text = generatedCodes.join("\n");
    navigator.clipboard.writeText(text);
    showToast("已复制所有卡密到剪贴板", "success");
  };

  const handleExport = () => {
    const text = generatedCodes.join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codes-${formData.batchId || Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("已导出卡密文件", "success");
  };

  const handleClose = () => {
    if (generatedCodes.length > 0) {
      onSuccess();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">批量生成卡密</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {generatedCodes.length === 0 ? (
            // 生成表单
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 卡密类型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  卡密类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as CodeType })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value={CodeType.MEMBERSHIP}>会员卡密</option>
                  <option value={CodeType.TOKEN}>字数卡密</option>
                  <option value={CodeType.MIXED}>混合卡密（会员+字数）</option>
                </select>
              </div>

              {/* 会员套餐 */}
              {(formData.type === CodeType.MEMBERSHIP || formData.type === CodeType.MIXED) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    会员套餐 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.membershipPlanId || ""}
                    onChange={(e) => setFormData({ ...formData, membershipPlanId: Number(e.target.value) })}
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
              {(formData.type === CodeType.TOKEN || formData.type === CodeType.MIXED) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    赠送字数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.tokenAmount || 0}
                    onChange={(e) => setFormData({ ...formData, tokenAmount: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="100000"
                  />
                </div>
              )}

              {/* 生成数量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  生成数量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={formData.count}
                  onChange={(e) => setFormData({ ...formData, count: Number(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">最多生成1000个</p>
              </div>

              {/* 使用次数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  最大使用次数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.maxUseCount}
                  onChange={(e) => setFormData({ ...formData, maxUseCount: Number(e.target.value) })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">1=一次性，-1=无限次</p>
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
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    过期时间
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.validTo || ""}
                    onChange={(e) => setFormData({ ...formData, validTo: e.target.value || undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 批次号 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  批次号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.batchId || ""}
                  onChange={(e) => setFormData({ ...formData, batchId: e.target.value || undefined })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="用于批量管理"
                />
              </div>

              {/* 备注 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={formData.remark || ""}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value || undefined })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="可选的备注信息..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t">
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? "生成中..." : "开始生成"}
                </button>
              </div>
            </form>
          ) : (
            // 生成结果
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">成功生成 {generatedCodes.length} 个卡密</span>
                </div>
                <p className="text-sm text-green-700">
                  批次号: {formData.batchId}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyAll}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  📋 复制全部
                </button>
                <button
                  onClick={handleExport}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  💾 导出文件
                </button>
              </div>

              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                <div className="font-mono text-sm space-y-1">
                  {generatedCodes.map((code, index) => (
                    <div key={index} className="py-1 hover:bg-gray-100 px-2 rounded">
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  完成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
