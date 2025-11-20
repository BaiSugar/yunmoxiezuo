# 个人设置组件

## 概述

个人设置模态框组件，支持用户管理个人信息、修改密码和查看字数消耗历史。

## 组件结构

```
settings/
├── UserSettingsModal.tsx    # 主模态框组件（包含Tab导航）
├── TokenHistoryTab.tsx      # 字数消耗历史Tab
└── README.md                # 本文档
```

## 功能特性

### 1. 基本信息 Tab

- 显示用户 ID、用户名、昵称
- 支持修改昵称和邮箱
- 用户名不可修改（只读）

### 2. 修改密码 Tab

- 输入当前密码验证身份
- 设置新密码（至少 6 个字符）
- 确认新密码一致性检查

### 3. 字数消耗历史 Tab（新增）

- **余额卡片**：显示总余额和今日免费额度
- **流水记录**：
  - 充值记录（绿色）
  - 消费记录（红色）
  - 赠送记录（紫色）
  - 退款记录（蓝色）
  - 过期记录（灰色）
- **筛选功能**：按类型筛选流水记录
- **分页加载**：支持翻页查看历史记录
- **详细信息**：显示时间、金额、余额变化、模型名称、备注等

## 使用方法

### 在组件中使用

```tsx
import React, { useState } from "react";
import UserSettingsModal from "../components/settings/UserSettingsModal";

function MyComponent() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsSettingsOpen(true)}>个人设置</button>

      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
```

### 快捷键

- **ESC 键**：关闭模态框
- **Tab 切换**：点击顶部 Tab 按钮切换不同设置页面

## API 依赖

### 字数余额相关 API

- `GET /api/v1/token-balances` - 查询用户余额
- `GET /api/v1/token-balances/transactions` - 查询字数流水记录

### 权限要求

- 无特殊权限要求（登录用户即可查看自己的数据）

## 类型定义

相关类型定义位于：

- `frontend/src/types/token-balance.ts` - 字数余额相关类型
- `frontend/src/services/token-balances.api.ts` - API 服务

## 样式特点

- **毛玻璃效果**：backdrop-blur-xl
- **响应式设计**：移动端友好
- **平滑动画**：Tab 切换、模态框打开/关闭
- **渐变色彩**：
  - 蓝色：基本信息
  - 紫色：密码修改
  - 绿色：字数消耗

## 注意事项

1. **模态框层级**：z-index 设置为 9999，确保在最顶层
2. **背景滚动**：打开时禁止背景滚动，关闭时恢复
3. **数据加载**：打开模态框时会自动加载最新数据
4. **Tab 状态**：每次打开模态框都会重置到"基本信息"Tab

## 移动端适配

- 响应式布局，适配手机、平板、PC
- 触摸友好的按钮尺寸
- 滚动容器优化

## 未来改进

- [ ] 添加更新个人信息的 API 接口对接
- [ ] 添加修改密码的 API 接口对接
- [ ] 支持导出字数消耗记录
- [ ] 添加消耗统计图表
- [ ] 支持按日期范围筛选
