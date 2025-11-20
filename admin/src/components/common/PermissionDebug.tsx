import { useAppSelector } from "../../store/hooks";
import { hasPermission, PERMISSIONS } from "../../utils/permission";

/**
 * 权限调试组件 - 详细测试权限检查
 */
export default function PermissionDebug() {
  const { user } = useAppSelector((state) => state.auth);

  // 测试权限列表
  const testPermissions = [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.USER.VIEW,
    PERMISSIONS.USER.CREATE,
    PERMISSIONS.USER.DELETE,
    PERMISSIONS.ROLE.VIEW,
    PERMISSIONS.PERMISSION.VIEW,
  ];

  return (
    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-green-900 mb-3">
        🔧 权限调试测试
      </h3>

      <div className="space-y-2 text-xs">
        <div>
          <strong>用户信息:</strong> {user?.username} (ID: {user?.id})
        </div>

        <div>
          <strong>角色信息:</strong>
          {user?.roles?.map((role, index) => (
            <div key={index} className="ml-2 mt-1">
              {typeof role === "string" ? (
                <span className="text-blue-600">{role}</span>
              ) : (
                <span className="text-blue-600">
                  {role.name} ({role.code})
                </span>
              )}
            </div>
          ))}
        </div>

        <div>
          <strong>权限检查结果:</strong>
          <div className="mt-1 space-y-1">
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
                  <span
                    className={`text-xs ${
                      hasAccess ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {hasAccess ? "✅ 通过" : "❌ 拒绝"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <strong>控制台日志:</strong>
          <div className="mt-1 text-xs text-gray-500">
            请查看浏览器控制台的详细日志
          </div>
        </div>
      </div>
    </div>
  );
}
