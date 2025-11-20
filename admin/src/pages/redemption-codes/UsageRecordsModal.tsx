import { useState, useEffect } from "react";
import { X, User, Calendar, Package, CreditCard } from "lucide-react";
import { getCodeUsageRecords } from "../../api/redemption-codes";
import type { RedemptionRecord } from "../../types/redemption-code";

interface UsageRecordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeId: number;
  codeStr: string;
}

/**
 * 卡密使用记录模态框
 */
export default function UsageRecordsModal({
  isOpen,
  onClose,
  codeId,
  codeStr,
}: UsageRecordsModalProps) {
  const [records, setRecords] = useState<RedemptionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadRecords(1);
    }
  }, [isOpen, codeId]);

  const loadRecords = async (page: number) => {
    try {
      setLoading(true);
      const response = await getCodeUsageRecords(codeId, page, pagination.limit);
      setRecords(response.data);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (error: any) {
      console.error("加载使用记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">使用记录</h2>
            <p className="text-sm text-gray-500 mt-1">
              卡密: <span className="font-mono text-blue-600">{codeStr}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 统计信息 */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span className="text-gray-600">使用人数:</span>
              <span className="font-bold text-blue-900">{pagination.total}</span>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无使用记录</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div
                  key={record.id}
                  className="p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    {/* 左侧信息 */}
                    <div className="flex-1">
                      {/* 用户信息 */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {record.user?.nickname || record.user?.username || "未知用户"}
                            </span>
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                              ID: {record.userId}
                            </span>
                          </div>
                          {record.user?.username && record.user?.nickname && (
                            <div className="text-xs text-gray-500">
                              @{record.user.username}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 兑换内容 */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {record.membershipId && (
                          <div className="flex items-center gap-2 text-sm">
                            <CreditCard className="w-4 h-4 text-purple-500" />
                            <span className="text-gray-600">获得会员</span>
                            <span className="font-medium text-purple-600">
                              (ID: {record.membershipId})
                            </span>
                          </div>
                        )}
                        {record.tokenAmount > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="w-4 h-4 text-green-500" />
                            <span className="text-gray-600">获得字数</span>
                            <span className="font-medium text-green-600">
                              {record.tokenAmount.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 时间和IP */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(record.createdAt)}</span>
                        </div>
                        {record.ipAddress && (
                          <div className="flex items-center gap-1">
                            <span>IP: {record.ipAddress}</span>
                          </div>
                        )}
                        {record.userAgent && (
                          <div className="flex items-center gap-1 max-w-md truncate">
                            <span title={record.userAgent}>
                              UA: {record.userAgent.substring(0, 50)}...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 右侧记录ID */}
                    <div className="text-right ml-4">
                      <div className="text-xs text-gray-400">记录ID</div>
                      <div className="text-sm font-mono text-gray-600">
                        #{record.id}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              第 {pagination.page} / {pagination.totalPages} 页，共 {pagination.total} 条
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadRecords(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <button
                onClick={() => loadRecords(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
