# Agent 使用指南

> 如何使用 Agent 系统提升写作效率

---

## 📖 快速开始

### 场景 1：我想要一个对话助手

**步骤**：

1. **选择方式**：
   - 方式 A：从 Agent 市场添加"对话大师"
   - 方式 B：自己创建一个

2. **如果选择自己创建**：

```json
{
  "name": "我的对话助手",
  "icon": "💬",

  // 方式1: 自定义提示词
  "systemPromptType": "custom",
  "systemPromptContent": "你是对话写作专家...",

  // 或方式2: 引用已有提示词
  "systemPromptType": "prompt",
  "systemPromptId": 123, // 你已有的对话提示词

  "capabilities": {
    "inlineCompletion": true, // 开启内联补全
    "enableInlineByDefault": true, // 默认开启
    "showThoughts": false, // 不显示思考（简洁模式）
    "chat": true,
    "quickActions": ["continue", "rewrite"]
  }
}
```

3. **使用**：
   - 编辑器中写对话时，停顿2秒自动提示
   - 或选中对话，右键 → AI改写

---

### 场景 2：我想创建一个能自动生成章节的 Agent

**需求**：

- 输入大纲，自动生成完整章节
- 包含对话、描写、情节

**解决方案**：创建一个**编排型主 Agent**

```json
{
  "name": "章节创作大师",
  "icon": "📖",
  "systemPromptContent": "你是章节创作协调者...",

  "capabilities": {
    "chat": true,
    "structureOperations": ["createChapter"]
  },

  "subAgents": [
    {
      "agentId": 10, // 情节大师
      "role": "outline",
      "callCondition": "always",
      "order": 1
    },
    {
      "agentId": 5, // 对话大师
      "role": "dialogue",
      "callCondition": "always",
      "order": 2
    },
    {
      "agentId": 8, // 描写大师
      "role": "description",
      "callCondition": "always",
      "order": 3
    }
  ],

  "workflow": {
    "mode": "sequential",
    "allowParallel": true,
    "parallelSteps": [2, 3] // 对话和描写并行
  }
}
```

**使用**：

```
打开Agent侧边栏 → 选择"章节创作大师" →
输入: "帮我创建第五章，李明发现真相" →
系统自动调用3个子Agent → 实时显示进度 → 生成完整章节
```

---

### 场景 3：我想要智能建议，但不自动执行

**需求**：

- 写作时检测到问题给出建议
- 由我决定是否采纳

**解决方案**：配置**建议型触发**

```json
{
  "name": "智能顾问",
  "icon": "💡",

  "autoTriggers": [
    {
      "condition": "detect_dialogue",
      "threshold": 0.7,
      "action": "suggest_sub_agent", // 建议而非自动执行
      "subAgents": [5],
      "message": "检测到大量对话，建议使用对话大师优化"
    },
    {
      "condition": "content_length",
      "operator": ">",
      "value": 3000,
      "action": "suggest_sub_agent",
      "subAgents": [15],
      "message": "章节较长，建议进行结构分析"
    }
  ]
}
```

**效果**：

- 系统检测到条件 → 弹出建议通知
- 你可以选择 [立即使用] 或 [忽略]

---

## 🎯 典型工作流

### 工作流 1：快速续写

```
用户正在写作
    ↓
停顿2秒
    ↓
[内联补全Agent] 自动触发
    ↓
显示灰色提示文本
    ↓
按Tab接受 / Esc拒绝
```

**适用 Agent**：对话大师、描写大师

**配置要点**：

- `inlineCompletion: true`
- `enableInlineByDefault: true`
- `maxLength: 100-200`

---

### 工作流 2：深度对话创作

```
用户选中一段对话
    ↓
打开Agent侧边栏
    ↓
发送: "这段对话太平淡"
    ↓
[对话大师] 分析并给出建议
    ↓
提供3种改写版本
    ↓
用户选择一个插入
```

**适用 Agent**：对话大师、描写大师、润色大师

**配置要点**：

- `chat: true`
- `showThoughts: true` (显示分析过程)
- `quickActions: ["rewrite"]`

---

### 工作流 3：智能章节生成

```
用户: "帮我创建第五章"
    ↓
[章节创作大师] 启动
    ↓
调用[情节大师] → 生成大纲
    ↓
并行调用:
  [对话大师] → 写对话
  [描写大师] → 写场景
    ↓
[主Agent] 整合 → 润色 → 保存
    ↓
推送完成通知
```

**适用 Agent**：章节创作大师（编排型）

**配置要点**：

