import { useAuth } from '../contexts/AuthContext';
import type { Permission } from '../types';

/**
 * 权限检查Hook
 * 提供基于角色和权限的访问控制功能
 */
export const usePermission = () => {
  const { user, isAuthenticated } = useAuth();

  /**
   * 检查用户是否有指定权限
   * @param permissionCode 权限代码
   * @returns 是否有权限
   */
  const hasPermission = (permissionCode: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    // 检查用户角色中的权限
    return user.roles.some(role => 
      role.permissions?.some(permission => 
        permission.code === permissionCode
      )
    );
  };

  /**
   * 检查用户是否有指定角色
   * @param roleCode 角色代码
   * @returns 是否有角色
   */
  const hasRole = (roleCode: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    return user.roles.some(role => role.code === roleCode);
  };

  /**
   * 检查用户是否有任意一个指定角色
   * @param roleCodes 角色代码数组
   * @returns 是否有任意一个角色
   */
  const hasAnyRole = (roleCodes: string[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    return user.roles.some(role => roleCodes.includes(role.code));
  };

  /**
   * 检查用户是否有所有指定角色
   * @param roleCodes 角色代码数组
   * @returns 是否有所有角色
   */
  const hasAllRoles = (roleCodes: string[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    const userRoleCodes = user.roles.map(role => role.code);
    return roleCodes.every(roleCode => userRoleCodes.includes(roleCode));
  };

  /**
   * 检查用户是否有任意一个指定权限
   * @param permissionCodes 权限代码数组
   * @returns 是否有任意一个权限
   */
  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    return user.roles.some(role => 
      role.permissions?.some(permission => 
        permissionCodes.includes(permission.code)
      )
    );
  };

  /**
   * 检查用户是否有所有指定权限
   * @param permissionCodes 权限代码数组
   * @returns 是否有所有权限
   */
  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }

    const userPermissions = user.roles.flatMap(role => 
      role.permissions?.map(permission => permission.code) || []
    );

    return permissionCodes.every(permissionCode => 
      userPermissions.includes(permissionCode)
    );
  };

  /**
   * 获取用户的所有权限
   * @returns 权限数组
   */
  const getUserPermissions = (): Permission[] => {
    if (!isAuthenticated || !user) {
      return [];
    }

    return user.roles.flatMap(role => role.permissions || []);
  };

  /**
   * 获取用户的所有角色
   * @returns 角色数组
   */
  const getUserRoles = () => {
    if (!isAuthenticated || !user) {
      return [];
    }

    return user.roles;
  };

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    getUserRoles,
    isAuthenticated,
    user
  };
};
