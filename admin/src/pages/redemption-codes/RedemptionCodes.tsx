import { useState, useEffect } from "react";
import {
  getRedemptionCodeList,
  deleteRedemptionCode,
  toggleRedemptionCodeStatus,
  getCodeStatistics,
} from "../../api/redemption-codes";
import type {
  RedemptionCode,
  QueryRedemptionCodeDto,
  CodeStatistics,
} from "../../types/redemption-code";
import { CodeType } from "../../types/redemption-code";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { showToast } from "../../components/common/ToastContainer";
import { useAppSelector } from "../../store/hooks";
import { hasButtonPermission, PERMISSIONS } from "../../utils/permission";
import RedemptionCodeModal from "./RedemptionCodeModal";
import BatchGenerateModal from "./BatchGenerateModal";
import UsageRecordsModal from "./UsageRecordsModal";

export default function RedemptionCodes() {
  const { user } = useAppSelector((state) => state.auth);
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<CodeStatistics | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState<QueryRedemptionCodeDto>({});

  // 模态框状态
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    code: RedemptionCode | null;
  }>({ isOpen: false, code: null });

  const [batchModal, setBatchModal] = useState(false);

  // 使用记录模态框
  const [usageRecordsModal, setUsageRecordsModal] = useState<{
    isOpen: boolean;
    codeId: number;
    codeStr: string;
  }>({ isOpen: false, codeId: 0, codeStr: "" });

  // 确认对话框
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmColor: "blue" as "blue" | "red" | "green" | "yellow",
  });

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      const stats = await getCodeStatistics();
      setStatistics(stats);
    } catch (error: any) {
      console.error("加载统计数据失败:", error);
    }
  };

  // 加载卡密列表
  const loadCodes = async () => {
    setLoading(true);
    try {
      const params: QueryRedemptionCodeDto = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await getRedemptionCodeList(params);
      
      // 兼容两种响应格式：带分页信息的对象 或 直接的数组
      if (Array.isArray(response)) {
        setCodes(response);
        setPagination({
          page: 1,
          limit: response.length,
          total: response.length,
          totalPages: 1,
        });
      } else {
        setCodes(response.data || []);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 20,
          total: response.total || 0,
          totalPages: response.totalPages || 1,
        });
      }
    } catch (error: any) {
      console.error("加载卡密列表失败:", error);
      showToast(error.message || "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  // 搜索
  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadCodes();
  };

  // 创建单个卡密
  const handleCreate = () => {
    setEditModal({ isOpen: true, code: null });
  };

  // 批量生成
  const handleBatchGenerate = () => {
    setBatchModal(true);
  };

  // 编辑卡密
  const handleEdit = (code: RedemptionCode) => {
    setEditModal({ isOpen: true, code });
  };

  // 删除卡密
  const handleDelete = (code: RedemptionCode) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除卡密",
      message: `确定要删除卡密"${code.code}"吗？此操作无法撤销。`,
      confirmColor: "red",
      onConfirm: async () => {
        try {
          await deleteRedemptionCode(code.id);
          showToast("删除成功", "success");
          loadCodes();
          loadStatistics();
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  // 切换状态
  const handleToggleStatus = (code: RedemptionCode) => {
    const action = code.isActive ? "禁用" : "启用";
    setConfirmDialog({
      isOpen: true,
      title: `${action}卡密`,
      message: `确定要${action}卡密"${code.code}"吗？`,
      confirmColor: code.isActive ? "yellow" : "green",
      onConfirm: async () => {
        try {
          await toggleRedemptionCodeStatus(code.id);
          showToast(`${action}成功`, "success");
          loadCodes();
        } catch (error: any) {
          showToast(error.message || `${action}失败`, "error");
        }
      },
    });
  };

  // 复制卡密
  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast("已复制到剪贴板", "success");
  };

  // 格式化日期
  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("zh-CN");
  };

  // 获取类型标签
  const getTypeLabel = (type: CodeType) => {
    const labels = {
      [CodeType.MEMBERSHIP]: "会员",
      [CodeType.TOKEN]: "字数",
      [CodeType.MIXED]: "混合",
    };
    return labels[type] || type;
  };

  // 获取类型颜色
  const getTypeColor = (type: CodeType) => {
    const colors = {
      [CodeType.MEMBERSHIP]: "bg-purple-100 text-purple-800",
      [CodeType.TOKEN]: "bg-blue-100 text-blue-800",
      [CodeType.MIXED]: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  // 判断是否已过期
  const isExpired = (validTo: string | null) => {
    if (!validTo) return false;
    return new Date(validTo) < new Date();
  };

  // 判断是否已用完
  const isUsedUp = (usedCount: number, maxUseCount: number) => {
    if (maxUseCount === -1) return false;
    return usedCount >= maxUseCount;
  };

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              卡密管理
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              管理系统兑换卡密
            </p>
          </div>
          <div className="flex gap-2">
            {hasButtonPermission(user, PERMISSIONS.REDEMPTION_CODE.CREATE) && (
              <>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  + 创建卡密
                </button>
                <button
                  onClick={handleBatchGenerate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  批量生成
                </button>
              </>
            )}
          </div>
        </div>

        {/* 统计卡片 */}
        {statistics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">总数</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.totalCodes}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">已启用</div>
              <div className="text-2xl font-bold text-green-600">{statistics.activeCodes}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">已使用</div>
              <div className="text-2xl font-bold text-blue-600">{statistics.usedCodes}</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">已过期</div>
              <div className="text-2xl font-bold text-red-600">{statistics.expiredCodes}</div>
            </div>
          </div>
        )}
      </div>

      {/* 筛选 */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <select
            value={filters.type || ""}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value as CodeType || undefined })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部类型</option>
            <option value={CodeType.MEMBERSHIP}>会员卡密</option>
            <option value={CodeType.TOKEN}>字数卡密</option>
            <option value={CodeType.MIXED}>混合卡密</option>
          </select>
          <select
            value={filters.isActive !== undefined ? String(filters.isActive) : ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                isActive: e.target.value === "" ? undefined : e.target.value === "true",
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">全部状态</option>
            <option value="true">已启用</option>
            <option value="false">已禁用</option>
          </select>
          <input
            type="text"
            placeholder="批次号"
            value={filters.batchId || ""}
            onChange={(e) => setFilters({ ...filters, batchId: e.target.value || undefined })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 卡密列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 移动端卡片视图 */}
        <div className="block sm:hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : codes.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无数据</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {codes.map((code) => (
                <div key={code.id} className="p-4">
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-mono text-sm font-medium text-gray-900 mb-1">
                          {code.code}
                          <button
                            onClick={() => handleCopy(code.code)}
                            className="ml-2 text-blue-600 hover:text-blue-700"
                          >
                            📋
                          </button>
                        </div>
                        {code.batchId && (
                          <div className="text-xs text-gray-500">批次: {code.batchId}</div>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(code.type)}`}>
                        {getTypeLabel(code.type)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-2">
                      <div>使用次数: {code.usedCount}/{code.maxUseCount === -1 ? "∞" : code.maxUseCount}</div>
                      <div>有效期: {formatDate(code.validFrom)} ~ {formatDate(code.validTo)}</div>
                      {code.remark && <div className="text-xs">备注: {code.remark}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          code.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {code.isActive ? "已启用" : "已禁用"}
                      </span>
                      {isExpired(code.validTo) && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          已过期
                        </span>
                      )}
                      {isUsedUp(code.usedCount, code.maxUseCount) && (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                          已用完
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {/* 查看使用记录 */}
                    {code.usedCount > 0 && (
                      <button
                        onClick={() => setUsageRecordsModal({ isOpen: true, codeId: code.id, codeStr: code.code })}
                        className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                      >
                        使用记录 ({code.usedCount})
                      </button>
                    )}
                    {hasButtonPermission(user, PERMISSIONS.REDEMPTION_CODE.UPDATE) && (
                      <>
                        <button
                          onClick={() => handleEdit(code)}
                          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleToggleStatus(code)}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg transition ${
                            code.isActive
                              ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {code.isActive ? "禁用" : "启用"}
                        </button>
                      </>
                    )}
                    {hasButtonPermission(user, PERMISSIONS.REDEMPTION_CODE.DELETE) && (
                      <button
                        onClick={() => handleDelete(code)}
                        className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 桌面端表格视图 */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  卡密码
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  类型
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  使用情况
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  有效期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  状态
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm font-medium text-gray-900">
                        {code.code}
                        <button
                          onClick={() => handleCopy(code.code)}
                          className="ml-2 text-blue-600 hover:text-blue-700"
                          title="复制"
                        >
                          📋
                        </button>
                      </div>
                      {code.batchId && (
                        <div className="text-xs text-gray-500">批次: {code.batchId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded ${getTypeColor(code.type)}`}>
                        {getTypeLabel(code.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {code.usedCount}/{code.maxUseCount === -1 ? "∞" : code.maxUseCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{formatDate(code.validFrom)}</div>
                      <div>~ {formatDate(code.validTo)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            code.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {code.isActive ? "已启用" : "已禁用"}
                        </span>
                        {isExpired(code.validTo) && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            已过期
                          </span>
                        )}
                        {isUsedUp(code.usedCount, code.maxUseCount) && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                            已用完
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {code.usedCount > 0 && (
                        <button
                          onClick={() => setUsageRecordsModal({ isOpen: true, codeId: code.id, codeStr: code.code })}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          使用记录
                        </button>
                      )}
                      {hasButtonPermission(user, PERMISSIONS.REDEMPTION_CODE.UPDATE) && (
                        <>
                          <button
                            onClick={() => handleEdit(code)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleToggleStatus(code)}
                            className={`mr-3 ${
                              code.isActive
                                ? "text-yellow-600 hover:text-yellow-900"
                                : "text-green-600 hover:text-green-900"
                            }`}
                          >
                            {code.isActive ? "禁用" : "启用"}
                          </button>
                        </>
                      )}
                      {hasButtonPermission(user, PERMISSIONS.REDEMPTION_CODE.DELETE) && (
                        <button
                          onClick={() => handleDelete(code)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {!loading && codes.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* 编辑模态框 */}
      {editModal.isOpen && (
        <RedemptionCodeModal
          code={editModal.code}
          onClose={() => setEditModal({ ...editModal, isOpen: false })}
          onSuccess={() => {
            setEditModal({ ...editModal, isOpen: false });
            loadCodes();
            loadStatistics();
          }}
        />
      )}

      {/* 批量生成模态框 */}
      {batchModal && (
        <BatchGenerateModal
          onClose={() => setBatchModal(false)}
          onSuccess={() => {
            setBatchModal(false);
            loadCodes();
            loadStatistics();
          }}
        />
      )}

      {/* 使用记录模态框 */}
      <UsageRecordsModal
        isOpen={usageRecordsModal.isOpen}
        onClose={() => setUsageRecordsModal({ ...usageRecordsModal, isOpen: false })}
        codeId={usageRecordsModal.codeId}
        codeStr={usageRecordsModal.codeStr}
      />
    </div>
  );
}
