# Agent 编排和协作系统设计

> Agent 如何与提示词、其他 Agent 协作完成复杂写作任务

---

## 一、协作架构

### 1.1 三层架构

```
┌─────────────────────────────────────────────────────┐
│                   Agent 层（编排层）                 │
│                                                     │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐    │
│  │ 主Agent │ ──→  │ 子Agent1│ ──→  │ 子Agent2│    │
│  │(编排者) │      │(执行者) │      │(执行者) │    │
│  └────┬────┘      └────┬────┘      └────┬────┘    │
│       │                │                 │         │
└───────┼────────────────┼─────────────────┼─────────┘
        │                │                 │
┌───────▼────────────────▼─────────────────▼─────────┐
│                  提示词层（模板层）                  │
│                                                     │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐        │
│  │提示词A  │    │提示词B  │    │提示词C  │        │
│  │(对话模板)│    │(描写模板)│    │(情节模板)│        │
│  └────┬────┘    └────┬────┘    └────┬────┘        │
│       │              │              │              │
└───────┼──────────────┼──────────────┼──────────────┘
        │              │              │
┌───────▼──────────────▼──────────────▼──────────────┐
│               底层服务层（执行层）                   │
│                                                     │
│  ChatCompletion  Macro  Token  Novel  Chapter ...  │
└─────────────────────────────────────────────────────┘
```

### 1.2 协作关系

**Agent 与 提示词**：

- 1个 Agent 可以引用多个提示词
- 1个提示词可以被多个 Agent 使用
- Agent 决定**何时**、**如何**使用提示词
- 提示词定义**生成规则**和**内容模板**

**Agent 与 Agent**：

- 主 Agent 可以调用多个子 Agent
- 子 Agent 可以独立使用，也可以被编排
- Agent 之间通过**输入/输出**传递数据
- 支持串行、并行、条件三种模式

---

## 二、Agent 引用提示词

### 2.1 基本引用

**单提示词引用**：

```json
{
  "agentId": 1,
  "name": "对话大师",
  "systemPromptType": "prompt",
  "systemPromptId": 123 // 引用提示词ID=123作为系统提示
}
```

**等价于**：

```
系统提示词 = 提示词123的所有内容
```

### 2.2 多提示词组合

**引用多个提示词，按位置组合**：

```json
{
  "agentId": 1,
  "name": "综合写作助手",
  "systemPromptType": "custom",
  "systemPromptContent": "你是一个综合写作助手...",
  "promptReferences": [
    {
      "promptId": 100,
      "position": "system", // 作为系统提示
      "enabled": true
    },
    {
      "promptId": 200,
      "position": "before", // 在用户输入前
      "enabled": true
    },
    {
      "promptId": 300,
      "position": "after", // 在用户输入后
      "enabled": true
    }
  ]
}
```

**提示词组装顺序**：

```
1. Agent自定义系统提示词（systemPromptContent）
2. position=system 的引用提示词（promptId=100）
3. 上下文信息（人物卡、世界观、章节历史）
4. position=before 的引用提示词（promptId=200）
5. 对话历史（如果是chat模式）
6. 用户输入
7. position=after 的引用提示词（promptId=300）
```

### 2.3 提示词的动态加载

**场景**：Agent 根据上下文决定加载哪些提示词

```typescript
// Agent执行时的逻辑
class AgentExecutorService {
  async execute(agent: Agent, input: string, context: any) {
    const messages = [];

    // 1. 基础系统提示
    messages.push({
      role: 'system',
      content: agent.systemPromptContent,
    });

    // 2. 加载引用的提示词
    for (const ref of agent.promptReferences) {
      if (!ref.enabled) continue;

      const prompt = await this.loadPrompt(ref.promptId);

      // 检查权限
      const hasPermission = await this.checkPromptPermission(
        prompt,
        context.userId,
      );

      if (!hasPermission) {
        this.logger.warn(`用户无权使用提示词 ${ref.promptId}，跳过`);
        continue;
      }

      // 根据position插入
      const content = await this.buildPromptContent(prompt, context);

      if (ref.position === 'system') {
        messages.push({ role: 'system', content });
      } else if (ref.position === 'before') {
        // 暂存，稍后插入
        beforeMessages.push({ role: 'system', content });
      } else if (ref.position === 'after') {
        afterMessages.push({ role: 'system', content });
      }
    }

    // 3. 组装完整消息
    // ... 继续组装
  }
}
```

