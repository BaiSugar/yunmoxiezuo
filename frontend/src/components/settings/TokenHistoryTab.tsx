import React, { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import {
  TrendingUp,
  Calendar,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Package,
  CreditCard,
  Gift,
  Ban,
  BarChart3,
} from "lucide-react";
import { getTransactions, getBalance } from "../../services/token-balances.api";
import type {
  TokenTransaction,
  TokenBalance,
  GetTransactionsParams,
} from "../../types/token-balance";
import { TransactionType } from "../../types/token-balance";

/**
 * 字数消耗历史 Tab
 * 展示字数流水记录（充值和消费）
 */
const TokenHistoryTab: React.FC = () => {
  const { error: showError } = useToast();

  // 数据状态
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // 筛选和分页
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // 加载余额信息
  const loadBalance = async () => {
    try {
      const data = await getBalance();
      setBalance(data);
    } catch (err: any) {
      console.error("加载余额失败:", err);
    }
  };

  // 加载流水记录
  const loadTransactions = async (page: number = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params: GetTransactionsParams = {
        page,
        limit,
      };

      if (filterType !== "all") {
        params.type = filterType;
      }

      const data = await getTransactions(params);
      setTransactions(data.data);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err: any) {
      showError(err.response?.data?.message || "加载流水记录失败");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadBalance();
    loadTransactions(1);
  }, [filterType]);

  // 处理分页
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || loadingMore) return;
    loadTransactions(page);
  };

  // 格式化时间
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 格式化数字
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // 获取类型标签
  const getTypeLabel = (type: TransactionType) => {
    const typeMap = {
      [TransactionType.RECHARGE]: {
        label: "充值",
        color: "green",
        icon: Package,
      },
      [TransactionType.CONSUME]: {
        label: "消费",
        color: "red",
        icon: CreditCard,
      },
      [TransactionType.GIFT]: { label: "赠送", color: "purple", icon: Gift },
      [TransactionType.REFUND]: {
        label: "退款",
        color: "blue",
        icon: TrendingUp,
      },
      [TransactionType.EXPIRE]: { label: "过期", color: "gray", icon: Ban },
    };
    return typeMap[type] || { label: type, color: "gray", icon: BarChart3 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 余额卡片 */}
      {balance && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 总余额 */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
            <div className="text-sm text-blue-600 mb-1">总余额</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatNumber(balance.totalTokens - balance.frozenTokens)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              已冻结 {formatNumber(balance.frozenTokens)} 字
            </div>
          </div>

          {/* 累计消耗 */}
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200/50">
            <div className="text-sm text-red-600 mb-1">累计消耗</div>
            <div className="text-2xl font-bold text-red-900">
              {formatNumber(balance.usedTokens)}
            </div>
            <div className="text-xs text-red-600 mt-1">
              历史总消耗字数
            </div>
          </div>

          {/* 今日免费额度 */}
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50">
            <div className="text-sm text-green-600 mb-1">今日免费额度</div>
            <div className="text-2xl font-bold text-green-900">
              {formatNumber(balance.dailyFreeQuota - balance.dailyUsedQuota)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              已用 {formatNumber(balance.dailyUsedQuota)} /{" "}
              {formatNumber(balance.dailyFreeQuota)}
            </div>
          </div>
        </div>
      )}

      {/* 筛选器 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Filter className="w-4 h-4" />
          <span>筛选：</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === "all"
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            全部
          </button>
          <button
            onClick={() => setFilterType(TransactionType.RECHARGE)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === TransactionType.RECHARGE
                ? "bg-green-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            充值
          </button>
          <button
            onClick={() => setFilterType(TransactionType.CONSUME)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === TransactionType.CONSUME
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            消费
          </button>
          <button
            onClick={() => setFilterType(TransactionType.GIFT)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterType === TransactionType.GIFT
                ? "bg-purple-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            赠送
          </button>
        </div>
      </div>

      {/* 流水记录列表 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <span className="w-1 h-6 bg-green-500 rounded-full"></span>
            <span>流水记录</span>
          </h3>
          <div className="text-sm text-gray-500">
            共 {formatNumber(total)} 条
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无流水记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => {
              const typeInfo = getTypeLabel(transaction.type);
              const Icon = typeInfo.icon;
              const isIncrease = transaction.amount > 0;

              return (
                <div
                  key={transaction.id}
                  className="p-4 bg-white/50 border border-gray-200/50 rounded-xl hover:bg-white transition-colors"
                >
                  <div className="flex items-start justify-between">
                    {/* 左侧：图标和信息 */}
                    <div className="flex items-start space-x-3 flex-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center bg-${typeInfo.color}-100`}
                      >
                        <Icon
                          className={`w-5 h-5 text-${typeInfo.color}-600`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {typeInfo.label}
                          </span>
                          {transaction.modelName && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                              {transaction.modelName}
                            </span>
                          )}
                        </div>
                        {transaction.remark && (
                          <div className="text-sm text-gray-600 mb-1">
                            {transaction.remark}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(transaction.createdAt)}</span>
                          </span>
                          <span>ID: {transaction.id}</span>
                          {transaction.relatedId && (
                            <span>关联ID: {transaction.relatedId}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 右侧：金额 */}
                    <div className="text-right ml-4 flex-shrink-0">
                      <div
                        className={`text-lg font-bold ${
                          isIncrease ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isIncrease ? "+" : ""}
                        {formatNumber(transaction.amount)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        余额: {formatNumber(transaction.balanceAfter)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
          <div className="text-sm text-gray-500">
            第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loadingMore}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loadingMore}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {loadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      )}
    </div>
  );
};

export default TokenHistoryTab;
