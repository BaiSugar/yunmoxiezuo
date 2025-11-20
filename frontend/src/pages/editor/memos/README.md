# 备忘录管理模块

## 功能概述

备忘录管理模块为小说编辑器提供了灵感记录和快速笔记功能，帮助作者在创作过程中记录重要的想法、灵感和待办事项。

## 核心功能

### 1. 备忘录列表
- **搜索功能**：支持按标题和内容搜索备忘录
- **智能排序**：置顶备忘录优先显示，其余按更新时间倒序排列
- **快速创建**：一键创建新备忘录
- **实时状态**：显示备忘录的创建和更新时间

### 2. 实时编辑
- **点击即编辑**：选择备忘录后直接进入编辑模式
- **自动保存**：输入1秒后自动保存，无需手动操作
- **保存状态**：实时显示保存状态（保存中/已保存+时间）
- **颜色标签**：支持自定义颜色标签，便于分类识别
- **置顶功能**：重要备忘录可置顶显示

### 3. 编辑功能
- **标题编辑**：支持长达200字符的标题
- **内容编辑**：不限长度的文本内容
- **颜色选择**：自由选择标签颜色
- **实时保存**：1秒防抖自动保存

### 4. 备忘录管理
- **创建备忘录**：快速创建新的备忘录
- **编辑备忘录**：修改现有备忘录的内容
- **删除备忘录**：带确认对话框的安全删除
- **置顶管理**：设置/取消置顶状态

## 数据结构

### Memo 接口
```typescript
interface Memo {
  id: number;              // 备忘录ID
  novelId: number;         // 所属作品ID
  title: string;           // 标题（最大200字符）
  content: string;         // 内容
  color?: string;          // 标签颜色（默认#3B82F6）
  isPinned: boolean;       // 是否置顶
  reminderAt?: string;     // 提醒时间（预留）
  createdAt: string;       // 创建时间
  updatedAt: string;       // 更新时间
}
```

### CreateMemoDto
```typescript
interface CreateMemoDto {
  title: string;           // 标题（必填）
  content: string;         // 内容（必填）
  color?: string;          // 颜色（可选）
  isPinned?: boolean;      // 是否置顶（可选）
  reminderAt?: string;     // 提醒时间（可选）
}
```

## API 端点

### 获取备忘录列表
```
GET /api/v1/memos?novelId={novelId}
```

### 创建备忘录
```
POST /api/v1/memos?novelId={novelId}
Body: CreateMemoDto
```

### 更新备忘录
```
PATCH /api/v1/memos/:id
Body: UpdateMemoDto
```

### 删除备忘录
```
DELETE /api/v1/memos/:id
```

## 使用场景

1. **灵感记录**：突然有了新的情节想法，立即记录
2. **人物设定**：临时记录人物的性格特点、背景故事
3. **剧情大纲**：快速记录章节大纲和重要转折点
4. **待修改项**：标记需要修改的章节或情节漏洞
5. **参考资料**：保存创作过程中需要参考的信息

## UI设计特点

- **左右布局**：列表在左，详情在右，适合桌面编辑
- **渐变色彩**：使用橙色渐变，与其他模块区分
- **置顶标识**：使用📌图标标识置顶备忘录
- **颜色标签**：左侧竖条显示自定义颜色
- **响应式设计**：全屏弹窗，最大化利用空间

## 集成方式

在编辑器中通过"编辑工具"底部Sheet访问：

```tsx
<MobileEditorTools
  onViewMemos={() => setShowMemos(true)}
  ...
/>
```

在主编辑器中渲染：

```tsx
{showMemos && (
  <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
      <MemosPage onClose={() => setShowMemos(false)} />
    </div>
  </div>
)}
```

## 未来扩展

- [ ] 提醒功能：支持设置定时提醒
- [ ] 分类标签：支持自定义标签分类
- [ ] 全文搜索：增强搜索功能
- [ ] Markdown支持：支持Markdown格式
- [ ] 导出功能：导出备忘录为文件
- [ ] 附件上传：支持上传图片等附件
