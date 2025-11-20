import { useAppSelector } from "../../store/hooks";
import {
  hasPermission,
  getUserPermissions,
  PERMISSIONS,
} from "../../utils/permission";

/**
 * 权限测试组件 - 用于调试权限控制
 * 仅在开发环境显示
 */
export default function PermissionTest() {
  const { user } = useAppSelector((state) => state.auth);

  // 如果不在开发环境，不显示
  if (import.meta.env.PROD) {
    return null;
  }

  const allPermissions = [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.USER.LIST,
    PERMISSIONS.USER.VIEW,
    PERMISSIONS.USER.CREATE,
    PERMISSIONS.USER.UPDATE,
    PERMISSIONS.USER.DELETE,
    PERMISSIONS.USER.BAN,
    PERMISSIONS.USER.ASSIGN_ROLES,
    PERMISSIONS.ROLE.VIEW,
    PERMISSIONS.ROLE.LIST,
    PERMISSIONS.ROLE.CREATE,
    PERMISSIONS.ROLE.UPDATE,
    PERMISSIONS.ROLE.DELETE,
    PERMISSIONS.ROLE.ASSIGN,
    PERMISSIONS.PERMISSION.VIEW,
    PERMISSIONS.PERMISSION.LIST,
    PERMISSIONS.PERMISSION.CREATE,
    PERMISSIONS.PERMISSION.UPDATE,
    PERMISSIONS.PERMISSION.DELETE,
    PERMISSIONS.PROMPT.CATEGORY_VIEW,
    PERMISSIONS.PROMPT.CATEGORY_CREATE,
    PERMISSIONS.PROMPT.CATEGORY_UPDATE,
    PERMISSIONS.PROMPT.CATEGORY_DELETE,
  ];

  return (
    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-yellow-900 mb-3">
        🔧 后台管理权限测试面板（仅开发环境）
      </h3>

      <div className="space-y-3 text-xs">
        <div>
          <strong>当前用户:</strong> {user?.username || "未登录"}
        </div>

        <div>
          <strong>用户类型:</strong>{" "}
          {typeof user?.roles?.[0] === "string" ? "LoginUser" : "User"}
        </div>

        <div>
          <strong>角色:</strong>{" "}
          {user?.roles
            ?.map((r) => (typeof r === "string" ? r : r.name))
            .join(", ") || "无"}
        </div>

        <div>
          <strong>角色代码:</strong>{" "}
          {user?.roles
            ?.map((r) => (typeof r === "string" ? r : r.code))
            .join(", ") || "无"}
        </div>

        <div>
          <strong>角色详情:</strong>
          <div className="mt-1 max-h-20 overflow-y-auto text-xs">
            {user?.roles?.map((role, index) => (
              <div key={index} className="mb-1">
                {typeof role === "string" ? (
                  <span className="text-blue-600">{role}</span>
                ) : (
                  <div>
                    <span className="text-blue-600">{role.name}</span> (
                    <span className="text-gray-500">{role.code}</span>)
                    {role.permissions && (
                      <div className="ml-2 text-gray-400">
                        权限: {role.permissions.length} 个
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <strong>用户权限:</strong>
          <div className="mt-1 max-h-20 overflow-y-auto">
            {getUserPermissions(user).length > 0 ? (
              getUserPermissions(user).map((permission) => (
                <span
                  key={permission}
                  className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-1 mb-1"
                >
                  {permission}
                </span>
              ))
            ) : (
              <span className="text-gray-500">无权限</span>
            )}
          </div>
        </div>

        <div>
          <strong>权限检查结果:</strong>
          <div className="mt-1 max-h-32 overflow-y-auto">
            {allPermissions.map((permission) => {
              const hasAccess = hasPermission(user, permission);
              return (
                <div key={permission} className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      hasAccess ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  <span
                    className={`text-xs ${
                      hasAccess ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {permission}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
