# 编辑器设置模块

## 📋 概述

编辑器设置模块提供用户个性化的编辑器配置界面，用户可以通过该界面自定义编辑器的外观和行为。

## 🎯 功能特性

### 1. 字体设置

- **字体系列**：支持多种中英文字体选择
  - 微软雅黑（默认）
  - 宋体
  - 楷体
  - 黑体
  - 仿宋
  - Arial
  - Georgia
  - Times New Roman
- **字体大小**：12-32px 可调
- **行距**：1.0-3.0 倍可调

### 2. 主题设置

- **浅色主题**：适合白天使用
- **深色主题**：适合夜间使用
- **自动模式**：跟随系统主题自动切换

### 3. 段落格式

- **段首空格**：0-10 个全角空格
- **段间空行**：0-5 行

### 4. 编辑器功能

- **自动保存**：开关控制
- **自动保存间隔**：10-300 秒可调
- **字数统计**：显示/隐藏控制

## 📁 文件结构

```
src/pages/settings/
├── EditorSettingsPage.tsx    # 编辑器设置页面组件
└── README.md                  # 本文件
```

## 🔌 API 集成

### 类型定义

```typescript
// src/types/editor-settings.ts
export interface EditorSettings {
  id: number;
  userId: number;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  theme: EditorTheme;
  paragraphIndent: number;
  paragraphSpacing: number;
  autoSave: boolean;
  autoSaveInterval: number;
  showWordCount: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### API 服务

```typescript
// src/services/editor-settings.api.ts
import { editorSettingsApi } from "../../services/editor-settings.api";

// 获取设置
const settings = await editorSettingsApi.getSettings();

// 更新设置
const updated = await editorSettingsApi.updateSettings({
  fontSize: 20,
  theme: "dark",
});

// 重置为默认
const defaultSettings = await editorSettingsApi.resetSettings();
```

## 🚀 使用方法

### 访问编辑器设置

用户登录后，可以通过以下方式访问编辑器设置：

1. 点击左侧菜单的 **"编辑器设置"** 按钮
2. 直接访问 URL：`/dashboard/settings/editor`

### 修改设置

1. 进入编辑器设置页面
2. 调整所需的配置项（修改后会自动标记为未保存）
3. 点击 **"保存设置"** 按钮保存更改
4. 如需恢复默认设置，点击 **"恢复默认"** 按钮

### 设置应用

编辑器设置保存后：

- 设置会自动同步到服务器
- 用户在任何设备登录都能看到相同的设置
- 可以在编辑器中应用这些设置（需要编辑器集成）

## 🎨 UI 设计特点

### 响应式设计

- 支持桌面端和移动端
- 使用 Tailwind CSS 实现现代化界面
- 毛玻璃效果和渐变背景

### 交互体验

- 实时预览调整效果（滑块显示当前值）
- 未保存状态提示
- 保存/重置操作带加载状态
- 成功/失败消息提示（Toast）

### 主题适配

- 支持浅色和深色模式
- 根据系统主题自动切换

## 🔄 与编辑器集成

要在编辑器中应用这些设置，需要：

1. 在编辑器组件挂载时获取设置：

```typescript
const [editorSettings, setEditorSettings] = useState<EditorSettings | null>(
  null
);

useEffect(() => {
  const loadEditorSettings = async () => {
    try {
      const settings = await editorSettingsApi.getSettings();
      setEditorSettings(settings);
      applySettings(settings);
    } catch (error) {
      console.error("加载编辑器设置失败:", error);
    }
  };

  loadEditorSettings();
}, []);
```

2. 应用设置到编辑器：

```typescript
const applySettings = (settings: EditorSettings) => {
  // 应用字体设置
  editorElement.style.fontFamily = settings.fontFamily;
  editorElement.style.fontSize = `${settings.fontSize}px`;
  editorElement.style.lineHeight = settings.lineHeight.toString();

  // 应用主题
  if (settings.theme === "dark") {
    document.documentElement.classList.add("dark");
  } else if (settings.theme === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    // auto - 跟随系统
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (prefersDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  // 应用段落格式
  // ... 根据 paragraphIndent 和 paragraphSpacing 调整

  // 设置自动保存
  if (settings.autoSave) {
    setupAutoSave(settings.autoSaveInterval * 1000);
  }

  // 显示/隐藏字数统计
  setShowWordCount(settings.showWordCount);
};
```

## 📝 注意事项

1. **首次访问**：用户首次访问编辑器设置时，后端会自动创建默认配置
2. **实时保存**：设置仅在用户点击 "保存设置" 后才会提交到服务器
3. **权限控制**：所有用户默认拥有编辑器设置的查看和修改权限
4. **数据持久化**：设置存储在数据库中，跨设备同步

## 🔗 相关文档

- [后端 API 文档](../../../../API/26-编辑器设置.md)
- [后端模块说明](../../../../backend/src/editor-settings/README.md)
- [类型定义](../../types/editor-settings.ts)
- [API 服务](../../services/editor-settings.api.ts)
