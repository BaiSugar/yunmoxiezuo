# 创意工坊

创意工坊是基于提示词分类的功能模块系统，让用户可以快速访问各种 AI 生成工具。

## 📁 文件结构

```
creative-workshop/
├── CreativeWorkshopPage.tsx      # 功能卡片列表页（Dashboard使用）
├── WorkshopGeneratorPage.tsx    # 独立全屏生成页（Dashboard使用）
├── components/
│   ├── ApplyToWorkModal.tsx     # 应用到作品模态窗（现代化UI）
│   └── README.md                # 组件文档
└── README.md                     # 本文档

editor/components/ai-assistant/
├── CreativeWorkshop.tsx          # 功能卡片列表（编辑器使用）
├── GeneratorInterface.tsx        # 生成器界面（编辑器使用）
└── AIAssistantPanel.tsx          # AI助手面板（集成工坊按钮）
```

## 🎯 功能特点

### 1. **双入口设计**

#### Dashboard 入口

- 位置：Dashboard 侧边栏 → "创意工坊"
- 路由：
  - `/dashboard/workshop` - 功能卡片列表
  - `/dashboard/workshop/:categoryId` - 独立全屏生成页
- 流程：
  1. 打开创意工坊，显示所有功能模块卡片
  2. 点击卡片（如"书名生成器"）
  3. 进入独立全屏生成页

#### 编辑器入口

- 位置：编辑器 AI 助手面板顶部 → "工坊"按钮（魔法棒图标）
- 位置：在"使用说明"和"新建对话"按钮之间
- 流程：
  1. 点击工坊按钮，AI 助手内容切换为功能卡片列表
  2. 点击卡片进入生成界面
  3. 再次点击工坊按钮返回对话模式

### 2. **功能模块卡片**

每个提示词分类自动生成一个功能模块卡片：

- **分类名称** → **生成器名称**
  - 例如："书名" → "书名生成器"
  - 例如："人物" → "人物生成器"
- **图标映射**：根据分类名称智能匹配图标
  ```typescript
  书名 → 📚
  人物 → 👤
  情节 → 📖
  对话 → 💬
  场景 → 🏞️
  开篇 → ✨
  结尾 → 🎬
  大纲 → 📝
  世界观 → 🌍
  剧情 → 🎭
  ```

### 3. **生成器界面**

点击功能模块后：

- 复用 `ChatTab` 组件（完整的 AI 对话功能）
- 复用 `PromptSelectionModal`（提示词选择）
- 复用 `ModelConfigModal`（模型配置）
- **自动筛选**：提示词选择器自动锁定到对应分类

### 4. **智能应用按钮**

生成内容后的"应用"按钮根据使用场景自动切换：

#### Dashboard 模式

- 点击"应用" → 打开 `ApplyToWorkModal`
- 两步式向导选择作品和章节
- 三种保存模式：新建/替换/追加
- 现代化 UI 设计（渐变背景、动画效果）

#### 编辑器模式

- 点击"应用" → 直接插入到编辑器
- 无缝集成到写作流程
- 即时反馈

## 🔧 实现原理

### 1. 固定分类模式

通过 `fixedCategoryId` 参数实现：

```typescript
// ChatTab 接收固定分类参数
interface ChatTabProps {
  fixedCategoryId?: number; // 固定的分类ID
  // ... 其他参数
}

// 传递给 PromptSelectionModal
<PromptSelectionModal
  fixedCategoryId={fixedCategoryId}
  // ... 其他参数
/>

// PromptSelectionModal 内部逻辑
useEffect(() => {
  if (isOpen) {
    // 自动设置分类ID
    setSelectedCategoryId(fixedCategoryId || null);
  }
}, [isOpen, fixedCategoryId]);

// API调用时传递categoryId过滤
const response = await promptsApi.getPrompts({
  categoryId: selectedCategoryId || undefined,  // 自动过滤该分类的提示词
  // ... 其他参数
});

// UI上禁用分类选择器
<select
  disabled={!!fixedCategoryId}  // 固定分类时禁用
  value={selectedCategoryId || ""}
>
```

**🔍 提示词过滤说明**：

- 设置 `fixedCategoryId` 后，`PromptSelectionModal` 会自动过滤该分类的提示词
- 分类选择器变为禁用状态（灰色），用户无法切换
- API 请求时会传递 `categoryId` 参数，后端只返回该分类下的提示词
- 确保前后端都正确过滤，避免显示其他分类的提示词

### 2. 关联作品功能

