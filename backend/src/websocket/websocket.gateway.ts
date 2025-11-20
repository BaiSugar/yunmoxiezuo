import {
  WebSocketGateway as WsGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { WebSocketClientService } from './services/websocket-client.service';
import { WebSocketRateLimitService } from './services/websocket-rate-limit.service';
import { WebSocketThrottleService } from './services/websocket-throttle.service';
import { WsMessageDto } from './dto/websocket.dto';
import { WsMessage, WsMessageType } from './interfaces/websocket-message.interface';

/**
 * WebSocket Gateway
 * 
 * 功能：
 * 1. 处理WebSocket连接、断开
 * 2. 处理心跳消息
 * 3. 广播消息
 * 4. 集成认证、速率限制、节流
 */
@WsGateway({
  cors: {
    origin: '*', // 生产环境应该配置具体的域名
    credentials: true,
  },
  namespace: '/', // 使用根命名空间
  transports: ['websocket', 'polling'], // 支持的传输方式
  // 注意：不设置path，使用Socket.IO默认路径 /socket.io
})
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);
  
  // 通知去重：记录已推送的通知ID（按用户分组）
  private readonly pushedNotifications = new Map<number, Set<string>>();
  
  // 待审核申请去重：记录已推送的申请通知（按用户分组）
  private readonly pushedPendingApplications = new Map<number, Set<string>>();

  constructor(
    private readonly clientService: WebSocketClientService,
    private readonly rateLimitService: WebSocketRateLimitService,
    private readonly throttleService: WebSocketThrottleService,
    private readonly wsJwtAuthGuard: WsJwtAuthGuard,
  ) {}

  /**
   * 设置服务实例（用于避免循环依赖）
   * 注意：使用setter避免循环依赖
   */
  private promptApplicationService: any;
  private notificationsService: any;
  private bookCreationService: any;

  setPromptApplicationService(service: any) {
    this.promptApplicationService = service;
  }

  setNotificationsService(service: any) {
    this.notificationsService = service;
  }

  setBookCreationService(service: any) {
    this.bookCreationService = service;
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

    // 方式2: 从查询参数获取 (兼容旧版本 ws://host/socket.io/?token=xxx)
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

  /**
   * Gateway初始化
   */
  afterInit(server: Server): void {
    this.logger.log('WebSocket Gateway 初始化完成');
    
    // 每30秒清理一次超时连接
    setInterval(() => {
      this.clientService.cleanupInactiveConnections();
    }, 30 * 1000);
  }

  /**
   * 客户端连接
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      this.logger.debug(`新连接尝试: ${client.id}`);
      
      // 🔒 提取并验证Token
      const token = this.extractToken(client);
      
      // 调试日志
      this.logger.debug(`Token提取结果: ${token ? '已获取 (' + token.length + ' 字符)' : '未获取'}`);
      this.logger.debug(`Auth对象: ${JSON.stringify(client.handshake.auth)}`);
      this.logger.debug(`Query参数: ${JSON.stringify(client.handshake.query)}`);
      this.logger.debug(`Authorization头: ${client.handshake.headers.authorization ? '存在' : '不存在'}`);
      
      if (!token) {
        this.logger.warn(`缺少Token，拒绝连接: ${client.id}`);
        client.emit('message', {
          type: 'error',
          data: { code: 'UNAUTHORIZED', message: '缺少认证令牌' },
        });
        client.disconnect(true);
        return;
      }
      
      this.logger.debug(`Token已获取，准备验证...`);

      // 🔐 使用Guard验证Token并附加用户信息
      try {
        this.logger.debug(`开始验证Token, Socket: ${client.id}`);
        const canActivate = await this.wsJwtAuthGuard.canActivate({
          switchToWs: () => ({
            getClient: () => client,
          }),
        } as any);

        if (!canActivate) {
          throw new Error('Token验证失败');
        }
        this.logger.debug(`Token验证成功, Socket: ${client.id}`);
      } catch (error) {
        this.logger.warn(`JWT认证失败: ${error.message}, Socket: ${client.id}`);
        this.logger.debug(`错误类型: ${error.constructor.name}`);
        this.logger.debug(`错误堆栈: ${error.stack}`);
        
        // 发送详细的错误信息
        const errorMessage = error.message || '认证失败';
        client.emit('message', {
          type: 'error',
          data: { 
            code: 'UNAUTHORIZED', 
            message: '认证失败: ' + errorMessage,
            details: error.constructor.name,
          },
        });
        client.disconnect(true);
        return;
      }

      const userId = client.data.user?.id;
      const username = client.data.user?.username;

      if (!userId) {
        this.logger.warn(`用户信息未附加，拒绝连接: ${client.id}`);
        client.disconnect(true);
        return;
      }

      // 添加客户端
      this.clientService.addClient(client);

      // 发送欢迎消息
      const welcomeMessage: WsMessage = {
        type: 'connection:success',
        data: {
          message: '连接成功',
          userId,
          username,
          timestamp: Date.now(),
        },
      };
      client.emit('message', welcomeMessage);

      this.logger.log(`✅ 客户端已连接: ${username} (${userId}), Socket: ${client.id}`);

      // 🔔 推送未读通知（离线期间的通知）
      await this.pushUnreadNotifications(userId);

      // 🔔 检查是否有待审核的提示词申请
      await this.checkPendingApplications(userId);
    } catch (error) {
      this.logger.error(`连接处理失败: ${error.message}`, error.stack);
      client.emit('message', {
        type: 'error',
        data: { code: 'CONNECTION_ERROR', message: error.message },
      });
      client.disconnect(true);
    }
  }

  /**
   * 推送用户的未读通知（带去重机制）
   */
  private async pushUnreadNotifications(userId: number): Promise<void> {
    try {
      if (!this.notificationsService) {
        return;
      }

      // 获取用户已推送的通知ID集合
      let userPushedIds = this.pushedNotifications.get(userId);
      if (!userPushedIds) {
        userPushedIds = new Set<string>();
        this.pushedNotifications.set(userId, userPushedIds);
      }

      const count = await this.notificationsService.pushUnreadNotifications(userId, userPushedIds);
      if (count > 0) {
        this.logger.log(`📬 推送了 ${count} 条未读通知给用户 ${userId}（去重后）`);
      }
    } catch (error) {
      this.logger.error(`推送未读通知失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 检查用户是否有待审核的提示词申请
   * 如果有，推送通知
   */
  private async checkPendingApplications(userId: number): Promise<void> {
    try {
      if (!this.promptApplicationService) {
        return; // 服务未注入，跳过
      }

      // 获取用户已推送的申请通知ID集合
      let userPushedPendingIds = this.pushedPendingApplications.get(userId);
      if (!userPushedPendingIds) {
        userPushedPendingIds = new Set<string>();
        this.pushedPendingApplications.set(userId, userPushedPendingIds);
      }

      // 查询待审核申请
      const pendingApplications = await this.promptApplicationService.findPendingApplications(userId);
      
      if (pendingApplications && pendingApplications.length > 0) {
        // 按提示词分组统计
        const promptGroups = new Map<number, { name: string; count: number; applications: any[] }>();
        
        for (const app of pendingApplications) {
          const promptId = app.promptId;
          const promptName = app.prompt?.name || '未知提示词';
          
          if (!promptGroups.has(promptId)) {
            promptGroups.set(promptId, {
              name: promptName,
              count: 0,
              applications: [],
            });
          }
          
          const group = promptGroups.get(promptId)!;
          group.count++;
          group.applications.push(app);
        }

        // 为每个提示词发送一条通知（带去重）
        let pushedCount = 0;
        for (const [promptId, group] of promptGroups) {
          const notificationId = `pending-applications-${promptId}`;
          
          // 检查是否已推送过
          if (userPushedPendingIds.has(notificationId)) {
            continue; // 跳过已推送的通知
          }
          
          const message: WsMessage = {
            type: WsMessageType.NOTIFICATION_NEW,
            data: {
              id: notificationId,
              title: `您有待审核的提示词申请`,
              content: `提示词「${group.name}」有 ${group.count} 条待审核申请`,
              category: 'prompt-pending-applications',
              level: 'info',
              action: {
                text: '立即查看',
                url: `/dashboard/prompts/${promptId}/permissions`,
              },
              extra: {
                promptId,
                promptName: group.name,
                count: group.count,
                applications: group.applications.map(app => ({
                  id: app.id,
                  userId: app.userId,
                  username: app.user?.username,
                  reason: app.reason,
                  createdAt: app.createdAt,
                })),
              },
              createdAt: new Date(),
            },
            timestamp: Date.now(),
          };

          this.sendToUser(userId, message);
          
          // 记录已推送的通知ID
          userPushedPendingIds.add(notificationId);
          pushedCount++;
        }

        if (pushedCount > 0) {
          this.logger.log(`📬 推送了 ${pushedCount} 条待审核申请通知给用户 ${userId}（去重后）`);
        }
      }
    } catch (error) {
      // 静默失败，不影响连接
      this.logger.error(`检查待审核申请失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 客户端断开
   */
  handleDisconnect(client: Socket): void {
    const userId = client.data.user?.id;
    const username = client.data.user?.username;
    
    this.clientService.removeClient(client);
    
    this.logger.log(`客户端已断开: ${username} (${userId})`);
  }

  /**
   * 处理心跳消息
   */
  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): void {
    const userId = client.data.user?.id;

    // 🔒 安全检查：必须登录才能发送心跳
    if (!userId) {
      this.logger.warn(`未认证的客户端尝试发送心跳: ${client.id}`);
      const errorMessage: WsMessage = {
        type: WsMessageType.ERROR,
        data: {
          code: 'UNAUTHORIZED',
          message: '未授权，请先登录',
        },
      };
      client.emit('message', errorMessage);
      client.disconnect(true);
      return;
    }

    // 检查速率限制（心跳每分钟最多120次）
    if (!this.rateLimitService.checkLimit(userId, { maxRequests: 120 })) {
      this.logger.warn(`用户 ${userId} 心跳频率过高`);
      return;
    }

    // 更新心跳时间
    this.clientService.updateHeartbeat(client.id);

    // 回复pong
    const pongMessage: WsMessage = {
      type: WsMessageType.PONG,
      data: {
        timestamp: Date.now(),
      },
    };
    client.emit('message', pongMessage);
  }

  /**
   * 处理通用消息（预留，根据需要扩展）
   */
  @SubscribeMessage('message')
  @UsePipes(new ValidationPipe({ transform: true }))
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: WsMessageDto,
  ): void {
    const userId = client.data.user?.id;

    // 🔒 安全检查：必须登录才能发送消息
    if (!userId) {
      this.logger.warn(`未认证的客户端尝试发送消息: ${client.id}`);
      const errorMessage: WsMessage = {
        type: WsMessageType.ERROR,
        data: {
          code: 'UNAUTHORIZED',
          message: '未授权，请先登录',
        },
      };
      client.emit('message', errorMessage);
      client.disconnect(true);
      return;
    }

    // 检查速率限制
    if (!this.rateLimitService.checkLimit(userId)) {
      const errorMessage: WsMessage = {
        type: WsMessageType.ERROR,
        data: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: '消息发送频率过高，请稍后再试',
        },
      };
      client.emit('message', errorMessage);
      return;
    }

    this.logger.debug(`收到消息: ${dto.type} from 用户 ${userId}`);

    // 这里可以根据消息类型分发到不同的处理器
    // 目前主要用于心跳，其他业务消息由服务端主动推送
  }

  /**
   * 广播消息给所有在线用户
   */
  broadcastToAll(message: WsMessage): void {
    this.clientService.broadcastToAll(message);
  }

  /**
   * 发送消息给指定用户
   */
  sendToUser(userId: number, message: WsMessage): void {
    this.clientService.sendToUser(userId, message);
  }

  /**
   * 发送消息给指定角色
   */
  sendToRole(roleName: string, message: WsMessage): void {
    this.clientService.sendToRole(roleName, message);
  }

  /**
   * 批量发送消息（带节流）
   */
  sendToUsersThrottled(userIds: number[], message: WsMessage): void {
    // 如果用户数量较少，直接发送
    if (userIds.length <= 10) {
      this.clientService.sendToUsers(userIds, message);
      return;
    }

    // 用户数量较多时，使用节流
    const key = `batch:${Date.now()}`;
    this.throttleService.addMessage(
      key,
      message,
      (messages) => {
        // 合并消息
        const merged = WebSocketThrottleService.mergeMessages(messages);
        for (const msg of merged) {
          this.clientService.sendToUsers(userIds, msg);
        }
      },
      {
        interval: 1000, // 1秒
        maxBatch: 5,    // 最多5条
      },
    );
  }

  /**
   * 获取在线统计
   */
  getOnlineStats(): { users: number; connections: number } {
    return {
      users: this.clientService.getOnlineUserCount(),
      connections: this.clientService.getOnlineConnectionCount(),
    };
  }

  /**
   * 检查用户是否在线
   */
  isUserOnline(userId: number): boolean {
    return this.clientService.isUserOnline(userId);
  }

  /**
   * 加入一键成书任务房间
   */
  @SubscribeMessage('join_book_creation_room')
  @UseGuards(WsJwtAuthGuard)
  async handleJoinBookCreationRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: number },
  ): Promise<void> {
    const userId = client.data.user?.id;
    const username = client.data.user?.username;
    
    this.logger.log(`📥 收到加入房间请求 - Socket: ${client.id}, 用户: ${userId} (${username}), 任务: ${data.taskId}`);
    this.logger.debug(`client.data.user: ${JSON.stringify(client.data.user)}`);

    if (!userId) {
      this.logger.warn(`❌ 用户未授权 - Socket: ${client.id}`);
      this.logger.debug(`客户端数据: ${JSON.stringify(client.data)}`);
      client.emit('message', {
        type: 'error',
        data: { code: 'UNAUTHORIZED', message: '未授权' },
      });
      return;
    }

    // 检查 bookCreationService 是否已注入
    if (!this.bookCreationService) {
      this.logger.error(`❌ BookCreationService 未注入！`);
      client.emit('message', {
        type: 'error',
        data: { code: 'SERVICE_ERROR', message: '服务未就绪，请稍后再试' },
      });
      return;
    }

    try {
      // 验证任务所有权
      this.logger.debug(`🔍 验证任务所有权 - 用户: ${userId}, 任务: ${data.taskId}`);
      await this.bookCreationService.getTask(data.taskId, userId);
      this.logger.debug(`✓ 任务验证通过`);

      // 验证通过，加入房间
      const roomName = `book-creation-${data.taskId}`;
      client.join(roomName);

      this.logger.log(`✅ 用户 ${userId} 成功加入房间: ${roomName}`);

      client.emit('message', {
        type: 'book_creation:room_joined',
        data: { taskId: data.taskId, message: '已加入任务房间' },
      });
    } catch (error) {
      this.logger.warn(
        `❌ 用户 ${userId} 尝试加入任务 ${data.taskId} 失败: ${error.message}`,
      );
      this.logger.error(`错误堆栈:`, error.stack);
      
      client.emit('message', {
        type: 'error',
        data: { 
          code: 'FORBIDDEN', 
          message: error.message || '无权访问此任务',
          details: error.response?.message || undefined,
        },
      });
    }
  }

  /**
   * 离开一键成书任务房间
   */
  @SubscribeMessage('leave_book_creation_room')
  @UseGuards(WsJwtAuthGuard)
  handleLeaveBookCreationRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: number },
  ): void {
    const roomName = `book-creation-${data.taskId}`;
    client.leave(roomName);

    this.logger.log(`客户端离开一键成书房间: ${roomName}`);

    client.emit('message', {
      type: 'book_creation:room_left',
      data: { taskId: data.taskId, message: '已离开任务房间' },
    });
  }

  /**
   * 发送一键成书进度更新
   * 供服务层调用
   */
  emitBookCreationProgress(taskId: number, data: any): void {
    // 安全检查：确保 server 已初始化
    if (!this.server) {
      this.logger.warn(`⚠️ [WebSocket] Server 未初始化，无法推送消息`);
      return;
    }

    const roomName = `book-creation-${taskId}`;
    const message = {
      taskId,
      timestamp: new Date().toISOString(),
      ...data,
    };
    
    // 获取房间中的客户端数量
    try {
      const room = this.server.sockets?.adapter?.rooms?.get(roomName);
      const clientCount = room ? room.size : 0;
      
      console.log(`📡 [WebSocket] 推送消息到房间 ${roomName} (${clientCount} 个客户端):`, message);
      
      if (clientCount === 0) {
        console.warn(`⚠️ [WebSocket] 房间 ${roomName} 中没有客户端！`);
      }
      
      this.server.to(roomName).emit('book_creation_progress', message);
      console.log(`✓ [WebSocket] 消息已发送`);
    } catch (error) {
      this.logger.error(`❌ [WebSocket] 推送消息失败:`, error);
    }
  }
}

