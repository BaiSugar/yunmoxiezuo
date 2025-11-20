# AI助手组件

完整实现了小说编辑器的AI助手功能，包含**对话**和**生成**两个Tab。

## 📁 文件结构

```
ai-assistant/
├── AIAssistantPanel.tsx      # 主面板（Tab切换、顶部按钮）
├── ChatTab.tsx                # 对话Tab
├── GenerateTab.tsx            # 生成Tab
├── ModelConfigModal.tsx       # 模型配置模态框
├── index.ts                   # 导出文件
└── README.md                  # 本文档
```

## 🎨 界面功能

### 1. **顶部导航栏**
- ✅ Tab切换：对话 / 生成
- ✅ 新建对话按钮（Plus图标）
- ✅ 历史记录按钮（History图标）

### 2. **对话Tab**
- ✅ 对话区域（空状态提示）
- ✅ 关联内容按钮（@符号）
- ✅ 添加文件按钮（📎图标）
- ✅ 多行输入框
- ✅ 发送按钮（圆形蓝色按钮）
- ✅ Enter键发送，Shift+Enter换行

**提示文字**：
```
对话区域，输入任何你对小说的疑问，
比如"人物设定如何修改"，"文章建议"。
```

### 3. **生成Tab**
- ✅ 生成区域（空状态提示）
- ✅ 关联内容按钮
- ✅ 添加文件按钮
- ✅ 多行输入框
- ✅ 生成按钮
- ✅ **选择提示词下拉框**（替代"选择模板"）
- ✅ **专业模型按钮**（打开配置模态框）

**提示文字**：
```
选择提示词，输入生成指令
AI将根据你的要求生成内容
```

### 4. **模型配置模态框**
- ✅ AI模型选择（5个模型）
  - GPT-4 Turbo（最强大的模型）
  - GPT-4（平衡性能和速度）
  - Claude 3 Opus（创意写作首选）
  - Claude 3 Sonnet（快速响应）
  - Gemini Pro（Google最新模型）
- ✅ 温度滑块（0-2，步长0.1）
- ✅ 快捷按钮：精确(0.3) / 平衡(0.7) / 创意(1.0)
- ✅ 保存配置按钮
- ✅ Portal渲染（最顶层显示）
- ✅ ESC键关闭

## 🔌 接口设计

### ChatTab Props
```typescript
interface ChatTabProps {
  onSendMessage: (message: string, mentions: string[], files: File[]) => void;
}
```

### GenerateTab Props
```typescript
interface GenerateTabProps {
  onGenerate: (
    promptId: number, 
    input: string, 
    modelId: string, 
    temperature?: number
  ) => void;
}
```

### ModelConfigModal Props
```typescript
interface ModelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentModel: string;
  currentTemperature: number;
  onSave: (model: string, temperature: number) => void;
}
```

## 💡 使用示例

```tsx
import { AIAssistant } from "./components/AIAssistant";

function NovelEditor() {
  return (
    <div className="flex h-screen">
      <EditorContent width={600} />
      <AIAssistant width={400} />
    </div>
  );
}
```

## 🎯 TODO事项

### 对话功能
- [ ] 实现消息列表显示
- [ ] 接入AI对话API
- [ ] 实现@关联内容功能
- [ ] 实现文件上传
- [ ] 消息历史记录
- [ ] 流式响应显示

### 生成功能
- [ ] 从API加载用户的提示词列表
- [ ] 接入AI生成API
- [ ] 生成结果插入编辑器
- [ ] 保存生成历史
- [ ] 生成参数预设

### 模型配置
- [ ] 从用户偏好加载默认配置
- [ ] 保存配置到用户偏好
- [ ] 显示当前使用的模型信息
- [ ] 模型切换时自动加载对应温度

### 用户体验优化
- [ ] 加载状态指示器
- [ ] 错误提示
- [ ] 生成进度条
- [ ] 取消生成功能
- [ ] 快捷键支持

## 🎨 设计规范

### 颜色
- 主色调：蓝色 `#3B82F6`
- 对话图标：蓝色 `text-blue-400`
- 生成图标：紫色 `text-purple-400`
- 按钮hover：`hover:bg-gray-100`

### 间距
- 内边距：`p-4`, `px-6 py-3`
- 外边距：`gap-3`, `space-y-6`
- 圆角：`rounded-lg`, `rounded-2xl`

### 动画
- 按钮：`transition-colors`
- 图标脉冲：同心圆层叠效果

## 🔗 相关文档

- 后端API：`backend/src/generation/` - AI生成服务
- 用户偏好：`backend/src/users/` - 用户模型偏好设置
- 提示词管理：`frontend/src/pages/prompts/` - 提示词广场

## 📝 更新日志

**2025-01-24**
- ✅ 创建完整的AI助手界面
- ✅ 实现对话Tab和生成Tab
- ✅ 添加模型配置模态框
- ✅ "选择模板"改为"选择提示词"
- ✅ 响应式设计和毛玻璃效果

---

**状态**：✅ 界面完成，待集成后端API
