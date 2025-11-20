/**
 * 紧急权限绕过工具
 * 用于调试权限问题
 */

import type { User, LoginUser } from '../types';

/**
 * 检查是否是超级管理员（紧急绕过）
 */
export const isSuperAdmin = (user: User | LoginUser | null): boolean => {
  if (!user || !user.roles || user.roles.length === 0) {
    return false;
  }

  // 获取角色代码
  let roleCodes: string[] = [];
  
  if (typeof user.roles[0] === 'string') {
    roleCodes = user.roles as string[];
  } else {
    roleCodes = (user.roles as any[]).map(role => role.code);
  }
  
  return roleCodes.includes('super_admin');
};

/**
 * 紧急权限检查（绕过正常权限逻辑）
 */
export const emergencyHasPermission = (user: User | LoginUser | null, permissionCode: string): boolean => {
  console.log('🚨 紧急权限检查:', { user, permissionCode });
  
  if (!user) {
    return false;
  }
  
  // 超级管理员拥有所有权限
  if (isSuperAdmin(user)) {
    console.log('✅ 紧急权限：超级管理员通过');
    return true;
  }
  
  // 其他情况暂时返回 true，用于调试
  console.log('⚠️ 紧急权限：临时通过');
  return true;
};