- `subAgents: [情节, 对话, 描写]`
- `workflow.mode: "sequential"`
- `workflow.allowParallel: true`

---

### 工作流 4：自动质量检查

```
用户点击保存章节
    ↓
[自动触发] chapter_save 事件
    ↓
后台调用[一致性检查Agent]
    ↓
扫描章节 + 对比人物卡/世界观
    ↓
发现问题?
  ↓ 是         ↓ 否
推送警告    静默完成
  ↓
用户选择是否修正
```

**适用 Agent**：一致性检查 Agent

**配置要点**：

- `autoTriggers` 配置 `chapter_save`
- `action: "notify"`
- `silent: false`

---

## 🔧 配置决策指南

### 何时引用提示词？

**✅ 推荐引用提示词**：

- 你已经有成熟的提示词模板
- 需要复用现有提示词的规则
- 需要多个 Agent 共享同一套规则

**✅ 推荐自定义**：

- Agent 需要特殊的系统提示
- 需要高度定制化的行为
- 提示词不够通用

**✅ 推荐混合使用**：

- 基础规则引用提示词（`promptReferences`）
- Agent 特性自定义（`systemPromptContent`）

---

### 何时配置子 Agent？

**✅ 需要子 Agent**：

- 任务需要多种专业能力
- 需要流程化的多步骤操作
- 追求高质量输出

**❌ 不需要子 Agent**：

- 简单的单一任务
- 实时性要求高的操作
- 用户只需要快速建议

---

### 何时使用自动触发？

**✅ 推荐自动触发**：

- 保存时自动检查（不打扰写作）
- 完成章节自动生成梗概
- 定期保存备份

**⚠️ 谨慎自动触发**：

- 内容生成类操作（消耗 token）
- 修改性操作（需要用户确认）
- 高频触发的操作（性能影响）

**✅ 推荐建议触发**：

- 检测到问题时给建议
- 发现优化机会时提示
- 智能推荐相关 Agent

---

## 🚀 实战案例

### 案例 1：轻量级对话助手

**需求**：快速、简单、不打扰

**配置**：

```json
{
  "name": "轻量对话助手",
  "systemPromptType": "prompt",
  "systemPromptId": 123,
  "capabilities": {
    "inlineCompletion": true,
    "enableInlineByDefault": true,
    "showThoughts": false,
    "chat": false,
    "quickActions": ["continue"]
  },
  "subAgents": [],
  "autoTriggers": []
}
```

**特点**：

- 只引用一个提示词
- 只支持内联补全
- 不显示思考过程
- 不自动触发任何操作

---

### 案例 2：重量级创作大师

**需求**：全功能、高质量、智能协作

**配置**：

```json
{
  "name": "AI创作大师",
  "systemPromptType": "custom",
  "systemPromptContent": "你是全能创作协调者...",
  "promptReferences": [
    { "promptId": 100, "position": "system" },
    { "promptId": 200, "position": "before" }
  ],
  "capabilities": {
    "inlineCompletion": true,
    "enableInlineByDefault": false,
    "showThoughts": true,
    "chat": true,
    "quickActions": ["continue", "rewrite", "expand", "polish"],
    "structureOperations": [
      "createChapter",
      "createCharacter",
      "createWorld",
      "analyzeStructure",
      "checkConsistency"
    ]
  },
  "subAgents": [
    { "agentId": 5, "role": "dialogue" },
    { "agentId": 8, "role": "description" },
    { "agentId": 10, "role": "plot" },
    { "agentId": 15, "role": "analyzer" },
    { "agentId": 20, "role": "checker" }
  ],
  "autoTriggers": [
    {
      "condition": "detect_dialogue",
      "action": "suggest_sub_agent",
      "subAgents": [5]
    },
    {
      "condition": "chapter_save",
      "action": "call_sub_agent",
      "subAgents": [20],
      "silent": true
    }
  ]
}
```

**特点**：

- 引用提示词 + 自定义提示词
- 全功能支持
- 5个子 Agent
- 智能自动触发

---

### 案例 3：专业章节生成流水线

**需求**：自动化章节创作，流程化生产

**主 Agent 配置**：

```json
{
  "name": "章节生产线",
  "subAgents": [
    { "agentId": 10, "role": "outline", "order": 1 },
    { "agentId": 5, "role": "dialogue", "order": 2 },
    { "agentId": 8, "role": "description", "order": 3 },
    { "agentId": 25, "role": "polisher", "order": 4 }
  ],
  "workflow": {
    "mode": "sequential",
    "allowParallel": true,
    "parallelSteps": [2, 3]
  }
}
```

