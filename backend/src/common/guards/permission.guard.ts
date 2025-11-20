import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionService } from '../services/permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取装饰器中定义的权限
    const permissionMetadata = this.reflector.getAllAndOverride<{
      permissions: string[];
      options: { matchAll?: boolean };
    }>(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    // 如果没有定义权限要求，直接放行
    if (!permissionMetadata || permissionMetadata.permissions.length === 0) {
      return true;
    }

    const { permissions: requiredPermissions, options } = permissionMetadata;
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 如果没有用户信息（未登录），拒绝访问
    if (!user) {
      throw new ForbiddenException('未登录或登录已过期');
    }

    // 超级管理员拥有所有权限
    if (this.permissionService.isSuperAdmin(user)) {
      return true;
    }

    // 获取用户的所有权限
    const userPermissions = await this.permissionService.getUserPermissions(
      user.id,
    );

    // 检查权限
    const hasPermission = options.matchAll
      ? this.checkAllPermissions(requiredPermissions, userPermissions)
      : this.checkAnyPermission(requiredPermissions, userPermissions);

    if (!hasPermission) {
      throw new ForbiddenException(
        `缺少必要的权限: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * 检查是否拥有任一权限（OR）
   */
  private checkAnyPermission(
    required: string[],
    userPermissions: string[],
  ): boolean {
    return required.some((permission) =>
      userPermissions.includes(permission),
    );
  }

  /**
   * 检查是否拥有所有权限（AND）
   */
  private checkAllPermissions(
    required: string[],
    userPermissions: string[],
  ): boolean {
    return required.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}

