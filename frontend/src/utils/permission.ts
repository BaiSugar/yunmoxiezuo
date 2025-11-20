import type { User, Role, Permission } from '../types';

/**
 * 权限常量定义（嵌套结构，与后端保持一致）
 * 前台用户权限 - 普通用户可访问
 */

const NOVEL_PERMISSIONS = {
  LIST: 'novel:list',                // 查看小说列表
  VIEW: 'novel:view',                // 查看小说详情
  CREATE: 'novel:create',            // 创建小说
  UPDATE: 'novel:update',            // 更新小说
  DELETE: 'novel:delete',            // 删除小说
  PUBLISH: 'novel:publish',          // 发布小说
  EXPORT: 'novel:export',            // 导出小说
} as const;

const PROMPT_PERMISSIONS = {
  LIST: 'prompt:list',               // 查看提示词列表
  VIEW: 'prompt:view',               // 查看提示词详情
  USE: 'prompt:use',                 // 使用提示词
  CREATE: 'prompt:create',           // 创建提示词
  UPDATE: 'prompt:update',           // 更新提示词
  DELETE: 'prompt:delete',           // 删除提示词
  PUBLISH: 'prompt:publish',         // 发布提示词
  STATS: 'prompt:stats',             // 查看统计数据
  BATCH_IMPORT: 'prompt:batch_import', // 批量导入
  EXPORT: 'prompt:export',           // 导出提示词
} as const;

const USER_PERMISSIONS = {
  VIEW: 'user:view',                 // 查看用户信息（自己）
  UPDATE: 'user:update',             // 更新用户信息（自己）
} as const;

// 导出嵌套结构的权限常量
export const PERMISSIONS = {
  NOVEL: NOVEL_PERMISSIONS,
  PROMPT: PROMPT_PERMISSIONS,
  USER: USER_PERMISSIONS,
} as const;

/**
 * 权限工具函数
 * 提供权限检查、角色验证等工具函数
 */

/**
 * 检查用户是否有指定权限
 * @param user 用户对象
 * @param permissionCode 权限代码
 * @returns 是否有权限
 */
export const hasPermission = (user: User | null, permissionCode: string): boolean => {
  if (!user) {
    return false;
  }

  return user.roles.some(role => 
    role.permissions?.some(permission => 
      permission.code === permissionCode
    )
  );
};

/**
 * 检查用户是否有指定角色
 * @param user 用户对象
 * @param roleCode 角色代码
 * @returns 是否有角色
 */
export const hasRole = (user: User | null, roleCode: string): boolean => {
  if (!user) {
    return false;
  }

  return user.roles.some(role => role.code === roleCode);
};

/**
 * 检查用户是否有任意一个指定角色
 * @param user 用户对象
 * @param roleCodes 角色代码数组
 * @returns 是否有任意一个角色
 */
export const hasAnyRole = (user: User | null, roleCodes: string[]): boolean => {
  if (!user) {
    return false;
  }

  return user.roles.some(role => roleCodes.includes(role.code));
};

/**
 * 检查用户是否有所有指定角色
 * @param user 用户对象
 * @param roleCodes 角色代码数组
 * @returns 是否有所有角色
 */
export const hasAllRoles = (user: User | null, roleCodes: string[]): boolean => {
  if (!user) {
    return false;
  }

  const userRoleCodes = user.roles.map(role => role.code);
  return roleCodes.every(roleCode => userRoleCodes.includes(roleCode));
};

/**
 * 检查用户是否有任意一个指定权限
 * @param user 用户对象
 * @param permissionCodes 权限代码数组
 * @returns 是否有任意一个权限
 */
export const hasAnyPermission = (user: User | null, permissionCodes: string[]): boolean => {
  if (!user) {
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
 * @param user 用户对象
 * @param permissionCodes 权限代码数组
 * @returns 是否有所有权限
 */
export const hasAllPermissions = (user: User | null, permissionCodes: string[]): boolean => {
  if (!user) {
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
 * @param user 用户对象
 * @returns 权限数组
 */
export const getUserPermissions = (user: User | null): Permission[] => {
  if (!user) {
    return [];
  }

  return user.roles.flatMap(role => role.permissions || []);
};

/**
 * 获取用户的所有角色
 * @param user 用户对象
 * @returns 角色数组
 */
export const getUserRoles = (user: User | null): Role[] => {
  if (!user) {
    return [];
  }

  return user.roles;
};

/**
 * 检查用户是否为管理员
 * @param user 用户对象
 * @returns 是否为管理员
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'admin') || hasRole(user, 'super_admin');
};

/**
 * 检查用户是否为超级管理员
 * @param user 用户对象
 * @returns 是否为超级管理员
 */
export const isSuperAdmin = (user: User | null): boolean => {
  return hasRole(user, 'super_admin');
};

/**
 * 检查用户是否有管理权限
 * @param user 用户对象
 * @returns 是否有管理权限
 */
export const hasAdminPermission = (user: User | null): boolean => {
  return isAdmin(user) || hasPermission(user, 'admin.access');
};

/**
 * 根据权限类型过滤权限
 * @param permissions 权限数组
 * @param type 权限类型
 * @returns 过滤后的权限数组
 */
export const filterPermissionsByType = (
  permissions: Permission[], 
  type: 'menu' | 'button' | 'api'
): Permission[] => {
  return permissions.filter(permission => permission.type === type);
};

/**
 * 构建权限树
 * @param permissions 权限数组
 * @returns 权限树
 */
export const buildPermissionTree = (permissions: Permission[]): Permission[] => {
  const permissionMap = new Map<number, Permission>();
  const rootPermissions: Permission[] = [];

  // 创建权限映射
  permissions.forEach(permission => {
    permissionMap.set(permission.id, { ...permission, children: [] });
  });

  // 构建树结构
  permissions.forEach(permission => {
    const permissionNode = permissionMap.get(permission.id);
    if (!permissionNode) return;

    if (permission.parentId) {
      const parent = permissionMap.get(permission.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(permissionNode);
      }
    } else {
      rootPermissions.push(permissionNode);
    }
  });

  return rootPermissions;
};

/**
 * 检查权限是否匹配
 * @param userPermission 用户权限代码
 * @param requiredPermission 需要的权限代码
 * @returns 是否匹配
 */
export const isPermissionMatch = (
  userPermission: string, 
  requiredPermission: string
): boolean => {
  // 支持通配符匹配
  if (requiredPermission.includes('*')) {
    const pattern = requiredPermission.replace(/\*/g, '.*');
    const regex = new RegExp(`^${pattern}$`);
    return regex.test(userPermission);
  }

  return userPermission === requiredPermission;
};

/**
 * 权限检查装饰器
 * 用于装饰函数，在执行前检查权限
 * @param permission 需要的权限
 * @param fallback 无权限时的回调
 */
export const withPermission = (
  permission: string,
  fallback?: () => void
) => {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (user: User | null, ...args: any[]) {
      if (!hasPermission(user, permission)) {
        if (fallback) {
          fallback();
        }
        return;
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
};