**子 Agent 列表**：

| Agent ID | 名称     | 职责     | 引用提示词   |
| -------- | -------- | -------- | ------------ |
| 10       | 情节大师 | 生成大纲 | promptId=500 |
| 5        | 对话大师 | 写对话   | promptId=501 |
| 8        | 描写大师 | 写场景   | promptId=502 |
| 25       | 润色大师 | 最终润色 | promptId=503 |

**执行流程**：

```
用户: "创建第五章，李明发现真相"
    ↓
[情节大师]
  引用提示词 500
  生成大纲:
    1. 李明在书房发现密信
    2. 验证信中内容
    3. 内心挣扎
    ↓
[对话大师]      [描写大师]
引用提示词501    引用提示词502
基于大纲写对话   基于大纲写场景
(并行执行)
    ↓
[润色大师]
  引用提示词 503
  整合 + 润色
    ↓
保存章节
```

---

## 💡 提示词复用策略

### 策略 1：一个提示词，多个 Agent

**场景**：你有一个很好的"悬疑写作"提示词

```
提示词ID=100 "悬疑写作模板"
    ↓ 被引用
    ├→ Agent A: 悬疑对话助手
    ├→ Agent B: 悬疑氛围大师
    └→ Agent C: 悬疑情节大师
```

**优势**：

- 所有 Agent 共享同一套悬疑规则
- 修改提示词，所有 Agent 同步更新
- 统一风格和质量标准

---

### 策略 2：多个提示词，一个 Agent

**场景**：创建一个全能 Agent，组合多个专业提示词

```
Agent: 全能创作助手
    ↓ 引用
    ├→ 提示词A: 基础写作规则
    ├→ 提示词B: 人物塑造技巧
    ├→ 提示词C: 场景描写方法
    └→ 提示词D: 对话写作技巧
```

**配置**：

```json
{
  "promptReferences": [
    { "promptId": 100, "position": "system" },
    { "promptId": 200, "position": "system" },
    { "promptId": 300, "position": "before" },
    { "promptId": 400, "position": "before" }
  ]
}
```

---

### 策略 3：Agent 树（多层嵌套）

**场景**：复杂的分层协作

```
主Agent: 全书创作大师
    ↓ 调用
    ├→ 子Agent1: 章节创作大师
    │       ↓ 调用
    │       ├→ 孙Agent1: 情节大师 (引用提示词500)
    │       ├→ 孙Agent2: 对话大师 (引用提示词501)
    │       └→ 孙Agent3: 描写大师 (引用提示词502)
    │
    ├→ 子Agent2: 人物设计大师 (引用提示词600)
    └→ 子Agent3: 世界观构建师 (引用提示词700)
```

**执行示例**：

```
用户: "帮我创建一部完整的小说"
    ↓
[全书创作大师] 分析任务
    ↓
调用 [人物设计大师] → 生成3个主要人物
调用 [世界观构建师] → 生成世界设定
    ↓
循环30次:
  调用 [章节创作大师]
      ↓ 内部调用
      情节大师 → 对话大师 → 描写大师
    ↓
完成整部小说
```

---

## 🔀 Agent 协作模式对比

### 模式对比表

| 模式     | 复杂度 | 执行时间 | 质量 | 适用场景               |
| -------- | ------ | -------- | ---- | ---------------------- |
| 单Agent  | 低     | 快       | 中   | 续写、改写、润色       |
| 串行协作 | 中     | 中       | 高   | 章节创作、结构优化     |
| 并行协作 | 中     | 快       | 高   | 同时生成对话+描写      |
| 条件协作 | 高     | 中       | 高   | 智能优化、问题修复     |
| 智能编排 | 高     | 慢       | 最高 | 完整作品创作、深度分析 |

---

## 📊 性能和成本

### Token 消耗对比

**单 Agent（续写100字）**：

- 输入: ~500 tokens（上下文）
- 输出: ~50 tokens
- 总计: ~550 tokens

**3-Agent 协作（创建章节）**：

- Agent 1 (情节): ~800 tokens
- Agent 2 (对话): ~1200 tokens
- Agent 3 (描写): ~1200 tokens
- 主 Agent 整合: ~500 tokens
- 总计: ~3700 tokens

**建议**：

- 日常写作：使用轻量单 Agent
- 重要章节：使用多 Agent 协作
- 定期分析：使用后台自动触发

---

## 🎨 前端交互示例

### 示例 1：内联补全开关

