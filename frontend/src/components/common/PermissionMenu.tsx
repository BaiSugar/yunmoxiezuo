import React from "react";
import { usePermission } from "../../hooks/usePermission";

interface MenuItem {
  /** 菜单项ID */
  id: string;
  /** 菜单项文本 */
  label: string;
  /** 菜单项图标 */
  icon?: React.ReactNode;
  /** 菜单项链接 */
  href?: string;
  /** 点击事件 */
  onClick?: () => void;
  /** 子菜单 */
  children?: MenuItem[];
  /** 需要的权限代码 */
  permission?: string;
  /** 需要的权限代码数组 */
  permissions?: string[];
  /** 需要的角色代码 */
  role?: string;
  /** 需要的角色代码数组 */
  roles?: string[];
  /** 权限检查模式 */
  mode?: "any" | "all";
}

interface PermissionMenuProps {
  /** 菜单项数组 */
  items: MenuItem[];
  /** 菜单容器类名 */
  className?: string;
  /** 菜单项类名 */
  itemClassName?: string;
  /** 子菜单类名 */
  submenuClassName?: string;
  /** 无权限时是否隐藏菜单项 */
  hideOnNoPermission?: boolean;
  /** 渲染菜单项的函数 */
  renderItem?: (item: MenuItem, hasAccess: boolean) => React.ReactNode;
}

/**
 * 权限控制菜单组件
 * 根据用户权限显示或隐藏菜单项
 */
const PermissionMenu: React.FC<PermissionMenuProps> = ({
  items,
  className = "",
  itemClassName = "",
  submenuClassName = "",
  hideOnNoPermission = true,
  renderItem,
}) => {
  const { hasPermission, hasRole, hasAnyRole, hasAnyPermission } =
    usePermission();

  // 检查菜单项权限
  const checkItemPermission = (item: MenuItem): boolean => {
    // 检查单个权限
    if (item.permission) {
      return hasPermission(item.permission);
    }

    // 检查多个权限
    if (item.permissions && item.permissions.length > 0) {
      if (item.mode === "all") {
        return item.permissions.every((p) => hasPermission(p));
      } else {
        return hasAnyPermission(item.permissions);
      }
    }

    // 检查单个角色
    if (item.role) {
      return hasRole(item.role);
    }

    // 检查多个角色
    if (item.roles && item.roles.length > 0) {
      return hasAnyRole(item.roles);
    }

    // 没有指定权限或角色，默认显示
    return true;
  };

  // 递归过滤菜单项
  const filterMenuItems = (menuItems: MenuItem[]): MenuItem[] => {
    const filtered = menuItems
      .map((item) => {
        const hasAccess = checkItemPermission(item);

        if (!hasAccess && hideOnNoPermission) {
          return null;
        }

        // 处理子菜单
        let filteredChildren: MenuItem[] | undefined;
        if (item.children && item.children.length > 0) {
          filteredChildren = filterMenuItems(item.children);
          // 如果所有子菜单都被过滤掉，且当前项无权限，则隐藏
          if (filteredChildren.length === 0 && !hasAccess) {
            return null;
          }
        }

        return {
          ...item,
          ...(filteredChildren !== undefined && { children: filteredChildren }),
        };
      })
      .filter((item): item is MenuItem => item !== null);
    
    return filtered;
  };

  // 渲染菜单项
  const renderMenuItem = (
    item: MenuItem,
    level: number = 0
  ): React.ReactNode => {
    const hasAccess = checkItemPermission(item);

    // 如果使用自定义渲染函数
    if (renderItem) {
      return renderItem(item, hasAccess);
    }

    // 默认渲染
    const content = (
      <div className={`menu-item ${itemClassName} ${level > 0 ? "ml-4" : ""}`}>
        {item.icon && <span className="menu-icon">{item.icon}</span>}
        <span className="menu-label">{item.label}</span>
      </div>
    );

    // 如果有链接
    if (item.href) {
      return (
        <a
          href={item.href}
          className={`block px-4 py-2 text-sm hover:bg-gray-100 ${itemClassName}`}
        >
          {content}
        </a>
      );
    }

    // 如果有点击事件
    if (item.onClick) {
      return (
        <button
          onClick={item.onClick}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${itemClassName}`}
        >
          {content}
        </button>
      );
    }

    return content;
  };

  // 渲染菜单
  const renderMenu = (
    menuItems: MenuItem[],
    level: number = 0
  ): React.ReactNode => {
    const filteredItems = filterMenuItems(menuItems);

    if (filteredItems.length === 0) {
      return null;
    }

    return (
      <ul className={`menu-list ${level > 0 ? submenuClassName : ""}`}>
        {filteredItems.map((item) => (
          <li key={item.id} className="menu-item-wrapper">
            {renderMenuItem(item, level)}
            {item.children && item.children.length > 0 && (
              <div className="submenu">
                {renderMenu(item.children, level + 1)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <nav className={`permission-menu ${className}`}>{renderMenu(items)}</nav>
  );
};

export default PermissionMenu;
