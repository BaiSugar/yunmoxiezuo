import { useState, useEffect } from "react";
import {
  getMembershipPlanList,
  deleteMembershipPlan,
  toggleMembershipPlanStatus,
} from "../../api/memberships";
import type {
  MembershipPlan,
  QueryMembershipPlanDto,
} from "../../types/membership";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { showToast } from "../../components/common/ToastContainer";
import { useAppSelector } from "../../store/hooks";
import { hasButtonPermission, PERMISSIONS } from "../../utils/permission";
import MembershipPlanModal from "./MembershipPlanModal";

export default function MembershipPlans() {
  const { user } = useAppSelector((state) => state.auth);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState<QueryMembershipPlanDto>({});

  // 编辑模态框
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    plan: MembershipPlan | null;
  }>({ isOpen: false, plan: null });

  // 确认对话框
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmColor: "blue" as "blue" | "red" | "green" | "yellow",
  });

  // 加载套餐列表
  const loadPlans = async () => {
    setLoading(true);
    try {
      const params: QueryMembershipPlanDto = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await getMembershipPlanList(params);
      
      setPlans(response.data);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (error: any) {
      console.error("加载套餐列表失败:", error);
      showToast(error.message || "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  // 搜索
  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadPlans();
  };

  // 创建套餐
  const handleCreate = () => {
    setEditModal({ isOpen: true, plan: null });
  };

  // 编辑套餐
  const handleEdit = (plan: MembershipPlan) => {
    setEditModal({ isOpen: true, plan });
  };

  // 删除套餐
  const handleDelete = (plan: MembershipPlan) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除套餐",
      message: `确定要删除套餐"${plan.name}"吗？此操作无法撤销。`,
      confirmColor: "red",
      onConfirm: async () => {
        try {
          await deleteMembershipPlan(plan.id);
          showToast("删除成功", "success");
          loadPlans();
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  // 切换状态
  const handleToggleStatus = (plan: MembershipPlan) => {
    const action = plan.isActive ? "下架" : "上架";
    setConfirmDialog({
      isOpen: true,
      title: `${action}套餐`,
      message: `确定要${action}套餐"${plan.name}"吗？`,
      confirmColor: plan.isActive ? "yellow" : "green",
      onConfirm: async () => {
        try {
          await toggleMembershipPlanStatus(plan.id);
          showToast(`${action}成功`, "success");
          loadPlans();
        } catch (error: any) {
          showToast(error.message || `${action}失败`, "error");
        }
      },
    });
  };

  // 格式化价格
  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `¥${numPrice.toFixed(2)}`;
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

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            会员套餐管理
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            管理系统会员套餐和权益
          </p>
        </div>
        {hasButtonPermission(user, PERMISSIONS.MEMBERSHIP.PLAN_CREATE) && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + 创建套餐
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

      {/* 套餐列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 移动端卡片视图 */}
        <div className="block sm:hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : plans.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无数据</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {plans.map((plan) => (
                <div key={plan.id} className="p-4">
                  <div className="mb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-500">等级 {plan.level}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{formatPrice(plan.price)}</p>
                        <p className="text-xs text-gray-500">{plan.duration === 0 ? "永久" : `${plan.duration}天`}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 mb-2">
                      <p>字数: {formatTokens(plan.tokenQuota)}</p>
                      <p>每日限额: {plan.dailyTokenLimit === 0 ? "无限制" : formatTokens(plan.dailyTokenLimit)}</p>
                      <p>并发: {plan.maxConcurrentChats} 个</p>
                      <p>优先级: {plan.priority}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          plan.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {plan.isActive ? "已上架" : "已下架"}
                      </span>
                      {plan.canUseAdvancedModels && (
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                          高级模型
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {hasButtonPermission(user, PERMISSIONS.MEMBERSHIP.PLAN_UPDATE) && (
                      <>
                        <button
                          onClick={() => handleEdit(plan)}
                          className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleToggleStatus(plan)}
                          className={`flex-1 px-3 py-2 text-sm rounded-lg transition ${
                            plan.isActive
                              ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                              : "bg-green-50 text-green-600 hover:bg-green-100"
                          }`}
                        >
                          {plan.isActive ? "下架" : "上架"}
                        </button>
                      </>
                    )}
                    {hasButtonPermission(user, PERMISSIONS.MEMBERSHIP.PLAN_DELETE) && (
                      <button
                        onClick={() => handleDelete(plan)}
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
                  价格/时长
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  字数配额
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  权益
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
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    暂无数据
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                        <div className="text-sm text-gray-500">等级 {plan.level} · 排序 {plan.sort}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">{formatPrice(plan.price)}</div>
                      <div className="text-sm text-gray-500">
                        {plan.duration === 0 ? "永久" : `${plan.duration}天`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">总额: {formatTokens(plan.tokenQuota)}</div>
                      <div className="text-sm text-gray-500">
                        每日: {plan.dailyTokenLimit === 0 ? "无限" : formatTokens(plan.dailyTokenLimit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>并发: {plan.maxConcurrentChats}</div>
                        <div>优先级: {plan.priority}</div>
                        {plan.canUseAdvancedModels && (
                          <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 rounded">
                            高级模型
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          plan.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {plan.isActive ? "已上架" : "已下架"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasButtonPermission(user, PERMISSIONS.MEMBERSHIP.PLAN_UPDATE) && (
                        <>
                          <button
                            onClick={() => handleEdit(plan)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleToggleStatus(plan)}
                            className={`mr-3 ${
                              plan.isActive
                                ? "text-yellow-600 hover:text-yellow-900"
                                : "text-green-600 hover:text-green-900"
                            }`}
                          >
                            {plan.isActive ? "下架" : "上架"}
                          </button>
                        </>
                      )}
                      {hasButtonPermission(user, PERMISSIONS.MEMBERSHIP.PLAN_DELETE) && (
                        <button
                          onClick={() => handleDelete(plan)}
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
        {!loading && plans.length > 0 && (
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
        <MembershipPlanModal
          plan={editModal.plan}
          onClose={() => setEditModal({ ...editModal, isOpen: false })}
          onSuccess={() => {
            setEditModal({ ...editModal, isOpen: false });
            loadPlans();
          }}
        />
      )}
    </div>
  );
}
