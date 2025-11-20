# 作品编辑器页面

> 创建时间：2025-10-18  
> 文件位置：`frontend/src/pages/editor/NovelEditor.tsx`

## 📖 功能概述

作品编辑器是写作平台的核心功能，提供完整的章节编辑、内容管理和AI辅助写作功能。

## 🎯 核心功能

### 1. 页面布局

```
┌─────────────────────────────────────────────────────────────────┐
│  顶部栏：返回按钮 | 作品名 | 自动保存状态 | 总字数 | 手动保存  │
├───────────┬─────────────────────────────────────┬───────────────┤
│           │  工具栏（占位，待实现）              │               │
│  左侧     ├─────────────────────────────────────┤    右侧       │
│  章节     │  章节标题输入                        │    AI助手     │
│  列表     ├─────────────────────────────────────┤    （预留）   │
│           │                                     │               │
│  • 章节1  │  内容编辑区域                        │               │
│  • 章节2  │  （多行文本输入）                    │               │
│  • ...    │                                     │               │
│           │  【文本选中悬浮窗】                  │               │
│           │                                     │               │
└───────────┴─────────────────────────────────────┴───────────────┘
```

### 2. 顶部功能栏

**左侧**：
- ✅ 返回按钮：返回作品列表
- ✅ 作品名称显示
- ✅ 自动保存状态
  - 保存中：显示加载图标
  - 已保存：显示时间
  - 未保存：提示状态

**右侧**：
- ✅ 总字数统计
- ✅ 手动保存按钮

### 3. 左侧章节列表

**功能**：
- ✅ 新建章节按钮
- ✅ 章节列表展示
  - 章节标题
  - 字数统计
  - 当前选中高亮
- ✅ 章节切换
- ⏳ 章节操作菜单（待实现）
  - 编辑
  - 删除
  - 移动

**样式**：
- 宽度：256px (w-64)
- 背景：白色
- 滚动：可滚动

### 4. 中间编辑区域

**工具栏（占位）**：
- 高度：48px
- 灰色背景
- 显示"编辑器工具栏（待实现）"提示文字

**章节标题**：
- ✅ 可编辑输入框
- ✅ 大号字体（text-2xl）
- ✅ 聚焦时底部蓝色下划线
- ✅ 实时字数统计

**内容编辑**：
- ✅ 全屏textarea
- ✅ 无边框设计
- ✅ 舒适的行高
- ✅ 系统字体
- ✅ 占满剩余空间

### 5. 文本选中悬浮窗 ⭐

**触发条件**：
- 用户选中文本（鼠标抬起或键盘释放）
- 选中内容不为空

**位置计算**：
- 默认：选中文本下方居中
- 智能调整：如果接近底部，显示在文本上方
- 水平居中对齐选中区域

**功能按钮**：
- 已选中字数显示
- AI续写按钮
- AI改写按钮
- AI扩写按钮

**样式特点**：
- 深色背景（bg-gray-900）
- 白色文字
- 圆角设计
- 阴影效果
- 自动跟随选区

### 6. 右侧AI助手（预留）

**功能**：
- ⏳ AI对话界面
- ⏳ AI生成功能
- ⏳ 写作建议

**样式**：
- 宽度：320px (w-80)
- 背景：白色
- 当前显示："功能开发中"提示

## 🔄 路由配置

### 路由路径
```
/editor/:novelId
```

### 参数
- `novelId`: 作品ID（数字）

### 示例
```
/editor/1  → 编辑ID为1的作品
/editor/42 → 编辑ID为42的作品
```

### 跳转方式

**从作品列表跳转**：
```typescript
// Works.tsx
const handleNovelClick = (novel: Novel) => {
  navigate(`/editor/${novel.id}`);
};
```

**程序化跳转**：
```typescript
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();
navigate(`/editor/${novelId}`);
```

## 💾 数据管理

### 当前实现（Mock数据）

