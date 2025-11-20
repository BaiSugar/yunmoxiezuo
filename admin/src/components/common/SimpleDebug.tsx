import { useAppSelector } from "../../store/hooks";

/**
 * 简单调试组件 - 显示用户基本信息
 */
export default function SimpleDebug() {
  const { user } = useAppSelector((state) => state.auth);

  return (
    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-blue-900 mb-3">
        🔍 简单调试信息
      </h3>

      <div className="space-y-2 text-xs">
        <div>
          <strong>用户存在:</strong> {user ? "是" : "否"}
        </div>

        <div>
          <strong>用户名:</strong> {user?.username || "无"}
        </div>

        <div>
          <strong>用户ID:</strong> {user?.id || "无"}
        </div>

        <div>
          <strong>角色数量:</strong> {user?.roles?.length || 0}
        </div>

        <div>
          <strong>角色类型:</strong> {typeof user?.roles?.[0]}
        </div>

        <div>
          <strong>原始角色数据:</strong>
          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(user?.roles, null, 2)}
          </pre>
        </div>

        <div>
          <strong>权限测试:</strong>
          <div className="mt-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs">dashboard:view</span>
              <span className="text-xs text-gray-500">→</span>
              <span className="text-xs text-blue-600">测试中...</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">user:view</span>
              <span className="text-xs text-gray-500">→</span>
              <span className="text-xs text-blue-600">测试中...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
