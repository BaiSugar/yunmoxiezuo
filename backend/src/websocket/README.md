# WebSocket 模块

## 概述

WebSocket模块提供实时双向通信能力，支持公告推送、系统通知、在线状态等实时功能。

## 目录结构

```
websocket/
├── guards/
│   └── ws-jwt-auth.guard.ts           # WebSocket JWT认证守卫
├── services/
│   ├── websocket-client.service.ts    # 客户端连接管理
│   ├── websocket-rate-limit.service.ts # 速率限制
│   ├── websocket-throttle.service.ts  # 消息节流
│   └── websocket-xss-filter.service.ts # XSS防护
├── interfaces/
│   └── websocket-message.interface.ts # 消息接口定义
├── dto/
│   └── websocket.dto.ts               # DTO定义
├── websocket.gateway.ts               # WebSocket Gateway
├── websocket.module.ts                # WebSocket模块
├── index.ts                           # 导出文件
└── README.md                          # 本文件
```

## 核心功能

### 1. JWT认证 (WsJwtAuthGuard)

- ✅ 连接时验证JWT Token
- ✅ 从查询参数或请求头提取Token
- ✅ 验证用户存在且状态正常
- ✅ 将用户信息附加到Socket对象

**使用方式**:
```typescript
@UseGuards(WsJwtAuthGuard)
@WebSocketGateway()
export class MyGateway {
  @SubscribeMessage('message')
  handleMessage(@ConnectedSocket() client: Socket) {
    const user = client.data.user; // 获取用户信息
  }
}
```

### 2. 客户端管理 (WebSocketClientService)

- ✅ 管理所有在线连接
- ✅ 支持按用户ID、角色查找客户端
- ✅ 广播消息到指定客户端
- ✅ 自动清理断开的连接

**API**:
```typescript
// 添加客户端
addClient(socket: Socket): void

// 移除客户端
removeClient(socket: Socket): void

// 广播给所有用户
broadcastToAll(message: WsMessage): void

// 发送给指定用户
sendToUser(userId: number, message: WsMessage): void

// 发送给指定角色
sendToRole(roleName: string, message: WsMessage): void

// 批量发送
sendToUsers(userIds: number[], message: WsMessage): void

// 检查用户是否在线
isUserOnline(userId: number): boolean
```

### 3. 速率限制 (WebSocketRateLimitService)

- ✅ 基于滑动窗口的速率限制
- ✅ 防止恶意客户端频繁发送消息
- ✅ 自动清理过期记录

**配置**:
```typescript
// 默认配置: 每分钟最多60条消息
{
  windowMs: 60 * 1000,  // 60秒
  maxRequests: 60,
}
```

**API**:
```typescript
// 检查速率限制
checkLimit(userId: number, config?: Partial<RateLimitConfig>): boolean

// 重置限制
reset(userId: number): void

// 获取状态
getStatus(userId: number): { count: number; limit: number; resetAt: number } | null
```

### 4. 消息节流 (WebSocketThrottleService)

- ✅ 频繁推送时自动节流
- ✅ 批量推送多个消息
- ✅ 自动合并相同类型消息

**配置**:
```typescript
// 默认配置: 每2秒最多推送10条消息
{
  interval: 2000,      // 2秒
  maxBatch: 10,        // 最多10条
}
```

**API**:
```typescript
// 添加消息到节流队列
addMessage(
  key: string,
  message: WsMessage,
  callback: (messages: WsMessage[]) => void,
  config?: Partial<ThrottleConfig>,
): void

// 清除队列
clear(key: string): void

// 合并消息
static mergeMessages(messages: WsMessage[]): WsMessage[]
```

### 5. XSS防护 (WebSocketXssFilterService)

- ✅ 过滤HTML标签
- ✅ 转义特殊字符
- ✅ 清理危险内容
- ✅ 验证URL安全

**API**:
```typescript
// 清理HTML内容
sanitizeHtml(html: string, strict?: boolean): string

// 移除所有HTML标签
stripAllTags(html: string): string

// 转义HTML特殊字符
escapeHtml(text: string): string

// 清理对象中的所有字符串字段
sanitizeObject<T>(obj: T, strict?: boolean): T

// 验证URL是否安全
isUrlSafe(url: string): boolean

// 清理公告内容
sanitizeAnnouncement(announcement: any): any
```

## 消息格式

所有WebSocket消息都遵循统一格式：

```typescript
interface WsMessage<T = any> {
  type: WsMessageType | string;  // 消息类型
  data: T;                        // 消息数据
  timestamp?: number;             // 时间戳（毫秒）
}
```

## 消息类型

```typescript
enum WsMessageType {
  // 系统消息
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
  
  // 公告相关
  ANNOUNCEMENT_NEW = 'announcement:new',
  ANNOUNCEMENT_UPDATE = 'announcement:update',
  ANNOUNCEMENT_DELETE = 'announcement:delete',
  
  // 通知相关
  NOTIFICATION_NEW = 'notification:new',
  
  // 聊天相关
  CHAT_MESSAGE = 'chat:message',
  
  // 用户相关
  USERS_ONLINE = 'users:online',
}
```

## 使用示例

### 在Service中推送消息

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketGateway } from '../websocket/websocket.gateway';
import { WebSocketXssFilterService } from '../websocket/services/websocket-xss-filter.service';
import { WsMessage, WsMessageType } from '../websocket/interfaces/websocket-message.interface';

@Injectable()
export class MyService {
  constructor(
    private readonly wsGateway: WebSocketGateway,
    private readonly xssFilter: WebSocketXssFilterService,
  ) {}

