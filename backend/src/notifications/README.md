# 通知系统模块

## 概述

完整的系统通知模块，支持**在线实时推送**和**离线持久化存储**。

## 核心功能

### ✅ 智能推送机制

```typescript
// 使用NotificationsService.createAndPush()
await notificationsService.createAndPush({
  userId: 123,
  title: '提示词申请已拒绝',
  content: '很抱歉，您申请的提示词「AI写作助手」未通过审核',
  category: 'prompt-rejection',
  level: 'warning',
  extra: {
    reviewNote: '暂不对外开放',
  },
});
```

**自动判断**：

- ✅ **用户在线** → WebSocket实时推送 + 保存数据库
- ✅ **用户离线** → 只保存数据库
- ✅ **用户登录** → 自动推送未读通知（最多10条）

### ✅ 通知持久化

所有通知都会保存到数据库：

- 离线用户登录后能看到
- 提供通知列表查询
- 支持标记已读/删除

### ✅ API接口

| 接口                                  | 方法   | 说明         |
| ------------------------------------- | ------ | ------------ |
| `/api/v1/notifications`               | GET    | 获取通知列表 |
| `/api/v1/notifications/unread-count`  | GET    | 获取未读数量 |
| `/api/v1/notifications/:id/read`      | POST   | 标记已读     |
| `/api/v1/notifications/mark-all-read` | POST   | 全部标记已读 |
| `/api/v1/notifications/:id`           | DELETE | 删除通知     |
| `/api/v1/notifications/clear-read`    | DELETE | 清空已读通知 |

## 使用示例

### 在Service中发送通知

```typescript
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MyService {
  constructor(private readonly notificationsService: NotificationsService) {}

  async notifyUser(userId: number) {
    // 智能推送：自动判断在线/离线
    await this.notificationsService.createAndPush({
      userId,
      title: '操作成功',
      content: '您的操作已成功完成',
      category: 'system',
      level: 'success',
      action: {
        text: '查看详情',
        url: '/dashboard/details',
      },
    });
  }
}
```

## 工作流程

### 场景1：用户在线

```
发送通知
    ↓
NotificationsService.createAndPush()
    ↓
保存到数据库
    ↓
检查用户是否在线（wsGateway.isUserOnline()）
    ↓
用户在线 → WebSocket实时推送
    ↓
用户立即看到通知弹窗
```

**日志**：

```
[NotificationsService] ✅ 实时推送通知给用户 123: 提示词申请已拒绝
```

### 场景2：用户离线

```
发送通知
    ↓
NotificationsService.createAndPush()
    ↓
保存到数据库
    ↓
检查用户是否在线（wsGateway.isUserOnline()）
    ↓
用户离线 → 只保存，不推送
    ↓
等待用户登录
```

**日志**：

```
[NotificationsService] 💾 保存离线通知给用户 123: 提示词申请已拒绝
```

### 场景3：用户登录

```
用户登录
    ↓
WebSocket连接建立
    ↓
WebSocketGateway.handleConnection()
    ↓
调用 NotificationsService.pushUnreadNotifications()
    ↓
查询未读通知（最多10条）
    ↓
逐条推送给用户
    ↓
用户看到所有未读通知
```

**日志**：

```
[NotificationsService] 📬 推送 3 条未读通知给用户 123
```

## 数据库迁移

执行SQL脚本创建表：

```bash
mysql -u root -p your_database < backend/migrations/create-notifications-table.sql
```

或使用TypeORM迁移：

```bash
npm run typeorm migration:run
```

## 通知类型

| 分类                          | 说明       | 级别    | 场景         |
| ----------------------------- | ---------- | ------- | ------------ |
| `prompt-application`          | 新申请     | info    | 用户提交申请 |
| `prompt-pending-applications` | 待审核汇总 | info    | 登录时检查   |
| `prompt-approval`             | 审核通过   | success | 作者通过申请 |
| `prompt-rejection`            | 审核拒绝   | warning | 作者拒绝申请 |
| `system`                      | 系统消息   | info    | 系统通知     |

## 特性对比

| 功能     | 旧方案（仅WebSocket） | 新方案（通知系统） |
| -------- | --------------------- | ------------------ |
| 在线推送 | ✅                    | ✅                 |
| 离线保存 | ❌                    | ✅                 |
| 登录推送 | ❌                    | ✅                 |
| 通知列表 | ❌                    | ✅                 |
| 未读数量 | ❌                    | ✅                 |
| 标记已读 | ❌                    | ✅                 |
| 通知删除 | ❌                    | ✅                 |

## 优势

✅ **不会遗漏**：离线用户登录后也能收到通知  
✅ **可追溯**：所有通知都保存在数据库  
✅ **可管理**：提供完整的CRUD接口  
✅ **智能推送**：自动判断在线/离线，无需手动判断  
✅ **性能优化**：登录时最多推送10条，避免过载

## 相关文档

- [提示词审核通知](../prompts/NOTIFICATION_GUIDE.md)
- [登录提醒功能](../prompts/LOGIN_NOTIFICATION.md)
- [WebSocket系统](../websocket/README.md)
