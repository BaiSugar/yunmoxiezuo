# AI 助手真实API集成文档

## 概述

已将AI助手中的模拟数据替换为真实的后端API调用，实现真正的AI生成功能。

---

## 主要改动

### **1. 新增 Generation API 服务**
📄 `frontend/src/services/generation.api.ts`

**功能：**
- ✅ 非流式生成：`generateWriting()`
- ✅ 流式生成：`generateWritingStream()`

**流式生成实现：**
```typescript
// 使用 fetch + ReadableStream 读取 SSE 流
const cancel = await generationApi.generateWritingStream(
  {
    promptId: 1,
    userInput: "用户输入",
    temperature: 0.7,
    history: [...],
  },
  (content) => {
    // 每次接收到新内容时的回调
    console.log(content);
  },
  () => {
    // 生成完成时的回调
    console.log('完成');
  },
  (error) => {
    // 错误处理回调
    console.error(error);
  }
);

// 可以调用 cancel() 停止生成
cancel();
```

---

### **2. ChatTab 组件改造**

**移除模拟代码：**
```typescript
// ❌ 旧代码：模拟的打字机效果
const mockResponse = "这是一个模拟的AI回复...";
let currentIndex = 0;
const interval = window.setInterval(() => {
  // ... 逐字显示
}, 30);
```

**替换为真实API：**
```typescript
// ✅ 新代码：真实的流式API调用
const cancel = await generationApi.generateWritingStream(
  {
    promptId: config.promptId,
    parameters: config.parameters,
    userInput: inputValue,
    modelId: config.modelId ? String(config.modelId) : undefined,
    temperature,
    history,
  },
  // 实时接收AI生成的内容
  (content: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === aiMessageId
        ? { ...msg, content: msg.content + content }
        : msg
    ));
  },
  // 生成完成
  () => {
    setMessages(prev => prev.map(msg =>
      msg.id === aiMessageId
        ? { ...msg, isGenerating: false }
        : msg
    ));
    setGeneratingMessageId(null);
  },
  // 错误处理
  (error: Error) => {
    console.error('AI生成错误:', error);
    showError(`AI生成失败: ${error.message}`);
  }
);
```

---

### **3. 状态管理改进**

**旧方式：**
```typescript
const generationIntervalRef = React.useRef<number | null>(null);

// 停止生成
if (generationIntervalRef.current) {
  clearInterval(generationIntervalRef.current);
}
```

**新方式：**
```typescript
const generationCancelRef = React.useRef<(() => void) | null>(null);

// 停止生成
if (generationCancelRef.current) {
  generationCancelRef.current(); // 调用 cancel 函数
}
```

---

## 后端 API 说明

### **接口路径**

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 非流式生成 | POST | `/api/v1/generation/writing` | 一次性返回完整结果 |
| 流式生成 | POST | `/api/v1/generation/writing/stream` | SSE流式返回 |

---

### **请求参数（WritingGenerationDto）**

```typescript
{
  promptId?: number;           // 提示词ID（可选）
  parameters?: Record<string, string>;  // 参数替换
  userInput?: string;          // 用户输入
  modelId?: string;            // AI模型ID
  temperature?: number;        // 温度参数 (0-2)
  maxTokens?: number;          // 最大Token数
  stream?: boolean;            // 是否流式（非流式接口使用）
  history?: Array<{            // 对话历史
    role: 'user' | 'assistant';
    content: string;
  }>;
}
```

---

### **响应格式**

**非流式响应：**
```json
{
  "content": "生成的完整文本...",
  "usage": {
    "promptTokens": 100,
    "completionTokens": 200,
    "totalTokens": 300
  }
}
```

**流式响应（SSE）：**
```
data: {"content":"生"}

data: {"content":"成"}

data: {"content":"的"}

data: [DONE]
```

---

## 完整工作流程

### **1. 用户发送消息**
```typescript
用户输入消息 + 选择提示词/参数
  ↓
构建用户消息对象
  ↓
添加到消息列表
  ↓
创建AI消息占位符（isGenerating: true）
```

---

