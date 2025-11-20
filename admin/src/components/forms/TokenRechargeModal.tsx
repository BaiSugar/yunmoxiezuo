import { useState } from "react";
import { rechargeTokens, setDailyQuota } from "../../api/token-balances";
import { showToast } from "../common/ToastContainer";

interface TokenRechargeModalProps {
  userId: number;
  username: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TokenRechargeModal({
  userId,
  username,
  onClose,
  onSuccess,
}: TokenRechargeModalProps) {
  const [activeTab, setActiveTab] = useState<"recharge" | "quota">("recharge");
  const [rechargeForm, setRechargeForm] = useState({
    amount: 100000,
    isGift: true,
    remark: "",
  });
  const [quotaForm, setQuotaForm] = useState({
    quota: 10000,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await rechargeTokens(userId, rechargeForm);
      showToast(`为用户 ${username} 充值成功`, "success");
      onSuccess();
    } catch (error: any) {
      showToast(error.message || "充值失败", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await setDailyQuota(userId, quotaForm.quota);
      showToast(`为用户 ${username} 设置每日免费额度成功`, "success");
      onSuccess();
    } catch (error: any) {
      showToast(error.message || "设置失败", "error");
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
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              字数管理 - {username}
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

        {/* 标签切换 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("recharge")}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === "recharge"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              充值字数
            </button>
            <button
              onClick={() => setActiveTab("quota")}
              className={`py-4 px-6 font-medium text-sm ${
                activeTab === "quota"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              设置免费额度
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "recharge" ? (
            <form onSubmit={handleRecharge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  充值金额（字数） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={rechargeForm.amount}
                  onChange={(e) =>
                    setRechargeForm({
                      ...rechargeForm,
                      amount: Number(e.target.value),
                    })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="100000"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rechargeForm.isGift}
                    onChange={(e) =>
                      setRechargeForm({
                        ...rechargeForm,
                        isGift: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    赠送（不扣费）
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  备注
                </label>
                <textarea
                  value={rechargeForm.remark}
                  onChange={(e) =>
                    setRechargeForm({ ...rechargeForm, remark: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="充值原因或备注"
                />
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
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? "处理中..." : "确认充值"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSetQuota} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  每日免费额度（字数） <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={quotaForm.quota}
                  onChange={(e) =>
                    setQuotaForm({ quota: Number(e.target.value) })
                  }
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="10000"
                />
                <p className="text-xs text-gray-500 mt-1">每日0点自动重置（默认 1万/天）</p>
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
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? "处理中..." : "确认设置"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
