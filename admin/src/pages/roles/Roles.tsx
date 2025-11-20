import { useState, useEffect } from "react";
import {
  getRoleList,
  deleteRole,
  getRolePermissions,
  createRole,
  assignPermissions,
} from "../../api/roles";
import { getPermissionTree } from "../../api/permissions";
import type { Role } from "../../types/role";
import type { Permission, PermissionTreeNode } from "../../types/permission";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { EmptyState } from "../../components/common/EmptyState";
import { ErrorState } from "../../components/common/ErrorState";
import { showToast } from "../../components/common/ToastContainer";
import { useAppSelector } from "../../store/hooks";
import { hasButtonPermission, PERMISSIONS } from "../../utils/permission";
import { exportToCSV } from "../../utils/export";
import { Download } from "lucide-react";

export default function Roles() {
  const { user } = useAppSelector((state) => state.auth);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showPermissions, setShowPermissions] = useState(false);

  // 编辑权限模态框
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    role: Role | null;
    allPermissions: PermissionTreeNode[];
    selectedPermissions: number[];
  }>({
    isOpen: false,
    role: null,
    allPermissions: [],
    selectedPermissions: [],
  });

  // 创建角色模态框
  const [createModal, setCreateModal] = useState<{
    isOpen: boolean;
    allPermissions: PermissionTreeNode[];
    baseRoleId: number | null;
    basePermissions: number[];
    additionalPermissions: number[];
    formData: {
      name: string;
      code: string;
      description: string;
      level: number;
    };
  }>({
    isOpen: false,
    allPermissions: [],
    baseRoleId: null,
    basePermissions: [],
    additionalPermissions: [],
    formData: { name: "", code: "", description: "", level: 10 },
  });

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // 加载角色列表
  const loadRoles = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getRoleList();
      setRoles(data);
      setError("");
    } catch (error: any) {
      console.error("加载角色列表失败:", error);
      setError(error.message || "加载角色列表失败，请重试");
      showToast(error.message || "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  // 删除角色
  const handleDelete = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除角色",
      message: `确定要删除角色 "${name}" 吗？此操作无法撤销。`,
      onConfirm: async () => {
        try {
          await deleteRole(id);
          showToast("删除成功", "success");
          loadRoles();
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  // 打开创建角色模态框
  const handleOpenCreateModal = async () => {
    try {
      const allPermissions = await getPermissionTree();
      setCreateModal({
        ...createModal,
        isOpen: true,
        allPermissions,
      });
    } catch (error: any) {
      showToast(error.message || "获取权限列表失败", "error");
    }
  };

  // 选择基础角色
  const handleSelectBaseRole = async (roleId: number | null) => {
    if (!roleId) {
      setCreateModal({
        ...createModal,
        baseRoleId: null,
        basePermissions: [],
        additionalPermissions: [],
      });
      return;
    }

    try {
      const rolePermissions = await getRolePermissions(roleId);
      const permissionIds = rolePermissions.map((p) => p.id);
      setCreateModal({
        ...createModal,
        baseRoleId: roleId,
        basePermissions: permissionIds,
        additionalPermissions: [],
      });
    } catch (error: any) {
      showToast(error.message || "获取角色权限失败", "error");
    }
  };

  // 创建角色
  const handleCreateRole = async () => {
    const { formData, basePermissions, additionalPermissions } = createModal;

    if (!formData.name || !formData.code) {
      showToast("请填写角色名称和代码", "error");
      return;
    }

    try {
      // 1. 创建角色
      const newRole = await createRole({
        name: formData.name,
        code: formData.code,
        description: formData.description,
        level: formData.level,
      });

      // 2. 分配权限（基础权限 + 额外权限）
      const allPermissionIds = [
        ...new Set([...basePermissions, ...additionalPermissions]),
      ];
      if (allPermissionIds.length > 0) {
        await assignPermissions(newRole.id, {
          permissionIds: allPermissionIds,
        });
      }

      showToast("创建角色成功", "success");
      setCreateModal({
        isOpen: false,
        allPermissions: [],
        baseRoleId: null,
        basePermissions: [],
        additionalPermissions: [],
        formData: { name: "", code: "", description: "", level: 10 },
      });
      loadRoles();
    } catch (error: any) {
      showToast(error.message || "创建角色失败", "error");
    }
  };

  // 打开编辑权限模态框
  const handleEditPermissions = async (role: Role) => {
    try {
      const [allPermissions, currentPermissions] = await Promise.all([
        getPermissionTree(),
        getRolePermissions(role.id),
      ]);

      setEditModal({
        isOpen: true,
        role,
        allPermissions,
        selectedPermissions: currentPermissions.map((p) => p.id),
      });
    } catch (error: any) {
      showToast(error.message || "获取权限失败", "error");
    }
  };

  // 保存权限编辑
  const handleSavePermissions = async () => {
    if (!editModal.role) return;

    try {
      await assignPermissions(editModal.role.id, {
        permissionIds: editModal.selectedPermissions,
      });
      showToast("编辑权限成功", "success");
      setEditModal({
        isOpen: false,
        role: null,
        allPermissions: [],
        selectedPermissions: [],
      });
      loadRoles();
    } catch (error: any) {
      showToast(error.message || "编辑权限失败", "error");
    }
  };

  // 查看权限
  const handleViewPermissions = async (role: Role) => {
    try {
      const data = await getRolePermissions(role.id);
      setPermissions(data);
      setSelectedRole(role);
      setShowPermissions(true);
    } catch (error: any) {
      console.error("加载权限失败:", error);
      showToast(error.message || "加载权限失败", "error");
    }
  };

  // 导出角色数据
  const handleExport = () => {
    if (roles.length === 0) {
      showToast("没有数据可导出", "warning");
      return;
    }

    const columns = [
      { key: "id" as keyof Role, label: "ID" },
      { key: "name" as keyof Role, label: "角色名称" },
      { key: "code" as keyof Role, label: "角色代码" },
      { key: "description" as keyof Role, label: "描述" },
      { key: "status" as keyof Role, label: "状态" },
      { key: "createdAt" as keyof Role, label: "创建时间" },
    ];

    const exportData = roles.map((role) => ({
      ...role,
      status: role.status === "active" ? "启用" : "禁用",
      createdAt: new Date(role.createdAt).toLocaleString("zh-CN"),
    }));

    exportToCSV(exportData, "角色列表", columns);
    showToast("导出成功", "success");
  };

  // 状态标签
  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        启用
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
        禁用
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            角色管理
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            管理系统中的所有角色和权限
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={roles.length === 0}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">导出</span>
          </button>
          {hasButtonPermission(user, PERMISSIONS.ROLE.CREATE) && (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              新增角色
            </button>
          )}
        </div>
      </div>

      {/* 角色列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 移动端卡片视图 */}
        <div className="block sm:hidden">
          {loading ? (
            <LoadingSpinner text="加载角色列表..." />
          ) : error ? (
            <ErrorState message={error} onRetry={loadRoles} />
          ) : roles.length === 0 ? (
            <EmptyState
              title="暂无角色"
              description="还没有任何角色"
              action={
                hasButtonPermission(user, PERMISSIONS.ROLE.CREATE)
                  ? { text: "创建第一个角色", onClick: handleOpenCreateModal }
                  : undefined
              }
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {roles.map((role) => (
                <div key={role.id} className="p-4">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{role.name}</h3>
                      {getStatusBadge(role.status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      代码：{role.code}
                    </p>
                    <p className="text-sm text-gray-500 mb-1">
                      等级：{role.level}
                    </p>
                    {role.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {role.description}
                      </p>
                    )}
                    {role.isSystem && (
                      <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        系统角色
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewPermissions(role)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                    >
                      查看权限
                    </button>
                    {!role.isSystem &&
                      hasButtonPermission(user, PERMISSIONS.ROLE.UPDATE) && (
                        <button
                          onClick={() => handleEditPermissions(role)}
                          className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                        >
                          编辑权限
                        </button>
                      )}
                    {!role.isSystem &&
                      hasButtonPermission(user, PERMISSIONS.ROLE.DELETE) && (
                        <button
                          onClick={() => handleDelete(role.id, role.name)}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色代码
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  等级
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  描述
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
                    <LoadingSpinner text="加载角色列表..." />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    <ErrorState message={error} onRetry={loadRoles} />
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8">
                    <EmptyState
                      title="暂无角色"
                      description="还没有任何角色"
                      action={
                        hasButtonPermission(user, PERMISSIONS.ROLE.CREATE)
                          ? {
                              text: "创建第一个角色",
                              onClick: handleOpenCreateModal,
                            }
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {role.name}
                        </div>
                        {role.isSystem && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            系统
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{role.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{role.level}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(role.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {role.description || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasButtonPermission(user, PERMISSIONS.ROLE.VIEW) && (
                        <button
                          onClick={() => handleViewPermissions(role)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          查看权限
                        </button>
                      )}
                      {!role.isSystem &&
                        hasButtonPermission(user, PERMISSIONS.ROLE.UPDATE) && (
                          <button
                            onClick={() => handleEditPermissions(role)}
                            className="text-purple-600 hover:text-purple-900 mr-3"
                          >
                            编辑权限
                          </button>
                        )}
                      {!role.isSystem &&
                        hasButtonPermission(user, PERMISSIONS.ROLE.DELETE) && (
                          <button
                            onClick={() => handleDelete(role.id, role.name)}
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
      </div>

      {/* 权限详情模态框 */}
      {showPermissions && selectedRole && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPermissions(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedRole.name} - 权限列表
                </h2>
                <button
                  onClick={() => setShowPermissions(false)}
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
              {permissions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">该角色暂无权限</p>
              ) : (
                <div className="space-y-2">
                  {permissions.map((permission) => (
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
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
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

      {/* 创建角色模态框 */}
      {createModal.isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setCreateModal({ ...createModal, isOpen: false })}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">新增角色</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* 基础信息 */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      角色名称 *
                    </label>
                    <input
                      type="text"
                      value={createModal.formData.name}
                      onChange={(e) =>
                        setCreateModal({
                          ...createModal,
                          formData: {
                            ...createModal.formData,
                            name: e.target.value,
                          },
                        })
                      }
                      placeholder="例如：超级会员"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      角色代码 *
                    </label>
                    <input
                      type="text"
                      value={createModal.formData.code}
                      onChange={(e) =>
                        setCreateModal({
                          ...createModal,
                          formData: {
                            ...createModal.formData,
                            code: e.target.value,
                          },
                        })
                      }
                      placeholder="例如：super_member"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    角色描述
                  </label>
                  <textarea
                    value={createModal.formData.description}
                    onChange={(e) =>
                      setCreateModal({
                        ...createModal,
                        formData: {
                          ...createModal.formData,
                          description: e.target.value,
                        },
                      })
                    }
                    placeholder="描述该角色的功能和用途"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    角色等级
                  </label>
                  <input
                    type="number"
                    value={createModal.formData.level}
                    onChange={(e) =>
                      setCreateModal({
                        ...createModal,
                        formData: {
                          ...createModal.formData,
                          level: parseInt(e.target.value) || 10,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    数值越大权限越高，普通用户为10
                  </p>
                </div>
              </div>

              {/* 基础角色选择 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  基于角色创建（可选）
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  选择一个基础角色，新角色将继承其所有权限，您还可以在下方添加额外权限
                </p>
                <select
                  value={createModal.baseRoleId || ""}
                  onChange={(e) =>
                    handleSelectBaseRole(
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">不基于任何角色</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} ({role.code})
                    </option>
                  ))}
                </select>
                {createModal.baseRoleId && (
                  <p className="text-sm text-blue-600 mt-2">
                    已继承 {createModal.basePermissions.length} 个权限
                  </p>
                )}
              </div>

              {/* 额外权限选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {createModal.baseRoleId
                    ? "额外权限（在基础权限上添加）"
                    : "选择权限"}
                </label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {createModal.allPermissions.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">暂无权限</p>
                  ) : (
                    <div className="space-y-2">
                      {createModal.allPermissions.map((permission) => {
                        const isBasePermission =
                          createModal.basePermissions.includes(permission.id);
                        const isSelected =
                          createModal.additionalPermissions.includes(
                            permission.id
                          );

                        return (
                          <div key={permission.id}>
                            <label
                              className={`flex items-start p-2 rounded-lg cursor-pointer ${
                                isBasePermission
                                  ? "bg-green-50"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                disabled={isBasePermission}
                                checked={isBasePermission || isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setCreateModal({
                                      ...createModal,
                                      additionalPermissions: [
                                        ...createModal.additionalPermissions,
                                        permission.id,
                                      ],
                                    });
                                  } else {
                                    setCreateModal({
                                      ...createModal,
                                      additionalPermissions:
                                        createModal.additionalPermissions.filter(
                                          (id) => id !== permission.id
                                        ),
                                    });
                                  }
                                }}
                                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <div className="ml-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">
                                    {permission.name}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded ${
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
                                  {isBasePermission && (
                                    <span className="text-xs text-green-600">
                                      (已继承)
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {permission.code}
                                </div>
                              </div>
                            </label>
                            {permission.children &&
                              permission.children.length > 0 && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {permission.children.map((child) => {
                                    const isChildBasePermission =
                                      createModal.basePermissions.includes(
                                        child.id
                                      );
                                    const isChildSelected =
                                      createModal.additionalPermissions.includes(
                                        child.id
                                      );

                                    return (
                                      <label
                                        key={child.id}
                                        className={`flex items-start p-2 rounded-lg cursor-pointer ${
                                          isChildBasePermission
                                            ? "bg-green-50"
                                            : "hover:bg-gray-50"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          disabled={isChildBasePermission}
                                          checked={
                                            isChildBasePermission ||
                                            isChildSelected
                                          }
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setCreateModal({
                                                ...createModal,
                                                additionalPermissions: [
                                                  ...createModal.additionalPermissions,
                                                  child.id,
                                                ],
                                              });
                                            } else {
                                              setCreateModal({
                                                ...createModal,
                                                additionalPermissions:
                                                  createModal.additionalPermissions.filter(
                                                    (id) => id !== child.id
                                                  ),
                                              });
                                            }
                                          }}
                                          className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <div className="ml-3 flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm text-gray-900">
                                              {child.name}
                                            </span>
                                            <span
                                              className={`px-2 py-0.5 text-xs rounded ${
                                                child.type === "menu"
                                                  ? "bg-blue-100 text-blue-800"
                                                  : child.type === "api"
                                                  ? "bg-green-100 text-green-800"
                                                  : "bg-purple-100 text-purple-800"
                                              }`}
                                            >
                                              {child.type === "menu"
                                                ? "菜单"
                                                : child.type === "api"
                                                ? "接口"
                                                : "按钮"}
                                            </span>
                                            {isChildBasePermission && (
                                              <span className="text-xs text-green-600">
                                                (已继承)
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            {child.code}
                                          </div>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  总权限数：
                  {createModal.basePermissions.length +
                    createModal.additionalPermissions.length}
                  {createModal.baseRoleId &&
                    ` (基础 ${createModal.basePermissions.length} + 额外 ${createModal.additionalPermissions.length})`}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() =>
                  setCreateModal({ ...createModal, isOpen: false })
                }
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleCreateRole}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                创建角色
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑权限模态框 */}
      {editModal.isOpen && editModal.role && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() =>
            setEditModal({
              isOpen: false,
              role: null,
              allPermissions: [],
              selectedPermissions: [],
            })
          }
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                编辑权限 - {editModal.role.name}
              </h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                {editModal.allPermissions.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">暂无权限</p>
                ) : (
                  <div className="space-y-2">
                    {editModal.allPermissions.map((permission) => {
                      const isSelected = editModal.selectedPermissions.includes(
                        permission.id
                      );

                      return (
                        <div key={permission.id}>
                          <label className="flex items-start p-2 rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditModal({
                                    ...editModal,
                                    selectedPermissions: [
                                      ...editModal.selectedPermissions,
                                      permission.id,
                                    ],
                                  });
                                } else {
                                  setEditModal({
                                    ...editModal,
                                    selectedPermissions:
                                      editModal.selectedPermissions.filter(
                                        (id) => id !== permission.id
                                      ),
                                  });
                                }
                              }}
                              className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">
                                  {permission.name}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-xs rounded ${
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
                              <div className="text-sm text-gray-500">
                                {permission.code}
                              </div>
                            </div>
                          </label>
                          {permission.children &&
                            permission.children.length > 0 && (
                              <div className="ml-6 mt-1 space-y-1">
                                {permission.children.map((child) => {
                                  const isChildSelected =
                                    editModal.selectedPermissions.includes(
                                      child.id
                                    );

                                  return (
                                    <label
                                      key={child.id}
                                      className="flex items-start p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChildSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setEditModal({
                                              ...editModal,
                                              selectedPermissions: [
                                                ...editModal.selectedPermissions,
                                                child.id,
                                              ],
                                            });
                                          } else {
                                            setEditModal({
                                              ...editModal,
                                              selectedPermissions:
                                                editModal.selectedPermissions.filter(
                                                  (id) => id !== child.id
                                                ),
                                            });
                                          }
                                        }}
                                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                      />
                                      <div className="ml-3 flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm text-gray-900">
                                            {child.name}
                                          </span>
                                          <span
                                            className={`px-2 py-0.5 text-xs rounded ${
                                              child.type === "menu"
                                                ? "bg-blue-100 text-blue-800"
                                                : child.type === "api"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-purple-100 text-purple-800"
                                            }`}
                                          >
                                            {child.type === "menu"
                                              ? "菜单"
                                              : child.type === "api"
                                              ? "接口"
                                              : "按钮"}
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {child.code}
                                        </div>
                                      </div>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-3">
                已选择 {editModal.selectedPermissions.length} 个权限
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() =>
                  setEditModal({
                    isOpen: false,
                    role: null,
                    allPermissions: [],
                    selectedPermissions: [],
                  })
                }
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                取消
              </button>
              <button
                onClick={handleSavePermissions}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmColor="red"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
