# 提示词管理系统 - 前端文档

## 📋 概述

提示词管理系统提供完整的 AI 提示词创建、分享、管理和使用功能。用户可以创建自己的提示词，浏览和使用他人分享的提示词，并通过权限系统控制访问。

## 🗂️ 文件结构

```
frontend/src/
├── types/
│   └── prompt.ts                    # 提示词相关类型定义
├── services/
│   └── prompts.api.ts               # 提示词 API 服务
├── components/
│   └── prompts/
│       ├── PromptCard.tsx           # 提示词卡片组件
│       └── CategoryFilter.tsx       # 分类筛选组件
└── pages/
    └── prompts/
        ├── PromptMarket.tsx         # 提示词广场（浏览）
        ├── PromptDetail.tsx         # 提示词详情
        ├── PromptEditor.tsx         # 创建/编辑提示词
        ├── MyPrompts.tsx            # 我的提示词管理
        ├── PromptApplications.tsx   # 申请审核管理
        └── PromptPermissions.tsx    # 权限管理
```

## 🎯 核心功能

### 1. 提示词广场 (PromptMarket)
**路由**: `/prompts`

**功能**：
- ✅ 浏览所有公开的提示词
- ✅ 按分类筛选（一级+二级分类）
- ✅ 关键词搜索（防抖优化）
- ✅ 多种排序方式（热度/最新/浏览/使用/点赞）
- ✅ 分页加载
- ✅ 响应式布局（支持移动端）

**技术要点**：
- 使用 `QueryPromptsParams` 构建查询参数
- 搜索防抖：300ms 延迟
- 卡片式网格布局（1/2/3列自适应）

### 2. 提示词详情 (PromptDetail)
**路由**: `/prompts/:id`

**功能**：
- ✅ 查看提示词基本信息
- ✅ 显示作者、分类、统计数据
- ✅ 内容预览（根据 `isContentPublic` 控制）
- ✅ 参数列表展示
- ✅ 点赞/使用/分享操作
- ✅ 申请权限对话框

**权限逻辑**：
```typescript
// 公开内容：所有人可见
if (isContentPublic || isAuthor) {
  showContent();
}
// 私有内容：需要申请
else {
  showApplyDialog();
}
```

### 3. 创建/编辑提示词 (PromptEditor)
**路由**: 
- 创建: `/prompts/create`
- 编辑: `/prompts/:id/edit`

**功能**：
- ✅ 基本信息编辑（名称、描述、分类）
- ✅ 多消息内容管理
  - 添加/删除消息
  - 角色选择（system/user/assistant）
  - 上下移动排序
  - 启用/禁用切换
- ✅ **智能参数识别**
  - 自动检测 `{{参数名}}` 占位符
  - 配置参数（必填/可选、描述）
- ✅ 公开性设置（双重开关）
  - `isPublic`: 是否在列表显示
  - `isContentPublic`: 是否公开内容
- ✅ 状态管理（草稿/已发布/已归档）

**参数系统**：
```typescript
// 自动提取参数
const regex = /\{\{(\w+)\}\}/g;
// 示例：你是{{角色}}，故事背景是{{背景}}
// 提取：['角色', '背景']
```

### 4. 我的提示词管理 (MyPrompts)
**路由**: `/prompts/my`

**功能**：
- ✅ 显示我创建的所有提示词
- ✅ 状态筛选（全部/草稿/已发布/已归档）
- ✅ 批量操作（多选删除）
- ✅ 表格视图展示统计数据
- ✅ 快速操作（查看/编辑/权限管理/删除）

**表格列**：
| 名称 | 分类 | 状态 | 浏览 | 使用 | 点赞 | 热度 | 创建时间 | 操作 |

### 5. 申请管理 (PromptApplications)
**路由**: `/prompts/applications`

**功能**：
- ✅ **我的申请**（用户视角）
  - 查看申请状态
  - 查看审核结果和备注
- ✅ **待我审核**（作者视角）
  - 查看待审核申请列表
  - 通过/拒绝申请
  - 填写审核备注
- ✅ 状态筛选（全部/待审核/已通过/已拒绝）

**审核流程**：
```
用户申请 → 填写理由 → 提交
         ↓
作者收到通知 → 查看申请 → 审核（通过/拒绝）
         ↓
系统自动授权 → 用户获得权限 → 可以使用
```

**自动授权机制**：
- 审核通过后，系统自动授予 `use` 权限
- 用户立即可以查看和使用提示词

### 6. 权限管理 (PromptPermissions)
**路由**: `/prompts/:id/permissions`

