import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

export enum LogType {
  AUTH = 'auth',           // 认证相关（登录、登出）
  USER = 'user',           // 用户操作
  ROLE = 'role',           // 角色操作
  PERMISSION = 'permission', // 权限操作
  API = 'api',             // API 调用
  SYSTEM = 'system',       // 系统操作
}

@Entity('logs')
@Index(['userId'])
@Index(['type'])
@Index(['level'])
@Index(['createdAt'])
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true, comment: '操作用户ID' })
  userId: number;

  @Column({ length: 100, nullable: true, comment: '用户名' })
  username: string;

  @Column({
    type: 'enum',
    enum: LogType,
    comment: '日志类型',
  })
  type: LogType;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
    comment: '日志级别',
  })
  level: LogLevel;

  @Column({ length: 200, comment: '操作描述' })
  action: string;

  @Column({ length: 20, nullable: true, comment: 'HTTP 方法' })
  method: string;

  @Column({ length: 500, nullable: true, comment: '请求路径' })
  path: string;

  @Column({ type: 'text', nullable: true, comment: '请求参数' })
  params: string;

  @Column({ type: 'text', nullable: true, comment: '响应数据' })
  response: string;

  @Column({ length: 50, nullable: true, comment: 'IP 地址' })
  ip: string;

  @Column({ length: 500, nullable: true, comment: '用户代理' })
  userAgent: string;

  @Column({ type: 'int', nullable: true, comment: '响应时间(ms)' })
  duration: number;

  @Column({ type: 'int', nullable: true, comment: 'HTTP 状态码' })
  statusCode: number;

  @Column({ type: 'text', nullable: true, comment: '错误信息' })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