---

## 三、Agent 调用 Agent

### 3.1 子 Agent 配置

在主 Agent 中配置子 Agent：

```json
{
  "agentId": 100,
  "name": "章节创作大师",
  "subAgents": [
    {
      "agentId": 10,
      "role": "outline",
      "name": "情节大师",
      "callCondition": "always", // 总是调用
      "order": 1,
      "input": [],
      "output": "outline"
    },
    {
      "agentId": 5,
      "role": "dialogue",
      "name": "对话大师",
      "callCondition": "when_needed", // 按需调用
      "order": 2,
      "input": ["outline"],
      "output": "dialogue",
      "condition": {
        "type": "detect_dialogue_needed",
        "threshold": 0.3
      }
    }
  ]
}
```

**调用条件 (callCondition)**：

| 值          | 说明                           |
| ----------- | ------------------------------ |
| always      | 总是调用                       |
| when_needed | 根据条件判断是否调用           |
| on_error    | 前面步骤失败时调用（错误处理） |
| parallel    | 与其他 Agent 并行执行          |

### 3.2 工作流模式

#### 模式 1：串行（Sequential）

```json
{
  "workflow": {
    "mode": "sequential",
    "agents": [
      { "agentId": 10, "output": "outline" },
      { "agentId": 5, "input": ["outline"], "output": "dialogue" },
      { "agentId": 8, "input": ["outline"], "output": "description" }
    ]
  }
}
```

**执行流程**：

```
Step 1: 情节大师 → 生成大纲
        ↓
Step 2: 对话大师 → 基于大纲写对话
        ↓
Step 3: 描写大师 → 基于大纲写描写
```

#### 模式 2：并行（Parallel）

```json
{
  "workflow": {
    "mode": "sequential",
    "allowParallel": true,
    "agents": [
      { "agentId": 10, "output": "outline" },
      {
        "agentId": 5,
        "input": ["outline"],
        "output": "dialogue",
        "parallel": true
      },
      {
        "agentId": 8,
        "input": ["outline"],
        "output": "description",
        "parallel": true
      }
    ]
  }
}
```

**执行流程**：

```
Step 1: 情节大师 → 生成大纲
        ↓
        ├─→ Step 2a: 对话大师 → 写对话
        └─→ Step 2b: 描写大师 → 写描写（并行）
```

#### 模式 3：条件（Conditional）

```json
{
  "workflow": {
    "mode": "conditional",
    "agents": [
      {
        "agentId": 15,
        "task": "分析内容类型",
        "output": "content_type"
      },
      {
        "agentId": 5,
        "condition": {
          "field": "content_type",
          "operator": "equals",
          "value": "dialogue"
        },
        "task": "优化对话"
      },
      {
        "agentId": 8,
        "condition": {
          "field": "content_type",
          "operator": "equals",
          "value": "description"
        },
        "task": "优化描写"
      }
    ]
  }
}
```

**执行流程**：

```
Step 1: 分析Agent → 判断内容类型
        ↓
     [条件判断]
    ↙          ↘
对话大师      描写大师
(如果是对话)  (如果是描写)
```

---

## 四、自动触发机制

### 4.1 触发条件详解

#### 条件 1：关键词检测

```json
{
  "condition": "user_input_contains",
  "keywords": ["创建章节", "写一章", "新建章节"],
  "action": "call_sub_agent",
  "subAgents": [10, 5, 8]
}
```

**触发时机**：

- 用户输入包含任一关键词
- 立即调用子 Agent 编排

**示例**：

```
用户: "帮我创建第五章"
系统: 检测到"创建"和"章节" → 触发章节创作工作流
```

#### 条件 2：内容特征检测

```json
{
  "condition": "detect_dialogue",
  "threshold": 0.7,
  "action": "suggest_sub_agent",
  "subAgents": [5],
  "message": "检测到大量对话，建议使用对话大师优化"
}
```

**触发时机**：

- 用户写作内容中对话占比 > 70%
- 建议（而非强制）使用对话大师