**功能**：
- ✅ 查看已授权用户列表
- ✅ 手动授予权限（输入用户ID）
- ✅ 撤销权限
- ✅ 权限类型选择（view/use/edit）

**权限层级**：
- `view`: 查看提示词内容
- `use`: 使用提示词（推荐）
- `edit`: 编辑提示词（慎用）

## 🔐 权限与安全

### 前端权限控制

所有需要认证的页面都使用 `AuthGuard` 包裹：

```typescript
<Route
  path="/prompts/create"
  element={
    <AuthGuard requireAuth={true}>
      <PromptEditor />
    </AuthGuard>
  }
/>
```

### API 权限验证

所有 API 请求都自动携带 JWT Token：

```typescript
// api.ts 请求拦截器
const token = localStorage.getItem('accessToken');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

### 资源归属校验

- 编辑/删除：仅作者
- 权限管理：仅作者
- 审核申请：仅作者

## 🎨 UI/UX 设计

### 设计风格
- **毛玻璃效果**: `backdrop-blur-xl`
- **扁平化**: 简洁的卡片式布局
- **渐变装饰**: 纯色圆形背景装饰
- **微交互**: hover 效果、过渡动画

### 响应式布局
```css
/* 提示词卡片网格 */
grid-cols-1          /* 移动端: 1列 */
md:grid-cols-2       /* 平板: 2列 */
xl:grid-cols-3       /* 桌面: 3列 */
```

### 颜色系统
- **主色**: 蓝色 (`bg-blue-500`)
- **成功**: 绿色 (`bg-green-500`)
- **警告**: 黄色/琥珀色 (`bg-amber-500`)
- **危险**: 红色 (`bg-red-500`)
- **中性**: 灰色 (`bg-gray-500`)

## 📡 API 对接

### 服务封装

所有 API 调用都通过 `prompts.api.ts` 封装：

```typescript
// 获取提示词列表
const response = await promptsApi.getPrompts({
  page: 1,
  pageSize: 12,
  categoryId: 1,
  sortBy: 'hotValue',
  sortOrder: 'DESC'
});

// 创建提示词
const newPrompt = await promptsApi.createPrompt({
  name: '小说情节生成器',
  isPublic: true,
  isContentPublic: true,
  categoryId: 1,
  status: 'published',
  contents: [...]
});
```

### 错误处理

统一的错误处理机制：

```typescript
try {
  await promptsApi.deletePrompt(id);
  showSuccess('删除成功');
} catch (err: any) {
  showError(err.response?.data?.message || '删除失败');
}
```

## 🚀 使用流程

### 创建提示词
1. 点击「创建提示词」按钮
2. 填写基本信息（名称、描述、分类）
3. 添加消息内容（支持多条）
4. 系统自动识别参数占位符
5. 配置公开性和状态
6. 保存草稿或直接发布

### 使用他人提示词
1. 在提示词广场浏览
2. 点击卡片查看详情
3. 如果内容公开，直接使用
4. 如果内容私有，点击「申请使用」
5. 填写申请理由并提交
6. 等待作者审核

### 审核申请
1. 进入「申请管理」页面
2. 切换到「待我审核」标签
3. 查看申请详情和理由
4. 点击「审核」按钮
5. 选择通过/拒绝，填写备注
6. 系统自动授予权限（如果通过）

## 🔧 技术栈

- **框架**: React 18 + TypeScript
- **路由**: React Router v6
- **状态管理**: React Hooks (useState, useEffect)
- **HTTP 客户端**: Axios
- **图标**: Lucide React
- **样式**: Tailwind CSS
- **认证**: JWT + Context API

## 📝 代码规范

遵循项目 SRS 规范：

1. **命名规范**：
   - 文件名: `kebab-case.tsx`
   - 组件: `PascalCase`
   - 变量/函数: `camelCase`
   - 类型: `PascalCase`

2. **安全第一**：
   - 所有接口必须认证
   - 操作必须鉴权
   - 资源归属校验

3. **结构清晰**：
   - 高内聚，低耦合
   - 合理的目录组织
   - 清晰的注释

## 🐛 已知问题

暂无

## 📅 后续计划

Phase 2 - AI 对话集成（待开发）：
- [ ] 参数填写表单
- [ ] 发送给 AI 对话
- [ ] 对话历史记录
- [ ] 快速使用入口

Phase 3 - 高级功能（可选）：
- [ ] 收藏功能
- [ ] 评分系统
- [ ] 评论功能
- [ ] 数据分析

## 📞 支持

如有问题，请查阅：
- [API 文档](../../API/06-提示词管理.md)
- [后端文档](../../backend/src/prompts/README.md)
- [开发路线图](../../backend/src/prompts/ROADMAP.md)
