import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skipTransform';

/**
 * 跳过响应转换装饰器
 * 使用此装饰器的接口将不会被 TransformInterceptor 包装
 * @example
 * @SkipTransform()
 * @Get('raw')
 * async getRawData() {
 *   return { custom: 'format' };
 * }
 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);

