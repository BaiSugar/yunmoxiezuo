# Agent 系统快速参考

> 5分钟速览整个 Agent 系统

---

## 🎯 核心概念

### Agent vs 提示词

| 维度 | Agent            | 提示词           |
| ---- | ---------------- | ---------------- |
| 定位 | 智能助手         | 内容模板         |
| 能力 | 编排、判断、执行 | 定义规则         |
| 交互 | 主动交互         | 被动引用         |
| 复用 | 可组合、可嵌套   | 可被多处引用     |
| 示例 | "对话大师"Agent  | "对话写作"提示词 |

### 三种交互模式

```
1. 内联补全 (Inline Completion)
   写作时自动提示 → Tab接受 → 继续写作

2. 对话协作 (Chat)
   打开侧边栏 → 与Agent讨论 → 插入结果

3. 快速操作 (Quick Action)
   选中文本 → 右键菜单 → 选择操作 → 查看结果
```

---

## 📦 Agent 配置速查

### 最小配置（纯提示词）

```json
{
  "name": "我的助手",
  "systemPromptType": "prompt",
  "systemPromptId": 123,
  "capabilities": {
    "inlineCompletion": true,
    "chat": false,
    "quickActions": []
  }
}
```

### 标准配置（自定义+引用）

```json
{
  "name": "对话助手",
  "icon": "💬",
  "systemPromptType": "custom",
  "systemPromptContent": "你是对话专家...",
  "promptReferences": [{ "promptId": 100, "position": "system" }],
  "capabilities": {
    "inlineCompletion": true,
    "enableInlineByDefault": true,
    "showThoughts": true,
    "chat": true,
    "quickActions": ["continue", "rewrite"]
  },
  "contextConfig": {
    "includeCharacters": true,
    "includeWorldSettings": false,
    "historyLength": 1,
    "maxContextTokens": 4000
  }
}
```

### 高级配置（多Agent协作）

```json
{
  "name": "章节创作大师",
  "icon": "📖",
  "systemPromptType": "custom",
  "systemPromptContent": "你是章节创作协调者...",
  "capabilities": {
    "chat": true,
    "showThoughts": true,
    "structureOperations": ["createChapter"]
  },
  "subAgents": [
    { "agentId": 10, "role": "outline", "order": 1 },
    { "agentId": 5, "role": "dialogue", "order": 2 },
    { "agentId": 8, "role": "description", "order": 3 }
  ],
  "workflow": {
    "mode": "sequential",
    "allowParallel": true,
    "parallelSteps": [2, 3]
  },
  "autoTriggers": [
    {
      "condition": "user_input_contains",
      "keywords": ["创建章节"],
      "action": "auto_orchestrate"
    }
  ]
}
```

---

## 🔌 API 速查

### Agent 管理

```bash
# 创建Agent
POST /api/v1/agents
Body: { name, systemPromptType, capabilities, ... }

# 获取列表
GET /api/v1/agents?page=1&limit=20

# 获取详情
GET /api/v1/agents/:id

# 更新
PUT /api/v1/agents/:id

# 删除
DELETE /api/v1/agents/:id
```

### Agent 交互

```bash
# 内联补全
POST /api/v1/agents/:id/complete
Body: { text, context, maxLength }

# 对话
POST /api/v1/agents/:id/chat
Body: { message, context, history, sessionId }

# 快速操作
POST /api/v1/agents/:id/quick-action
Body: { action, text, context }

# 结构操作
POST /api/v1/agents/:id/structure-operation
Body: { operation, context, parameters }

# Agent编排
POST /api/v1/agents/:id/orchestrate
Body: { task, context, workflow }
```

### Agent 市场

```bash
# 浏览市场
GET /api/v1/agents/market?sortBy=popular

# 添加到我的
POST /api/v1/agents/:id/add

# 评价
POST /api/v1/agents/:id/rate
Body: { rating, comment }
```

---

## 🎨 前端集成速查

### 内联补全

```tsx
// 1. 监听编辑器输入
editor.on('input:pause', async () => {
  const text = editor.getTextBeforeCursor(500);
  const suggestion = await api.post(`/agents/${agentId}/complete`, {
    text,
    context: { chapterId },
  });
  editor.showSuggestion(suggestion.text);
});

// 2. 快捷键
editor.on('key:tab', () => editor.acceptSuggestion());
editor.on('key:esc', () => editor.dismissSuggestion());
```

