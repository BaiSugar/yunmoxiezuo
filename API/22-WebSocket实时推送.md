# WebSocket 实时推送系统

## 概述

WebSocket系统提供实时双向通信能力，支持公告推送、系统通知、在线状态等实时功能。

### 核心特性

- ✅ **JWT认证**: 连接时验证Token，确保安全性
- ✅ **权限检查**: 根据用户角色推送不同内容
- ✅ **速率限制**: 防止恶意客户端频繁发送消息
- ✅ **消息节流**: 频繁推送时自动节流和批量处理
- ✅ **XSS防护**: 所有推送内容自动过滤危险代码
- ✅ **自动重连**: 客户端断线自动重连（最多5次）
- ✅ **心跳保活**: 定期心跳保持连接活跃
- ✅ **多端支持**: 同一用户可同时在线多个设备

## 连接方式

### WebSocket URL

```
ws://your-domain/ws?token=<accessToken>
wss://your-domain/ws?token=<accessToken>  (生产环境使用HTTPS)
```

### 连接参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token | string | 是 | JWT访问令牌 |

### 连接示例

**JavaScript**:
```javascript
const token = localStorage.getItem('accessToken');
const ws = new WebSocket(`ws://localhost:3000/ws?token=${token}`);

ws.onopen = () => {
  console.log('WebSocket连接成功');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('收到消息:', message);
};

ws.onerror = (error) => {
  console.error('WebSocket错误:', error);
};

ws.onclose = () => {
  console.log('WebSocket连接关闭');
};
```

**Socket.IO (推荐)**:
```javascript
import { io } from 'socket.io-client';

const token = localStorage.getItem('accessToken');
const socket = io('http://localhost:3000', {
  path: '/ws',
  transports: ['websocket', 'polling'],
  query: { token },
});

socket.on('connect', () => {
  console.log('连接成功');
});

socket.on('message', (message) => {
  console.log('收到消息:', message);
});

