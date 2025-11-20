// 用户相关工具函数
import type { LoginUser, User } from '../types/user';
import type { Role } from '../types/role';

/**
 * 判断是否是LoginUser类型（roles是字符串数组）
 */
export function isLoginUser(user: LoginUser | User): user is LoginUser {
  return user.roles.length > 0 && typeof user.roles[0] === 'string';
}

/**
 * 获取用户的第一个角色名称
 * 注意：如果是LoginUser类型，只能显示角色代码，建议登录后立即调用getProfile获取完整信息
 */
export function getUserRoleName(user: LoginUser | User | null): string {
  if (!user || !user.roles || user.roles.length === 0) {
    return '未知角色';
  }

  if (isLoginUser(user)) {
    // roles是字符串数组，只能返回角色代码
    // 建议在登录后调用 getProfile API 获取完整的用户信息
    return user.roles[0]; // 返回角色代码，如 "super_admin"
  } else {
    // roles是Role对象数组，返回角色名称
    return (user.roles as Role[])[0]?.name || '未知角色';
  }
}

/**
 * 获取用户的所有角色名称
 */
export function getUserRoleNames(user: LoginUser | User | null): string[] {
  if (!user || !user.roles || user.roles.length === 0) {
    return ['未知角色'];
  }

  if (isLoginUser(user)) {
    // roles是字符串数组，只能返回角色代码
    return user.roles;
  } else {
    // roles是Role对象数组，返回角色名称
    return (user.roles as Role[]).map(role => role.name);
  }
}