  async sendNotification(userId: number, content: string): Promise<void> {
    // 清理内容，防止XSS
    const sanitizedContent = this.xssFilter.sanitizeHtml(content);

    // 构建消息
    const message: WsMessage = {
      type: WsMessageType.NOTIFICATION_NEW,
      data: {
        content: sanitizedContent,
        timestamp: Date.now(),
      },
    };

    // 推送给指定用户
    this.wsGateway.sendToUser(userId, message);
  }

  async broadcastAnnouncement(announcement: any): Promise<void> {
    // 清理公告内容
    const sanitized = this.xssFilter.sanitizeAnnouncement(announcement);

    // 构建消息
    const message: WsMessage = {
      type: WsMessageType.ANNOUNCEMENT_NEW,
      data: sanitized,
      timestamp: Date.now(),
    };

    // 广播给所有用户
    this.wsGateway.broadcastToAll(message);
  }
}
```

### 扩展Gateway处理自定义消息

```typescript
import { SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway()
export class MyCustomGateway extends WebSocketGateway {
  @SubscribeMessage('custom:message')
  handleCustomMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): void {
    const userId = client.data.user?.id;

    // 检查速率限制
    if (!this.rateLimitService.checkLimit(userId)) {
      // 发送错误消息
      return;
    }

    // 处理自定义消息
    console.log('收到自定义消息:', data);
  }
}
```

## 集成到现有模块

### 1. 导入WebSocketModule

```typescript
import { Module } from '@nestjs/common';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    WebSocketModule,
  ],
  // ...
})
export class MyModule {}
```

### 2. 注入WebSocket服务

```typescript
import { Injectable } from '@nestjs/common';
import { WebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class MyService {
  constructor(
    private readonly wsGateway: WebSocketGateway,
  ) {}

  async doSomething() {
    // 使用WebSocket推送消息
    this.wsGateway.broadcastToAll({
      type: 'custom:event',
      data: { message: 'Hello World' },
    });
  }
}
```

## 性能优化

### 1. 批量推送

当需要推送给多个用户时，使用 `sendToUsersThrottled` 代替多次 `sendToUser`：

```typescript
// ❌ 不推荐
for (const userId of userIds) {
  this.wsGateway.sendToUser(userId, message);
}

// ✅ 推荐
this.wsGateway.sendToUsersThrottled(userIds, message);
```

### 2. 消息合并

使用节流服务自动合并相同类型的消息：

```typescript
this.throttleService.addMessage(
  'my-key',
  message,
  (messages) => {
    // 合并消息
    const merged = WebSocketThrottleService.mergeMessages(messages);
    // 批量发送
    for (const msg of merged) {
      this.wsGateway.broadcastToAll(msg);
    }
  },
);
```

### 3. 增量更新

只推送变化的数据，而不是完整对象：

```typescript
// ❌ 不推荐：推送完整对象
const message = {
  type: 'data:update',
  data: fullObject,  // 很大的对象
};

// ✅ 推荐：只推送变化
const message = {
  type: 'data:update',
  data: {
    id: 1,
    changes: { status: 'active' },  // 只包含变化的字段
  },
};
```

## 安全最佳实践

### 1. 始终验证Token

Gateway已经使用了 `@UseGuards(WsJwtAuthGuard)`，确保所有连接都经过认证。

### 2. 过滤所有用户输入

```typescript
// ✅ 推荐
const sanitized = this.xssFilter.sanitizeHtml(userInput);

// ❌ 不推荐：直接使用用户输入
this.wsGateway.broadcastToAll({
  type: 'message',
  data: { content: userInput },  // 可能包含XSS代码
});
```

### 3. 检查速率限制

对于用户主动发送的消息，始终检查速率限制：

```typescript
if (!this.rateLimitService.checkLimit(userId)) {
  // 拒绝请求
  return;
}
```

### 4. 最小权限原则

只推送用户有权限查看的内容：

```typescript
// 根据用户权限过滤内容
if (user.roles.includes('admin')) {
  // 推送完整信息
} else {
  // 推送部分信息
}
```

## 监控和调试

### 获取在线统计

```typescript
const stats = this.wsGateway.getOnlineStats();
console.log(`在线用户: ${stats.users}, 连接数: ${stats.connections}`);
```

### 检查用户是否在线

```typescript
if (this.wsGateway.isUserOnline(userId)) {
  // 用户在线，可以推送
} else {
  // 用户不在线，保存到数据库稍后推送
}
```

### 查看日志

WebSocket模块会自动记录关键操作：

- 连接/断开
- 消息推送
- 速率限制警告
- 错误和异常

## 故障排查

### 连接失败

1. 检查JWT_SECRET环境变量
2. 检查Token是否有效
3. 查看服务端日志

### 收不到消息

1. 检查用户是否在线
2. 检查消息类型是否正确
3. 检查权限配置

### 性能问题

1. 查看在线用户数
2. 检查消息推送频率
3. 查看速率限制日志
4. 优化消息大小

## 环境变量

```env
# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## 依赖

- `@nestjs/websockets`: ^10.0.0
- `@nestjs/platform-socket.io`: ^10.0.0
- `socket.io`: ^4.6.0
- `compression`: ^1.7.4

## 相关文档

- [WebSocket API文档](../../../API/22-WebSocket实时推送.md)
- [公告系统文档](../../../API/20-公告系统.md)
- [前端WebSocket指南](../../../frontend/src/services/WEBSOCKET_GUIDE.md)

## 未来计划

- [ ] Redis适配器支持（多服务器）
- [ ] 消息持久化（离线消息）
- [ ] 消息确认机制
- [ ] 更细粒度的权限控制
- [ ] WebSocket统计面板
- [ ] 消息重试机制