**前端展示**：

```
┌────────────────────────────────────┐
│ 💡 建议                             │
│ 检测到大量对话，建议使用对话大师优化 │
│ [立即使用] [忽略]                   │
└────────────────────────────────────┘
```

#### 条件 3：一致性问题检测

```json
{
  "condition": "consistency_issue",
  "checkTypes": ["character", "worldSetting"],
  "action": "auto_fix",
  "subAgents": [20],
  "autoExecute": false
}
```

**触发时机**：

- 检测到人物或世界观设定矛盾
- 提示用户并等待确认

#### 条件 4：写作进度触发

```json
{
  "condition": "chapter_completed",
  "action": "call_sub_agent",
  "subAgents": [15],
  "task": "自动生成章节梗概"
}
```

**触发时机**：

- 用户完成一章（点击保存）
- 自动调用摘要 Agent 生成梗概

### 4.2 触发流程

```
用户操作/写作
    ↓
[触发条件检测引擎]
    ↓
匹配到触发规则？
    ↓
  是    否
  ↓     ↓
执行   忽略
动作
  ↓
调用子Agent / 建议 / 通知
```

---

## 五、实际使用场景

### 场景 1：智能章节创作

**用户操作**：

```
用户: "帮我创建第五章，要有李明和艾莉娅的对话，以及紧张的氛围描写"
```

**系统响应**：

```
┌────────────────────────────────────────────────────┐
│ 🤖 章节创作大师启动                                 │
│ 💭 正在分析任务需求...                              │
│    • 需要创建新章节                                 │
│    • 需要人物对话（李明、艾莉娅）                    │
│    • 需要场景描写（紧张氛围）                        │
│    • 决定调用3个子Agent协作                         │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ [步骤 1/4] 情节大师正在工作...                      │
│ 💭 • 分析前四章剧情发展                             │
│    • 确定第五章的核心冲突                           │
│    • 设计3个场景段落                                │
│ ✅ 已生成章节大纲                                   │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ [步骤 2/4] 对话大师正在工作... (并行)               │
│ 💭 • 根据大纲设计李明和艾莉娅的对话                  │
│    • 加入情绪冲突和心理活动                         │
│ ✅ 已生成3段对话                                    │
│                                                    │
│ [步骤 3/4] 描写大师正在工作... (并行)               │
│ 💭 • 营造紧张氛围                                   │
│    • 使用光影、声音等感官描写                        │
│ ✅ 已生成环境描写                                   │
└────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│ [步骤 4/4] 整合润色中...                            │
│ 💭 • 整合大纲、对话、描写                           │
│    • 调整段落顺序                                   │
│    • 润色过渡部分                                   │
│ ✅ 章节创作完成！                                   │
│                                                    │
│ 📖 第五章 真相浮现（2,350字）                       │
│ [查看预览] [保存章节] [重新生成]                    │
└────────────────────────────────────────────────────┘
```

### 场景 2：写作过程智能建议

**用户正在写作**：

```
用户正在输入...
她走进房间，看到一个神秘的身影。
"你是谁？"
"我是..."
```

**系统自动检测**：

```
[内容分析引擎]
• 对话占比: 65%
• 描写占比: 35%
• 字数: 500

[触发规则匹配]
✅ 匹配到规则: detect_dialogue (threshold: 0.6)
✅ 匹配到规则: content_length (> 500)

[执行动作]
1. 弹出建议: "检测到大量对话，建议使用对话大师优化"
2. 自动调用: "内容分析Agent" (后台运行，不打扰用户)
```

**前端显示**：

```
┌─────────────────────────────────────┐
│ 编辑器                               │
│ 她走进房间，看到一个神秘的身影。      │
│ "你是谁？"                           │
│ "我是..."                            │
│                                     │
│ [💡 智能建议]                        │
│ • 对话大师: 可以让对话更生动          │
│ • 描写大师: 建议补充场景细节          │
│ [应用建议] [忽略]                    │
└─────────────────────────────────────┘
```

### 场景 3：一致性自动检查

**触发时机**：用户保存章节时

**自动执行**：

