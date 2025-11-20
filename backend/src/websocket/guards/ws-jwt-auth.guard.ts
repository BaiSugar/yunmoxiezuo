import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../../auth/auth.service';
import { WsAuthPayload } from '../interfaces/websocket-message.interface';

/**
 * WebSocket JWT 认证守卫
 * 
 * 功能：
 * 1. 验证连接时的JWT Token
 * 2. 将用户信息附加到socket对象
 * 3. 拒绝未授权的连接
 */
@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsJwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      
      // 从查询参数或握手头中提取token
      const token = this.extractToken(client);
      
      if (!token) {
        this.logger.warn(`[WsJwtAuthGuard] Token 提取失败, Socket: ${client.id}`);
        throw new WsException('缺少认证令牌');
      }

      this.logger.debug(`[WsJwtAuthGuard] Token 已提取 (${token.length} 字符), 准备验证...`);

      // 验证JWT Token
      let payload: WsAuthPayload;
      try {
        payload = await this.jwtService.verifyAsync(token);
        this.logger.debug(`[WsJwtAuthGuard] JWT 验证成功, 用户ID: ${payload.sub}`);
      } catch (error) {
        this.logger.warn(`[WsJwtAuthGuard] JWT 验证失败: ${error.message}`);
        throw new WsException('Token 无效或已过期: ' + error.message);
      }
      
      // 验证用户是否存在且状态正常
      let user;
      try {
        user = await this.authService.validateUser(payload.sub);
      } catch (error) {
        this.logger.warn(`[WsJwtAuthGuard] 用户验证失败: ${error.message}`);
        throw new WsException(error.message || '用户不存在或状态异常');
      }
      
      if (!user) {
        this.logger.warn(`[WsJwtAuthGuard] 用户不存在或状态异常, 用户ID: ${payload.sub}`);
        throw new WsException('用户不存在或状态异常');
      }

      // 将用户信息附加到socket对象
      client.data.user = {
        id: user.id,
        username: user.username,
        roles: user.roles?.map(r => r.name) || [],
      };

      this.logger.debug(`[WsJwtAuthGuard] 认证成功, 用户: ${user.username} (${user.id})`);
      return true;
    } catch (error) {
      this.logger.error(`[WsJwtAuthGuard] 认证异常: ${error.message}`);
      throw new WsException('认证失败: ' + error.message);
    }
  }

  /**
   * 从Socket连接中提取Token
   */
  private extractToken(client: Socket): string | null {
    // 方式1: 从 auth 对象获取 (Socket.IO v3+ 推荐方式)
    const authToken = (client.handshake.auth as any)?.token;
    if (authToken) {
      return authToken;
    }

    // 方式2: 从查询参数获取 (ws://host/ws?token=xxx)
    const queryToken = client.handshake.query.token as string;
    if (queryToken) {
      return queryToken;
    }

    // 方式3: 从认证头获取 (Authorization: Bearer xxx)
    const authHeader = client.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }
}