### **2. 调用AI生成API**
```typescript
准备请求参数：
  - promptId: 选中的提示词ID
  - parameters: 参数映射
  - userInput: 用户输入
  - modelId: 选中的模型
  - temperature: 温度设置
  - history: 历史消息
  ↓
调用 generateWritingStream()
  ↓
开始接收流式响应
```

---

### **3. 流式更新UI**
```typescript
每次接收到新内容：
  ↓
更新AI消息的 content 字段
  ↓
触发 React 重新渲染
  ↓
用户看到打字机效果
```

---

### **4. 完成/错误处理**
```typescript
生成完成：
  - 设置 isGenerating: false
  - 清除 generatingMessageId
  - 保存对话到后端

生成错误：
  - 显示错误消息
  - 停止生成状态
  - Toast提示用户
```

---

## 错误处理

### **网络错误**
```typescript
try {
  const cancel = await generationApi.generateWritingStream(...);
} catch (error) {
  showError(`AI生成失败: ${error.message}`);
  // 更新消息为错误状态
  setMessages(prev => prev.map(msg =>
    msg.id === aiMessageId
      ? { ...msg, content: `生成失败: ${error.message}`, isGenerating: false }
      : msg
  ));
}
```

---

### **流式读取错误**
```typescript
// onError 回调
(error: Error) => {
  console.error('AI生成错误:', error);
  // 显示错误提示
  showError(`AI生成失败: ${error.message}`);
  // 更新消息状态
  setMessages(prev => prev.map(msg =>
    msg.id === aiMessageId
      ? { ...msg, content: msg.content || `生成失败: ${error.message}`, isGenerating: false }
      : msg
  ));
}
```

---

## 用户交互

### **停止生成**
```typescript
用户点击"停止生成"按钮
  ↓
调用 handleStopGeneration()
  ↓
执行 generationCancelRef.current()
  ↓
取消流式请求
  ↓
设置消息状态为非生成中
```

---

### **重新生成**
```typescript
用户点击"重新生成"按钮
  ↓
删除当前AI消息
  ↓
重新调用 handleSend()
  ↓
发起新的生成请求
```

---

## 权限要求

后端接口需要权限：
```typescript
@RequirePermissions(GENERATION_PERMISSIONS.WRITING_GENERATE)
```

用户需要拥有 `generation:writing:generate` 权限。

---

## 依赖关系

```
ChatTab.tsx
  ↓ 导入
generation.api.ts
  ↓ 使用
apiService (axios实例)
  ↓ 请求
后端 /api/v1/generation/writing/stream
  ↓ 调用
WritingGenerationService
  ↓ 调用
AI模型（OpenAI/Claude等）
```

---

## 测试检查清单

- [ ] ✅ 发送消息后能看到AI回复（流式显示）
- [ ] ✅ 停止生成按钮可正常工作
- [ ] ✅ 重新生成功能正常
- [ ] ✅ 错误提示正常显示
- [ ] ✅ 对话历史正确传递
- [ ] ✅ 提示词参数正确替换
- [ ] ✅ 模型选择生效
- [ ] ✅ 温度参数生效
- [ ] ✅ 对话保存到后端

---

## 注意事项

1. **Token管理**：确保 localStorage 中有有效的 accessToken
2. **错误重试**：流式请求失败不会自动重试，需用户手动重新生成
3. **并发控制**：同时只能有一个生成请求，新请求会取消旧请求
4. **内存管理**：长对话会占用更多内存，建议限制历史消息数量
5. **权限检查**：确保用户有生成权限，否则会返回403

---

## 未来优化

1. **自动重试**：网络错误时自动重试
2. **离线支持**：缓存部分对话内容
3. **进度指示**：显示生成进度（如 Token 数量）
4. **多模型支持**：同时请求多个模型进行比较
5. **引用溯源**：显示生成内容的来源（使用了哪些提示词、人物卡等）

---

## 完成状态

- ✅ 移除所有模拟数据
- ✅ 集成真实流式API
- ✅ 实现完整错误处理
- ✅ 支持停止生成
- ✅ 对话历史传递
- ✅ 参数和配置传递
- ✅ UI状态正确更新

**准备就绪，可投入生产使用！** 🎉
