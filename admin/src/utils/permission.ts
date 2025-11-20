// 权限检查工具函数
import type { User, LoginUser, Role } from '../types';
import type { Permission } from '../types/permission';

/**
 * 检查用户是否有指定权限
 * @param user 用户对象
 * @param permissionCode 权限代码
 * @returns 是否有权限
 */
export const hasPermission = (user: User | LoginUser | null, permissionCode: string): boolean => {
  console.log('🔍 权限检查开始:', { 
    user: user?.username, 
    roles: user?.roles,
    permissionCode 
  });
  
  if (!user || !user.roles || user.roles.length === 0) {
    console.log('❌ 用户或角色不存在');
    return false;
  }

  // 获取角色代码列表
  let roleCodes: string[] = [];
  
  if (typeof user.roles[0] === 'string') {
    // LoginUser 类型（roles 是 string[]）
    roleCodes = user.roles as string[];
    console.log('📝 LoginUser 角色代码:', roleCodes);
  } else {
    // User 类型（roles 是 Role[]）
    roleCodes = (user.roles as Role[]).map(role => role.code);
    console.log('📝 User 角色代码:', roleCodes);
  }
  
  // 超级管理员拥有所有权限
  if (roleCodes.includes('super_admin')) {
    console.log('✅ 超级管理员权限通过');
    return true;
  }
  
  // 管理员角色拥有大部分权限（除了超级管理员专用权限）
  if (roleCodes.includes('admin')) {
    // 管理员不能删除系统角色和超级管理员权限
    if (permissionCode.includes('system') || permissionCode.includes('super_admin')) {
      console.log('❌ 管理员无系统权限');
      return false;
    }
    console.log('✅ 管理员权限通过');
    return true;
  }
  
  console.log('❌ 无管理员权限');
  return false;
};

/**
 * 检查用户是否有菜单权限
 * @param user 用户对象
 * @param menuCode 菜单权限代码
 * @returns 是否有菜单权限
 */
export const hasMenuPermission = (user: User | LoginUser | null, menuCode: string): boolean => {
  return hasPermission(user, menuCode);
};

/**
 * 检查用户是否有按钮权限
 * @param user 用户对象
 * @param buttonCode 按钮权限代码
 * @returns 是否有按钮权限
 */
export const hasButtonPermission = (user: User | LoginUser | null, buttonCode: string): boolean => {
  return hasPermission(user, buttonCode);
};

/**
 * 检查用户是否有API权限
 * @param user 用户对象
 * @param apiCode API权限代码
 * @returns 是否有API权限
 */
export const hasApiPermission = (user: User | LoginUser | null, apiCode: string): boolean => {
  return hasPermission(user, apiCode);
};

/**
 * 获取用户的所有权限代码
 * @param user 用户对象
 * @returns 权限代码数组
 */
export const getUserPermissions = (user: User | LoginUser | null): string[] => {
  if (!user || !user.roles || user.roles.length === 0) {
    return [];
  }

  // 如果是 LoginUser 类型，返回角色代码
  if (typeof user.roles[0] === 'string') {
    return user.roles as string[];
  }

  // 如果是 User 类型，返回所有权限代码
  const roles = user.roles as Role[];
  const permissions: string[] = [];
  
  roles.forEach(role => {
    if (role.permissions) {
      role.permissions.forEach((permission: Permission) => {
        if (permission.status === 'active') {
          permissions.push(permission.code);
        }
      });
    }
  });
  
  return [...new Set(permissions)]; // 去重
};

/**
 * 检查用户是否有任一权限
 * @param user 用户对象
 * @param permissionCodes 权限代码数组
 * @returns 是否有任一权限
 */
export const hasAnyPermission = (user: User | LoginUser | null, permissionCodes: string[]): boolean => {
  return permissionCodes.some(code => hasPermission(user, code));
};

/**
 * 检查用户是否有所有权限
 * @param user 用户对象
 * @param permissionCodes 权限代码数组
 * @returns 是否有所有权限
 */
export const hasAllPermissions = (user: User | LoginUser | null, permissionCodes: string[]): boolean => {
  return permissionCodes.every(code => hasPermission(user, code));
};

/**
 * 权限常量定义（嵌套结构，与后端保持一致）
 * 后台管理系统权限 - 只有管理员可以访问
 */

const DASHBOARD_PERMISSIONS = {
  VIEW: 'dashboard:view',
} as const;

const USER_PERMISSIONS = {
  LIST: 'user:list',
  VIEW: 'user:view',
  CREATE: 'user:create',
  UPDATE: 'user:update',
  DELETE: 'user:delete',
  BAN: 'user:ban',
  ASSIGN_ROLES: 'user:assign_roles',
} as const;

const ROLE_PERMISSIONS = {
  VIEW: 'permission:role:view',
  LIST: 'permission:role:list',
  CREATE: 'permission:role:create',
  UPDATE: 'permission:role:update',
  DELETE: 'permission:role:delete',
  ASSIGN: 'permission:role:assign',
} as const;

const PERMISSION_PERMISSIONS = {
  VIEW: 'permission:view',
  LIST: 'permission:list',
  CREATE: 'permission:create',
  UPDATE: 'permission:update',
  DELETE: 'permission:delete',
} as const;

const PROMPT_PERMISSIONS = {
  CATEGORY_VIEW: 'prompt:category:view',
  CATEGORY_CREATE: 'prompt:category:create',
  CATEGORY_UPDATE: 'prompt:category:update',
  CATEGORY_DELETE: 'prompt:category:delete',
  MANAGE_ALL: 'prompt:manage:all',
  BAN: 'prompt:ban',
  UNBAN: 'prompt:unban',
  REPORT_REVIEW: 'prompt:report:review',
} as const;