### 对话协作

```tsx
// Agent侧边栏
const sendMessage = async (message) => {
  const response = await api.post(`/agents/${agentId}/chat`, {
    message,
    context: { chapterId },
    history: messages.slice(-10),
  });

  setMessages((prev) => [
    ...prev,
    { role: 'user', content: message },
    { role: 'assistant', content: response.text },
  ]);
};
```

### Thoughts 展示

```tsx
// WebSocket监听
useEffect(() => {
  socket.on('agent:thought', (data) => {
    setThoughts((prev) => [...prev, data.thought]);
  });

  socket.on('agent:completed', (data) => {
    setResult(data.result);
  });
}, [socket]);

// UI展示
<div className="thoughts">
  <h4>💭 Agent思考中...</h4>
  {thoughts.map((t, i) => (
    <div key={i}>• {t}</div>
  ))}
</div>;
```

### 协作流程

```tsx
// 显示协作进度
<AgentOrchestrationFlow
  steps={[
    { agent: '情节大师', status: 'completed' },
    { agent: '对话大师', status: 'running' },
    { agent: '描写大师', status: 'pending' },
  ]}
/>
```

---

## 🔧 配置决策树

```
需要创建Agent
    ↓
问题1: 功能简单还是复杂？
    ├─ 简单（续写/改写）
    │   ↓
    │   使用单Agent
    │   引用已有提示词
    │
    └─ 复杂（创建章节/分析结构）
        ↓
        问题2: 需要多种能力吗？
            ├─ 需要
            │   ↓
            │   创建编排型主Agent
            │   配置多个子Agent
            │
            └─ 不需要
                ↓
                创建单Agent
                配置多个提示词引用

问题3: 需要自动触发吗？
    ├─ 需要
    │   ↓
    │   配置autoTriggers
    │   选择触发条件
    │   选择动作类型
    │
    └─ 不需要
        ↓
        手动触发即可

问题4: 需要实时反馈吗？
    ├─ 需要
    │   ↓
    │   开启showThoughts
    │   使用流式生成
    │
    └─ 不需要
        ↓
        使用普通模式
```

---

## 💡 常见用例速查

### 用例 1: 简单续写助手

```json
{
  "name": "续写助手",
  "systemPromptId": 123,
  "capabilities": {
    "inlineCompletion": true,
    "chat": false
  }
}
```

### 用例 2: 对话优化助手

```json
{
  "name": "对话优化",
  "systemPromptId": 456,
  "capabilities": {
    "chat": true,
    "quickActions": ["rewrite", "expand"]
  },
  "contextConfig": {
    "includeCharacters": true
  }
}
```

### 用例 3: 章节创作流水线

```json
{
  "name": "章节流水线",
  "capabilities": {
    "structureOperations": ["createChapter"]
  },
  "subAgents": [
    { "agentId": 10, "role": "outline" },
    { "agentId": 5, "role": "dialogue" },
    { "agentId": 8, "role": "description" }
  ],
  "workflow": {
    "mode": "sequential",
    "parallelSteps": [2, 3]
  }
}
```

### 用例 4: 智能质检助手

```json
{
  "name": "质检助手",
  "capabilities": {
    "structureOperations": ["checkConsistency", "analyzeStructure"]
  },
  "autoTriggers": [
    {
      "condition": "chapter_save",
      "action": "call_sub_agent",
      "silent": true
    }
  ]
}
```

---

## 🌊 工作流模式速查

### 串行模式

```json
{
  "mode": "sequential",
  "agents": [
    { "agentId": 1, "output": "step1" },
    { "agentId": 2, "input": ["step1"], "output": "step2" },
    { "agentId": 3, "input": ["step1", "step2"] }
  ]
}
```

**执行**: A → B → C

### 并行模式

```json
{
  "mode": "sequential",
  "parallelSteps": [1, 2, 3],
  "agents": [{ "agentId": 1 }, { "agentId": 2 }, { "agentId": 3 }]
}
```

**执行**: A + B + C (同时)

### 混合模式

```json
{
  "mode": "sequential",
  "parallelSteps": [2, 3],
  "agents": [
    { "agentId": 1, "output": "outline" },
    { "agentId": 2, "input": ["outline"] },
    { "agentId": 3, "input": ["outline"] }
  ]
}
```

