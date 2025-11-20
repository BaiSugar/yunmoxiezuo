# NotificationToast 组件说明

## 功能概述

通用的系统通知Toast组件，用于显示各类实时通知。

## 支持的通知类型

### 1. 提示词申请相关

| 类别 | 说明 | 触发时机 | 显示效果 |
|------|------|----------|---------|
| `prompt-application` | 新申请 | 用户提交申请（实时） | 蓝色，8秒自动关闭 |
| `prompt-pending-applications` | 待审核申请 | 作者登录时检查 | 蓝色，8秒自动关闭 |
| `prompt-approval` | 审核通过 | 作者通过申请 | 绿色，10秒自动关闭 |
| `prompt-rejection` | 审核拒绝 | 作者拒绝申请 | 黄色，需手动关闭 |

### 2. 通知级别和颜色

| 级别 | 颜色 | 图标 | 自动关闭 |
|------|------|------|---------|
| `info` | 蓝色 | ℹ️ | 8秒 |
| `success` | 绿色 | ✅ | 10秒 |
| `warning` | 黄色 | ⚠️ | 不自动关闭 |
| `error` | 红色 | ❌ | 不自动关闭 |

## 通知示例

### 登录时的待审核申请通知

```
ℹ️ 您有待审核的提示词申请              [×]
提示词「AI写作助手」有 3 条待审核申请

[立即查看 →]
━━━━━━━━━━ 8秒倒计时
```

**点击"立即查看"** → 跳转到申请列表页面

### 实时新申请通知

```
ℹ️ 收到新的提示词申请                  [×]
有用户申请使用您的提示词「AI写作助手」

[查看申请 →]
━━━━━━━━━━ 8秒倒计时
```

### 审核通过通知

```
✅ 提示词申请已通过                     [×]
您申请的提示词「AI写作助手」已通过审核，现在可以使用了！

备注：欢迎使用，有问题随时联系

[立即使用 →]
━━━━━━━━━━ 10秒倒计时
```

### 审核拒绝通知

```
⚠️ 提示词申请已拒绝                    [×]
很抱歉，您申请的提示词「AI写作助手」未通过审核

备注：暂不对外开放，敬请谅解
```

**需要手动关闭**（点击×）

## 位置和层级

- **位置**: 右上角 `top-20 right-4`
- **层级**: `z-index: 9998`（在公告Toast下方）
- **最大宽度**: `max-w-md`
- **动画**: 从右侧滑入

## 实现原理

### 自动监听

组件在 `useEffect` 中自动订阅 `notification:new` 消息：

```typescript
useEffect(() => {
  const unsubscribe = wsService.on('notification:new', handleNewNotification);
  return () => unsubscribe();
}, []);
```

### 智能显示

根据通知类别和级别自动选择：
- 颜色（蓝/绿/黄/红）
- 图标（ℹ️/✅/⚠️/❌）
- 自动关闭时间（8秒/10秒/不关闭）

### 防重复

使用 `closedIds` Set记录已关闭的通知，避免重复显示。

## 测试

### 浏览器控制台测试

```javascript
// 测试登录时的待审核提醒
wsService['handleMessage']({
  type: 'notification:new',
  data: {
    id: 'pending-' + Date.now(),
    title: '您有待审核的提示词申请',
    content: '提示词「AI写作助手」有 3 条待审核申请',
    category: 'prompt-pending-applications',
    level: 'info',
    action: {
      text: '立即查看',
      url: '/dashboard/prompts/my-prompts?tab=applications&promptId=1'
    },
    extra: {
      promptId: 1,
      promptName: 'AI写作助手',
      count: 3
    },
    createdAt: new Date()
  }
});
```

应该看到蓝色通知框，显示待审核数量！

## 配置

在 `NotificationToast.tsx` 中可以调整：

### 自动关闭时间

```typescript
const getAutoDismissTime = (category: string, level?: string): number => {
  if (level === 'error' || category === 'prompt-rejection') {
    return 0; // 不自动关闭
  }
  if (level === 'success') {
    return 10000; // 10秒
  }
  return 8000; // 8秒
};
```

### 位置

```tsx
<div className="fixed top-20 right-4 ...">
  {/* top-20: 距离顶部5rem（80px）*/}
  {/* right-4: 距离右侧1rem（16px）*/}
</div>
```

## 相关文档

- [提示词通知指南](../../../backend/src/prompts/NOTIFICATION_GUIDE.md)
- [登录提醒功能](../../../backend/src/prompts/LOGIN_NOTIFICATION.md)
- [WebSocket使用指南](../../services/WEBSOCKET_GUIDE.md)

