import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiResponse } from '../interfaces/response.interface';

/**
 * HTTP 异常过滤器
 * 捕获所有 HTTP 异常并统一格式化错误响应
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // 解析异常信息
    let message = exception.message;
    let error = exception.name;
    let details: any = null;

    if (typeof exceptionResponse === 'object') {
      const resp = exceptionResponse as any;
      message = resp.message || message;
      error = resp.error || error;
      
      // 如果是验证错误，提取详细信息
      if (Array.isArray(resp.message)) {
        details = resp.message;
        message = '数据验证失败';
      }
    }

    // 构建错误响应
    const errorResponse: ApiResponse = {
      success: false,
      code: status,
      message,
      data: {
        error,
        details,
        path: request.url,
        method: request.method,
      },
      timestamp: Date.now(),
    };

    // 记录错误日志
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception.stack,
        'HttpExceptionFilter',
      );
    } else if (status >= 400) {
      this.logger.warn(
        `${request.method} ${request.url} - ${message}`,
        'HttpExceptionFilter',
      );
    }

    response.status(status).json(errorResponse);
  }
}

/**
 * 全局异常过滤器
 * 捕获所有未处理的异常
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let error = 'InternalServerError';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      error = exception.name;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // 构建错误响应
    const errorResponse: ApiResponse = {
      success: false,
      code: status,
      message,
      data: {
        error,
        path: request.url,
        method: request.method,
      },
      timestamp: Date.now(),
    };

    // 记录错误日志
    this.logger.error(
      `${request.method} ${request.url} - ${message}`,
      exception instanceof Error ? exception.stack : exception,
      'AllExceptionsFilter',
    );

    response.status(status).json(errorResponse);
  }
}