```
[保存触发]
用户点击保存 → 触发 chapter_save 事件

[自动调用一致性检查Agent]
Step 1: 扫描新章节内容
Step 2: 对比人物卡设定
Step 3: 检查世界观一致性
Step 4: 生成检查报告

[推送结果]
如果发现问题 → 推送警告通知
```

**前端通知**：

```
┌─────────────────────────────────────┐
│ ⚠️ 一致性检查                        │
│                                     │
│ 发现 2 处潜在问题:                   │
│                                     │
│ 1. 人物外貌不一致                    │
│    李明在第1章是"黑发"，               │
│    但第5章变成了"金发"                │
│    → [查看位置] [修正]                │
│                                     │
│ 2. 地点描述矛盾                      │
│    东海的位置描述与世界观不符          │
│    → [查看位置] [修正]                │
│                                     │
│ [全部修正] [忽略]                    │
└─────────────────────────────────────┘
```

---

## 六、协作执行引擎实现

### 6.1 AgentOrchestratorService

```typescript
@Injectable()
export class AgentOrchestratorService {
  constructor(
    private readonly agentExecutor: AgentExecutorService,
    private readonly wsGateway: WebSocketGateway,
  ) {}

  /**
   * 执行多Agent协作
   */
  async orchestrate(
    mainAgent: Agent,
    task: string,
    context: any,
    workflow: Workflow,
  ) {
    const orchestrationId = `orch_${Date.now()}`;
    const results = new Map<string, any>();

    // 推送开始消息
    this.wsGateway.emitToUser(context.userId, 'agent:orchestration-start', {
      orchestrationId,
      mainAgentId: mainAgent.id,
      totalSteps: workflow.agents.length,
    });

    // 串行模式
    if (workflow.mode === 'sequential') {
      for (let i = 0; i < workflow.agents.length; i++) {
        const agentConfig = workflow.agents[i];

        // 检查是否并行执行
        if (workflow.parallelSteps?.includes(i)) {
          // 并行执行
          const parallelAgents = this.getParallelGroup(workflow.agents, i);
          const parallelResults = await Promise.all(
            parallelAgents.map((ac) =>
              this.executeSubAgent(ac, results, context),
            ),
          );
          parallelResults.forEach((result, idx) => {
            results.set(parallelAgents[idx].output, result);
          });
        } else {
          // 串行执行
          const result = await this.executeSubAgent(
            agentConfig,
            results,
            context,
          );
          results.set(agentConfig.output, result);
        }

        // 推送进度
        this.wsGateway.emitToUser(
          context.userId,
          'agent:orchestration-progress',
          {
            orchestrationId,
            currentStep: i + 1,
            totalSteps: workflow.agents.length,
            progress: ((i + 1) / workflow.agents.length) * 100,
          },
        );
      }
    }

    // 最终整合
    if (workflow.finalizer) {
      const finalResult = await this.executeSubAgent(
        workflow.finalizer,
        results,
        context,
      );
      return finalResult;
    }

    return results;
  }

  /**
   * 执行子Agent
   */
  private async executeSubAgent(
    config: SubAgentConfig,
    previousResults: Map<string, any>,
    context: any,
  ) {
    const subAgent = await this.loadAgent(config.agentId);

    // 构建输入
    const input = this.buildSubAgentInput(config, previousResults);

    // 执行
    const result = await this.agentExecutor.execute(
      subAgent,
      input,
      context,
      'orchestration',
    );

    // 推送子Agent完成
    this.wsGateway.emitToUser(context.userId, 'agent:sub-agent-completed', {
      agentId: config.agentId,
      agentName: subAgent.name,
      result,
    });

    return result;
  }

  /**
   * 构建子Agent的输入
   */
  private buildSubAgentInput(
    config: SubAgentConfig,
    previousResults: Map<string, any>,
  ): string {
    const parts = [config.task]; // 任务描述

    // 添加前面Agent的输出
    if (config.input && config.input.length > 0) {
      parts.push('\n【参考信息】');
      for (const inputKey of config.input) {
        const data = previousResults.get(inputKey);
        if (data) {
          parts.push(`\n${inputKey}:\n${JSON.stringify(data, null, 2)}`);
        }
      }
    }

    return parts.join('\n');
  }
}
```

