import { SetMetadata } from '@nestjs/common';

export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

/**
 * 可选认证装饰器
 * 使用此装饰器的接口支持登录和未登录两种状态
 * 有 token 时会验证并注入用户信息，没有 token 时也允许访问
 * @example
 * @OptionalAuth()
 * @Get()
 * async findAll(@CurrentUser('id') userId?: number) {}
 */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