**执行**: A → (B + C)

---

## ⚡ 性能优化速查

### 内联补全优化

```json
{
  "modelId": "gemini-2.0-flash", // 使用快速模型
  "temperature": 0.5, // 降低随机性
  "contextConfig": {
    "historyLength": 0, // 不包含历史
    "maxContextTokens": 2000 // 限制上下文
  }
}
```

### 对话优化

```json
{
  "modelId": "gpt-4o-mini", // 平衡质量和速度
  "temperature": 0.7,
  "contextConfig": {
    "historyLength": 1, // 只包含前1章
    "maxContextTokens": 4000
  }
}
```

### 创作优化

```json
{
  "modelId": "gpt-4o", // 使用高质量模型
  "temperature": 0.9, // 提高创造性
  "contextConfig": {
    "historyLength": 3, // 包含前3章
    "maxContextTokens": 8000 // 足够的上下文
  },
  "workflow": {
    "allowParallel": true, // 启用并行
    "parallelSteps": [2, 3]
  }
}
```

---

## 🎭 预设 Agent 推荐

### 日常写作

```
✅ 对话大师 - 内联补全 + 快速改写
✅ 描写大师 - 场景扩写 + 润色
✅ 润色大师 - 文字优化
```

### 章节创作

```
✅ 章节创作大师 (主Agent)
   ├─ 情节大师 (子Agent)
   ├─ 对话大师 (子Agent)
   └─ 描写大师 (子Agent)
```

### 质量管理

```
✅ 一致性检查Agent (自动触发)
✅ 结构分析Agent (手动触发)
```

---

## 🔀 提示词与 Agent 协作

### 模式 1: 纯提示词 Agent

```
Agent --引用--> 提示词
```

**适用**: 简单场景，快速搭建

### 模式 2: 提示词组合 Agent

```
Agent --引用--> [提示词A, 提示词B, 提示词C]
```

**适用**: 需要多套规则

### 模式 3: Agent 调用 Agent

```
主Agent --调用--> [子Agent1, 子Agent2, 子Agent3]
              ↓
         每个子Agent可引用提示词
```

**适用**: 复杂任务，专业分工

### 模式 4: 混合协作

```
主Agent
  ├─ 引用提示词A
  ├─ 引用提示词B
  └─ 调用子Agent
       └─ 引用提示词C
```

**适用**: 最高灵活性

---

## 🚀 快速上手

### 1. 创建你的第一个 Agent (2分钟)

```bash
# 1. 从市场添加预设Agent
POST /api/v1/agents/1/add

# 或自己创建
POST /api/v1/agents
{
  "name": "我的助手",
  "systemPromptType": "prompt",
  "systemPromptId": 你的提示词ID,
  "capabilities": {
    "inlineCompletion": true
  }
}
```

### 2. 在编辑器中使用 (1分钟)

```tsx
// 前端代码
import { useAgent } from '@/hooks/useAgent';

const { currentAgent, complete } = useAgent(agentId);

// 内联补全
const suggestion = await complete({
  text: editorText,
  context: { chapterId },
});
```

### 3. 体验效果

```
1. 在编辑器中写作
2. 停顿2秒
3. 看到灰色提示文本
4. 按Tab接受
5. 继续写作
```

---

## 📊 调用时机决策

### 何时调用单 Agent？

```
✅ 续写一小段
✅ 改写选中文本
✅ 快速润色
✅ 实时补全
```

**特点**: 快速、简单、低成本

### 何时调用多 Agent？

```
✅ 创建完整章节
✅ 复杂优化任务
✅ 需要多种专业能力
✅ 追求高质量输出
```

**特点**: 慢、复杂、高质量、高成本

### 何时自动触发？

```
✅ 保存时检查一致性（后台）
✅ 完成章节生成梗概（自动）
✅ 检测到问题给建议（提示）
✅ 定期备份（定时）
```

**特点**: 提升效率、不打扰用户

---

## 💰 成本对比

### Token 消耗估算

