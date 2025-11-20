import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { LogsService } from '../../logs/logs.service';
import { LOG_METADATA_KEY } from '../decorators/log.decorator';

/**
 * 日志拦截器
 * 自动记录 API 调用和重要操作
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(
    private reflector: Reflector,
    private logsService: LogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, headers } = request;
    const userAgent = headers['user-agent'];
    const startTime = Date.now();

    // 获取装饰器中定义的操作描述
    const action = this.reflector.get<string>(
      LOG_METADATA_KEY,
      context.getHandler(),
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = context.switchToHttp().getResponse().statusCode;

          // 如果有操作描述，记录详细日志
          if (action) {
            this.logsService
              .create({
                userId: user?.id,
                username: user?.username,
                type: this.getLogType(url),
                action,
                method,
                path: url,
                ip,
                userAgent,
                duration,
                statusCode,
              })
              .catch((err) => this.logger.error('日志记录失败', err));
          }

          // 慢查询警告（超过 3 秒）
          if (duration > 3000) {
            this.logger.warn(
              `慢查询: ${method} ${url} - ${duration}ms`,
              'SlowQuery',
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;

          // 记录错误日志
          this.logsService
            .logError(
              action || `API 错误: ${method} ${url}`,
              error.message,
              user?.id,
              user?.username,
            )
            .catch((err) => this.logger.error('错误日志记录失败', err));

          // 打印错误日志
          this.logger.error(
            `${method} ${url} - ${error.message} (${duration}ms)`,
            error.stack,
          );
        },
      }),
    );
  }

  /**
   * 根据 URL 判断日志类型
   */
  private getLogType(url: string): any {
    if (url.includes('/auth/')) return 'auth';
    if (url.includes('/users/')) return 'user';
    if (url.includes('/roles/')) return 'role';
    if (url.includes('/permissions/')) return 'permission';
    return 'api';
  }
}

