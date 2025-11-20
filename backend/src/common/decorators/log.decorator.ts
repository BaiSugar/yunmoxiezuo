import { SetMetadata } from '@nestjs/common';

export const LOG_METADATA_KEY = 'log';

/**
 * 日志装饰器
 * 自动记录方法调用日志
 * @param action 操作描述
 * @example
 * @LogAction('创建用户')
 * createUser() { }
 */
export const LogAction = (action: string) => SetMetadata(LOG_METADATA_KEY, action);

