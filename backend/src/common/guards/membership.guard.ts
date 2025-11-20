import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipPermissionsService } from '../../memberships/services/membership-permissions.service';
import { MEMBERSHIP_LEVEL_KEY, MEMBERSHIP_FEATURE_KEY } from '../decorators/require-membership.decorator';

/**
 * 会员权限 Guard
 * 
 * 检查用户会员等级和权益
 */
@Injectable()
export class MembershipGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly membershipPermissions: MembershipPermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取所需的会员等级
    const requiredLevel = this.reflector.getAllAndOverride<number>(
      MEMBERSHIP_LEVEL_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 获取所需的会员权益
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      MEMBERSHIP_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 如果没有要求，直接通过
    if (!requiredLevel && !requiredFeature) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未登录');
    }

    // 检查会员等级
    if (requiredLevel) {
      const hasLevel = await this.membershipPermissions.checkMinLevel(
        user.id,
        requiredLevel,
      );

      if (!hasLevel) {
        throw new ForbiddenException(`需要 ${requiredLevel} 级或以上会员`);
      }
    }

    // 检查会员权益
    if (requiredFeature) {
      const hasFeature = await this.membershipPermissions.hasFeature(
        user.id,
        requiredFeature,
      );

      if (!hasFeature) {
        throw new ForbiddenException(`需要开通 ${requiredFeature} 权益`);
      }
    }

    return true;
  }
}
