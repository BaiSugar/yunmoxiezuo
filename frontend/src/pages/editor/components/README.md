# 编辑器组件说明

## 组件结构

本目录包含了小说编辑器页面的所有子组件，采用模块化设计，便于维护和复用。

### 组件列表

#### 1. **EditorHeader** (`EditorHeader.tsx`)
顶部导航栏组件
- **功能**：显示作品名称、总字数、自动保存状态
- **Props**：
  - `novelName`: 作品名称
  - `totalWordCount`: 总字数
  - `autoSaving`: 是否正在保存
  - `lastSaveTime`: 最后保存时间
  - `onBack`: 返回按钮回调

#### 2. **ChapterList** (`ChapterList.tsx`)
章节列表侧边栏组件
- **功能**：
  - 显示分卷和章节列表
  - 支持分卷折叠/展开
  - 支持拖拽排序（分卷和章节）
  - 独立章节区域管理
- **Props**：
  - `width`: 侧边栏宽度
  - `volumes`: 分卷数组
  - `standaloneChapters`: 独立章节数组
  - `currentChapter`: 当前选中的章节
  - `dragState`: 拖拽状态
  - `onVolumeToggle`: 分卷折叠切换回调
  - `onChapterClick`: 章节点击回调
  - `onDragStart`: 拖拽开始回调
  - `onDragEnd`: 拖拽结束回调
  - `onDragOver`: 拖拽经过回调

#### 3. **EditorContent** (`EditorContent.tsx`)
编辑器主体内容区域
- **功能**：
  - 章节标题编辑
  - 章节内容编辑
  - 字数统计
- **Props**：
  - `currentChapter`: 当前章节
  - `chapterContent`: 章节内容
  - `onTitleChange`: 标题变化回调
  - `onContentChange`: 内容变化回调
  - `onTextSelect`: 文本选择回调

#### 4. **SelectionToolbar** (`SelectionToolbar.tsx`)
文本选择悬浮工具栏
- **功能**：
  - 显示选中文本字数
  - AI续写/改写/扩写按钮
- **Props**：
  - `toolbar`: 工具栏状态（位置、选中文本等）

#### 5. **AIAssistant** (`AIAssistant.tsx`)
AI助手侧边栏
- **功能**：AI对话和生成功能（待实现）
- **Props**：
  - `width`: 侧边栏宽度

#### 6. **ResizeDivider** (`ResizeDivider.tsx`)
可拖动的分隔条
- **功能**：调整左右侧边栏宽度
- **Props**：
  - `onMouseDown`: 鼠标按下回调
  - `title`: 提示文本

### 类型定义 (`types.ts`)

包含所有共享的 TypeScript 类型定义：
- `Chapter`: 章节数据结构
- `Volume`: 分卷数据结构
- `SelectionToolbarState`: 选择工具栏状态
- `DragState`: 拖拽状态

## 使用示例

```tsx
import {
  EditorHeader,
  ChapterList,
  EditorContent,
  SelectionToolbar,
  AIAssistant,
  ResizeDivider,
} from "./components";
import type { Chapter, Volume, DragState } from "./components";

// 在主组件中使用
<EditorHeader
  novelName={novelName}
  totalWordCount={totalWordCount}
  autoSaving={autoSaving}
  lastSaveTime={lastSaveTime}
  onBack={handleBack}
/>

<ChapterList
  width={leftWidth}
  volumes={volumes}
  standaloneChapters={standaloneChapters}
  currentChapter={currentChapter}
  dragState={dragState}
  onVolumeToggle={handleVolumeToggle}
  onChapterClick={handleChapterClick}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  onDragOver={handleDragOver}
/>
```

## 设计原则

1. **单一职责**：每个组件只负责一个特定功能
2. **Props 驱动**：所有状态通过 props 传递，组件保持无状态
3. **类型安全**：使用 TypeScript 确保类型安全
4. **可复用性**：组件设计考虑了复用性和扩展性
5. **清晰的接口**：明确的 Props 定义和文档说明

## 文件结构

```
components/
├── README.md                  # 本文档
├── index.ts                   # 统一导出
├── types.ts                   # 类型定义
├── EditorHeader.tsx          # 顶部导航栏
├── ChapterList.tsx           # 章节列表
├── EditorContent.tsx         # 编辑器内容
├── SelectionToolbar.tsx      # 选择工具栏
├── AIAssistant.tsx           # AI助手
└── ResizeDivider.tsx         # 分隔条
```
