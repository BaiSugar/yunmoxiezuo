import { useState, useEffect } from "react";
import { getPermissionTree, deletePermission } from "../../api/permissions";
import type { PermissionTreeNode } from "../../types/permission";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { showToast } from "../../components/common/ToastContainer";
import { useAppSelector } from "../../store/hooks";
import { hasButtonPermission, PERMISSIONS } from "../../utils/permission";

export default function Permissions() {
  const { user } = useAppSelector((state) => state.auth);
  const [permissions, setPermissions] = useState<PermissionTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // 加载权限树
  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await getPermissionTree();
      setPermissions(data);
      // 默认全部收起
      setExpandedIds(new Set());
    } catch (error) {
      console.error("加载权限列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  // 删除权限
  const handleDelete = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除权限",
      message: `确定要删除权限 "${name}" 吗？如果该权限有子权限或被角色使用，则无法删除。`,
      onConfirm: async () => {
        try {
          await deletePermission(id);
          showToast("删除成功", "success");
          loadPermissions();
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  // 切换展开/折叠
  const toggleExpand = (id: number) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  // 权限类型标签
  const getTypeBadge = (type: string) => {
    const styles = {
      menu: "bg-blue-100 text-blue-800",
      api: "bg-green-100 text-green-800",
      button: "bg-purple-100 text-purple-800",
    };
    const labels = {
      menu: "菜单",
      api: "接口",
      button: "按钮",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded ${
          styles[type as keyof typeof styles] || ""
        }`}
      >
        {labels[type as keyof typeof labels] || type}
      </span>
    );
  };

  // 状态标签
  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
        启用
      </span>
    ) : (
      <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
        禁用
      </span>
    );
  };

  // 渲染权限树节点（递归）
  const renderTreeNode = (node: PermissionTreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);

    return (
      <div key={node.id}>
        {/* 移动端视图 */}
        <div className="block sm:hidden">
          <div
            className="p-4 border-b border-gray-200"
            style={{ paddingLeft: `${level * 1 + 1}rem` }}
          >
            <div className="flex items-start gap-3">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(node.id)}
                  className="flex-shrink-0 mt-1 text-gray-400"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-gray-900">{node.name}</h3>
                  {getTypeBadge(node.type)}
                  {getStatusBadge(node.status)}
                </div>
                <p className="text-sm text-gray-500 mb-2">{node.code}</p>
                {node.resource && (
                  <p className="text-xs text-gray-400 mb-1">
                    资源：{node.resource}
                    {node.method && ` - ${node.method}`}
                  </p>
                )}
                {node.description && (
                  <p className="text-sm text-gray-600 mb-2">
                    {node.description}
                  </p>
                )}
                {hasButtonPermission(user, PERMISSIONS.PERMISSION.DELETE) && (
                  <button
                    onClick={() => handleDelete(node.id, node.name)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          </div>
          {hasChildren &&
            isExpanded &&
            node.children!.map((child) => renderTreeNode(child, level + 1))}
        </div>

        {/* 桌面端视图 */}
        <div className="hidden sm:block">
          <div className="hover:bg-gray-50">
            <div className="px-6 py-4 flex items-center">
              <div
                className="flex-1 flex items-center"
                style={{ paddingLeft: `${level * 2}rem` }}
              >
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(node.id)}
                    className="mr-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ) : (
                  <span className="w-5 mr-2"></span>
                )}
                <div className="flex-1 grid grid-cols-6 gap-4">
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-gray-900">
                      {node.name}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm text-gray-500">{node.code}</div>
                  </div>
                  <div>{getTypeBadge(node.type)}</div>
                  <div className="flex items-center justify-end gap-3">
                    {getStatusBadge(node.status)}
                    {hasButtonPermission(
                      user,
                      PERMISSIONS.PERMISSION.DELETE
                    ) && (
                      <button
                        onClick={() => handleDelete(node.id, node.name)}
                        className="text-sm text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {hasChildren &&
            isExpanded &&
            node.children!.map((child) => renderTreeNode(child, level + 1))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          权限管理
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          管理系统中的所有权限，支持树形结构
        </p>
      </div>

      {/* 权限树 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 桌面端表头 */}
        <div className="hidden sm:block bg-gray-50 border-b border-gray-200">
          <div className="px-6 py-3 grid grid-cols-6 gap-4">
            <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              权限名称
            </div>
            <div className="col-span-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              权限代码
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              类型
            </div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
              操作
            </div>
          </div>
        </div>

        {/* 权限树内容 */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : permissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无数据</div>
        ) : (
          <div>{permissions.map((node) => renderTreeNode(node))}</div>
        )}
      </div>

      {/* 图例说明 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">说明</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• 菜单权限：控制菜单的显示与隐藏</p>
          <p>• 接口权限：控制API接口的访问权限</p>
          <p>• 按钮权限：控制页面按钮的显示与功能</p>
          <p>• 权限支持树形结构，最多3层</p>
        </div>
      </div>

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
