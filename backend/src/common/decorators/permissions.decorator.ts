import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export interface PermissionOptions {
  matchAll?: boolean; // true: 需要所有权限(AND), false: 需要任一权限(OR)
}

/**
 * 权限装饰器
 * @param permissions 权限代码数组
 * @param options 配置选项
 * @example
 * // 需要 user:create 权限
 * @RequirePermissions('user:create')
 *
 * // 需要 user:view 或 user:list 权限之一
 * @RequirePermissions('user:view', 'user:list')
 *
 * // 需要同时拥有 user:ban 和 user:update 权限
 * @RequirePermissions('user:ban', 'user:update', { matchAll: true })
 */
export const RequirePermissions = (...args: any[]) => {
  let permissions: string[] = [];
  let options: PermissionOptions = { matchAll: false };

  // 解析参数
  if (args.length > 0) {
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'object' && !Array.isArray(lastArg) && lastArg !== null) {
      options = lastArg as PermissionOptions;
      permissions = args.slice(0, -1) as string[];
    } else {
      permissions = args as string[];
    }
  }

  return SetMetadata(PERMISSIONS_KEY, { permissions, options });
};

