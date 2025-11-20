import { useAppSelector } from "../../store/hooks";
import { hasPermission, PERMISSIONS } from "../../utils/permission";

/**
 * 调试信息组件 - 用于诊断权限问题
 * 仅在开发环境显示
 */
export default function DebugInfo() {
  const { user } = useAppSelector((state) => state.auth);

  // 如果不在开发环境，不显示
  if (import.meta.env.PROD) {
    return null;
  }

  // 测试基础权限
  const testPermissions = [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.USER.VIEW,
    PERMISSIONS.USER.CREATE,
  ];

  return (
    <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-red-900 mb-3">
        🐛 调试信息（仅开发环境）
      </h3>

      <div className="space-y-2 text-xs">
        <div>
          <strong>用户存在:</strong> {user ? "是" : "否"}
        </div>

        <div>
          <strong>用户角色:</strong> {user?.roles?.length || 0} 个
        </div>

        <div>
          <strong>角色类型:</strong> {typeof user?.roles?.[0]}
        </div>

        <div>
          <strong>角色详情:</strong>
          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
            {JSON.stringify(user?.roles, null, 2)}
          </pre>
        </div>

        <div>
          <strong>权限测试:</strong>
          {testPermissions.map((permission) => {
            const hasAccess = hasPermission(user, permission);
            return (
              <div key={permission} className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    hasAccess ? "bg-green-500" : "bg-red-500"
                  }`}
                ></span>
                <span className="text-xs">{permission}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