### 6.2 AutoTriggerService

```typescript
@Injectable()
export class AutoTriggerService {
  constructor(
    private readonly agentOrchestrator: AgentOrchestratorService,
    private readonly contentAnalyzer: ContentAnalyzerService,
  ) {}

  /**
   * 检查并执行自动触发
   */
  async checkAndTrigger(agent: Agent, userInput: string, context: any) {
    if (!agent.autoTriggers || agent.autoTriggers.length === 0) {
      return null;
    }

    for (const trigger of agent.autoTriggers) {
      const shouldTrigger = await this.checkCondition(
        trigger,
        userInput,
        context,
      );

      if (shouldTrigger) {
        return await this.executeTrigger(trigger, agent, context);
      }
    }

    return null;
  }

  /**
   * 检查触发条件
   */
  private async checkCondition(
    trigger: AutoTrigger,
    userInput: string,
    context: any,
  ): Promise<boolean> {
    switch (trigger.condition) {
      case 'user_input_contains':
        return trigger.keywords.some((keyword) => userInput.includes(keyword));

      case 'detect_dialogue':
        const dialogueRatio = await this.contentAnalyzer.getDialogueRatio(
          context.currentContent,
        );
        return dialogueRatio > trigger.threshold;

      case 'content_length':
        const length = context.currentContent?.length || 0;
        return this.compareValue(length, trigger.operator, trigger.value);

      case 'consistency_issue':
        const issues = await this.contentAnalyzer.checkConsistency(
          context.novelId,
        );
        return issues.length > 0;

      // ... 更多条件
    }
  }

  /**
   * 执行触发动作
   */
  private async executeTrigger(
    trigger: AutoTrigger,
    agent: Agent,
    context: any,
  ) {
    switch (trigger.action) {
      case 'call_sub_agent':
        // 立即调用子Agent
        return await this.agentOrchestrator.orchestrate(
          agent,
          trigger.task || context.userInput,
          context,
          {
            mode: trigger.workflow || 'sequential',
            agents: trigger.subAgents.map((id) => ({ agentId: id })),
          },
        );

      case 'suggest_sub_agent':
        // 发送建议通知
        this.wsGateway.emitToUser(context.userId, 'agent:suggestion', {
          agentId: agent.id,
          message: trigger.message,
          suggestedAgents: trigger.subAgents,
        });
        return null;

      case 'notify':
        // 仅通知
        this.wsGateway.emitToUser(context.userId, 'agent:notification', {
          message: trigger.message,
        });
        return null;

      case 'auto_fix':
        // 自动修复（需要用户确认）
        this.wsGateway.emitToUser(context.userId, 'agent:auto-fix-request', {
          issue: trigger.issue,
          suggestedFix: trigger.suggestedFix,
          requireConfirm: true,
        });
        return null;
    }
  }
}
```

---

## 七、何时调用子 Agent？

### 7.1 明确调用（用户主动）

```typescript
// 用户明确要求
"帮我创建一章" → 调用"章节创作大师" → 自动编排子Agent

// 用户点击菜单
[创建章节] 按钮 → 直接调用Agent编排流程
```

### 7.2 智能建议（系统建议）

```typescript
// 检测到特征
写作中对话占比高 → 建议使用"对话大师"

// 检测到问题
发现设定矛盾 → 建议使用"一致性检查Agent"

// 达到阈值
章节超过3000字 → 建议使用"结构分析Agent"
```

### 7.3 自动调用（后台执行）

```typescript
// 保存触发
用户保存章节 → 自动调用"梗概生成Agent"

// 定时触发
写作超过30分钟 → 自动保存 + 生成备份

// 完成触发
完成一卷 → 自动生成卷总结
```

### 7.4 条件调用（智能判断）

```typescript
// 主Agent内部判断
主Agent分析内容 → 发现需要对话优化 → 调用"对话大师"
                → 发现需要场景描写 → 调用"描写大师"
```

---

## 八、调用决策树

