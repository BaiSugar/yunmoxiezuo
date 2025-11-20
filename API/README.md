# AI 写作平台 API 接口文档

## 🔔 最新更新 (2025-10-20)

**提示词系统上线** 🎉
- ✅ 完整的提示词管理系统（26个新接口）
- ✅ 双重公开性控制（isPublic + isContentPublic）
- ✅ 参数系统支持（{{参数名}} 占位符）
- ✅ 权限分级管理（view/use/edit）
- ✅ 申请审核流程（自动授权机制）
- ✅ 热度计算和统计
- ✅ 分类和子分类管理

📝 [查看完整更新日志](./CHANGELOG.md)

## 📚 文档说明

本目录包含所有后端 API 接口的详细规范文档。

## 📋 目录结构

```
API/
├── README.md              # 本文件，总览
├── CHANGELOG.md           # API 更新日志 ⭐
├── 01-认证模块.md          # 用户认证相关接口
├── 02-用户管理.md          # 用户管理相关接口
├── 03-角色管理.md          # 角色管理相关接口
├── 04-权限管理.md          # 权限管理相关接口
├── 05-作品管理.md          # 作品管理相关接口
├── 06-提示词管理.md        # 提示词系统相关接口 ⭐ NEW
└── 99-通用规范.md          # 通用接口规范、响应格式等
```

## 🌐 服务器信息

- **开发环境**: `http://localhost:3000`
- **API 文档**: `http://localhost:3000/api/docs` (Swagger UI)
- **API 版本**: v1
- **基础路径**: `/api/v1`

## 🔐 认证方式

所有需要认证的接口都使用 **Bearer Token** 方式：

```http
Authorization: Bearer {your_access_token}
```

## 📊 模块概览

| 模块     | 接口数量 | 状态      | 说明                                     |
| -------- | -------- | --------- | ---------------------------------------- |
| 认证模块 | 5        | ✅ 已完成 | 注册、登录、刷新令牌、登出、获取个人信息 |
| 用户管理 | 14       | ✅ 已完成 | 用户 CRUD、个人资料、密码修改、封禁等    |
| 角色管理 | 7        | ✅ 已完成 | 角色 CRUD、权限分配                      |
| 权限管理 | 6        | ✅ 已完成 | 权限 CRUD、树形结构查询                  |
| 作品管理 | 39+      | ✅ 已完成 | 作品、分卷、章节、历史版本、人物卡、世界观、备忘录、文件上传 |
| 提示词系统 | 26      | ✅ 已完成 | 提示词 CRUD、分类、权限、申请审核、统计 ⭐ NEW |

**总计**: 97+ 个接口

## 🚀 快速开始

### 1. 注册用户

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123",
  "username": "testuser"
}
```

### 2. 登录获取 Token

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

响应中会返回 `accessToken`，后续请求需要携带此 Token。

### 3. 访问受保护的接口

```http
GET /api/v1/users/me
Authorization: Bearer {accessToken}
```

## 📝 统一响应格式

### 成功响应

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {
    // 实际数据
  },
  "timestamp": 1234567890
}
```

### 错误响应

```json
{
  "success": false,
  "code": 400,
  "message": "错误描述",
  "data": {
    "error": "错误类型",
    "details": ["详细错误信息"],
    "path": "/api/v1/users",
    "method": "POST"
  },
  "timestamp": 1234567890
}
```

## 🔒 权限代码说明

### 用户管理权限

- `user:list` - 查看用户列表
- `user:view` - 查看用户详情
- `user:create` - 创建用户
- `user:update` - 更新用户
- `user:delete` - 删除用户
- `user:ban` - 封禁/解封用户
- `user:assign_roles` - 分配角色

### 角色管理权限

- `permission:role:list` - 查看角色列表
- `permission:role:create` - 创建角色
- `permission:role:update` - 更新角色
- `permission:role:delete` - 删除角色
- `permission:role:assign` - 分配权限

### 权限管理权限

- `permission:list` - 查看权限列表
- `permission:create` - 创建权限
- `permission:update` - 更新权限
- `permission:delete` - 删除权限

### 提示词管理权限 ⭐ NEW

- `prompt:list` - 查看提示词列表
- `prompt:view` - 查看提示词详情
- `prompt:create` - 创建提示词
- `prompt:update` - 更新提示词
- `prompt:delete` - 删除提示词
- `prompt:use` - 使用提示词
- `prompt:publish` - 发布提示词
- `prompt:manage:all` - 管理所有提示词（管理员）
- `prompt:review` - 审核提示词内容（管理员）
- `prompt:force_delete` - 强制删除（管理员）
- `prompt:category:create` - 创建分类（管理员）
- `prompt:category:update` - 更新分类（管理员）
- `prompt:category:delete` - 删除分类（管理员）

## 🛠️ 开发工具

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Postman**: 可导入 API 集合
- **VS Code REST Client**: 使用 `.http` 文件测试

## 📖 详细文档

请查看各模块的详细文档：

0. [📝 API 更新日志](./CHANGELOG.md) - 最新变更记录 ⭐
1. [认证模块](./01-认证模块.md) - 用户注册、登录、令牌管理
2. [用户管理](./02-用户管理.md) - 用户 CRUD、个人资料管理
3. [角色管理](./03-角色管理.md) - 角色 CRUD、权限分配
4. [权限管理](./04-权限管理.md) - 权限 CRUD、树形结构
5. [作品管理](./05-作品管理.md) - 作品、分卷、章节、历史版本、人物卡、世界观、备忘录
6. [提示词管理](./06-提示词管理.md) - 提示词 CRUD、分类、权限、申请审核 ⭐ NEW
7. [通用规范](./99-通用规范.md) - 响应格式、错误码、分页等

## 📞 联系方式

如有疑问，请参考：

- 项目文档：`backend/docs/`
- API 文档：`http://localhost:3000/api/docs`
- 开发计划：`backend/docs/plans/DEVELOPMENT_PLAN.md`