```tsx
// 编辑器顶部工具栏
<div className="editor-toolbar">
  <AgentSelector current={currentAgent} onChange={setAgent} />

  {currentAgent?.capabilities.inlineCompletion && (
    <Toggle
      checked={inlineEnabled}
      onChange={setInlineEnabled}
      label="内联补全"
    />
  )}

  {currentAgent?.capabilities.showThoughts && (
    <Toggle
      checked={showThoughts}
      onChange={setShowThoughts}
      label="显示思考"
    />
  )}
</div>
```

### 示例 2：Thoughts 展示

```tsx
// Agent侧边栏中的思考过程展示
<div className="thoughts-panel">
  <h4>💭 Agent 思考过程</h4>
  <div className="thoughts-list">
    {thoughts.map((thought, idx) => (
      <div key={idx} className="thought-item">
        <span className="step">{idx + 1}</span>
        <span className="content">{thought}</span>
      </div>
    ))}
  </div>
</div>
```

### 示例 3：协作流程可视化

```tsx
<div className="orchestration-flow">
  <h3>🔄 协作流程</h3>

  {steps.map((step, idx) => (
    <div key={idx} className="flow-step">
      <div className="step-header">
        <span className="step-num">{idx + 1}</span>
        <span className="agent-icon">{step.agent.icon}</span>
        <span className="agent-name">{step.agent.name}</span>
        <span className={`status ${step.status}`}>
          {step.status === 'running' && '⏳ 执行中'}
          {step.status === 'completed' && '✅ 完成'}
          {step.status === 'pending' && '⏸️ 等待'}
        </span>
      </div>

      {step.status === 'running' && step.thoughts && (
        <div className="step-thoughts">
          {step.thoughts.map((t, i) => (
            <div key={i}>• {t}</div>
          ))}
        </div>
      )}

      {step.status === 'completed' && (
        <div className="step-result">
          <button onClick={() => previewResult(step.result)}>查看结果</button>
        </div>
      )}
    </div>
  ))}
</div>
```

**效果**：

```
🔄 协作流程

[1] 🎭 情节大师  ✅ 完成
    • 分析了前四章剧情
    • 确定第五章转折点
    [查看大纲]

[2] 💬 对话大师  ⏳ 执行中
    • 根据大纲设计对话
    • 加入情绪冲突

[3] ✍️ 描写大师  ⏸️ 等待
```

---

## 🎯 推荐 Agent 组合

### 组合 1：日常写作三件套

```
1. 对话大师 (内联补全)
2. 描写大师 (快速扩写)
3. 润色大师 (文字优化)
```

**使用方式**：

- 写对话时切换到"对话大师"
- 写场景时切换到"描写大师"
- 最后用"润色大师"统一优化

---

### 组合 2：章节创作工厂

```
主Agent: 章节创作大师
  ├─ 子Agent1: 情节大师
  ├─ 子Agent2: 对话大师
  ├─ 子Agent3: 描写大师
  └─ 子Agent4: 润色大师
```

**使用方式**：

- 一句话生成完整章节
- 自动协调4个专业 Agent
- 实时显示进度和思考过程

---

### 组合 3：质量保障体系

```
1. 一致性检查Agent (自动触发: 保存时)
2. 结构分析Agent (手动触发: 完成一卷)
3. 质量评估Agent (自动触发: 完成章节)
```

**使用方式**：

- 配置为后台自动触发
- 发现问题时推送通知
- 不干扰正常写作流程

---

## 📝 配置模板

### 模板 1：纯提示词 Agent（最简单）

```json
{
  "name": "简单助手",
  "icon": "✨",
  "systemPromptType": "prompt",
  "systemPromptId": 123,
  "capabilities": {
    "inlineCompletion": true,
    "chat": false,
    "quickActions": []
  }
}
```

### 模板 2：提示词组合 Agent（中等复杂）

```json
{
  "name": "组合助手",
  "icon": "🔧",
  "systemPromptType": "custom",
  "systemPromptContent": "...",
  "promptReferences": [
    { "promptId": 100, "position": "system" },
    { "promptId": 200, "position": "before" }
  ],
  "capabilities": {
    "inlineCompletion": true,
    "chat": true,
    "quickActions": ["continue", "rewrite"]
  }
}
```

### 模板 3：多 Agent 编排（复杂）

```json
{
  "name": "编排大师",
  "icon": "🎬",
  "systemPromptType": "custom",
  "systemPromptContent": "...",
  "promptReferences": [...],
  "subAgents": [
    { "agentId": 5, "role": "dialogue" },
    { "agentId": 8, "role": "description" },
    { "agentId": 10, "role": "plot" }
  ],
  "workflow": {
    "mode": "sequential",
    "allowParallel": true
  },
  "autoTriggers": [...]
}
```

