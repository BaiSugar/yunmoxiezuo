import { useState, useEffect } from "react";
import { getUserBalance } from "../../api/token-balances";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { ErrorState } from "../common/ErrorState";

interface UserTokenDetailModalProps {
  userId: number;
  username: string;
  onClose: () => void;
}

export default function UserTokenDetailModal({
  userId,
  username,
  onClose,
}: UserTokenDetailModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<any>(null);

  const loadBalance = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserBalance(userId);
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalance();
  }, [userId]);

  const formatTokens = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              字数详情 - {username}
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

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {loading ? (
            <div className="py-12">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <ErrorState message={error} onRetry={loadBalance} />
          ) : balance ? (
            <div className="space-y-6">
              {/* 余额总览 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  余额总览
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">总字数</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatTokens(balance.totalTokens)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">可用字数</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatTokens(balance.totalTokens - balance.frozenTokens)}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">已使用</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {formatTokens(balance.usedTokens)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">冻结字数</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {formatTokens(balance.frozenTokens)}
                    </p>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">赠送字数</p>
                    <p className="text-2xl font-bold text-pink-600">
                      {formatTokens(balance.giftTokens)}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">购买字数</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {formatTokens(balance.purchasedTokens || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 每日免费额度 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  每日免费额度
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">额度上限</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatTokens(balance.dailyFreeQuota || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">已使用</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatTokens(balance.dailyUsedQuota || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">剩余</span>
                    <span className="text-lg font-semibold text-green-600">
                      {formatTokens(
                        Math.max(
                          0,
                          (balance.dailyFreeQuota || 0) -
                            (balance.dailyUsedQuota || 0)
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 使用率 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  使用率
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">整体使用率</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {balance.totalTokens > 0
                        ? Math.round(
                            (balance.usedTokens / balance.totalTokens) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          balance.totalTokens > 0
                            ? Math.min(
                                100,
                                (balance.usedTokens / balance.totalTokens) * 100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
