# 独立章节和分卷混合排序方案

## 问题
当前独立章节总是在所有分卷前面显示，无法实现：
```
独立章节2
分卷1
独立章节1
```

## 方案1：修改数据结构（推荐）

### 数据结构
给 Volume 和 Chapter 都添加 `globalOrder` 字段：

```typescript
interface Volume {
  id: number;
  name: string;
  order: number; // 分卷间的顺序
  globalOrder: number; // 在整个列表中的全局顺序
  isCollapsed: boolean;
  chapters: Chapter[];
}

interface Chapter {
  id: number;
  title: string;
  volumeId: number | null;
  order: number; // 章节在分卷内的顺序
  globalOrder: number; // 独立章节的全局顺序（仅对独立章节有效）
  content: string;
  wordCount: number;
}
```

### 渲染逻辑
```tsx
// 创建混合列表
const mixedList = [
  ...standaloneChapters.map(c => ({ type: 'chapter', data: c, order: c.globalOrder })),
  ...volumes.map(v => ({ type: 'volume', data: v, order: v.globalOrder }))
].sort((a, b) => a.order - b.order);

// 渲染
{mixedList.map(item => 
  item.type === 'chapter' 
    ? renderChapter(item.data)
    : renderVolume(item.data)
)}
```

## 方案2：简化方案（当前可用）

**规则：**
- 独立章节总是在分卷前面
- 拖到折叠分卷下方 → 成为独立章节（会跑到最上面）
- 拖到展开分卷下方 → 成为分卷第一个章节

**优点：**
- 不需要修改数据结构
- 简单易实现

**缺点：**
- 独立章节无法在分卷下方

## 建议

如果需要支持完全自由的排序（独立章节和分卷混合），建议使用方案1。

如果可以接受独立章节总是在前的限制，使用方案2即可。
