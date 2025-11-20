import React from "react";
import { usePermission } from "../../hooks/usePermission";

interface PermissionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 需要的权限代码 */
  permission?: string;
  /** 需要的权限代码数组（满足任意一个即可） */
  permissions?: string[];
  /** 需要的角色代码 */
  role?: string;
  /** 需要的角色代码数组（满足任意一个即可） */
  roles?: string[];
  /** 权限检查模式：any（任意一个）或 all（全部） */
  mode?: "any" | "all";
  /** 无权限时是否隐藏按钮 */
  hideOnNoPermission?: boolean;
  /** 无权限时显示的替代内容 */
  fallback?: React.ReactNode;
  /** 子元素 */
  children: React.ReactNode;
}

/**
 * 权限控制按钮组件
 * 根据用户权限显示或隐藏按钮
 */
const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  permissions,
  role,
  roles,
  mode = "any",
  hideOnNoPermission = true,
  fallback = null,
  children,
  ...buttonProps
}) => {
  const { hasPermission, hasRole, hasAnyRole, hasAnyPermission } =
    usePermission();

  // 检查权限
  const checkPermission = (): boolean => {
    // 检查单个权限
    if (permission) {
      return hasPermission(permission);
    }

    // 检查多个权限
    if (permissions && permissions.length > 0) {
      if (mode === "all") {
        return permissions.every((p) => hasPermission(p));
      } else {
        return hasAnyPermission(permissions);
      }
    }

    // 检查单个角色
    if (role) {
      return hasRole(role);
    }

    // 检查多个角色
    if (roles && roles.length > 0) {
      return hasAnyRole(roles);
    }

    // 没有指定权限或角色，默认显示
    return true;
  };

  const hasAccess = checkPermission();

  // 无权限且设置为隐藏
  if (!hasAccess && hideOnNoPermission) {
    return null;
  }

  // 无权限且不隐藏，显示替代内容
  if (!hasAccess && !hideOnNoPermission) {
    return <>{fallback}</>;
  }

  // 有权限，渲染按钮
  return <button {...buttonProps}>{children}</button>;
};

export default PermissionButton;
