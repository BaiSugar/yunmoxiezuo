# 公告系统前端组件

## 概述

公告系统前端实现，提供**两种显示方式**：
1. **模态窗**：用户主动点击查看完整公告列表
2. **Toast通知**：自动在右上角弹出，适合简短提醒

完美适配PC、平板、手机三端。

## 组件结构

```
components/announcements/
├── AnnouncementButton.tsx    # 公告按钮（带未读数量气泡）
├── AnnouncementModal.tsx     # 公告模态窗（主动查看）
├── AnnouncementToast.tsx     # Toast通知（自动弹出）
└── README.md                  # 本文档
```

## 功能特性

### 1. AnnouncementButton（公告按钮）

**位置**: Dashboard 右上角（用户菜单左侧）

**功能**:
- 显示未读数量气泡（红色，超过9显示"9+"）
- 点击打开公告模态窗
- 每5分钟自动刷新未读数量

**使用方式**:
```tsx
import AnnouncementButton from './components/announcements/AnnouncementButton';

<AnnouncementButton />
```

### 2. AnnouncementModal（公告模态窗）

**响应式布局**:

**PC端（≥768px）**:
```
┌─────────────────────────────────────────┐
│ 🔔 系统公告                        [X]  │
├──────────┬──────────────────────────────┤
│ 公告列表 │ 公告详情                     │
│          │                              │
│ • 系统公告│ 📢 系统维护通知              │
│ • 活动通知│                              │
│ • 新功能  │ 详细内容...                  │
│          │                              │
│          │ [立即查看 →]                │
└──────────┴──────────────────────────────┘
```

**手机端（<768px）**:
```
┌─────────────────────────┐
│ 🔔 系统公告        [X] │
├─────────────────────────┤
│ [下拉选择公告]          │
├─────────────────────────┤
│                         │
│ 📢 系统维护通知         │
│                         │
│ 详细内容...             │
│                         │
│ [立即查看 →]           │
│                         │
└─────────────────────────┘
```

**功能**:
- 显示所有有效公告
- 按优先级和置顶排序
- 支持HTML内容渲染
- 链接跳转（支持内部链接和外部链接）
- 自动标记已读（如果公告需要确认阅读）
- 追踪链接点击统计

**使用方式**:
```tsx
import AnnouncementModal from './components/announcements/AnnouncementModal';

const [isOpen, setIsOpen] = useState(false);

<AnnouncementModal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)} 
/>
```

### 3. AnnouncementToast（Toast通知）

**位置**: 页面右上角固定位置

**功能**:
- 自动显示 `isPopup = true` 的公告
- 多个公告堆叠显示
- 不需要确认阅读的公告5秒后自动关闭（带进度条）
- 需要确认阅读的公告需手动关闭
- 支持链接跳转
- 根据公告级别显示不同颜色和图标

**使用方式**:
```tsx
import AnnouncementToast from './components/announcements/AnnouncementToast';

// 直接添加到页面，会自动加载和显示
<AnnouncementToast />
```

**显示效果**:
```
页面右上角
┌─────────────────────┐
│ ℹ️ 系统维护通知    [X]│
│ 今晚22:00-23:00... │
│ [查看详情 →]       │
│ ▓▓▓▓▓░░░░░░░░░    │  ← 自动关闭进度条
└─────────────────────┘
```

**自动关闭规则**:
- `needRead = false`: 5秒后自动关闭
- `needRead = true`: 必须手动关闭

## 两种显示方式的区别

| 特性 | 模态窗 (Modal) | Toast通知 |
|------|---------------|-----------|
| 触发方式 | 用户点击按钮 | 页面加载自动显示 |
| 显示位置 | 屏幕中央全屏遮罩 | 右上角小窗口 |
| 适用场景 | 完整公告列表，详细内容 | 简短提醒，重要通知 |
| 公告数量 | 可查看所有有效公告 | 仅显示 `isPopup = true` 的公告 |
| 关闭方式 | 用户主动关闭 | 自动关闭或手动关闭 |
| 内容长度 | 支持长文本和HTML | 标题+摘要，适合短内容 |

## 公告类型和级别

### 公告类型
- `system` - 系统公告（蓝色）
- `activity` - 活动公告（绿色）
- `maintenance` - 维护公告（橙色）
- `feature` - 新功能（紫色）
- `notice` - 通知（灰色）

### 提示级别
- `info` - 信息 ℹ️（蓝色）
- `success` - 成功 ✅（绿色）
- `warning` - 警告 ⚠️（黄色）
- `error` - 错误 ❌（红色）

## 后端API集成

### 依赖的API接口

1. **获取有效公告**
   ```
   GET /api/v1/announcements/active
   返回: Announcement[]
   ```

2. **获取未读数量**
   ```
   GET /api/v1/announcements/unread-count
   返回: { count: number }
   认证: 必需
   ```

3. **获取公告详情**
   ```
   GET /api/v1/announcements/:id
   返回: Announcement
   ```

4. **标记已读**
   ```
   POST /api/v1/announcements/:id/read
   Body: { needClick?: boolean }
   ```

## 样式自定义

组件使用 Tailwind CSS，可通过 `styleConfig` 自定义公告样式：

```typescript
interface StyleConfig {
  backgroundColor?: string;  // 背景色
  borderColor?: string;      // 边框色
  textColor?: string;        // 文字色
}
```

## 开发注意事项

1. **未登录用户**: 只能看到 `targetType = 'all'` 的公告
2. **未读数量**: 仅统计 `needRead = true` 且未读的公告
3. **链接跳转**: 
   - `linkTarget = '_blank'` → 新标签页打开
   - `linkTarget = '_self'` → 当前页面跳转
4. **自动刷新**: 每5分钟刷新一次未读数量，避免频繁请求

## 测试建议

1. 测试响应式布局（PC、平板、手机）
2. 测试未读数量显示和刷新
3. 测试公告列表和详情切换
4. 测试链接跳转（内部链接和外部链接）
5. 测试标记已读功能
6. 测试无公告时的空状态显示

## 未来改进

- [ ] 支持公告搜索和筛选
- [ ] 支持公告分类展示
- [ ] 添加公告动画效果
- [ ] 支持公告弹窗自动显示（针对 isPopup = true 的公告）
- [ ] 添加公告通知声音
