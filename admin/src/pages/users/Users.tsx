import { useState, useEffect } from "react";
import {
  getUserList,
  deleteUser,
  banUser,
  unbanUser,
  getUserPermissions,
  assignRoles,
  createUser,
  updateUser,
} from "../../api/users";
import { getRoleList } from "../../api/roles";
import type {
  User,
  QueryUserDto,
  CreateUserDto,
  UpdateUserDto,
} from "../../types/user";
import type { Role } from "../../types/role";
import type { Permission } from "../../types/permission";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { UserFormModal } from "../../components/forms/UserFormModal";
import { AdminUserEditModal } from "../../components/forms/AdminUserEditModal";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { showToast } from "../../components/common/ToastContainer";
import { useAppSelector } from "../../store/hooks";
import {
  hasButtonPermission,
  PERMISSIONS,
  ROLES,
} from "../../utils/permission";
import { exportToCSV } from "../../utils/export";
import { Download } from "lucide-react";

export default function Users() {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // 权限查看模态框
  const [permissionsModal, setPermissionsModal] = useState<{
    isOpen: boolean;
    user: User | null;
    permissions: Permission[];
  }>({ isOpen: false, user: null, permissions: [] });

  // 分配角色模态框
  const [rolesModal, setRolesModal] = useState<{
    isOpen: boolean;
    user: User | null;
    allRoles: Role[];
    selectedRoleIds: number[];
  }>({ isOpen: false, user: null, allRoles: [], selectedRoleIds: [] });

  // 用户表单模态框（创建/编辑）
  const [userFormModal, setUserFormModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });

  // 管理员用户详情模态框
  const [adminEditModal, setAdminEditModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({ isOpen: false, user: null });

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmColor: "blue" as "blue" | "red" | "green" | "yellow",
  });

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const params: QueryUserDto = {
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
      if (searchText) params.search = searchText;
      if (statusFilter) params.status = statusFilter as any;

      const response = await getUserList(params);

      // 确保响应数据有效
      if (response && response.items && response.pagination) {
        setUsers(response.items);
        setPagination(response.pagination);
        setError("");
      } else {
        console.error("API返回数据格式错误:", response);
        setUsers([]);
        setError("数据格式错误");
      }
    } catch (error: any) {
      console.error("加载用户列表失败:", error);
      setUsers([]);
      setError(error.message || "加载用户列表失败，请重试");
      showToast(error.message || "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  // 搜索
  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadUsers();
  };

  // 删除用户
  const handleDelete = (id: number, username: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除用户",
      message: `确定要删除用户 "${username}" 吗？此操作无法撤销。`,
      confirmColor: "red",
      onConfirm: async () => {
        try {
          await deleteUser(id);
          showToast("删除成功", "success");
          loadUsers();
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  // 查看用户权限
  const handleViewPermissions = async (user: User) => {
    try {
      const permissions = await getUserPermissions(user.id);
      setPermissionsModal({ isOpen: true, user, permissions });
    } catch (error: any) {
      showToast(error.message || "获取权限失败", "error");
    }
  };

  // 分配角色
  const handleAssignRoles = async (user: User) => {
    try {
      const allRoles = await getRoleList();
      const selectedRoleIds = user.roles.map((r) => r.id);
      setRolesModal({ isOpen: true, user, allRoles, selectedRoleIds });
    } catch (error: any) {
      showToast(error.message || "获取角色列表失败", "error");
    }
  };

  // 保存角色分配
  const handleSaveRoles = async () => {
    if (!rolesModal.user) return;

    try {
      await assignRoles(rolesModal.user.id, {
        roleIds: rolesModal.selectedRoleIds,
      });
      showToast("分配角色成功", "success");
      setRolesModal({ ...rolesModal, isOpen: false });
      loadUsers();
    } catch (error: any) {
      showToast(error.message || "分配角色失败", "error");
    }
  };

  // 打开创建用户表单
  const handleOpenCreateForm = () => {
    setUserFormModal({ isOpen: true, user: null });
  };

  // 打开编辑用户表单
  const handleOpenEditForm = (user: User) => {
    setUserFormModal({ isOpen: true, user });
  };

  // 打开管理员用户详情（超管专用）
  const handleOpenAdminEdit = (targetUser: User) => {
    setAdminEditModal({ isOpen: true, user: targetUser });
  };

  // 判断当前用户是否是超级管理员
  const isSuperAdmin = () => {
    if (!currentUser || !currentUser.roles) return false;
    const roleCodes =
      typeof currentUser.roles[0] === "string"
        ? (currentUser.roles as string[])
        : (currentUser.roles as Role[]).map((r) => r.code);
    return roleCodes.includes(ROLES.SUPER_ADMIN);
  };

  // 提交用户表单
  const handleSubmitUserForm = async (data: CreateUserDto | UpdateUserDto) => {
    try {
      if (userFormModal.user) {
        // 编辑模式
        await updateUser(userFormModal.user.id, data as UpdateUserDto);
        showToast("更新用户成功", "success");
      } else {
        // 创建模式
        await createUser(data as CreateUserDto);
        showToast("创建用户成功", "success");
      }
      setUserFormModal({ isOpen: false, user: null });
      loadUsers();
    } catch (error: any) {
      showToast(error.message || "操作失败", "error");
      throw error; // 让表单组件知道提交失败
    }
  };

  // 导出用户数据
  const handleExport = () => {
    if (users.length === 0) {
      showToast("没有数据可导出", "warning");
      return;
    }

    // 定义导出的列
    const columns = [
      { key: "id" as keyof User, label: "ID" },
      { key: "username" as keyof User, label: "用户名" },
      { key: "email" as keyof User, label: "邮箱" },
      { key: "nickname" as keyof User, label: "昵称" },
      {
        key: "roles" as keyof User,
        label: "角色",
      },
      { key: "status" as keyof User, label: "状态" },
      { key: "createdAt" as keyof User, label: "创建时间" },
    ];

    // 处理数据
    const exportData = users.map((user) => ({
      ...user,
      roles: user.roles.map((r) => r.name).join(", "),
      status:
        user.status === "active"
          ? "正常"
          : user.status === "inactive"
          ? "未激活"
          : "已封禁",
      createdAt: new Date(user.createdAt).toLocaleString("zh-CN"),
    }));

    exportToCSV(exportData, "用户列表", columns);
    showToast("导出成功", "success");
  };

  // 封禁/解封用户
  const handleBanToggle = (user: User) => {
    const action = user.status === "banned" ? "解封" : "封禁";
    setConfirmDialog({
      isOpen: true,
      title: `${action}用户`,
      message: `确定要${action}用户 "${user.username}" 吗？`,
      confirmColor: user.status === "banned" ? "green" : "yellow",
      onConfirm: async () => {
        try {
          if (user.status === "banned") {
            await unbanUser(user.id);
          } else {
            await banUser(user.id);
          }
          showToast(`${action}成功`, "success");
          loadUsers();
        } catch (error: any) {
          showToast(error.message || `${action}失败`, "error");
        }
      },
    });
  };

  // 状态标签样式
  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      banned: "bg-red-100 text-red-800",
    };
    const labels = {
      active: "正常",
      inactive: "未激活",
      banned: "已封禁",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          styles[status as keyof typeof styles] || styles.inactive
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          用户管理
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          管理系统中的所有用户
        </p>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="搜索用户名、邮箱..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option value="active">正常</option>
            <option value="inactive">未激活</option>
            <option value="banned">已封禁</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            搜索
          </button>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleExport}
            disabled={users.length === 0}
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">导出数据</span>
          </button>
          {hasButtonPermission(currentUser, PERMISSIONS.USER.CREATE) && (
            <button
              onClick={handleOpenCreateForm}
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md hover:shadow-lg"
            >
              + 创建用户
            </button>
          )}
        </div>
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 移动端卡片视图 */}
        <div className="block sm:hidden">
          {loading ? (
            <LoadingSpinner text="加载用户列表..." />
          ) : error ? (
            <ErrorState message={error} onRetry={loadUsers} />
          ) : users.length === 0 ? (
            <EmptyState
              icon="search"
              title="暂无用户数据"
              description={
                searchText || statusFilter
                  ? "没有找到符合条件的用户"
                  : "还没有任何用户"
              }
              action={
                hasButtonPermission(currentUser, PERMISSIONS.USER.CREATE)
                  ? {
                      text: "创建第一个用户",
                      onClick: handleOpenCreateForm,
                    }
                  : undefined
              }
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <img
                      src={
                        user.avatar ||
                        `https://ui-avatars.com/api/?name=${user.username}`
                      }
                      alt={user.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {user.nickname || user.username}
                        </h3>
                        {getStatusBadge(user.status)}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        角色：{user.roles.map((r) => r.name).join(", ") || "无"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isSuperAdmin() && (
                      <button
                        onClick={() => handleOpenAdminEdit(user)}
                        className="flex-1 px-3 py-2 text-sm bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-600 hover:from-indigo-100 hover:to-purple-100 rounded-lg transition min-w-[80px] border border-indigo-200"
                      >
                        详情
                      </button>
                    )}
                    {hasButtonPermission(
                      currentUser,
                      PERMISSIONS.USER.UPDATE
                    ) &&
                      !isSuperAdmin() && (
                        <button
                          onClick={() => handleOpenEditForm(user)}
                          className="flex-1 px-3 py-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition min-w-[80px]"
                        >
                          编辑
                        </button>
                      )}
                    <button
                      onClick={() => handleViewPermissions(user)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition min-w-[80px]"
                    >
                      查看权限
                    </button>
                    {hasButtonPermission(
                      currentUser,
                      PERMISSIONS.USER.ASSIGN_ROLES
                    ) && (
                      <button
                        onClick={() => handleAssignRoles(user)}
                        className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition min-w-[80px]"
                      >
                        分配角色
                      </button>
                    )}
                    {hasButtonPermission(currentUser, PERMISSIONS.USER.BAN) && (
                      <button
                        onClick={() => handleBanToggle(user)}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition min-w-[60px] ${
                          user.status === "banned"
                            ? "bg-green-50 text-green-600 hover:bg-green-100"
                            : "bg-orange-50 text-orange-600 hover:bg-orange-100"
                        }`}
                      >
                        {user.status === "banned" ? "解封" : "封禁"}
                      </button>
                    )}
                    {hasButtonPermission(
                      currentUser,
                      PERMISSIONS.USER.DELETE
                    ) && (
                      <button
                        onClick={() => handleDelete(user.id, user.username)}
                        className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition min-w-[60px]"
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  邮箱
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    <LoadingSpinner text="加载用户列表..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    <ErrorState message={error} onRetry={loadUsers} />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    <EmptyState
                      icon="search"
                      title="暂无用户数据"
                      description={
                        searchText || statusFilter
                          ? "没有找到符合条件的用户"
                          : "还没有任何用户"
                      }
                    />
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={
                            user.avatar ||
                            `https://ui-avatars.com/api/?name=${user.username}`
                          }
                          alt={user.username}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.nickname || user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.roles.map((r) => r.name).join(", ") || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isSuperAdmin() && (
                        <button
                          onClick={() => handleOpenAdminEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3 font-medium"
                        >
                          详情
                        </button>
                      )}
                      {hasButtonPermission(
                        currentUser,
                        PERMISSIONS.USER.UPDATE
                      ) &&
                        !isSuperAdmin() && (
                          <button
                            onClick={() => handleOpenEditForm(user)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            编辑
                          </button>
                        )}
                      <button
                        onClick={() => handleViewPermissions(user)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        查看权限
                      </button>
                      {hasButtonPermission(
                        currentUser,
                        PERMISSIONS.USER.ASSIGN_ROLES
                      ) && (
                        <button
                          onClick={() => handleAssignRoles(user)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          分配角色
                        </button>
                      )}
                      {hasButtonPermission(
                        currentUser,
                        PERMISSIONS.USER.BAN
                      ) && (
                        <button
                          onClick={() => handleBanToggle(user)}
                          className={`mr-3 ${
                            user.status === "banned"
                              ? "text-green-600 hover:text-green-900"
                              : "text-orange-600 hover:text-orange-900"
                          }`}
                        >
                          {user.status === "banned" ? "解封" : "封禁"}
                        </button>
                      )}
                      {hasButtonPermission(
                        currentUser,
                        PERMISSIONS.USER.DELETE
                      ) && (
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
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
        {!loading && users.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                共 {pagination.total} 条记录，第 {pagination.page} /{" "}
                {pagination.totalPages} 页
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
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

      {/* 权限查看模态框 */}
      {permissionsModal.isOpen && permissionsModal.user && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() =>
            setPermissionsModal({ ...permissionsModal, isOpen: false })
          }
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {permissionsModal.user.username} - 用户权限
                </h2>
                <button
                  onClick={() =>
                    setPermissionsModal({ ...permissionsModal, isOpen: false })
                  }
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
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {permissionsModal.permissions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">该用户暂无权限</p>
              ) : (
                <div className="space-y-2">
                  {permissionsModal.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {permission.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {permission.code}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          permission.type === "menu"
                            ? "bg-blue-100 text-blue-800"
                            : permission.type === "api"
                            ? "bg-green-100 text-green-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {permission.type === "menu"
                          ? "菜单"
                          : permission.type === "api"
                          ? "接口"
                          : "按钮"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 分配角色模态框 */}
      {rolesModal.isOpen && rolesModal.user && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setRolesModal({ ...rolesModal, isOpen: false })}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头部 */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">分配角色</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    为{" "}
                    <span className="font-medium">
                      {rolesModal.user.username}
                    </span>{" "}
                    分配角色权限
                  </p>
                </div>
                <button
                  onClick={() =>
                    setRolesModal({ ...rolesModal, isOpen: false })
                  }
                  className="text-gray-400 hover:text-gray-600 transition-colors"
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

            {/* 角色列表 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {rolesModal.allRoles.length === 0 ? (
                <EmptyState
                  title="暂无角色"
                  description="系统中还没有任何角色"
                />
              ) : (
                <div className="space-y-3">
                  {rolesModal.allRoles.map((role) => {
                    const isChecked = rolesModal.selectedRoleIds.includes(
                      role.id
                    );
                    const isSystem =
                      role.code === "super_admin" || role.code === "admin";

                    return (
                      <label
                        key={role.id}
                        className={`flex items-start p-4 rounded-xl cursor-pointer transition-all ${
                          isChecked
                            ? "bg-blue-50 border-2 border-blue-500"
                            : "bg-gray-50 border-2 border-transparent hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRolesModal({
                                ...rolesModal,
                                selectedRoleIds: [
                                  ...rolesModal.selectedRoleIds,
                                  role.id,
                                ],
                              });
                            } else {
                              setRolesModal({
                                ...rolesModal,
                                selectedRoleIds:
                                  rolesModal.selectedRoleIds.filter(
                                    (id) => id !== role.id
                                  ),
                              });
                            }
                          }}
                          className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {role.name}
                            </span>
                            {isSystem && (
                              <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                系统角色
                              </span>
                            )}
                          </div>
                          {role.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {role.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            角色代码: {role.code}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {/* 已选择提示 */}
              {rolesModal.selectedRoleIds.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    已选择{" "}
                    <span className="font-bold">
                      {rolesModal.selectedRoleIds.length}
                    </span>{" "}
                    个角色
                  </p>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setRolesModal({ ...rolesModal, isOpen: false })}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
              >
                取消
              </button>
              <button
                onClick={handleSaveRoles}
                disabled={rolesModal.selectedRoleIds.length === 0}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                保存 ({rolesModal.selectedRoleIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 用户表单模态框 */}
      <UserFormModal
        isOpen={userFormModal.isOpen}
        user={userFormModal.user}
        onClose={() => setUserFormModal({ isOpen: false, user: null })}
        onSubmit={handleSubmitUserForm}
      />

      {/* 超级管理员用户详情模态框 */}
      <AdminUserEditModal
        isOpen={adminEditModal.isOpen}
        user={adminEditModal.user}
        onClose={() => setAdminEditModal({ isOpen: false, user: null })}
      />

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmColor={confirmDialog.confirmColor}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        }}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
