import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan } from 'typeorm';
import { Log, LogLevel, LogType } from './entities/log.entity';

export interface CreateLogDto {
  userId?: number;
  username?: string;
  type: LogType;
  level?: LogLevel;
  action: string;
  method?: string;
  path?: string;
  params?: any;
  response?: any;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  errorMessage?: string;
}

export interface QueryLogsDto {
  page?: number;
  pageSize?: number;
  userId?: number;
  type?: LogType;
  level?: LogLevel;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private readonly logRepository: Repository<Log>,
  ) {}

  /**
   * 创建日志
   */
  async create(createLogDto: CreateLogDto): Promise<void> {
    try {
      const { params, response, ...rest } = createLogDto;
      
      const log = this.logRepository.create({
        ...rest,
        params: params ? JSON.stringify(params) : undefined,
        response: response ? JSON.stringify(response) : undefined,
      });

      await this.logRepository.save(log);
    } catch (error) {
      // 日志记录失败不影响业务
      console.error('日志记录失败:', error);
    }
  }

  /**
   * 记录认证日志
   */
  async logAuth(
    action: string,
    userId?: number,
    username?: string,
    ip?: string,
    success: boolean = true,
  ): Promise<void> {
    await this.create({
      userId,
      username,
      type: LogType.AUTH,
      level: success ? LogLevel.INFO : LogLevel.WARN,
      action,
      ip,
    });
  }

  /**
   * 记录用户操作日志
   */
  async logUserAction(
    action: string,
    userId: number,
    username: string,
    targetUserId?: number,
  ): Promise<void> {
    await this.create({
      userId,
      username,
      type: LogType.USER,
      level: LogLevel.INFO,
      action: `${action}${targetUserId ? ` (目标用户ID: ${targetUserId})` : ''}`,
    });
  }

  /**
   * 记录 API 调用日志
   */
  async logApiCall(
    method: string,
    path: string,
    userId?: number,
    username?: string,
    statusCode?: number,
    duration?: number,
    ip?: string,
  ): Promise<void> {
    await this.create({
      userId,
      username,
      type: LogType.API,
      level: statusCode && statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO,
      action: `API 调用: ${method} ${path}`,
      method,
      path,
      statusCode,
      duration,
      ip,
    });
  }

  /**
   * 记录错误日志
   */
  async logError(
    action: string,
    errorMessage: string,
    userId?: number,
    username?: string,
  ): Promise<void> {
    await this.create({
      userId,
      username,
      type: LogType.SYSTEM,
      level: LogLevel.ERROR,
      action,
      errorMessage,
    });
  }

  /**
   * 查询日志列表
   */
  async findAll(queryDto: QueryLogsDto) {
    const { page = 1, pageSize = 20, userId, type, level, startDate, endDate } = queryDto;

    const queryBuilder = this.logRepository.createQueryBuilder('log');

    // 筛选条件
    if (userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId });
    }

    if (type) {
      queryBuilder.andWhere('log.type = :type', { type });
    }

    if (level) {
      queryBuilder.andWhere('log.level = :level', { level });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    // 排序和分页
    queryBuilder.orderBy('log.createdAt', 'DESC');
    queryBuilder.skip((page - 1) * pageSize).take(pageSize);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 获取统计数据
   */
  async getStatistics(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalLogs,
      authLogs,
      errorLogs,
      todayLogs,
    ] = await Promise.all([
      this.logRepository.count({
        where: { createdAt: MoreThan(startDate) },
      }),
      this.logRepository.count({
        where: { type: LogType.AUTH, createdAt: MoreThan(startDate) },
      }),
      this.logRepository.count({
        where: { level: LogLevel.ERROR, createdAt: MoreThan(startDate) },
      }),
      this.logRepository.count({
        where: { createdAt: MoreThan(new Date(new Date().setHours(0, 0, 0, 0))) },
      }),
    ]);

    return {
      totalLogs,
      authLogs,
      errorLogs,
      todayLogs,
      days,
    };
  }
}

