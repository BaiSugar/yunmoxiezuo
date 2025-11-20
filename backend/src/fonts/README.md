## 📋 概述

字体管理模块允许管理员上传和管理字体文件，前端通过动态加载字体文件确保所有用户都能看到相同的字体效果。

## 🎯 核心功能

### 1. 字体文件上传

- 支持 WOFF2, WOFF, TTF, OTF 格式
- 文件存储在 `uploads/fonts/` 目录
- 自动生成下载 URL
- 文件大小验证

### 2. 字体管理

- 查看所有字体
- 启用/禁用字体
- 设置默认字体
- 删除字体（包括文件）

### 3. 字体类型

**系统字体**:

- `format: 'system'`
- 无需上传文件
- 使用字体回退栈

**Web 字体**:

- `format: 'woff2' | 'woff' | 'ttf' | 'otf'`
- 从服务器加载
- 所有用户效果一致

## 🗄️ 数据库设计

```sql
CREATE TABLE `fonts` (
  `id` INT UNSIGNED AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,           -- CSS font-family 名称
  `display_name` VARCHAR(100) NOT NULL,   -- 用户看到的名称
  `category` VARCHAR(50) NOT NULL,        -- 分类
  `file_path` VARCHAR(500) NOT NULL,      -- 文件路径
  `format` VARCHAR(50) NOT NULL,          -- 格式
  `file_size` INT UNSIGNED NOT NULL,      -- 文件大小（字节）
  `is_enabled` TINYINT(1) DEFAULT 1,      -- 是否启用
  `is_default` TINYINT(1) DEFAULT 0,      -- 是否默认
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
);
```

## 🔌 API 接口

### 公开接口

- `GET /fonts/enabled` - 获取所有启用的字体

### 管理员接口

- `GET /fonts` - 获取所有字体
- `POST /fonts/upload` - 上传字体文件
- `PUT /fonts/:id` - 更新字体信息
- `POST /fonts/:id/set-default` - 设置默认字体
- `DELETE /fonts/:id` - 删除字体

## 🔐 权限控制

```typescript
import { PERMISSIONS } from '../common/config/permissions.config';

PERMISSIONS.FONT.VIEW; // 'font:view'
PERMISSIONS.FONT.UPLOAD; // 'font:upload'
PERMISSIONS.FONT.UPDATE; // 'font:update'
PERMISSIONS.FONT.DELETE; // 'font:delete'
```

## 📦 模块结构

```
src/fonts/
├── entities/
│   └── font.entity.ts           # 字体实体
├── dto/
│   └── upload-font.dto.ts       # DTO
├── services/
│   └── fonts.service.ts         # 业务逻辑
├── controllers/
│   └── fonts.controller.ts      # 控制器
├── fonts.module.ts              # 模块定义
└── README.md                    # 本文件
```

## 🚀 使用示例

### Service 层

```typescript
// 上传字体
const font = await fontsService.uploadFont(file, {
  name: 'SourceHanSerif',
  displayName: '思源宋体',
  category: '推荐',
  description: 'Adobe 开源宋体',
});

// 获取启用的字体
const fonts = await fontsService.findAllEnabled();

// 设置默认字体
await fontsService.setDefault(fontId);

// 删除字体
await fontsService.remove(fontId); // 同时删除文件
```

## 📝 注意事项

1. **文件存储**：字体文件存储在 `uploads/fonts/` 目录
2. **唯一性**：字体名称（name）必须唯一
3. **默认字体**：只能有一个默认字体
4. **级联删除**：删除字体时会同时删除物理文件
5. **格式验证**：只接受 ttf, otf, woff, woff2 格式

## 🔗 相关文档

- [API 文档](../../../API/27-字体管理.md)
- [字体系统实现说明](../../../docs/字体系统实现说明.md)
- [权限配置](../common/config/permissions.config.ts)
