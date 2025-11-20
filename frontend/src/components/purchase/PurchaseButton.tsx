import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, Gift, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import PurchaseModal from './PurchaseModal';
import { redemptionCodesApi } from '../../services/redemption-codes.api';

/**
 * 购买按钮组件 - 显示在顶部导航栏
 */
export default function PurchaseButton() {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);

  // 处理兑换
  const handleRedeem = async () => {
    if (!redeemCode.trim()) {
      toast.error('请输入兑换码');
      return;
    }

    setIsRedeeming(true);
    try {
      const result = await redemptionCodesApi.redeem(redeemCode.trim());
      toast.success(result.message || '兑换成功！');
      setRedeemCode('');
      setIsRedeemModalOpen(false);
      // 刷新页面以更新余额和会员状态
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || '兑换失败');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative p-2 rounded-xl hover:bg-white/50 transition-colors group"
        title="购买中心"
      >
        <ShoppingCart className="w-5 h-5 text-gray-700 group-hover:text-blue-600 transition-colors" />
      </button>

      <PurchaseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onOpenRedeem={() => setIsRedeemModalOpen(true)}
      />

      {/* 兑换码模态框 */}
      {isRedeemModalOpen && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={() => setIsRedeemModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">兑换码</h3>
              </div>
              <button
                onClick={() => setIsRedeemModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

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
                if (e.key === 'Enter' && !isRedeeming && redeemCode.trim()) {
                  handleRedeem();
                }
              }}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setIsRedeemModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRedeem}
                disabled={isRedeeming || !redeemCode.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRedeeming ? '兑换中...' : '确认兑换'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
