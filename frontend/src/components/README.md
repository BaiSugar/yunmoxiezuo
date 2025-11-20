# 组件目录结构说明

> 更新时间：2025-10-18

## 📁 目录结构

```
components/
├── common/              # 通用组件
│   ├── AuthGuard.tsx           # 认证守卫
│   ├── ConfirmDialog.tsx       # 确认对话框
│   ├── PermissionButton.tsx    # 权限按钮
│   ├── PermissionMenu.tsx      # 权限菜单
│   ├── ProtectedRoute.tsx      # 受保护路由
│   ├── Toast.tsx               # 提示消息
│   ├── ToastContainer.tsx      # 提示容器
│   └── UserDropdown.tsx        # 用户下拉菜单
│
├── layout/              # 布局组件
│   └── Sidebar.tsx             # 侧边栏
│
├── novels/              # 作品相关组件 ⭐
│   ├── NovelCard.tsx           # 作品卡片
│   ├── CreateNovelModal.tsx    # 创建作品对话框
│   ├── EditNovelModal.tsx      # 编辑作品对话框
│   ├── DeleteConfirmDialog.tsx # 删除确认对话框
│   ├── NovelFilterPanel.tsx    # 作品筛选面板
│   └── CoverUpload.tsx         # 封面上传组件
│
├── dialogs/             # 对话框组件
│   └── (待移入相关对话框组件)
│
├── ui/                  # UI基础组件
│   └── (按钮、输入框等基础组件)
│
└── forms/               # 表单组件
    └── (表单相关组件)
```

## 📋 组件分类说明

### 1. common/ - 通用组件
**用途**：跨模块使用的通用组件
**特点**：
- 高复用性
- 业务无关
- 可独立使用

**包含组件**：
- 认证相关：AuthGuard、ProtectedRoute
- 权限相关：PermissionButton、PermissionMenu
- UI反馈：Toast、ToastContainer、ConfirmDialog
- 用户交互：UserDropdown

### 2. layout/ - 布局组件
**用途**：页面布局结构组件
**特点**：
- 影响页面整体结构
- 通常在路由层面使用

**包含组件**：
- Sidebar - 侧边导航栏

### 3. novels/ - 作品相关组件 ⭐
**用途**：作品管理功能的所有组件
**特点**：
- 专注于作品CRUD
- 包含对话框、卡片、筛选等

**包含组件**：
- **NovelCard.tsx** - 作品卡片（网格/列表视图）
- **CreateNovelModal.tsx** - 创建作品对话框
- **EditNovelModal.tsx** - 编辑作品对话框
- **DeleteConfirmDialog.tsx** - 删除确认对话框
- **NovelFilterPanel.tsx** - 作品筛选面板
- **CoverUpload.tsx** - 封面上传组件

### 4. dialogs/ - 对话框组件
**用途**：通用对话框组件
**特点**：
- 可复用的对话框
- 不限于特定业务

**规划**：
- 移入通用对话框
- 区别于业务特定对话框（如novels/下的）

### 5. ui/ - UI基础组件
**用途**：基础UI组件库
**特点**：
- 最小粒度组件
- 高度可复用
- 样式一致

**规划组件**：
- Button - 按钮
- Input - 输入框
- Select - 选择器
- Modal - 模态框基础组件
- Badge - 徽章
- Card - 卡片基础

### 6. forms/ - 表单组件
**用途**：表单相关组件
**特点**：
- 表单控件封装
- 表单验证

**规划组件**：
- FormField - 表单字段
- FormGroup - 表单组
- Validators - 验证器

## 🚀 下一步计划

### 阶段1：移动作品相关组件 ✅
- [x] 创建 novels/ 文件夹
- [ ] 移动 NovelCard.tsx → novels/
- [ ] 移动 CreateNovelModal.tsx → novels/
- [ ] 移动 EditNovelModal.tsx → novels/
- [ ] 移动 DeleteConfirmDialog.tsx → novels/
- [ ] 移动 NovelFilterPanel.tsx → novels/
- [ ] 移动 CoverUpload.tsx → novels/
- [ ] 更新所有导入路径

### 阶段2：创建UI基础组件
- [ ] 创建 Button 组件
- [ ] 创建 Input 组件
- [ ] 创建 Modal 基础组件
- [ ] 重构现有组件使用基础组件

### 阶段3：优化对话框组件
- [ ] 提取通用对话框逻辑
- [ ] 创建对话框上下文
- [ ] 统一对话框样式

## 📝 命名规范

### 文件命名
- **组件文件**：PascalCase（如 `NovelCard.tsx`）
- **工具文件**：camelCase（如 `utils.ts`）
- **类型文件**：PascalCase（如 `Novel.types.ts`）

### 目录命名
- **功能目录**：小写+连字符（如 `novels/`）
- **通用目录**：小写单词（如 `common/`、`ui/`）

### 组件命名
- **React组件**：PascalCase
- **Props接口**：`{ComponentName}Props`
- **导出方式**：默认导出（`export default`）

## 🔗 导入路径

### 推荐使用绝对路径
```typescript
// ✅ 推荐
import { NovelCard } from '@/components/novels/NovelCard';
import { Button } from '@/components/ui/Button';

// ❌ 不推荐
import { NovelCard } from '../../components/novels/NovelCard';
```

### 配置别名
在 `tsconfig.json` 或 `vite.config.ts` 中配置：
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"]
    }
  }
}
```

## 📚 相关文档

- [组件开发规范](../../../docs/DEVELOPMENT.md)
- [组件文档](../../../frontend/docs/COMPONENTS.md)
- [TypeScript规范](../../../docs/TYPESCRIPT.md)

## 🆕 最近更新

### 2025-10-18
- ✅ 创建 novels/ 文件夹
- ✅ 创建 ui/ 文件夹
- ✅ 创建 dialogs/ 文件夹（已存在，清理）
- ✅ 重命名 upload.tsx → CoverUpload.tsx
- ✅ 重命名 novels.tsx → NovelFilterPanel.tsx
- 📝 创建组件目录结构文档