| 操作                | Token 消耗 | 耗时 | 成本 |
| ------------------- | ---------- | ---- | ---- |
| 内联补全（100字）   | ~600       | 1秒  | 低   |
| 快速改写（200字）   | ~1000      | 2秒  | 低   |
| 对话（1轮）         | ~1500      | 3秒  | 中   |
| 创建章节（单Agent） | ~3000      | 5秒  | 中   |
| 创建章节（3Agent）  | ~8000      | 12秒 | 高   |
| 分析结构            | ~5000      | 8秒  | 中   |

### 节省成本建议

1. **日常写作**：使用轻量 Agent（flash模型）
2. **重要章节**：使用多 Agent 协作（4o模型）
3. **批量操作**：使用后台队列（避免并发）
4. **智能缓存**：相同输入复用结果（5分钟）

---

## 🐛 问题排查

### Agent 无响应？

```
检查清单:
□ Agent是否存在？
□ 用户是否有权限？
□ 引用的提示词是否有权限？
□ 字数余额是否充足？
□ 网络连接是否正常？
```

### 内联补全不触发？

```
检查清单:
□ Agent是否开启了inlineCompletion？
□ enableInlineByDefault是否为true？
□ 编辑器是否启用了内联补全？
□ 输入是否停顿了2秒？
```

### 子 Agent 调用失败？

```
检查清单:
□ 子Agent是否存在？
□ 子Agent配置是否正确？
□ workflow配置是否有误？
□ 输入/输出是否匹配？
```

### Thoughts 不显示？

```
检查清单:
□ Agent是否开启了showThoughts？
□ 是否使用流式生成？
□ WebSocket是否连接？
□ 前端是否监听了agent:thought事件？
```

---

## 📱 WebSocket 事件速查

### 订阅事件

```typescript
socket.on('agent:thought', (data) => {
  // { thought, step, totalSteps }
});

socket.on('agent:progress', (data) => {
  // { progress, currentStep, preview }
});

socket.on('agent:completed', (data) => {
  // { result }
});

socket.on('agent:orchestration-progress', (data) => {
  // { currentAgent, progress }
});

socket.on('agent:sub-agent-completed', (data) => {
  // { agentName, result }
});

socket.on('agent:suggestion', (data) => {
  // { message, suggestedAgents }
});
```

---

## 🎓 最佳实践速查

### ✅ 推荐做法

- 单一职责：每个 Agent 专注一个领域
- 合理命名：清晰的名称和描述
- 控制上下文：不要包含过多历史
- 提示词复用：引用而非复制
- 渐进增强：先简单后复杂
- 用户控制：建议而非强制

### ❌ 避免做法

- 过度编排：简单任务用复杂工作流
- 重复功能：创建功能重复的 Agent
- 过大上下文：包含全部章节历史
- 盲目自动：所有操作都自动触发
- 忽略成本：不考虑 token 消耗
- 缺少测试：配置后不验证效果

---

## 🔗 快速链接

- [完整 API 文档](../../../API/24-Agent智能助手系统.md)
- [协作机制详解](./AGENT_ORCHESTRATION.md)
- [使用指南](./AGENT_USAGE_GUIDE.md)
- [实施计划](./IMPLEMENTATION_PLAN.md)

---

## 📞 开发支持

### 关键服务类

```typescript
// Agent管理
AgentsService; // CRUD操作
AgentExecutorService; // 执行引擎
AgentOrchestratorService; // 编排引擎

// 上下文和分析
AgentContextService; // 上下文构建
ContentAnalyzerService; // 内容分析

// 交互服务
AgentCompletionService; // 内联补全
AgentChatService; // 对话服务
AgentQuickActionService; // 快速操作
AgentStructureOpsService; // 结构操作

// 触发和监控
AutoTriggerService; // 自动触发
AgentMonitoringService; // 监控统计
```

### 关键 Entity

```typescript
Agent; // Agent配置
AgentPromptReference; // 提示词引用
AgentCustomPrompt; // 自定义提示词
AgentSession; // 会话记录
AgentUsageLog; // 使用日志
AgentRating; // 评分
```

---

## 🎯 一句话总结

**Agent = 智能助手 + 提示词编排器 + 多Agent协调者**

- 可以引用提示词（复用现有规则）
- 可以调用其他 Agent（专业分工）
- 可以自动触发（智能建议）
- 可以实时反馈（Thoughts展示）

**核心价值**: 让 AI 不仅是工具，更是会思考、会协作的智能写作伙伴！
