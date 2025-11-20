import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { ApiResponse } from '../interfaces/response.interface';

// 跳过响应转换的装饰器 key
export const SKIP_TRANSFORM_KEY = 'skipTransform';

/**
 * 响应数据转换拦截器
 * 将所有响应统一包装成标准格式
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private reflector: Reflector) {}

  /**
   * 根据HTTP方法和状态码获取默认消息
   */
  private getDefaultMessage(method: string, statusCode: number): string {
    // 如果是 2xx 状态码
    if (statusCode >= 200 && statusCode < 300) {
      const methodMessages: Record<string, string> = {
        GET: '获取成功',
        POST: '创建成功',
        PUT: '更新成功',
        PATCH: '更新成功',
        DELETE: '删除成功',
      };
      return methodMessages[method] || '操作成功';
    }
    return '操作成功';
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // 检查是否跳过转换
    const skipTransform = this.reflector.getAllAndOverride<boolean>(
      SKIP_TRANSFORM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipTransform) {
      return next.handle();
    }

    // 获取 HTTP 上下文
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        // 如果数据已经是标准格式，直接返回
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // 获取 HTTP 状态码和方法
        const statusCode = response.statusCode || 200;
        const method = request.method;

        // 如果返回数据中包含 message 字段，优先使用
        let message = '操作成功';
        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message as string;
          // 移除原始数据中的 message 字段，避免重复
          const { message: _, ...restData } = data as any;
          data = restData as T;
        } else {
          // 否则根据 HTTP 方法和状态码生成默认消息
          message = this.getDefaultMessage(method, statusCode);
        }

        // 包装成标准格式
        return {
          success: true,
          code: statusCode,
          message,
          data,
          timestamp: Date.now(),
        };
      }),
    );
  }
}
