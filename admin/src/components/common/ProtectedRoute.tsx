import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { hasMenuPermission } from "../../utils/permission";

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission: string;
  fallbackPath?: string;
}

/**
 * 受保护的路由组件
 * 检查用户是否有指定权限，没有权限则重定向
 */
export const ProtectedRoute = ({
  children,
  permission,
  fallbackPath = "/dashboard",
}: ProtectedRouteProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const isAuthenticated = !!localStorage.getItem("accessToken");

  // 未登录，跳转到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 已登录但无权限，跳转到指定页面
  if (!hasMenuPermission(user, permission)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};

/**
 * 权限检查组件
 * 根据权限显示或隐藏内容
 */
interface PermissionGateProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

export const PermissionGate = ({
  children,
  permission,
  fallback = null,
}: PermissionGateProps) => {
  const { user } = useAppSelector((state) => state.auth);

  if (!hasMenuPermission(user, permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
