# 编辑器设置集成文档

## ✅ 已完成的功能

### 1. 字体配置系统（服务器下发）

**SQL 配置文件**: `backend/sql/insert_editor_font_config.sql`

管理员可以在系统设置中配置可用的字体列表，包括：

- 字体值（font-family CSS 值）
- 显示标签
- 分类（推荐/中文/英文/特殊）
- 描述信息

**系统设置项**:

```sql
category: 'editor'
key: 'available_fonts'
type: 'json'
is_public: true  -- 前端可读取
```

### 2. 编辑器设置真实应用

#### 2.1 TipTap 编辑器样式应用

**文件**: `frontend/src/pages/editor/components/TipTapEditor.tsx`

编辑器现在从 `editorSettings` props 读取：

- ✅ **字体系列** (`fontFamily`)
- ✅ **字体大小** (`fontSize`)
- ✅ **行距** (`lineHeight`)

```typescript
editorProps: {
  attributes: {
    style: `
      font-size: ${editorSettings?.fontSize || 16}px; 
      line-height: ${editorSettings?.lineHeight || 1.8}; 
      font-family: ${
        editorSettings?.fontFamily || "system-ui, -apple-system, sans-serif"
      };
    `;
  }
}
```

#### 2.2 自动排版应用设置

**文件**: `frontend/src/pages/editor/components/TipTapEditor.tsx` (handleAutoFormat)

自动排版现在使用：

- ✅ **段首缩进** (`paragraphIndent`) - 全角空格数量
- ✅ **段间空行** (`paragraphSpacing`) - 段落之间的空行数

```typescript
const indentCount = editorSettings?.paragraphIndent ?? 2;
const spacingCount = editorSettings?.paragraphSpacing ?? 1;
const indent = "　".repeat(indentCount); // 全角空格

// 添加缩进
const paragraphHtml = `<p>${indent}${trimmed}</p>`;

// 添加段间空行
if (index < formattedParagraphs.length - 1 && spacingCount > 0) {
  const emptyParagraphs = "<p></p>".repeat(spacingCount);
  return paragraphHtml + emptyParagraphs;
}
```

### 3. 数据流向

```
用户修改设置 → 保存到数据库 → 刷新页面 → 加载设置 → 应用到编辑器
```

**NovelEditor.tsx**:

```typescript
1. useEffect(() => loadEditorSettings(), [])  // 加载用户设置
2. editorSettings 传递给 EditorContent
3. EditorContent 传递给 TipTapEditor
4. TipTapEditor 应用样式和排版逻辑
```

### 4. 字体选择功能

#### 4.1 预设字体（推荐）

- 使用字体回退栈（Font Stack）
- 确保跨平台兼容
- 例如: `"PingFang SC, Microsoft YaHei, Hiragino Sans GB, sans-serif"`
  - Mac: PingFang SC
  - Windows: Microsoft YaHei
  - Linux/其他: 系统默认 sans-serif

#### 4.2 自定义字体

用户可以输入任何字体名称，例如：

- `思源宋体, Source Han Serif, serif`
- `霞鹜文楷, LXGW WenKai, KaiTi, serif`
- `Noto Serif SC, SimSun, serif`

**⚠️ 重要提醒**：

- 自定义字体必须已安装在用户系统中
- 建议总是添加通用字体作为回退（如 `serif`, `sans-serif`）

### 5. 字体大小和行距自定义

#### 5.1 双重输入方式

- **滑块调节**：快速调整，实时预览
- **数字输入**：精确设置，支持键盘输入

#### 5.2 范围限制

- 字体大小: 12-32px
- 行距: 1.0-3.0 倍

### 6. 移动端适配

**位置**: 编辑器顶部右侧 → 更多(移动端) → 编辑工具区 → 编辑器设置

**文件**: `frontend/src/pages/editor/components/MobileEditorTools.tsx`

移动端显示完整的设置选项，与 PC 端功能一致。

## 🎯 使用流程

### PC 端:

1. 打开小说编辑器
2. 点击右上角 ⚙️ 编辑器设置按钮
3. 调整设置（字体/大小/行距/主题/段落）
4. 点击"保存设置"
5. 页面自动刷新，新设置立即生效

### 移动端:

1. 打开小说编辑器
2. 点击底部"更多"按钮
3. 在"编辑工具"区域找到"编辑器设置"
4. 后续流程同 PC 端