```
用户输入
    ↓
[意图识别]
    ↓
    ├─ 包含"创建"关键词？
    │   ↓ 是
    │   ├─ 创建章节 → 调用"章节创作大师"
    │   ├─ 创建人物 → 调用"人物设计Agent"
    │   └─ 创建世界观 → 调用"世界观构建Agent"
    │
    ├─ 包含"分析"关键词？
    │   ↓ 是
    │   ├─ 分析结构 → 调用"结构分析Agent"
    │   ├─ 检查一致性 → 调用"一致性检查Agent"
    │   └─ 评估质量 → 调用"质量评估Agent"
    │
    ├─ 内容特征检测
    │   ↓
    │   ├─ 对话比例 > 70% → 建议"对话大师"
    │   ├─ 描写不足 < 30% → 建议"描写大师"
    │   └─ 节奏过慢 → 建议"节奏控制Agent"
    │
    └─ 默认行为
        ↓
        使用当前Agent单独处理
```

---

## 九、配置示例：全功能主 Agent

```json
{
  "name": "全能创作大师",
  "icon": "🎯",
  "description": "智能协调所有专业Agent，提供全方位写作支持",

  "systemPromptType": "custom",
  "systemPromptContent": "你是一个智能创作协调者，负责理解用户意图并调用合适的专业Agent完成任务。你可以：\n1. 分析用户需求\n2. 选择合适的子Agent\n3. 协调多个Agent协作\n4. 整合和优化结果",

  "modelId": "gpt-4o",
  "temperature": 0.7,

  "capabilities": {
    "inlineCompletion": false,
    "enableInlineByDefault": false,
    "showThoughts": true,
    "chat": true,
    "quickActions": [],
    "structureOperations": [
      "createVolume",
      "createChapter",
      "createCharacter",
      "createWorld",
      "createMemo",
      "analyzeStructure",
      "checkConsistency",
      "suggestPlot"
    ]
  },

  "contextConfig": {
    "includeCharacters": true,
    "includeWorldSettings": true,
    "includeOutline": true,
    "historyLength": 3,
    "maxContextTokens": 8000
  },

  "subAgents": [
    {
      "agentId": 5,
      "role": "dialogue",
      "name": "对话大师",
      "callCondition": "when_needed"
    },
    {
      "agentId": 8,
      "role": "description",
      "name": "描写大师",
      "callCondition": "when_needed"
    },
    {
      "agentId": 10,
      "role": "plot",
      "name": "情节大师",
      "callCondition": "when_needed"
    },
    {
      "agentId": 15,
      "role": "analyzer",
      "name": "结构分析Agent",
      "callCondition": "when_needed"
    },
    {
      "agentId": 20,
      "role": "checker",
      "name": "一致性检查Agent",
      "callCondition": "when_needed"
    }
  ],

  "autoTriggers": [
    {
      "condition": "user_input_contains",
      "keywords": ["创建章节", "写一章", "新建章节"],
      "action": "auto_orchestrate",
      "workflow": {
        "mode": "sequential",
        "agents": [
          { "agentId": 10, "output": "outline" },
          {
            "agentId": 5,
            "input": ["outline"],
            "output": "dialogue",
            "parallel": true
          },
          {
            "agentId": 8,
            "input": ["outline"],
            "output": "description",
            "parallel": true
          }
        ]
      }
    },
    {
      "condition": "detect_dialogue",
      "threshold": 0.7,
      "action": "suggest_sub_agent",
      "subAgents": [5],
      "message": "检测到大量对话，对话大师可以帮你优化"
    },
    {
      "condition": "chapter_save",
      "action": "call_sub_agent",
      "subAgents": [20],
      "task": "检查一致性",
      "silent": true
    },
    {
      "condition": "chapter_completed",
      "action": "call_sub_agent",
      "subAgents": [25],
      "task": "自动生成章节梗概",
      "autoExecute": true
    }
  ],

  "workflow": {
    "mode": "intelligent",
    "allowParallel": true,
    "maxConcurrent": 3,
    "timeout": 300000
  }
}
```

---

## 十、前端交互流程

### 10.1 协作进度展示