---

## ⚡ 性能优化建议

### 1. 合理使用并行

```json
{
  "workflow": {
    "parallelSteps": [2, 3] // 对话和描写可以并行
  }
}
```

**节省时间**：

- 串行: 3秒 + 3秒 = 6秒
- 并行: max(3秒, 3秒) = 3秒

### 2. 控制上下文大小

```json
{
  "contextConfig": {
    "historyLength": 1, // 只包含前1章（而非全部）
    "maxContextTokens": 4000 // 限制总token数
  }
}
```

### 3. 选择合适的模型

```json
{
  // 快速任务使用轻量模型
  "modelId": "gemini-2.0-flash",

  // 重要任务使用高质量模型
  "modelId": "gpt-4o"
}
```

### 4. 缓存子 Agent 结果

```typescript
// 相同输入的子Agent结果可以缓存5分钟
const cacheKey = `agent_${agentId}_${hash(input)}`;
await cache.set(cacheKey, result, 300);
```

---

## 🎓 进阶技巧

### 技巧 1：动态切换 Agent

```tsx
// 根据内容类型自动切换Agent
useEffect(() => {
  const content = editor.getText();

  if (detectDialogue(content) > 0.7) {
    setCurrentAgent(dialogueAgent);
  } else if (detectDescription(content) > 0.7) {
    setCurrentAgent(descriptionAgent);
  }
}, [editor.content]);
```

### 技巧 2：上下文预加载

```typescript
// 在Agent执行前预加载上下文
const context = await preloadContext({
  novelId,
  chapterId,
  includeCharacters: true,
  includeWorldSettings: true,
  historyLength: 3,
});

// 上下文已准备好，执行更快
await agent.execute(input, context);
```

### 技巧 3：批量操作

```typescript
// 为多个章节批量生成梗概
const chapters = [1, 2, 3, 4, 5];

await agent.orchestrate({
  operation: 'autoSummary',
  targets: chapters,
  parallel: true,
  maxConcurrent: 3,
});
```

---

## 🚨 常见问题

### Q1: Agent 和提示词有什么区别？

**提示词**：

- 静态的内容模板
- 定义生成规则
- 被动使用

**Agent**：

- 智能的执行者
- 可以调度和编排
- 主动判断和建议
- 可以引用多个提示词
- 可以调用其他 Agent

### Q2: 什么时候用单 Agent，什么时候用多 Agent？

**单 Agent**：

- 简单任务（续写、改写）
- 实时操作（内联补全）
- 快速响应

**多 Agent 协作**：

- 复杂任务（创建章节）
- 需要多种专业能力
- 追求高质量

### Q3: 自动触发会不会打扰写作？

**不会，因为有三种模式**：

1. **静默模式**：后台执行，不通知
2. **建议模式**：弹出建议，等待确认
3. **自动模式**：直接执行（仅用于安全操作）

**建议配置**：

- 检查类操作 → 静默模式
- 生成类操作 → 建议模式
- 保存类操作 → 自动模式

### Q4: Agent 协作会消耗更多 token 吗？

**是的，但质量更高**：

| 方式         | Token 消耗 | 质量 | 时间 |
| ------------ | ---------- | ---- | ---- |
| 单次生成     | 1000       | 中   | 3秒  |
| 3-Agent 协作 | 3500       | 高   | 8秒  |
| 5-Agent 协作 | 6000       | 最高 | 15秒 |

**优化建议**：

- 日常写作用单 Agent
- 重要章节用多 Agent
- 合理配置并行执行

---

## 总结

### Agent 与提示词的最佳实践

1. **提示词是基础** - 定义生成规则和内容模板
2. **Agent 是编排者** - 决定何时、如何使用提示词和其他 Agent
3. **单 Agent 处理简单任务** - 快速、高效
4. **多 Agent 处理复杂任务** - 专业分工、质量更高
5. **自动触发提升效率** - 但要避免打扰用户
6. **智能建议最友好** - 让用户保持控制权

### 推荐配置策略

**新手**：

- 从 Agent 市场添加预设 Agent
- 使用单 Agent 模式
- 关闭自动触发

**进阶**：

- 自己创建 Agent，引用提示词
- 尝试快速操作和对话模式
- 配置建议型触发

**高级**：

- 创建编排型主 Agent
- 配置多 Agent 协作工作流
- 使用自动触发和智能建议
- 搭建个人的 Agent 生态系统
