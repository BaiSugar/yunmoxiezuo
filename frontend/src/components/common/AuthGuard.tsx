import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * 认证守卫组件
 * 根据认证状态决定是否渲染子组件或重定向
 */
const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  redirectTo = "/dashboard",
  requireAuth = false,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  // 如果需要认证但未登录，重定向到登录页
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果不需要认证但已登录，重定向到指定页面
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // 渲染子组件
  return <>{children}</>;
};

export default AuthGuard;