创意工坊支持可选的作品关联，启用@功能：

```typescript
// WorkshopGeneratorPage 状态
const [selectedNovelId, setSelectedNovelId] = useState<number | undefined>(
  undefined
);
const [selectedNovelName, setSelectedNovelName] = useState<string>("");
const [chapters, setChapters] = useState<any[]>([]);
const [volumes, setVolumes] = useState<any[]>([]);

// 选择作品后加载数据
useEffect(() => {
  if (!selectedNovelId) return;

  // 加载章节列表
  const chaptersResponse = await apiService.get(
    `/novels/${selectedNovelId}/chapters`
  );
  setChapters(chaptersResponse.data.data);

  // 加载分卷列表
  const volumesResponse = await apiService.get(
    `/novels/${selectedNovelId}/volumes`
  );
  setVolumes(volumesResponse.data.data);
}, [selectedNovelId]);

// 传递给ChatTab
<ChatTab
  novelId={selectedNovelId} // 有值时启用@功能
  chapters={chapters}
  volumes={volumes}
  fixedCategoryId={category.id}
/>;
```

**功能逻辑**：

- `novelId` 为 `undefined`：@按钮禁用，无法关联内容
- `novelId` 有值：自动加载人物卡、世界观、备忘录等，@功能可用
- 用户可以随时切换关联的作品或取消关联

### 3. 提示词分类 API

```typescript
// 从后端获取启用的分类
const categories = await promptCategoriesApi.getCategories();

// 后端返回的数据结构
interface PromptCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  usageType: "writing" | "roleplay";
}
```

### 3. 组件复用

#### Dashboard 模式

```
CreativeWorkshopPage (卡片列表)
  → 点击卡片 → WorkshopGeneratorPage (独立全屏页)
    └── ChatTab (with fixedCategoryId)
          ├── PromptSelectionModal (locked to category)
          ├── ModelConfigModal
          └── 其他功能组件
```

#### 编辑器模式

```
AIAssistantPanel
  → 点击工坊按钮 → CreativeWorkshop (卡片列表)
    → 点击卡片 → GeneratorInterface
      └── ChatTab (with fixedCategoryId)
            ├── PromptSelectionModal (locked to category)
            ├── ModelConfigModal
            └── 其他功能组件
```

## 📝 使用说明

### Dashboard 模式

1. 登录后进入 Dashboard
2. 点击侧边栏"创意工坊"（魔法棒图标 `Wand2`）
3. 浏览功能卡片列表（自动从 API 获取分类）
4. 点击任意卡片（如"书名生成器"）进入独立全屏生成页
5. **[可选]** 点击"关联作品"按钮，选择作品以启用@功能
6. 选择提示词并使用 AI 生成内容
7. 点击"应用"按钮保存到作品
8. 点击返回按钮回到卡片列表

**💡 关联作品功能**：

- 默认不关联作品，可以直接使用通用提示词
- 关联作品后可以使用@功能引用人物卡、世界观、备忘录、章节
- 关联按钮显示当前作品名称，已关联时显示蓝色高亮

### 编辑器模式

1. 打开小说编辑器
2. 打开 AI 助手面板
3. 点击顶部"工坊"按钮（在帮助和新建对话之间）
4. AI 助手内容切换为功能卡片列表
5. 点击卡片进入生成界面（提示词选择器锁定该分类）
6. 生成内容可直接应用到编辑器
7. 点击工坊按钮返回对话模式

## 🎨 UI 设计

### 卡片样式

- **渐变背景**：蓝色到紫色的装饰性渐变
- **悬停效果**：向上浮动 + 阴影增强
- **响应式布局**：
  - 移动端：1 列
  - 平板：2 列
  - 桌面：3-4 列

### 颜色方案

- 主色调：蓝色 (#3B82F6)
- 辅助色：紫色 (#A855F7)、粉色 (#EC4899)
- 背景：渐变毛玻璃效果

## 🔐 权限控制

- 提示词分类由管理员在后台配置
- 只有启用的分类才会显示在创意工坊
- 提示词使用权限由提示词系统控制

## 📦 后端要求

确保后端接口正确返回：

- GET `/api/prompt-categories` - 返回启用的分类列表
- 分类必须包含 `id`、`name` 等必要字段

## 🚀 扩展建议

1. **统计数据**：显示每个模块的使用次数
2. **收藏功能**：用户可以收藏常用模块
3. **推荐系统**：根据用户使用习惯推荐模块
4. **模板市场**：每个分类下显示热门提示词