```tsx
// AgentOrchestrationProgress.tsx
export const AgentOrchestrationProgress = ({ orchestrationId }) => {
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const socket = io('/ws');

    socket.on('agent:orchestration-progress', (data) => {
      if (data.orchestrationId === orchestrationId) {
        setCurrentStep(data.currentStep);
      }
    });

    socket.on('agent:sub-agent-completed', (data) => {
      setSteps((prev) => [
        ...prev,
        {
          agentName: data.agentName,
          status: 'completed',
          result: data.result,
          thoughts: data.thoughts,
        },
      ]);
    });

    return () => socket.disconnect();
  }, [orchestrationId]);

  return (
    <div className="orchestration-progress">
      <h3>🤖 多Agent协作进行中...</h3>

      {steps.map((step, idx) => (
        <div key={idx} className="step">
          <div className="step-header">
            <span className="step-number">{idx + 1}</span>
            <span className="agent-name">{step.agentName}</span>
            <span className="status">✅ 完成</span>
          </div>

          {step.thoughts && (
            <div className="thoughts">
              <h4>💭 思考过程</h4>
              <ul>
                {step.thoughts.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="result-preview">
            {JSON.stringify(step.result).slice(0, 200)}...
          </div>
        </div>
      ))}

      {currentStep < steps.length && (
        <div className="current-step">
          <Spinner />
          <span>正在执行步骤 {currentStep + 1}...</span>
        </div>
      )}
    </div>
  );
};
```

---

## 十一、最佳实践

### 11.1 何时使用单 Agent

✅ 适合场景：

- 简单任务（续写、改写、润色）
- 专注单一领域（纯对话、纯描写）
- 实时响应（内联补全）
- 快速操作

### 11.2 何时使用多 Agent 协作

✅ 适合场景：

- 复杂任务（创建完整章节）
- 需要多种专业能力（对话+描写+情节）
- 结构性操作（创建人物卡并自动融入剧情）
- 质量要求高（多轮优化）

### 11.3 协作设计建议

**避免过度编排**：

- 不要为简单任务设计复杂工作流
- 子 Agent 数量建议 2-5 个
- 总执行时间控制在 1 分钟内

**合理分工**：

- 每个子 Agent 负责明确的单一任务
- 避免子 Agent 之间功能重叠
- 输入/输出清晰定义

**错误处理**：

- 某个子 Agent 失败不应影响整体
- 提供降级方案
- 记录详细日志

---

## 十二、性能优化

### 12.1 并行执行

```json
{
  "workflow": {
    "mode": "sequential",
    "allowParallel": true,
    "parallelSteps": [2, 3, 4] // 步骤2、3、4并行执行
  }
}
```

**优势**：

- 减少总执行时间
- 充分利用多核和并发

**适用场景**：

- 子 Agent 之间无依赖关系
- 对话大师和描写大师可以并行

### 12.2 缓存中间结果

```typescript
// 缓存子Agent结果
const cacheKey = `agent_${agentId}_${hash(input)}`;
const cached = await this.cache.get(cacheKey);
if (cached) {
  return cached;
}
```

### 12.3 Token 预算控制

```typescript
// 为每个子Agent分配token预算
{
  "workflow": {
    "tokenBudget": {
      "total": 8000,
      "perAgent": 2000,
      "reserved": 1000  // 为最终整合预留
    }
  }
}
```

---

## 十三、总结

### Agent 与提示词的协作

| 维度   | Agent            | 提示词            |
| ------ | ---------------- | ----------------- |
| 定位   | 智能编排者       | 内容模板          |
| 功能   | 调度、判断、整合 | 定义生成规则      |
| 复用性 | 可组合、可嵌套   | 可被多Agent引用   |
| 灵活性 | 高（可动态调用） | 中（静态模板）    |
| 复杂度 | 高（支持工作流） | 低（纯文本/引用） |

### 多 Agent 协作优势

1. **专业分工** - 每个 Agent 专注擅长领域
2. **质量提升** - 多个专家协作，质量更高
3. **灵活编排** - 根据任务动态组合
4. **可复用性** - 子 Agent 可以独立使用
5. **可扩展性** - 轻松添加新的专业 Agent

### 关键设计原则

1. **单一职责** - 每个 Agent 专注一个领域
2. **松耦合** - Agent 之间通过标准接口交互
3. **可组合** - 支持灵活的编排组合
4. **可观测** - 完整的 Thoughts 和进度反馈
5. **容错性** - 子 Agent 失败不影响整体