socket.on('disconnect', () => {
  console.log('连接断开');
});
```

## 消息格式

### 标准消息格式

所有WebSocket消息都遵循统一格式：

```typescript
interface WsMessage<T = any> {
  type: string;           // 消息类型
  data: T;                // 消息数据
  timestamp?: number;     // 时间戳（毫秒）
}
```

## 消息类型

### 1. 系统消息

#### 1.1 连接成功

**类型**: `connection:success`

**方向**: 服务端 → 客户端

**触发时机**: 客户端成功连接后

**数据格式**:
```json
{
  "type": "connection:success",
  "data": {
    "message": "连接成功",
    "userId": 123,
    "username": "张三",
    "timestamp": 1706271600000
  },
  "timestamp": 1706271600000
}
```

#### 1.2 心跳 (Ping/Pong)

**客户端发送**:
```json
{
  "type": "ping",
  "data": {
    "timestamp": 1706271600000
  }
}
```

**服务端响应**:
```json
{
  "type": "pong",
  "data": {
    "timestamp": 1706271601000
  }
}
```

**说明**:
- 客户端应每30秒发送一次心跳
- 服务端会立即响应pong消息
- 超过5分钟无心跳，服务端会断开连接

#### 1.3 错误消息

**类型**: `error`

**方向**: 服务端 → 客户端

**数据格式**:
```json
{
  "type": "error",
  "data": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "消息发送频率过高，请稍后再试"
  },
  "timestamp": 1706271600000
}
```

**常见错误码**:
- `RATE_LIMIT_EXCEEDED`: 超出速率限制
- `UNAUTHORIZED`: 未授权
- `INVALID_MESSAGE`: 无效消息格式
- `INTERNAL_ERROR`: 服务器内部错误

### 2. 公告消息

#### 2.1 新公告推送

**类型**: `announcement:new`

**方向**: 服务端 → 客户端

**触发时机**: 
- 管理员发布新公告时
- 管理员手动推送公告时

**数据格式**:
```json
{
  "type": "announcement:new",
  "data": {
    "id": 1,
    "title": "系统维护通知",
    "content": "<p>今晚22:00-23:00系统维护</p>",
    "summary": "今晚22:00-23:00系统维护",
    "type": "maintenance",
    "level": "warning",
    "isPopup": true,
    "needRead": false,
    "linkText": "查看详情",
    "linkUrl": "https://example.com/notice/1",
    "startTime": "2024-01-26T10:00:00.000Z",
    "endTime": "2024-01-27T10:00:00.000Z",
    "publishedAt": "2024-01-26T10:00:00.000Z"
  },
  "timestamp": 1706271600000
}
```

**字段说明**:
- `type`: 公告类型 (notice/maintenance/event)
- `level`: 重要级别 (info/success/warning/error)
- `isPopup`: 是否弹窗显示
- `needRead`: 是否需要确认已读
- 内容已自动过滤XSS，可安全显示

#### 2.2 公告更新

**类型**: `announcement:update`

**方向**: 服务端 → 客户端

**数据格式**: 同 `announcement:new`

#### 2.3 公告删除

**类型**: `announcement:delete`

**方向**: 服务端 → 客户端

**数据格式**:
```json
{
  "type": "announcement:delete",
  "data": {
    "id": 1
  },
  "timestamp": 1706271600000
}
```

### 3. 通知消息

#### 3.1 新通知

**类型**: `notification:new`

**方向**: 服务端 → 客户端

**数据格式**:
```json
{
  "type": "notification:new",
  "data": {
    "id": 1,
    "title": "您的作品已通过审核",
    "content": "恭喜您，作品《示例小说》已通过审核",
    "category": "system",
    "isRead": false,
    "createdAt": "2024-01-26T10:00:00.000Z"
  },
  "timestamp": 1706271600000
}
```

### 4. 在线用户

#### 4.1 在线用户列表

**类型**: `users:online`

**方向**: 服务端 → 客户端

**数据格式**:
```json
{
  "type": "users:online",
  "data": {
    "count": 120,
    "users": [
      {
        "id": 1,
        "username": "张三",
        "status": "online"
      }
    ]
  },
  "timestamp": 1706271600000
}
```

## 推送策略

### 目标类型

公告推送支持以下目标类型：

1. **全部用户** (`all`)
   - 广播给所有在线用户
   - 不考虑用户角色和权限

2. **指定用户** (`user`)
   - 只推送给指定的用户ID列表
   - 支持批量推送（带节流）

3. **指定角色** (`role`)
   - 推送给拥有指定角色的所有用户
   - 例如：管理员、VIP会员等

4. **指定会员等级** (`membership`)
   - 推送给指定会员等级的用户
   - 例如：白银会员、黄金会员等

### 推送时机

1. **自动推送**
   - 发布公告时，如果设置了 `isPush=true` 且 `isPopup=true`
   - 自动推送给目标用户

2. **手动推送**
   - 管理员可通过API手动推送已发布的公告
   - 适用于需要重新提醒的场景

## 性能优化

### 1. 消息节流

当目标用户数量超过10个时，自动启用节流：

- **节流间隔**: 2秒
- **最大批量**: 10条消息
- **自动合并**: 相同类型的消息会自动合并

### 2. 批量推送

- 小于10个用户：立即推送
- 大于10个用户：分批推送，避免服务器压力
- 自动合并重复消息

### 3. 增量更新

- 只推送变化的数据
- 数组数据自动合并
- 减少带宽占用

### 4. 压缩

- 使用Socket.IO自带的压缩功能
- 大消息自动压缩
- 节省带宽

## 安全措施

### 1. Token验证

- 每次连接都验证JWT Token
- Token过期自动断开连接
- 支持Token刷新重连

### 2. 权限检查

- 推送前检查用户权限
- 根据角色过滤推送内容
- 防止越权访问

### 3. 速率限制

**默认限制**:
- 普通消息: 60条/分钟
- 心跳消息: 120条/分钟

**超出限制**:
- 返回错误消息
- 记录警告日志
- 不会断开连接

### 4. XSS防护

**自动过滤**:
- 移除script和style标签
- 移除事件处理属性 (onclick等)
- 清理危险协议 (javascript:, data:等)
- 保留安全的HTML标签

**严格模式字段** (移除所有HTML):
- username, email, phone
- title, name

**标准模式字段** (保留安全HTML):
- content

### 5. 连接管理

- 记录所有连接信息
- 定期清理超时连接（5分钟无心跳）
- 防止连接泄漏

## 客户端最佳实践

### 1. 自动重连

```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 3000; // 3秒

