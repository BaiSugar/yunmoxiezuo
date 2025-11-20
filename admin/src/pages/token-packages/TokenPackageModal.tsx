import { useState, useEffect } from "react";
import { createTokenPackage, updateTokenPackage } from "../../api/token-packages";
import type {
  TokenPackage,
  CreateTokenPackageDto,
} from "../../types/token-package";
import { showToast } from "../../components/common/ToastContainer";

interface TokenPackageModalProps {
  package: TokenPackage | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TokenPackageModal({
  package: pkg,
  onClose,
  onSuccess,
}: TokenPackageModalProps) {
  const isEdit = !!pkg;

  const [formData, setFormData] = useState<CreateTokenPackageDto>({
    name: "",
    tokenAmount: 500000,
    bonusTokens: 0,
    price: 0,
    validDays: 0,
    minMemberLevel: 0,
    discount: 1.0,
    sort: 0,
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name,
        tokenAmount: pkg.tokenAmount,
        bonusTokens: pkg.bonusTokens,
        price: pkg.price,
        validDays: pkg.validDays,
        minMemberLevel: pkg.minMemberLevel,
        discount: pkg.discount,
        sort: pkg.sort,
        description: pkg.description || "",
      });
    }
  }, [pkg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (isEdit) {
        await updateTokenPackage(pkg.id, formData);
        showToast("更新成功", "success");
      } else {
        await createTokenPackage(formData);
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
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? "编辑字数包" : "创建字数包"}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* 基础信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">基础信息</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    套餐名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：大包50万字"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    基础字数 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.tokenAmount}
                    onChange={(e) => setFormData({ ...formData, tokenAmount: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="500000"
                  />
                  <p className="text-xs text-gray-500 mt-1">购买后获得的字数</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    赠送字数
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bonusTokens}
                    onChange={(e) => setFormData({ ...formData, bonusTokens: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="50000"
                  />
                  <p className="text-xs text-gray-500 mt-1">额外赠送的字数</p>
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
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="49.90"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.sort}
                    onChange={(e) => setFormData({ ...formData, sort: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">数字越小越靠前</p>
                </div>
              </div>
            </div>

            {/* 限制条件 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">限制条件</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    有效期（天）
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.validDays}
                    onChange={(e) => setFormData({ ...formData, validDays: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">0表示永久有效</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    最低会员等级
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minMemberLevel}
                    onChange={(e) => setFormData({ ...formData, minMemberLevel: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">0表示无限制</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    折扣（0.1-1.0）
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="1.0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(formData.discount ?? 1) < 1 
                      ? `${((formData.discount ?? 1) * 10).toFixed(1)}折，实际价格 ¥${(formData.price * (formData.discount ?? 1)).toFixed(2)}`
                      : "原价"
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* 套餐描述 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                套餐描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="简要描述套餐特点和适用场景..."
              />
            </div>

            {/* 购买地址 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                购买地址
              </label>
              <input
                type="url"
                value={formData.purchaseUrl || ''}
                onChange={(e) => setFormData({ ...formData, purchaseUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/buy/package-1"
              />
              <p className="text-xs text-gray-500 mt-1">用户点击购买后跳转的地址</p>
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
              {submitting ? "保存中..." : isEdit ? "保存修改" : "创建字数包"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
