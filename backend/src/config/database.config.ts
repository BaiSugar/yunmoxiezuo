import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from './naming-strategy';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'xiezuo',
    // 自动加载所有在模块中注册的实体（无需手动导入）
    autoLoadEntities: true,
    synchronize: process.env.DB_SYNCHRONIZE === 'true',
    logging: process.env.DB_LOGGING === 'true',
    charset: 'utf8mb4',
    timezone: '+08:00',
    namingStrategy: new SnakeNamingStrategy(), // 自动转换驼峰命名到下划线
    
    // ⚡ 性能优化配置
    poolSize: 10, // 连接池大小
    connectTimeout: 10000, // 连接超时 10秒
    acquireTimeout: 10000, // 获取连接超时 10秒
    extra: {
      connectionLimit: 10, // 最大连接数
      waitForConnections: true, // 等待可用连接
      queueLimit: 0, // 无限队列
    },
    cache: {
      duration: 60000, // 查询缓存 60秒（可选）
    },
  }),
);