## 📐 设置项详解

### 字体设置

- **字体系列**: 预设字体（跨平台兼容）或自定义字体
- **字体大小**: 12-32px，支持滑块和输入框
- **行距**: 1.0-3.0 倍，支持滑块和输入框

### 主题设置

- **浅色**: 白底黑字
- **深色**: 黑底白字
- **跟随系统**: 自动根据系统主题切换

### 段落格式

- **段首空格**: 0-10 个全角空格（`　`）
- **段间空行**: 0-5 行空段落

### 编辑器功能

- **自动保存**: 开关 + 间隔（10-300 秒）
- **字数统计**: 显示/隐藏

## 🔄 生效机制

### 立即生效

- ❌ 设置保存后需要刷新页面

### 刷新后生效

- ✅ 字体、字体大小、行距
- ✅ 段首缩进、段间空行（自动排版使用）
- ✅ 主题（如果实现了主题切换）
- ✅ 自动保存间隔
- ✅ 字数统计显示

**实现方式**:

```typescript
// 保存成功后自动刷新
setTimeout(() => {
  window.location.reload();
}, 1000);
```

## 🔧 管理员配置

### 配置可用字体列表

**SQL**: `backend/sql/insert_editor_font_config.sql`

```sql
INSERT INTO system_settings (category, key, value, type, is_public) VALUES
('editor', 'available_fonts', '[...]', 'json', 1);
```

**字体配置格式**:

```json
[
  {
    "value": "Microsoft YaHei, PingFang SC, sans-serif",
    "label": "微软雅黑",
    "category": "推荐",
    "description": "Windows 标配，清晰易读"
  }
]
```

### 配置参数范围

```sql
('editor', 'font_size_range', '{"min": 12, "max": 32, "default": 16}', 'json', 1),
('editor', 'line_height_range', '{"min": 1.0, "max": 3.0, "default": 1.8}', 'json', 1),
('editor', 'paragraph_indent_range', '{"min": 0, "max": 10, "default": 2}', 'json', 1),
('editor', 'paragraph_spacing_range', '{"min": 0, "max": 5, "default": 1}', 'json', 1)
```

## 📝 注意事项

1. **字体回退很重要**

   - 不同系统有不同的预装字体
   - 总是提供多个回退选项
   - 最后使用通用字体族（serif/sans-serif）

2. **自定义字体需谨慎**

   - 用户必须自己确保字体已安装
   - 提供清晰的使用示例和警告

3. **设置保存后刷新**

   - 目前采用页面刷新方式应用设置
   - 未来可优化为实时应用（不刷新页面）

4. **默认值保护**
   - 所有设置都有合理的默认值
   - 加载失败时使用默认设置，不影响使用

## 🚀 未来优化方向

1. **实时应用设置**（不刷新页面）

   - 使用 EditorSettingsContext 全局状态
   - TipTap 编辑器监听设置变化
   - 动态更新样式

2. **字体加载状态检测**

   - 检测字体是否成功加载
   - 显示回退字体提示

3. **预览功能**

   - 在设置面板显示实时预览
   - 边调整边查看效果

4. **Web 字体支持**

   - 管理员可上传 Web 字体文件
   - 前端自动加载和应用

5. **导入/导出设置**
   - 允许用户导出设置配置
   - 可在不同设备间同步

## 📚 相关文件

### 后端

- `backend/src/editor-settings/` - 编辑器设置模块
- `backend/sql/create_editor_settings_table.sql` - 数据库表
- `backend/sql/insert_editor_font_config.sql` - 字体配置

### 前端

- `frontend/src/types/editor-settings.ts` - 类型定义
- `frontend/src/services/editor-settings.api.ts` - API 服务
- `frontend/src/contexts/EditorSettingsContext.tsx` - 全局状态（未使用）
- `frontend/src/pages/editor/components/TipTapEditor.tsx` - 编辑器应用
- `frontend/src/pages/editor/components/EditorSettingsModal.tsx` - 设置模态框
- `frontend/src/pages/editor/NovelEditor.tsx` - 加载和传递设置

### 文档

- `API/26-编辑器设置.md` - API 文档
- `backend/src/editor-settings/README.md` - 后端说明
- `frontend/src/pages/settings/README.md` - 前端说明
