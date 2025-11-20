import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { PermissionService } from './services/permission.service';
import { PermissionSyncService } from './services/permission-sync.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { Permission } from '../users/entities/permission.entity';
import { Role } from '../users/entities/role.entity';
import { User } from '../users/entities/user.entity';

@Global()
@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Permission, Role, User]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get<number>('REDIS_TTL') || 3600,
        // Redis store 配置（如果需要）
        // 注意：cache-manager v5 需要不同的配置方式
      }),
    }),
  ],
  providers: [
    PermissionService,
    PermissionSyncService,
    // 全局 JwtAuthGuard，所有接口默认需要认证（使用 @Public() 可以跳过）
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局 PermissionGuard，检查接口权限（在 JwtAuthGuard 之后执行）
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
  exports: [CacheModule, PermissionService, PermissionSyncService, DatabaseModule],
})
export class CommonModule {}