```typescript
// 模拟数据结构
interface Chapter {
  id: number;
  title: string;
  volumeId: number;
  volumeName: string;
  content: string;
  wordCount: number;
  order: number;
}
```

### 待实现（真实API）

**需要的API接口**：

1. **获取作品信息**
   ```
   GET /api/v1/novels/:id
   ```

2. **获取章节列表**
   ```
   GET /api/v1/novels/:id/chapters
   ```

3. **获取章节内容**
   ```
   GET /api/v1/chapters/:id
   ```

4. **保存章节内容**
   ```
   PUT /api/v1/chapters/:id
   Body: { content: string }
   ```

5. **创建章节**
   ```
   POST /api/v1/novels/:id/chapters
   Body: { title: string, volumeId: number }
   ```

## 🎨 样式特点

### 响应式设计
- 目前为桌面端优化
- 移动端适配待实现

### 配色方案
- 主背景：灰色 (#f9fafb)
- 卡片背景：白色
- 高亮色：蓝色 (#3b82f6)
- 文字：深灰 (#111827)

### 交互反馈
- ✅ 悬停效果
- ✅ 点击反馈
- ✅ 加载状态
- ✅ 保存提示

## 🚀 未来优化

### 功能增强
1. **编辑器工具栏**
   - 文字格式化
   - 字体大小调整
   - 主题切换

2. **自动保存优化**
   - 防抖处理（现已标注TODO）
   - 本地缓存
   - 离线编辑

3. **章节管理**
   - 拖拽排序
   - 批量操作
   - 分卷管理

4. **AI功能**
   - 智能续写
   - 内容改写
   - 风格优化
   - 对话助手

5. **协作功能**
   - 多人编辑
   - 版本控制
   - 评论批注

### 性能优化
1. 大文件编辑优化
2. 虚拟滚动
3. 延迟加载
4. 增量保存

## 📝 使用示例

### 从作品列表进入编辑器

```typescript
// 1. 在Works页面点击作品卡片
<NovelCard
  novel={novel}
  onClick={() => handleNovelClick(novel)} // 跳转到编辑器
/>

// 2. 自动跳转到编辑器
navigate(`/editor/${novel.id}`);

// 3. 编辑器加载作品数据
useEffect(() => {
  loadNovelData();
}, [novelId]);
```

### 文本选中操作

```typescript
// 1. 用户选中文本
<textarea
  onMouseUp={handleTextSelect}
  onKeyUp={handleTextSelect}
/>

// 2. 显示悬浮工具栏
{selectionToolbar.show && (
  <div style={{ left: x, top: y }}>
    选中 {length} 字
    <button>AI续写</button>
    <button>AI改写</button>
  </div>
)}
```

### 自动保存

```typescript
// 1. 内容变化触发
const handleContentChange = (e) => {
  setChapterContent(e.target.value);
  triggerAutoSave(e.target.value);
};

// 2. 自动保存逻辑（待优化）
const triggerAutoSave = (content) => {
  setAutoSaving(true);
  // TODO: 防抖 + API调用
  setTimeout(() => {
    setAutoSaving(false);
    setLastSaveTime(new Date());
  }, 1000);
};
```

## 🐛 已知问题

1. ⚠️ **自动保存未实现防抖**
   - 当前：每次输入都触发
   - 需要：延迟500ms后才保存
   
2. ⚠️ **无网络错误处理**
   - 需要添加离线提示
   - 本地缓存机制

3. ⚠️ **章节操作菜单未完成**
   - 有按钮但无功能
   - 需要添加编辑/删除

4. ⚠️ **移动端适配待优化**
   - 当前为桌面端优化
   - 需要响应式布局

## 📚 相关文档

- [作品管理页面](../dashboard/Works.tsx)
- [作品卡片组件](../../components/novels/NovelCard.tsx)
- [路由配置](../../App.tsx)
- [组件文档](../../components/README.md)

---

**最后更新**: 2025-10-18  
**状态**: ✅ 基础功能已完成，待接入真实API