function connect() {
  const socket = io('http://localhost:3000', {
    path: '/ws',
    query: { token: getToken() },
  });

  socket.on('disconnect', () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      setTimeout(() => {
        console.log(`重连第 ${reconnectAttempts} 次...`);
        connect();
      }, reconnectDelay * reconnectAttempts);
    }
  });

  socket.on('connect', () => {
    reconnectAttempts = 0;
    console.log('连接成功');
  });

  return socket;
}
```

### 2. 心跳保活

```javascript
let heartbeatTimer;

function startHeartbeat(socket) {
  heartbeatTimer = setInterval(() => {
    socket.emit('message', {
      type: 'ping',
      data: { timestamp: Date.now() },
    });
  }, 30000); // 30秒
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
  }
}

socket.on('connect', () => startHeartbeat(socket));
socket.on('disconnect', () => stopHeartbeat());
```

### 3. 消息处理

```javascript
socket.on('message', (message) => {
  switch (message.type) {
    case 'announcement:new':
      handleNewAnnouncement(message.data);
      break;
    case 'notification:new':
      handleNewNotification(message.data);
      break;
    case 'error':
      handleError(message.data);
      break;
    default:
      console.log('未知消息类型:', message.type);
  }
});
```

### 4. 错误处理

```javascript
socket.on('error', (error) => {
  console.error('WebSocket错误:', error);
  
  if (error.message.includes('认证失败')) {
    // Token过期，刷新Token后重连
    refreshToken().then((newToken) => {
      socket.io.opts.query.token = newToken;
      socket.connect();
    });
  }
});
```

## 监控和日志

### 在线统计

可通过Gateway获取当前在线统计：

```typescript
const stats = wsGateway.getOnlineStats();
// {
//   users: 120,       // 在线用户数
//   connections: 150  // 连接数（一个用户可能有多个连接）
// }
```

### 检查用户是否在线

```typescript
const isOnline = wsGateway.isUserOnline(userId);
```

### 日志

系统会自动记录：
- 连接/断开日志
- 消息推送日志
- 错误和警告日志
- 速率限制日志

## 故障排查

### 连接失败

1. **检查Token是否有效**
   - Token格式是否正确
   - Token是否过期
   - Token权限是否足够

2. **检查网络**
   - 防火墙是否阻止WebSocket
   - 代理是否支持WebSocket
   - CORS配置是否正确

3. **检查服务端**
   - WebSocket服务是否启动
   - 端口是否正确
   - 日志是否有错误

### 收不到消息

1. **检查订阅**
   - 是否正确监听message事件
   - 消息类型是否匹配
   - 事件处理函数是否正确

2. **检查权限**
   - 用户是否有权限接收该消息
   - 目标类型是否包含当前用户
   - 角色权限是否正确

3. **检查服务端**
   - 推送是否成功
   - 用户是否在线
   - 日志是否有错误

### 频繁断开

1. **检查心跳**
   - 是否定期发送心跳
   - 心跳间隔是否合理
   - 网络是否稳定

2. **检查速率限制**
   - 是否超出速率限制
   - 消息发送频率是否过高
   - 日志是否有警告

3. **检查服务器**
   - 服务器负载是否过高
   - 内存是否充足
   - 是否有其他错误

## 相关API

### 手动推送公告

**接口**: `POST /api/v1/announcements/:id/push`

**权限**: `announcement:push`

**请求参数**:
```json
{}
```

**响应**:
```json
{
  "code": 200,
  "message": "推送成功",
  "data": null
}
```

## 更新日志

### v1.0.0 (2024-01-26)

- ✅ 实现WebSocket基础功能
- ✅ 集成JWT认证
- ✅ 实现速率限制
- ✅ 实现消息节流
- ✅ 实现XSS防护
- ✅ 集成公告推送功能
- ✅ 支持多种推送策略

## 技术栈

- **框架**: NestJS + Socket.IO
- **认证**: JWT
- **协议**: WebSocket + HTTP长轮询（降级）
- **压缩**: Socket.IO自带压缩

## 性能指标

- **单服务器支持**: 10,000+ 并发连接
- **消息延迟**: < 100ms
- **重连时间**: < 3秒
- **内存占用**: 每个连接约 10KB

## 注意事项

1. **生产环境使用WSS**
   - 使用HTTPS时必须使用WSS
   - 配置SSL证书

2. **负载均衡**
   - 使用Redis做消息中转
   - 启用Sticky Session

3. **监控告警**
   - 监控在线人数
   - 监控推送成功率
   - 监控连接异常

4. **性能优化**
   - 避免推送大量数据
   - 合理使用节流和批量
   - 定期清理无效连接

