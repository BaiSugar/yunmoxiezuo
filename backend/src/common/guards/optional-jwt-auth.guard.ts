import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 可选的 JWT 认证 Guard
 * 如果有 token 则验证，没有 token 也允许通过
 * 用于那些需要支持登录和未登录两种状态的接口
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // 尝试调用父类的 canActivate
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // 即使没有用户信息也返回（不抛出异常）
    // 这样接口就可以同时支持登录和未登录状态
    return user || null;
  }
}
