# 创意工坊组件

## WorkSelectorModal

作品选择器模态窗，用于在创意工坊中关联作品，启用@功能。

### 🎯 功能说明

创意工坊默认不关联作品，用户可以：

- 不关联作品：只能使用通用提示词，无法使用@功能
- 关联作品：可以使用@功能引用人物卡、世界观、备忘录、章节等

### 🎨 UI 特点

- 作品列表卡片展示（带图标和章节数）
- "不关联作品"选项（默认）
- 选中状态：蓝色勾选标记
- 渐变背景和现代化设计

### 📦 Props

```typescript
interface WorkSelectorModalProps {
  isOpen: boolean;
  selectedWorkId?: number;
  onSelect: (workId: number, workName: string) => void; // workId=0表示取消关联
  onClose: () => void;
}
```

### 🎯 使用示例

```typescript
const [showWorkSelector, setShowWorkSelector] = useState(false);
const [selectedNovelId, setSelectedNovelId] = useState<number | undefined>(undefined);
const [selectedNovelName, setSelectedNovelName] = useState<string>("");

// 顶部关联作品按钮
<button
  onClick={() => setShowWorkSelector(true)}
  className={selectedNovelId ? "bg-blue-50 text-blue-700" : "bg-white text-gray-600"}
>
  <BookOpen />
  {selectedNovelId ? selectedNovelName : "关联作品"}
</button>

// 模态窗
<WorkSelectorModal
  isOpen={showWorkSelector}
  selectedWorkId={selectedNovelId}
  onSelect={(workId, workName) => {
    if (workId === 0) {
      setSelectedNovelId(undefined);
      setSelectedNovelName("");
    } else {
      setSelectedNovelId(workId);
      setSelectedNovelName(workName);
    }
  }}
  onClose={() => setShowWorkSelector(false)}
/>

// 传递给ChatTab
<ChatTab novelId={selectedNovelId} chapters={chapters} volumes={volumes} />
```

---

## ApplyToWorkModal

现代化的"应用到作品"模态窗，用于将 AI 生成的内容保存到用户作品中。

### 🎨 UI 特点

#### 1. **渐变头部**

- 蓝色 → 紫色 → 粉色渐变背景
- 半透明叠加层增强视觉效果
- 魔法棒图标 + 标题说明

#### 2. **两步式流程**

```
步骤1: 选择作品
  ├─ 进度指示器（1完成 → 2）
  ├─ 作品卡片网格（2列布局）
  ├─ 卡片悬停效果
  └─ 选中标记（蓝色勾选）

步骤2: 配置保存
  ├─ 选中作品信息卡片
  ├─ 三种保存模式卡片
  │   ├─ 新建章节（蓝色）
  │   ├─ 替换内容（橙色）
  │   └─ 追加内容（绿色）
  ├─ 章节标题输入框（新建模式）
  └─ 章节列表（替换/追加模式）
```

#### 3. **视觉元素**

- **圆角**: 3xl（24px）外框，2xl（16px）内部卡片
- **阴影**: 分层阴影系统
  - 模态窗：`shadow-2xl`
  - 选中卡片：`shadow-lg`
  - 按钮悬停：`hover:shadow-xl`
- **动画**:
  - 淡入缩放：`animate-in fade-in zoom-in-95`
  - 加载旋转：`animate-spin`
- **渐变**:
  - 头部：`from-blue-500 via-purple-500 to-pink-500`
  - 按钮：`from-blue-500 to-purple-500`
  - 作品图标：`from-blue-400 to-purple-500`

### 📦 Props

```typescript
interface ApplyToWorkModalProps {
  isOpen: boolean; // 是否显示
  content: string; // 要保存的内容
  title?: string; // 内容标题（用于新建章节）
  onClose: () => void; // 关闭回调
}
```

### 🔧 功能特性

#### 1. 三种保存模式

**新建章节** (CopyMode: 'new')

- 创建新章节并保存内容
- 需要输入章节标题
- 自动设置章节顺序（末尾追加）

**替换内容** (CopyMode: 'replace')

- 完全替换现有章节内容
- 需要选择目标章节
- 会覆盖原有内容（⚠️ 不可恢复）

**追加内容** (CopyMode: 'append')

- 在现有章节末尾追加
- 需要选择目标章节
- 自动添加两个换行符分隔

#### 2. 智能状态管理

```typescript
// 自动重置状态
useEffect(() => {
  if (isOpen) {
    setStep(1); // 回到第一步
    setSelectedWork(null); // 清空选择
    setSelectedChapter(null);
    setCopyMode("new"); // 默认新建模式
    setNewChapterTitle(title || "");
  }
}, [isOpen, title]);
```

#### 3. 数据加载

- **作品列表**: 打开时自动加载（分页 100 条）
- **章节列表**: 选择作品后自动加载
- **加载状态**: 骨架屏 + 加载动画

### 🎯 使用示例

```typescript
// 在WorkshopGeneratorPage中使用
const [showApplyModal, setShowApplyModal] = useState(false);
const [pendingContent, setPendingContent] = useState("");

const handleApplyToEditor = (content: string) => {
  setPendingContent(content);
  setShowApplyModal(true);
};

return (
  <>
    <ChatTab onApplyToEditor={handleApplyToEditor} />

    <ApplyToWorkModal
      isOpen={showApplyModal}
      content={pendingContent}
      title={`${category?.name}生成内容`}
      onClose={() => {
        setShowApplyModal(false);
        setPendingContent("");
      }}
    />
  </>
);
```

### 🎨 与 CopyToWorkModal 的对比

| 特性         | CopyToWorkModal | ApplyToWorkModal   |
| ------------ | --------------- | ------------------ |
| **布局**     | 单页面          | 两步式向导         |
| **头部**     | 简单白色        | 渐变背景           |
| **作品选择** | 2 列网格        | 2 列卡片（带图标） |
| **模式选择** | 3 列文字按钮    | 3 列圆形图标卡片   |
| **进度提示** | 无              | 进度指示器         |
| **视觉风格** | 传统            | 现代扁平           |
| **动画**     | 无              | 淡入/缩放/旋转     |
| **z-index**  | 50              | 9999               |

### 🔄 API 调用

#### 获取作品列表

```typescript
GET /novels?page=1&pageSize=100
Response: { data: { data: Work[] } }
```

#### 获取章节列表

```typescript
GET /novels/:novelId/chapters
Response: { data: Chapter[] }
```

#### 创建新章节

```typescript
POST /chapters
Body: {
  novelId: number,
  volumeId: null,
  title: string,
  content: string,
  globalOrder: number
}
```

#### 更新章节

```typescript
PATCH /chapters/:chapterId
Body: { content: string }
```

### 🚀 未来优化建议

1. **预览功能**: 显示内容预览（前 100 字）
2. **历史记录**: 记住最近使用的作品
3. **快捷模式**: 一键保存到上次作品
4. **批量操作**: 同时保存到多个章节
5. **冲突检测**: 替换前提示内容长度对比
6. **撤销功能**: 保存前备份原内容
