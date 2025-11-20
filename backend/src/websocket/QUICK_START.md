# WebSocket 快速开始指南

## 1. 确认依赖已安装

```bash
npm install
```

确保以下依赖已安装：
- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`
- `compression`

## 2. 配置环境变量

在 `.env` 或 `.env.local` 文件中配置：

```env
# JWT配置（必需）
JWT_SECRET=your-secret-key-here
```

## 3. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

## 4. 测试WebSocket连接

### 方式1: 使用浏览器控制台

1. 打开浏览器开发者工具（F12）
2. 在控制台输入：

```javascript
// 1. 获取Token（需要先登录）
const token = localStorage.getItem('accessToken');

// 2. 连接WebSocket
const ws = new WebSocket(`ws://localhost:3000/ws?token=${token}`);

// 3. 监听事件
ws.onopen = () => console.log('✅ 连接成功');
ws.onmessage = (e) => console.log('📨 收到消息:', JSON.parse(e.data));
ws.onerror = (e) => console.error('❌ 错误:', e);
ws.onclose = () => console.log('❌ 连接关闭');

// 4. 发送心跳
setInterval(() => {
  ws.send(JSON.stringify({ type: 'ping', data: { timestamp: Date.now() } }));
}, 30000);
```

### 方式2: 使用Socket.IO客户端（推荐）

```javascript
// 1. 引入Socket.IO（在前端项目中）
import { io } from 'socket.io-client';

// 2. 连接
const token = localStorage.getItem('accessToken');
const socket = io('http://localhost:3000', {
  path: '/ws',
  transports: ['websocket', 'polling'],
  query: { token },
});

// 3. 监听事件
socket.on('connect', () => {
  console.log('✅ 连接成功');
});

socket.on('message', (message) => {
  console.log('📨 收到消息:', message);
  
  switch (message.type) {
    case 'announcement:new':
      console.log('🔔 新公告:', message.data);
      break;
    case 'pong':
      console.log('💓 心跳响应');
      break;
  }
});

socket.on('disconnect', () => {
  console.log('❌ 连接断开');
});

// 4. 发送心跳
setInterval(() => {
  socket.emit('message', { 
    type: 'ping', 
    data: { timestamp: Date.now() } 
  });
}, 30000);
```

## 5. 测试公告推送

### 步骤1: 创建公告

使用API创建一个公告：

```bash
curl -X POST http://localhost:3000/api/v1/announcements \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试公告",
    "content": "<p>这是一条测试公告</p>",
    "summary": "测试公告摘要",
    "type": "notice",
    "level": "info",
    "isPopup": true,
    "isPush": true,
    "needRead": false,
    "targetType": "all",
    "startTime": "2024-01-26T00:00:00Z"
  }'
```

### 步骤2: 发布公告

发布公告会自动推送（如果设置了 `isPush=true` 和 `isPopup=true`）：

```bash
curl -X POST http://localhost:3000/api/v1/announcements/1/publish \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 步骤3: 手动推送

也可以手动推送已发布的公告：

```bash
curl -X POST http://localhost:3000/api/v1/announcements/1/push \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 步骤4: 查看前端效果

在浏览器中，连接WebSocket的客户端会立即收到 `announcement:new` 消息：

```json
{
  "type": "announcement:new",
  "data": {
    "id": 1,
    "title": "测试公告",
    "content": "<p>这是一条测试公告</p>",
    "summary": "测试公告摘要",
    "type": "notice",
    "level": "info",
    "isPopup": true,
    ...
  },
  "timestamp": 1706271600000
}
```

## 6. 验证功能

### ✅ 认证功能

```javascript
// 测试无效Token
const ws = new WebSocket('ws://localhost:3000/ws?token=invalid-token');
// 应该立即断开连接

// 测试无Token
const ws = new WebSocket('ws://localhost:3000/ws');
// 应该收到错误消息
```

### ✅ 心跳功能

```javascript
// 发送心跳
socket.emit('message', { type: 'ping', data: { timestamp: Date.now() } });

// 应该收到pong响应
socket.on('message', (msg) => {
  if (msg.type === 'pong') {
    console.log('✅ 心跳正常');
  }
});
```

### ✅ 速率限制

```javascript
// 快速发送100条消息
for (let i = 0; i < 100; i++) {
  socket.emit('message', { type: 'test', data: { index: i } });
}

// 应该在60条后收到速率限制错误
socket.on('message', (msg) => {
  if (msg.type === 'error' && msg.data.code === 'RATE_LIMIT_EXCEEDED') {
    console.log('✅ 速率限制正常工作');
  }
});
```

### ✅ 自动重连

```javascript
// 手动断开连接
socket.disconnect();

// Socket.IO会自动尝试重连
socket.on('reconnect', () => {
  console.log('✅ 自动重连成功');
});
```

## 7. 查看在线统计

在后端代码中：

```typescript
import { WebSocketGateway } from './websocket/websocket.gateway';

@Injectable()
export class SomeService {
  constructor(private readonly wsGateway: WebSocketGateway) {}

  getOnlineStats() {
    const stats = this.wsGateway.getOnlineStats();
    console.log(`在线用户: ${stats.users}, 连接数: ${stats.connections}`);
  }

  isUserOnline(userId: number): boolean {
    return this.wsGateway.isUserOnline(userId);
  }
}
```

## 8. 监控日志

启动服务后，查看日志输出：

```
[WebSocketGateway] WebSocket Gateway 初始化完成
[WebSocketGateway] 客户端已连接: 张三 (123)
[WebSocketClientService] 客户端连接: 张三 (123) - Socket: abc123
[WebSocketClientService] 当前在线: 1 个连接, 1 个用户
[AnnouncementsService] 公告已推送: 测试公告 (ID: 1)
```

## 9. 常见问题

### Q: 连接失败，显示401错误

**原因**: Token无效或过期

**解决**:
1. 确认Token格式正确
2. 重新登录获取新Token
3. 检查JWT_SECRET配置

### Q: 收不到消息

**原因**: 可能没有正确监听消息事件

**解决**:
```javascript
// 确保监听了正确的事件
socket.on('message', (msg) => {
  console.log('收到消息:', msg);
});
```

### Q: 频繁断开连接

**原因**: 没有发送心跳

**解决**:
```javascript
// 定期发送心跳（30秒）
setInterval(() => {
  socket.emit('message', { type: 'ping', data: { timestamp: Date.now() } });
}, 30000);
```

### Q: 推送公告没有反应

**原因**: 
1. 公告没有设置 `isPush=true` 和 `isPopup=true`
2. 用户不在目标受众范围内
3. WebSocket连接已断开

**解决**:
1. 检查公告配置
2. 检查目标类型和目标ID
3. 检查WebSocket连接状态

## 10. 下一步

现在你已经成功启动了WebSocket系统！接下来可以：

1. 📖 阅读 [完整API文档](../../../API/22-WebSocket实时推送.md)
2. 🔧 查看 [模块文档](./README.md) 了解详细功能
3. 💻 查看 [前端集成指南](../../../frontend/src/services/WEBSOCKET_GUIDE.md)
4. 🎨 根据需求扩展自定义消息类型
5. 🔐 配置生产环境的安全策略

## 技术支持

如果遇到问题：

1. 查看日志输出
2. 检查浏览器开发者工具的WebSocket面板
3. 参考故障排查文档
4. 查看相关模块的README

祝使用愉快！🎉

