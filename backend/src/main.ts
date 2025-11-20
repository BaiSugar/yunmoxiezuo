import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as express from 'express';
import * as mysql from 'mysql2/promise';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'; // 已禁用
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './common/filters/http-exception.filter';

// 自动创建数据库
async function ensureDatabaseExists(configService: ConfigService) {
  const dbHost = configService.get<string>('database.host');
  const dbPort = configService.get<number>('database.port');
  const dbUsername = configService.get<string>('database.username');
  const dbPassword = configService.get<string>('database.password');
  const dbName = configService.get<string>('database.database');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      port: dbPort,
      user: dbUsername,
      password: dbPassword,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    console.log(`✅ 数据库 '${dbName}' 已存在或创建成功。`);
  } catch (error) {
    console.error(`❌ 数据库连接或创建失败:`, error);
    process.exit(1); // 失败时退出
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function bootstrap() {
  // 在创建 Nest 应用之前，无法直接注入 ConfigService
  // 因此，我们先创建一个临时的、只加载配置模块的应用实例
  const tempApp = await NestFactory.createApplicationContext(AppModule);
  const configService = tempApp.get(ConfigService);

  // 确保数据库存在
  await ensureDatabaseExists(configService);
  await tempApp.close(); // 关闭临时应用

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 获取配置服务
  const reflector = app.get(Reflector);

  // 启用信任代理（用于正确获取客户端IP和协议）
  app.set('trust proxy', true);

  // 配置请求体大小限制（支持大章节内容，50MB 足够支持 mediumtext 的 16MB 限制）
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 启用 CORS
  app.enableCors();

  // 配置静态文件服务（上传的文件）
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动删除未定义的属性
      forbidNonWhitelisted: true, // 当出现未定义属性时抛出错误
      transform: true, // 自动转换类型
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局拦截器（按顺序执行）
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector), //  序列化拦截器（排除 @Exclude() 字段）
    new TransformInterceptor(reflector), //  响应转换拦截器（统一格式）
    app.get(LoggingInterceptor), // 日志拦截器（已禁用，避免控制台输出过多日志）
  );

  // 全局异常过滤器（按顺序执行）
  app.useGlobalFilters(
    new AllExceptionsFilter(), // 1. 捕获所有异常
    new HttpExceptionFilter(), // 2. 处理 HTTP 异常
  );

  // Swagger 文档配置（仅在非生产环境启用）
  const nodeEnv = configService.get<string>('NODE_ENV') || 'development';
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('AI 写作平台 API')
      .setDescription('AI 写作平台后端 API 文档')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('认证', '用户认证相关接口')
      .addTag('用户', '用户管理相关接口')
      .addTag('角色', '角色管理相关接口')
      .addTag('权限', '权限管理相关接口')
      .addTag('作品管理', '作品CRUD相关接口')
      .addTag('分卷管理', '分卷CRUD相关接口')
      .addTag('章节管理', '章节和版本管理相关接口')
      .addTag('人物卡管理', '人物卡CRUD相关接口')
      .addTag('世界观管理', '世界观设定CRUD相关接口')
      .addTag('备忘录管理', '备忘录CRUD相关接口')
      .addTag('作品管理 - 文件上传', '封面图片上传相关接口')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // 启动服务
  const port = configService.get<number>('PORT') || 5000;
  await app.listen(port);

  console.log(`\n🚀 应用已启动！`);
  console.log(`📝 API 地址: http://localhost:${port}`);
  console.log(`🌍 运行环境: ${nodeEnv}`);
  
  if (nodeEnv !== 'production') {
    console.log(`📚 API 文档: http://localhost:${port}/api/docs`);
  }
}

bootstrap();
