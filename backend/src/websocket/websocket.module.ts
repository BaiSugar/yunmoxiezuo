import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebSocketGateway } from './websocket.gateway';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { WebSocketClientService } from './services/websocket-client.service';
import { WebSocketRateLimitService } from './services/websocket-rate-limit.service';
import { WebSocketThrottleService } from './services/websocket-throttle.service';
import { WebSocketXssFilterService } from './services/websocket-xss-filter.service';
import { AuthModule } from '../auth/auth.module';

/**
 * WebSocket 模块
 * 
 * 提供实时通信功能：
 * - JWT认证
 * - 速率限制
 * - 消息节流
 * - XSS防护
 * - 客户端管理
 */
@Module({
  imports: [
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'default-secret',
        signOptions: {
          expiresIn: 604800, // 7天（秒）
        },
      }),
    }),
  ],
  providers: [
    WebSocketGateway,
    WsJwtAuthGuard,
    WebSocketClientService,
    WebSocketRateLimitService,
    WebSocketThrottleService,
    WebSocketXssFilterService,
  ],
  exports: [
    WebSocketGateway,
    WebSocketClientService,
    WebSocketXssFilterService,
  ],
})
export class WebSocketModule {}