const AI_MODEL_PERMISSIONS = {
  // 提供商管理
  PROVIDER_CREATE: 'ai:provider:create',
  PROVIDER_READ: 'ai:provider:read',
  PROVIDER_UPDATE: 'ai:provider:update',
  PROVIDER_DELETE: 'ai:provider:delete',
  PROVIDER_TEST: 'ai:provider:test',
  // 模型管理
  MODEL_CREATE: 'ai:model:create',
  MODEL_READ: 'ai:model:read',
  MODEL_UPDATE: 'ai:model:update',
  MODEL_DELETE: 'ai:model:delete',
  // 聊天补全
  CHAT_CREATE: 'ai:chat:create',
  CHAT_READ: 'ai:chat:read',
} as const;

const ANNOUNCEMENT_PERMISSIONS = {
  VIEW: 'announcement:view',
  CREATE: 'announcement:create',
  READ: 'announcement:read',
  UPDATE: 'announcement:update',
  DELETE: 'announcement:delete',
  PUBLISH: 'announcement:publish',
  PUSH: 'announcement:push',
  STATS: 'announcement:stats',
} as const;

const MEMBERSHIP_PERMISSIONS = {
  // 会员套餐管理（管理员）
  PLAN_VIEW: 'membership:plan:view',
  PLAN_CREATE: 'membership:plan:create',
  PLAN_READ: 'membership:plan:read',
  PLAN_UPDATE: 'membership:plan:update',
  PLAN_DELETE: 'membership:plan:delete',
  // 用户会员管理（管理员）
  USER_VIEW: 'membership:user:view',
  USER_ACTIVATE: 'membership:user:activate',
  // 会员功能入口（前端菜单，根据会员等级显示）
  ACCESS_ADVANCED_MODELS: 'membership:feature:advanced_models',
  ACCESS_API: 'membership:feature:api',
  ACCESS_ANALYTICS: 'membership:feature:analytics',
  ACCESS_PRIORITY_SUPPORT: 'membership:feature:priority_support',
} as const;

const TOKEN_PACKAGE_PERMISSIONS = {
  VIEW: 'token:package:view',
  CREATE: 'token:package:create',
  READ: 'token:package:read',
  UPDATE: 'token:package:update',
  DELETE: 'token:package:delete',
} as const;

const REDEMPTION_CODE_PERMISSIONS = {
  VIEW: 'redemption:code:view',
  CREATE: 'redemption:code:create',
  READ: 'redemption:code:read',
  UPDATE: 'redemption:code:update',
  DELETE: 'redemption:code:delete',
  BATCH_GENERATE: 'redemption:code:batch',
  EXPORT: 'redemption:code:export',
} as const;

const TOKEN_CONSUMPTION_PERMISSIONS = {
  VIEW_RECORDS: 'token-consumption:view-records',
  VIEW_STATISTICS: 'token-consumption:view-statistics',
  ADMIN_MANAGE: 'token-consumption:admin-manage',
  RESET_QUOTA: 'token-consumption:reset-quota',
} as const;

const TOOL_PERMISSIONS = {
  VIEW: 'tool:view',
  MANAGE: 'tool:manage',
  UPDATE: 'tool:update',
  USE: 'tool:use',
} as const;

const SYSTEM_SETTINGS_PERMISSIONS = {
  VIEW: 'system-settings:view',
  READ: 'system-settings:read',
  UPDATE: 'system-settings:update',
  UPDATE_BATCH: 'system-settings:update-batch',
} as const;

const EMAIL_TEMPLATE_PERMISSIONS = {
  VIEW: 'email:template:view',
  CREATE: 'email:template:create',
  UPDATE: 'email:template:update',
  DELETE: 'email:template:delete',
} as const;

const FONT_PERMISSIONS = {
  VIEW: 'font:view',
  UPLOAD: 'font:upload',
  UPDATE: 'font:update',
  DELETE: 'font:delete',
} as const;

// 导出嵌套结构的权限常量
export const PERMISSIONS = {
  DASHBOARD: DASHBOARD_PERMISSIONS,
  USER: USER_PERMISSIONS,
  ROLE: ROLE_PERMISSIONS,
  PERMISSION: PERMISSION_PERMISSIONS,
  PROMPT: PROMPT_PERMISSIONS,
  AI_MODEL: AI_MODEL_PERMISSIONS,
  ANNOUNCEMENT: ANNOUNCEMENT_PERMISSIONS,
  MEMBERSHIP: MEMBERSHIP_PERMISSIONS,
  TOKEN_PACKAGE: TOKEN_PACKAGE_PERMISSIONS,
  REDEMPTION_CODE: REDEMPTION_CODE_PERMISSIONS,
  TOKEN_CONSUMPTION: TOKEN_CONSUMPTION_PERMISSIONS,
  TOOL: TOOL_PERMISSIONS,
  SYSTEM_SETTINGS: SYSTEM_SETTINGS_PERMISSIONS,
  EMAIL_TEMPLATE: EMAIL_TEMPLATE_PERMISSIONS,
  FONT: FONT_PERMISSIONS,
} as const;

/**
 * 角色常量定义
 * 后台管理系统角色 - 只有管理员角色
 */
export const ROLES = {
  SUPER_ADMIN: 'super_admin',  // 超级管理员
  ADMIN: 'admin',              // 普通管理员
} as const;
