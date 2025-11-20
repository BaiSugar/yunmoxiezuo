# 提示词分类管理模块

## 📋 功能概述

提示词分类管理模块用于管理提示词系统的分类和子分类，支持层级结构的分类体系。

## 🔐 权限要求

### 菜单访问权限
- `prompt:category:view` - 查看提示词分类管理页面

### 操作权限
- `prompt:category:create` - 创建分类和子分类
- `prompt:category:update` - 更新分类和子分类
- `prompt:category:delete` - 删除分类和子分类

### 权限说明
- **超级管理员（super_admin）**：拥有所有权限
- **普通管理员（admin）**：拥有所有权限
- 普通用户无权访问后台管理

## 📁 文件结构

```
admin/src/pages/prompts/
├── PromptCategories.tsx    # 分类管理主页面
└── README.md                # 本文档

admin/src/api/
└── prompt-categories.ts     # API接口定义

admin/src/types/
└── prompt-category.ts       # TypeScript类型定义
```

## 🎯 主要功能

### 1. 分类管理
- **查看分类列表** - 展示所有分类，支持展开/折叠查看子分类
- **创建分类** - 新增基础分类（需要权限）
  - 分类名称（必填）
  - 图标（必填，支持Emoji）
  - 描述（可选）
  - 排序值（可选，默认0）
- **编辑分类** - 修改分类信息（需要权限）
- **删除分类** - 删除分类及其所有子分类（需要权限）

### 2. 子分类管理
- **创建子分类** - 在某个分类下新增子分类（需要权限）
  - 所属分类ID
  - 子分类名称（必填）
  - 描述（可选）
  - 排序值（可选，默认0）
- **编辑子分类** - 修改子分类信息（需要权限）
- **删除子分类** - 删除单个子分类（需要权限）

### 3. UI特性
- **响应式设计** - 适配移动端和桌面端
- **展开折叠** - 点击分类可展开/折叠查看子分类
- **权限控制** - 根据用户权限动态显示操作按钮
- **确认对话框** - 删除操作需要二次确认
- **实时反馈** - 操作结果即时Toast提示

## 🔧 技术实现

### 权限检查
```typescript
// 使用 hasButtonPermission 检查按钮权限
const canCreate = hasButtonPermission(user, PERMISSIONS.PROMPT_CATEGORY_CREATE);
const canUpdate = hasButtonPermission(user, PERMISSIONS.PROMPT_CATEGORY_UPDATE);
const canDelete = hasButtonPermission(user, PERMISSIONS.PROMPT_CATEGORY_DELETE);

// 根据权限显示按钮
{canCreate && (
  <button onClick={handleCreate}>新增分类</button>
)}
```

### API调用
```typescript
// 获取分类列表
const categories = await getCategoryList();

// 创建分类
await createCategory({
  name: 'AI写作',
  icon: '✍️',
  description: '用于辅助小说、文章等各类文本创作',
  order: 1
});

// 创建子分类
await createSubCategory({
  categoryId: 1,
  name: '小说创作',
  description: '长篇小说、短篇故事创作',
  order: 1
});
```

### 路由保护
```typescript
// 路由配置中使用 ProtectedRoute 组件
{
  path: "prompt-categories",
  element: (
    <ProtectedRoute permission={PERMISSIONS.PROMPT_CATEGORY_VIEW}>
      <PromptCategories />
    </ProtectedRoute>
  ),
}
```

## 📊 数据结构

### Category（分类）
```typescript
interface Category {
  id: number;
  name: string;
  icon: string;
  description?: string;
  order: number;
  subCategories?: SubCategory[];
  createdAt: string;
  updatedAt: string;
}
```

### SubCategory（子分类）
```typescript
interface SubCategory {
  id: number;
  categoryId: number;
  name: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}
```

## 🎨 UI组件

### 分类卡片
- 展开/折叠按钮
- 分类图标和名称
- 分类描述
- 统计信息（排序、子分类数量）
- 操作按钮（新增子分类、编辑、删除）

### 子分类列表
- 子分类名称
- 子分类描述
- 排序信息
- 操作按钮（编辑、删除）

### 模态框
- **分类模态框** - 创建/编辑分类
- **子分类模态框** - 创建/编辑子分类
- 表单验证
- 提交状态管理

## 🔒 安全性

### 前端权限控制
- 路由级别权限保护（ProtectedRoute）
- 按钮级别权限控制（hasButtonPermission）
- 菜单级别权限过滤（hasMenuPermission）

### 后端权限验证
- 所有写操作（创建、更新、删除）需要后端权限验证
- 使用 `@RequirePermissions()` 装饰器
- JWT认证保护

## 📝 使用示例

### 1. 创建新分类
1. 点击页面右上角"+ 新增分类"按钮
2. 填写分类名称、图标、描述、排序
3. 点击"确定"提交

### 2. 创建子分类
1. 找到目标分类
2. 点击"+ 子分类"按钮
3. 填写子分类信息
4. 点击"确定"提交

### 3. 编辑分类/子分类
1. 点击相应的"编辑"按钮
2. 修改信息
3. 点击"确定"保存

### 4. 删除分类/子分类
1. 点击"删除"按钮
2. 在确认对话框中确认操作

## ⚠️ 注意事项

1. **删除分类会同时删除所有子分类** - 请谨慎操作
2. **图标建议使用Emoji** - 确保跨平台显示一致
3. **排序值越小越靠前** - 用于控制显示顺序
4. **权限检查在前后端都会执行** - 确保安全性

## 🔗 相关链接

- [后端API文档](../../../../../backend/API/06-提示词管理.md)
- [权限系统说明](../../utils/permission.ts)
- [路由配置](../../routes/index.tsx)

## 📅 更新日志

### v1.0.0 - 2025-10-20
- ✅ 初始版本
- ✅ 分类CRUD功能
- ✅ 子分类CRUD功能
- ✅ 权限控制
- ✅ 响应式设计
