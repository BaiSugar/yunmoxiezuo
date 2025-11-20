import { useState, useEffect } from "react";
import {
  getTokenPackageList,
  deleteTokenPackage,
  toggleTokenPackageStatus,
} from "../../api/token-packages";
import type {
  TokenPackage,
  QueryTokenPackageDto,
} from "../../types/token-package";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { showToast } from "../../components/common/ToastContainer";
import { useAppSelector } from "../../store/hooks";
import { hasButtonPermission, PERMISSIONS } from "../../utils/permission";
import TokenPackageModal from "./TokenPackageModal";

export default function TokenPackages() {
  const { user } = useAppSelector((state) => state.auth);
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState<QueryTokenPackageDto>({});

  // 编辑模态框
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    package: TokenPackage | null;
  }>({ isOpen: false, package: null });

  // 确认对话框
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmColor: "blue" as "blue" | "red" | "green" | "yellow",
  });

  // 加载字数包列表
  const loadPackages = async () => {
    setLoading(true);
    try {
      const params: QueryTokenPackageDto = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await getTokenPackageList(params);
      
      // 兼容两种响应格式：带分页信息的对象 或 直接的数组
      if (Array.isArray(response)) {
        // 后端返回的是直接数组（无分页）
        setPackages(response);
        setPagination({
          page: 1,
          limit: response.length,
          total: response.length,
          totalPages: 1,
        });
      } else {
        // 后端返回的是带分页信息的对象
        setPackages(response.data || []);
        setPagination({
          page: response.page || 1,
          limit: response.limit || 20,
          total: response.total || 0,
          totalPages: response.totalPages || 1,
        });
      }
    } catch (error: any) {
      console.error("加载字数包列表失败:", error);
      showToast(error.message || "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  // 搜索
  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadPackages();
  };

  // 创建字数包
  const handleCreate = () => {
    setEditModal({ isOpen: true, package: null });
  };

  // 编辑字数包
  const handleEdit = (pkg: TokenPackage) => {
    setEditModal({ isOpen: true, package: pkg });
  };

  // 删除字数包
  const handleDelete = (pkg: TokenPackage) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除字数包",
      message: `确定要删除字数包"${pkg.name}"吗？此操作无法撤销。`,
      confirmColor: "red",
      onConfirm: async () => {
        try {
          await deleteTokenPackage(pkg.id);
          showToast("删除成功", "success");
          loadPackages();
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  // 切换状态
  const handleToggleStatus = (pkg: TokenPackage) => {
    const action = pkg.isActive ? "下架" : "上架";
    setConfirmDialog({
      isOpen: true,
      title: `${action}字数包`,
      message: `确定要${action}字数包"${pkg.name}"吗？`,
      confirmColor: pkg.isActive ? "yellow" : "green",
      onConfirm: async () => {
        try {
          await toggleTokenPackageStatus(pkg.id);
          showToast(`${action}成功`, "success");
          loadPackages();
        } catch (error: any) {
          showToast(error.message || `${action}失败`, "error");
        }
      },
    });
  };

  // 格式化价格
  const formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`;
  };

  // 格式化字数
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  // 计算实际价格（折扣后）
  const getActualPrice = (price: number, discount: number) => {
    return price * discount;
  };

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            字数包管理
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            管理系统字数包套餐
          </p>
        </div>
        {hasButtonPermission(user, PERMISSIONS.TOKEN_PACKAGE.CREATE) && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + 创建字数包
          </button>
        )}
      </div>

      {/* 筛选 */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <option value="true">已上架</option>
            <option value="false">已下架</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 字数包列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 移动端卡片视图 */}
        <div className="block sm:hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : packages.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无数据</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-4">
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{pkg.name}</h3>
                        <p className="text-sm text-gray-500">排序 {pkg.sort}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">
                          {formatPrice(getActualPrice(pkg.price, pkg.discount))}
                        </p>
                        {pkg.discount < 1 && (
                          <p className="text-xs text-gray-400 line-through">
                            {formatPrice(pkg.price)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-2">
                      <p>字数: {formatTokens(pkg.tokenAmount)}</p>
                      {pkg.bonusTokens > 0 && (
                        <p className="text-orange-600">赠送: {formatTokens(pkg.bonusTokens)}</p>
                      )}
                      <p>有效期: {pkg.validDays === 0 ? "永久" : `${pkg.validDays}天`}</p>
                      {pkg.minMemberLevel > 0 && (
                        <p>要求会员等级: {pkg.minMemberLevel}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          pkg.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {pkg.isActive ? "已上架" : "已下架"}
                      </span>
                      {pkg.discount < 1 && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          {(pkg.discount * 10).toFixed(1)}折
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {hasButtonPermission(user, PERMISSIONS.TOKEN_PACKAGE.UPDATE) && (
                      <>
                        <button
                          onClick={() => handleEdit(pkg)}
                          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleToggleStatus(pkg)}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg transition ${
                            pkg.isActive
                              ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {pkg.isActive ? "下架" : "上架"}
                        </button>
                      </>
                    )}
                    {hasButtonPermission(user, PERMISSIONS.TOKEN_PACKAGE.DELETE) && (
                      <button
                        onClick={() => handleDelete(pkg)}
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
                  套餐信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  价格
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  字数配置
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  限制条件
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
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                        <div className="text-sm text-gray-500">排序 {pkg.sort}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {formatPrice(getActualPrice(pkg.price, pkg.discount))}
                      </div>
                      {pkg.discount < 1 && (
                        <>
                          <div className="text-sm text-gray-400 line-through">
                            {formatPrice(pkg.price)}
                          </div>
                          <div className="text-xs text-red-600">
                            {(pkg.discount * 10).toFixed(1)}折
                          </div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        基础: {formatTokens(pkg.tokenAmount)}
                      </div>
                      {pkg.bonusTokens > 0 && (
                        <div className="text-sm text-orange-600">
                          赠送: {formatTokens(pkg.bonusTokens)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>有效期: {pkg.validDays === 0 ? "永久" : `${pkg.validDays}天`}</div>
                        {pkg.minMemberLevel > 0 && (
                          <div>会员等级: ≥{pkg.minMemberLevel}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          pkg.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {pkg.isActive ? "已上架" : "已下架"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasButtonPermission(user, PERMISSIONS.TOKEN_PACKAGE.UPDATE) && (
                        <>
                          <button
                            onClick={() => handleEdit(pkg)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleToggleStatus(pkg)}
                            className={`mr-3 ${
                              pkg.isActive
                                ? "text-yellow-600 hover:text-yellow-900"
                                : "text-green-600 hover:text-green-900"
                            }`}
                          >
                            {pkg.isActive ? "下架" : "上架"}
                          </button>
                        </>
                      )}
                      {hasButtonPermission(user, PERMISSIONS.TOKEN_PACKAGE.DELETE) && (
                        <button
                          onClick={() => handleDelete(pkg)}
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
        {!loading && packages.length > 0 && (
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
        <TokenPackageModal
          package={editModal.package}
          onClose={() => setEditModal({ ...editModal, isOpen: false })}
          onSuccess={() => {
            setEditModal({ ...editModal, isOpen: false });
            loadPackages();
          }}
        />
      )}
    </div>
  );
}
