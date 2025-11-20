# Agent 系统实施计划

> 完整的技术实现方案和开发路线图

---

## 📋 项目概览

### 目标

实现类似 Cursor 的 AI 编程助手在写作场景的应用，支持：

- 内联补全
- 对话协作
- 快速操作
- 结构操作
- 多 Agent 编排
- 自动触发机制

### 技术栈

- **后端**: NestJS + TypeORM + Bull/BullMQ
- **实时通信**: Socket.IO (已有)
- **AI 调用**: 复用现有 ChatCompletionService
- **数据库**: MySQL (已有)

---

## 🗄️ 数据库设计

### 新增表结构

#### 1. agents 表

```sql
CREATE TABLE agents (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '创建者ID',
  name VARCHAR(100) NOT NULL COMMENT 'Agent名称',
  description TEXT COMMENT '描述',
  icon VARCHAR(50) COMMENT '图标emoji',

  -- 核心配置
  system_prompt_type ENUM('custom', 'prompt') DEFAULT 'custom',
  system_prompt_content TEXT,
  system_prompt_id BIGINT,
  model_id VARCHAR(100) DEFAULT 'gemini-2.0-flash',
  temperature DECIMAL(3,2) DEFAULT 0.7,

  -- JSON配置
  capabilities JSON NOT NULL,
  context_config JSON NOT NULL,
  sub_agents JSON,
  auto_triggers JSON,
  workflow JSON,

  -- 统计
  usage_count INT DEFAULT 0,
  rating DECIMAL(3,2),
  rating_count INT DEFAULT 0,

  -- 权限
  is_public BOOLEAN DEFAULT FALSE,
  require_application BOOLEAN DEFAULT FALSE,

  -- 分享
  parent_agent_id BIGINT,
  fork_count INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  INDEX idx_user (user_id),
  INDEX idx_public (is_public, deleted_at),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (system_prompt_id) REFERENCES prompts(id),
  FOREIGN KEY (parent_agent_id) REFERENCES agents(id)
);
```

#### 2. agent_prompt_references 表

```sql
CREATE TABLE agent_prompt_references (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  agent_id BIGINT NOT NULL,
  prompt_id BIGINT NOT NULL,
  position ENUM('system', 'before', 'after') DEFAULT 'system',
  enabled BOOLEAN DEFAULT TRUE,
  order_index INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_agent (agent_id),
  INDEX idx_prompt (prompt_id),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
);
```

#### 3. agent_custom_prompts 表

```sql
CREATE TABLE agent_custom_prompts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  agent_id BIGINT NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_agent (agent_id),
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);
```

#### 4-6. 其他表（见 API 文档）

---

## 🏗️ 模块结构

```
backend/src/agents/
├── controllers/
│   ├── agents.controller.ts              # Agent CRUD
│   ├── agent-interact.controller.ts      # 交互API
│   ├── agent-orchestrate.controller.ts   # 编排API
│   └── agent-market.controller.ts        # 市场API
│
├── services/
│   ├── agents.service.ts                 # Agent管理
│   ├── agent-executor.service.ts         # 执行引擎
│   ├── agent-orchestrator.service.ts     # 编排引擎
│   ├── agent-context.service.ts          # 上下文构建
│   ├── agent-completion.service.ts       # 内联补全
│   ├── agent-chat.service.ts             # 对话服务
│   ├── agent-quick-action.service.ts     # 快速操作
│   ├── agent-structure-ops.service.ts    # 结构操作
│   ├── auto-trigger.service.ts           # 自动触发
│   └── content-analyzer.service.ts       # 内容分析
│
├── entities/
│   ├── agent.entity.ts
│   ├── agent-prompt-reference.entity.ts
│   ├── agent-custom-prompt.entity.ts
│   ├── agent-session.entity.ts
│   ├── agent-usage-log.entity.ts
│   └── agent-rating.entity.ts
│
├── dto/
│   ├── create-agent.dto.ts
│   ├── update-agent.dto.ts
│   ├── agent-complete.dto.ts
│   ├── agent-chat.dto.ts
│   ├── agent-quick-action.dto.ts
│   ├── agent-structure-op.dto.ts
│   ├── agent-orchestrate.dto.ts
│   └── agent-response.dto.ts
│
├── interfaces/
│   ├── agent-config.interface.ts
│   ├── agent-context.interface.ts
│   ├── workflow.interface.ts
│   └── trigger.interface.ts
│
├── enums/
│   ├── agent-capability.enum.ts
│   ├── operation-type.enum.ts
│   ├── trigger-condition.enum.ts
│   └── workflow-mode.enum.ts
│
├── guards/
│   └── agent-permission.guard.ts
│
├── agents.module.ts
├── AGENT_ORCHESTRATION.md
├── AGENT_USAGE_GUIDE.md
└── IMPLEMENTATION_PLAN.md (本文档)
```

---

## 🚀 开发路线图

### Phase 1: 基础架构（第1周）

#### 任务清单

- [ ] 创建数据库迁移文件

  ```bash
  npm run migration:generate -- CreateAgentTables
  ```

- [ ] 创建 Entity 类
  - [ ] agent.entity.ts
  - [ ] agent-prompt-reference.entity.ts
  - [ ] agent-custom-prompt.entity.ts
  - [ ] agent-session.entity.ts
  - [ ] agent-usage-log.entity.ts
  - [ ] agent-rating.entity.ts

- [ ] 创建 DTO 类
  - [ ] create-agent.dto.ts
  - [ ] update-agent.dto.ts
  - [ ] agent-response.dto.ts

- [ ] 创建枚举和接口
  - [ ] agent-capability.enum.ts
  - [ ] operation-type.enum.ts
  - [ ] agent-config.interface.ts

- [ ] 创建 AgentsModule
  ```typescript
  @Module({
    imports: [
      TypeOrmModule.forFeature([
        Agent,
        AgentPromptReference,
        AgentCustomPrompt,
        // ...
      ]),
      PromptsModule, // 引用提示词系统
      GenerationModule, // 引用AI生成系统
      WebSocketModule, // WebSocket推送
    ],
    controllers: [AgentsController],
    providers: [AgentsService],
    exports: [AgentsService],
  })
  export class AgentsModule {}
  ```

#### 验收标准

- ✅ 数据库表创建成功
- ✅ Entity 可以正常映射
- ✅ 基础 CRUD API 可用

---

### Phase 2: Agent 管理（第2周）

#### 2.1 Agent CRUD Service

```typescript
@Injectable()
export class AgentsService {
  // 创建Agent
  async create(dto: CreateAgentDto, userId: number): Promise<Agent> {
    // 1. 验证配置
    this.validateAgentConfig(dto);

    // 2. 如果引用提示词，验证权限
    if (dto.systemPromptType === 'prompt') {
      await this.validatePromptPermission(dto.systemPromptId, userId);
    }

    // 3. 创建Agent
    const agent = this.agentRepository.create({
      ...dto,
      userId,
    });

    await this.agentRepository.save(agent);

    // 4. 保存提示词引用
    if (dto.promptReferences) {
      await this.savePromptReferences(agent.id, dto.promptReferences);
    }

    // 5. 保存自定义提示词
    if (dto.customPrompts) {
      await this.saveCustomPrompts(agent.id, dto.customPrompts);
    }

    return agent;
  }

  // 查询Agent（含权限检查）
  async findOne(id: number, userId?: number): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: ['promptReferences', 'customPrompts', 'author'],
    });

    if (!agent) {
      throw new NotFoundException('Agent不存在');
    }

    // 权限检查
    if (agent.userId !== userId && !agent.isPublic) {
      throw new ForbiddenException('无权访问此Agent');
    }

    return agent;
  }

  // 更新Agent
  async update(id: number, dto: UpdateAgentDto, userId: number) {
    const agent = await this.findOne(id, userId);

    // 仅限作者修改
    if (agent.userId !== userId) {
      throw new ForbiddenException('仅限作者修改');
    }

    // 更新配置
    Object.assign(agent, dto);
    await this.agentRepository.save(agent);

    // 更新引用关系
    if (dto.promptReferences) {
      await this.updatePromptReferences(agent.id, dto.promptReferences);
    }

    return agent;
  }

  // 删除Agent（软删除）
  async delete(id: number, userId: number) {
    const agent = await this.findOne(id, userId);

    if (agent.userId !== userId) {
      throw new ForbiddenException('仅限作者删除');
    }

    await this.agentRepository.softDelete(id);
  }
}
```

#### 2.2 Agent 验证

```typescript
private validateAgentConfig(dto: CreateAgentDto) {
  // 验证系统提示词
  if (dto.systemPromptType === 'custom' && !dto.systemPromptContent) {
    throw new BadRequestException('自定义类型需要提供systemPromptContent');
  }

  if (dto.systemPromptType === 'prompt' && !dto.systemPromptId) {
    throw new BadRequestException('引用类型需要提供systemPromptId');
  }

  // 验证capabilities
  if (!dto.capabilities || Object.keys(dto.capabilities).length === 0) {
    throw new BadRequestException('至少需要启用一个能力');
  }

  // 验证subAgents引用
  if (dto.subAgents && dto.subAgents.length > 0) {
    for (const subAgent of dto.subAgents) {
      if (!subAgent.agentId) {
        throw new BadRequestException('subAgent必须指定agentId');
      }
    }
  }
}
```

#### 验收标准

- ✅ Agent CRUD API 完整实现
- ✅ 权限检查正确
- ✅ 提示词引用正常
- ✅ 配置验证完善

---

### Phase 3: Agent 执行引擎（第3周）

#### 3.1 AgentExecutorService

```typescript
@Injectable()
export class AgentExecutorService {
  constructor(
    private readonly chatCompletionService: ChatCompletionService,
    private readonly agentContextService: AgentContextService,
    private readonly macroReplacer: MacroReplacerService,
    private readonly tokenConsumptionService: TokenConsumptionService,
  ) {}

  /**
   * 执行Agent任务
   */
  async execute(
    agent: Agent,
    input: string,
    context: AgentContext,
    actionType: AgentActionType,
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    // 1. 构建消息数组
    const messages = await this.buildMessages(
      agent,
      input,
      context,
      actionType,
    );

    // 2. 准备AI调用参数
    const requestParams = {
      model: agent.modelId,
      messages,
      temperature: agent.temperature,
      max_tokens: this.getMaxTokens(actionType),
      stream: context.stream || false,
    };

    // 3. 如果需要显示思考过程
    if (agent.capabilities.showThoughts && context.stream) {
      return await this.executeWithThoughts(agent, requestParams, context);
    }

    // 4. 普通执行
    const result = await this.chatCompletionService.complete(
      requestParams,
      context.userId,
    );

    // 5. 记录使用日志
    await this.logUsage(agent, input, result, context);

    // 6. 返回结果
    return {
      content: result.choices[0].message.content,
      usage: result.usage,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 带思考过程的执行
   */
  private async executeWithThoughts(
    agent: Agent,
    requestParams: any,
    context: AgentContext,
  ) {
    // 思考过程提示词
    const thoughtPrompt = `
在回答之前，请先分析思考，格式如下：
<thoughts>
1. 分析当前情况...
2. 确定解决方案...
3. 选择实施策略...
</thoughts>

然后再给出实际内容。
`;

    // 添加思考提示
    requestParams.messages.push({
      role: 'system',
      content: thoughtPrompt,
    });

    // 流式生成
    const stream = this.chatCompletionService.completeStream(
      requestParams,
      context.userId,
    );

    let fullContent = '';
    let inThoughts = false;
    let currentThought = '';

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      fullContent += content;

      // 解析思考过程
      if (content.includes('<thoughts>')) {
        inThoughts = true;
        currentThought = '';
        continue;
      }

      if (content.includes('</thoughts>')) {
        inThoughts = false;
        // 推送完整的思考过程
        this.pushThoughts(context, currentThought);
        continue;
      }

      if (inThoughts) {
        currentThought += content;
        // 实时推送思考片段
        this.pushThought(context, content);
      } else {
        // 推送实际内容
        this.pushContent(context, content);
      }
    }

    return { content: fullContent };
  }

  /**
   * 构建消息数组
   */
  private async buildMessages(
    agent: Agent,
    input: string,
    context: AgentContext,
    actionType: AgentActionType,
  ) {
    const messages = [];

    // 1. Agent系统提示词
    if (agent.systemPromptType === 'custom' && agent.systemPromptContent) {
      messages.push({
        role: 'system',
        content: agent.systemPromptContent,
      });
    } else if (agent.systemPromptType === 'prompt' && agent.systemPromptId) {
      const prompt = await this.loadPrompt(agent.systemPromptId);
      messages.push({
        role: 'system',
        content: this.buildPromptContent(prompt),
      });
    }

    // 2. 引用的提示词（position=system）
    const systemRefs = await this.loadPromptReferences(agent.id, 'system');
    for (const ref of systemRefs) {
      messages.push({
        role: 'system',
        content: this.buildPromptContent(ref.prompt),
      });
    }

    // 3. 上下文信息
    const contextPrompt = await this.agentContextService.build(agent, context);
    if (contextPrompt) {
      messages.push({
        role: 'system',
        content: contextPrompt,
      });
    }

    // 4. 引用的提示词（position=before）
    const beforeRefs = await this.loadPromptReferences(agent.id, 'before');
    for (const ref of beforeRefs) {
      messages.push({
        role: 'system',
        content: this.buildPromptContent(ref.prompt),
      });
    }

    // 5. 对话历史（chat模式）
    if (actionType === 'chat' && context.history) {
      messages.push(...context.history);
    }

    // 6. 操作提示词（completion/rewrite等）
    const actionPrompt = await this.getActionPrompt(agent, actionType);
    if (actionPrompt) {
      messages.push({
        role: 'user',
        content: await this.macroReplacer.replace(actionPrompt, {
          userId: context.userId,
          variables: { input, ...context.variables },
        }),
      });
    }

    // 7. 引用的提示词（position=after）
    const afterRefs = await this.loadPromptReferences(agent.id, 'after');
    for (const ref of afterRefs) {
      messages.push({
        role: 'system',
        content: this.buildPromptContent(ref.prompt),
      });
    }

    // 8. 用户输入（如果没有actionPrompt）
    if (!actionPrompt && input) {
      messages.push({
        role: 'user',
        content: input,
      });
    }

    return messages;
  }
}
```

#### 3.2 AgentContextService

```typescript
@Injectable()
export class AgentContextService {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly worldSettingsService: WorldSettingsService,
    private readonly chaptersService: ChaptersService,
  ) {}

  /**
   * 构建上下文提示词
   */
  async build(agent: Agent, context: AgentContext): Promise<string> {
    const parts: string[] = [];
    const config = agent.contextConfig;

    // 1. 人物卡
    if (config.includeCharacters && context.novelId) {
      const characters = await this.charactersService.findByNovel(
        context.novelId,
      );

      if (characters.length > 0) {
        parts.push('【人物设定】');
        for (const char of characters) {
          parts.push(this.formatCharacter(char));
        }
      }
    }

    // 2. 世界观
    if (config.includeWorldSettings && context.novelId) {
      const worldSettings = await this.worldSettingsService.findByNovel(
        context.novelId,
      );

      if (worldSettings.length > 0) {
        parts.push('【世界观设定】');
        for (const ws of worldSettings) {
          parts.push(this.formatWorldSetting(ws));
        }
      }
    }

    // 3. 章节大纲
    if (config.includeOutline && context.chapterId) {
      const chapter = await this.chaptersService.findOne(context.chapterId);
      if (chapter?.summary) {
        parts.push('【当前章节大纲】');
        parts.push(chapter.summary);
      }
    }

    // 4. 前几章内容
    if (config.historyLength > 0 && context.chapterId) {
      const previousChapters = await this.chaptersService.findPrevious(
        context.chapterId,
        config.historyLength,
      );

      if (previousChapters.length > 0) {
        parts.push('【前文回顾】');
        for (const ch of previousChapters) {
          parts.push(`第${ch.order}章: ${ch.title}`);
          parts.push(ch.summary || ch.content.slice(0, 500) + '...');
        }
      }
    }

    // 5. 当前选中文本
    if (context.selectedText) {
      parts.push('【选中内容】');
      parts.push(context.selectedText);
    }

    // 6. 当前段落
    if (context.currentParagraph) {
      parts.push('【当前段落】');
      parts.push(context.currentParagraph);
    }

    const fullContext = parts.join('\n\n');

    // Token控制
    const estimatedTokens = Math.ceil(fullContext.length / 3);
    if (estimatedTokens > config.maxContextTokens) {
      return this.trimContext(fullContext, config.maxContextTokens);
    }

    return fullContext;
  }

  private formatCharacter(char: Character): string {
    const fields = char.fields || {};
    let text = `【${char.name}】\n`;
    for (const [key, value] of Object.entries(fields)) {
      if (value) {
        text += `${key}: ${value}\n`;
      }
    }
    return text;
  }

  // ... 其他格式化方法
}
```

#### 验收标准

- ✅ 上下文正确加载人物卡、世界观
- ✅ Token 限制生效
- ✅ 格式化输出规范

---

### Phase 3: 交互功能（第4-5周）

#### 3.1 内联补全

```typescript
@Injectable()
export class AgentCompletionService {
  async complete(
    agent: Agent,
    dto: AgentCompleteDto,
    userId: number,
  ): Promise<string> {
    // 检查能力
    if (!agent.capabilities.inlineCompletion) {
      throw new BadRequestException('此Agent不支持内联补全');
    }

    // 构建上下文
    const context: AgentContext = {
      userId,
      novelId: dto.context.novelId,
      chapterId: dto.context.chapterId,
      cursorPosition: dto.context.cursorPosition,
    };

    // 执行Agent
    const result = await this.agentExecutor.execute(
      agent,
      dto.text,
      context,
      'completion',
    );

    // 截取指定长度
    const maxLength = dto.maxLength || 100;
    return result.content.slice(0, maxLength);
  }
}
```

#### 3.2 对话协作

```typescript
@Injectable()
export class AgentChatService {
  async chat(
    agent: Agent,
    dto: AgentChatDto,
    userId: number,
  ): Promise<AgentChatResponse> {
    // 检查能力
    if (!agent.capabilities.chat) {
      throw new BadRequestException('此Agent不支持对话模式');
    }

    // 加载或创建会话
    let session = dto.sessionId
      ? await this.loadSession(dto.sessionId, userId)
      : await this.createSession(agent.id, dto.context, userId);

    // 构建上下文
    const context: AgentContext = {
      userId,
      ...dto.context,
      history: dto.history || [],
      sessionId: session.id,
    };

    // 执行Agent
    const result = await this.agentExecutor.execute(
      agent,
      dto.message,
      context,
      'chat',
    );

    // 保存对话历史
    await this.saveChatHistory(session.id, dto.message, result.content);

    return {
      text: result.content,
      sessionId: session.id,
      usage: result.usage,
    };
  }
}
```

#### 3.3 快速操作

```typescript
@Injectable()
export class AgentQuickActionService {
  async quickAction(
    agent: Agent,
    dto: AgentQuickActionDto,
    userId: number,
  ): Promise<AgentQuickActionResponse> {
    // 检查是否支持该操作
    if (!agent.capabilities.quickActions?.includes(dto.action)) {
      throw new BadRequestException(`此Agent不支持${dto.action}操作`);
    }

    // 构建上下文
    const context: AgentContext = {
      userId,
      ...dto.context,
      selectedText: dto.text,
    };

    // 执行Agent
    const result = await this.agentExecutor.execute(
      agent,
      dto.text,
      context,
      dto.action,
    );

    return {
      original: dto.text,
      result: result.content,
      usage: result.usage,
    };
  }
}
```

#### 验收标准

- ✅ 三种交互模式全部实现
- ✅ 流式和非流式都支持
- ✅ Thoughts 显示正常
- ✅ 使用日志正确记录

---

### Phase 4: 结构操作（第6周）

#### 4.1 AgentStructureOpsService

```typescript
@Injectable()
export class AgentStructureOpsService {
  async executeOperation(
    agent: Agent,
    dto: AgentStructureOpDto,
    userId: number,
  ) {
    // 检查权限
    if (!agent.capabilities.structureOperations?.includes(dto.operation)) {
      throw new BadRequestException(`此Agent不支持${dto.operation}操作`);
    }

    // 根据操作类型分发
    switch (dto.operation) {
      case 'createChapter':
        return await this.createChapter(agent, dto, userId);

      case 'createCharacter':
        return await this.createCharacter(agent, dto, userId);

      case 'analyzeStructure':
        return await this.analyzeStructure(agent, dto, userId);

      case 'checkConsistency':
        return await this.checkConsistency(agent, dto, userId);

      // ... 其他操作
    }
  }

  /**
   * 创建章节
   */
  private async createChapter(
    agent: Agent,
    dto: AgentStructureOpDto,
    userId: number,
  ) {
    const { novelId, volumeId } = dto.context;
    const { title, summary, autoGenerate, targetLength } = dto.parameters;

    // 1. 如果需要自动生成内容
    let content = '';
    const thoughts: string[] = [];

    if (autoGenerate) {
      // 使用Agent生成章节内容
      const context = await this.buildChapterContext(novelId, volumeId);

      const prompt = `
请基于以下信息创作一个新章节：

标题: ${title}
梗概: ${summary}
目标字数: ${targetLength}

${context}

请创作完整的章节内容。
`;

      const result = await this.agentExecutor.execute(
        agent,
        prompt,
        { userId, novelId },
        'structure_operation',
      );

      content = result.content;
      thoughts.push(...(result.thoughts || []));
    }

    // 2. 创建章节记录
    const chapter = await this.chaptersService.create({
      volumeId,
      title,
      summary,
      content,
    });

    // 3. 返回结果
    return {
      operationType: 'createChapter',
      result: chapter,
      thoughts,
      suggestions: this.generateSuggestions(chapter),
    };
  }

  /**
   * 创建人物卡
   */
  private async createCharacter(
    agent: Agent,
    dto: AgentStructureOpDto,
    userId: number,
  ) {
    const { novelId } = dto.context;
    const { role, brief } = dto.parameters;

    // 使用Agent生成人物卡
    const prompt = `
请创建一个${role}角色：${brief}

请提供以下信息（JSON格式）：
{
  "name": "角色名字",
  "category": "角色分类",
  "fields": {
    "性别": "...",
    "年龄": "...",
    "职业": "...",
    "性格": "...",
    "外貌": "...",
    "能力": "...",
    "背景": "...",
    "动机": "...",
    "弱点": "..."
  }
}
`;

    const result = await this.agentExecutor.execute(
      agent,
      prompt,
      { userId, novelId },
      'structure_operation',
    );

    // 解析JSON结果
    const characterData = JSON.parse(result.content);

    // 创建人物卡
    const character = await this.charactersService.create({
      novelId,
      ...characterData,
    });

    return {
      operationType: 'createCharacter',
      result: character,
      thoughts: result.thoughts || [],
    };
  }
}
```

#### 验收标准

- ✅ 支持所有结构操作类型
- ✅ 自动生成内容质量良好
- ✅ 正确调用底层服务
- ✅ 返回 thoughts 和 suggestions

---

### Phase 5: Agent 编排（第7-8周）

#### 5.1 AgentOrchestratorService

```typescript
@Injectable()
export class AgentOrchestratorService {
  constructor(
    private readonly agentExecutor: AgentExecutorService,
    private readonly agentsService: AgentsService,
    private readonly wsGateway: WebSocketGateway,
  ) {}

  async orchestrate(
    mainAgent: Agent,
    task: string,
    context: AgentContext,
    workflow: Workflow,
  ) {
    const orchestrationId = `orch_${Date.now()}`;
    const results = new Map<string, any>();

    // 推送开始
    this.pushStart(context.userId, orchestrationId, workflow);

    try {
      // 根据模式执行
      switch (workflow.mode) {
        case 'sequential':
          await this.executeSequential(workflow, results, context);
          break;

        case 'parallel':
          await this.executeParallel(workflow, results, context);
          break;

        case 'conditional':
          await this.executeConditional(workflow, results, context);
          break;
      }

      // 最终整合
      const finalResult = await this.finalize(
        workflow.finalizer,
        results,
        context,
      );

      // 推送完成
      this.pushCompleted(context.userId, orchestrationId, finalResult);

      return finalResult;
    } catch (error) {
      // 推送错误
      this.pushError(context.userId, orchestrationId, error);
      throw error;
    }
  }

  /**
   * 串行执行
   */
  private async executeSequential(
    workflow: Workflow,
    results: Map<string, any>,
    context: AgentContext,
  ) {
    for (let i = 0; i < workflow.agents.length; i++) {
      const agentConfig = workflow.agents[i];

      // 检查是否并行执行
      if (workflow.parallelSteps?.includes(i)) {
        const parallelGroup = this.getParallelGroup(workflow.agents, i);
        await this.executeParallelGroup(parallelGroup, results, context);
        i += parallelGroup.length - 1; // 跳过已执行的
      } else {
        await this.executeSubAgent(agentConfig, results, context, i + 1);
      }
    }
  }

  /**
   * 执行子Agent
   */
  private async executeSubAgent(
    config: SubAgentConfig,
    results: Map<string, any>,
    context: AgentContext,
    step: number,
  ) {
    // 加载子Agent
    const subAgent = await this.agentsService.findOne(config.agentId);

    // 推送进度
    this.pushProgress(context.userId, {
      currentStep: step,
      agentName: subAgent.name,
    });

    // 构建输入
    const input = this.buildSubAgentInput(config, results);

    // 执行
    const result = await this.agentExecutor.execute(
      subAgent,
      input,
      context,
      'orchestration',
    );

    // 保存结果
    results.set(config.output, result);

    // 推送完成
    this.pushSubAgentCompleted(context.userId, {
      agentId: config.agentId,
      agentName: subAgent.name,
      result,
    });

    return result;
  }
}
```

#### 验收标准

- ✅ 串行、并行、条件三种模式都实现
- ✅ 子 Agent 结果正确传递
- ✅ WebSocket 实时推送进度
- ✅ 错误处理完善

---

### Phase 6: 自动触发（第9周）

#### 6.1 AutoTriggerService

```typescript
@Injectable()
export class AutoTriggerService {
  async checkAndTrigger(
    agent: Agent,
    userInput: string,
    context: AgentContext,
  ) {
    if (!agent.autoTriggers) return null;

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

  private async checkCondition(
    trigger: AutoTrigger,
    userInput: string,
    context: any,
  ): Promise<boolean> {
    // 实现各种检测逻辑
    // ...
  }
}
```

#### 6.2 ContentAnalyzerService

```typescript
@Injectable()
export class ContentAnalyzerService {
  /**
   * 检测对话比例
   */
  async getDialogueRatio(content: string): Promise<number> {
    const dialoguePattern = /"[^"]*"|「[^」]*」/g;
    const dialogues = content.match(dialoguePattern) || [];
    const dialogueLength = dialogues.join('').length;
    return dialogueLength / content.length;
  }

  /**
   * 检测描写比例
   */
  async getDescriptionRatio(content: string): Promise<number> {
    // 使用简单的启发式规则
    // 或调用AI进行语义分析
  }

  /**
   * 检查一致性
   */
  async checkConsistency(novelId: number) {
    // 加载所有章节和设定
    // 对比并查找矛盾
    // 返回问题列表
  }
}
```

#### 验收标准

- ✅ 所有触发条件都实现
- ✅ 检测准确率 > 80%
- ✅ 不影响编辑器性能

---

### Phase 7: Agent 市场（第10周）

#### 实现功能

- [ ] 浏览公开 Agent
- [ ] 搜索和筛选
- [ ] 添加到我的列表（fork）
- [ ] 评分和评价
- [ ] 统计和排行

#### 验收标准

- ✅ 市场API全部实现
- ✅ Fork 机制正常
- ✅ 评分系统准确

---

### Phase 8: 前端集成（第11-13周）

#### 8.1 编辑器集成

- [ ] Agent 选择器
- [ ] 内联补全 UI
- [ ] Thoughts 展示
- [ ] 协作流程可视化

#### 8.2 Agent 管理界面

- [ ] Agent 创建/编辑表单
- [ ] 提示词选择器
- [ ] 子 Agent 配置器
- [ ] 触发规则编辑器

#### 8.3 Agent 市场

- [ ] 市场浏览页面
- [ ] Agent 详情页
- [ ] 评分和评价
- [ ] 搜索和筛选

---

## 🧪 测试计划

### 单元测试

```typescript
describe('AgentExecutorService', () => {
  it('应该正确构建消息数组', async () => {
    const messages = await service.buildMessages(agent, input, context, 'chat');
    expect(messages).toHaveLength(5);
    expect(messages[0].role).toBe('system');
  });

  it('应该正确加载引用的提示词', async () => {
    const agent = createTestAgent({
      promptReferences: [{ promptId: 123, position: 'system' }],
    });
    const messages = await service.buildMessages(agent, input, context, 'chat');
    // 验证提示词内容已加载
  });
});

describe('AgentOrchestratorService', () => {
  it('应该串行执行子Agent', async () => {
    const result = await service.orchestrate(mainAgent, task, context, {
      mode: 'sequential',
      agents: [{ agentId: 1 }, { agentId: 2 }],
    });
    // 验证执行顺序
  });

  it('应该并行执行子Agent', async () => {
    const startTime = Date.now();
    await service.executeParallelGroup([agent1, agent2], results, context);
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(5000); // 应该比串行快
  });
});
```

### 集成测试

```typescript
describe('Agent API Integration', () => {
  it('POST /agents 应该创建Agent', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/agents')
      .set('Authorization', `Bearer ${token}`)
      .send(createAgentDto)
      .expect(201);

    expect(response.body.data.id).toBeDefined();
  });

  it('POST /agents/:id/complete 应该返回补全建议', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/agents/${agentId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '她走进房间...' })
      .expect(200);

    expect(response.body.data.text).toBeDefined();
  });
});
```

---

## 📊 性能目标

### 响应时间

| 操作类型   | 目标时间 | 可接受时间 |
| ---------- | -------- | ---------- |
| 内联补全   | < 1秒    | < 2秒      |
| 快速操作   | < 3秒    | < 5秒      |
| 对话协作   | < 3秒    | < 5秒      |
| 结构操作   | < 5秒    | < 10秒     |
| Agent 协作 | < 10秒   | < 20秒     |

### 并发性能

- 单服务器支持 100+ 并发 Agent 执行
- WebSocket 支持 1000+ 在线用户
- 内联补全队列处理 50+ 请求/秒

### 资源控制

- 单个 Agent 执行 < 10MB 内存
- 协作任务总 token < 20,000
- 数据库连接池 < 50

---

## 🔐 安全和权限

### 权限控制

```typescript
// Agent使用权限检查
@UseGuards(AgentPermissionGuard)
async execute(@Param('id') agentId: number) {
  // Guard会自动检查:
  // 1. Agent是否存在
  // 2. 用户是否有权使用（作者/公开/已授权）
  // 3. 引用的提示词是否有权限
}
```

### 速率限制

```typescript
// 防止滥用
@UseGuards(ThrottlerGuard)
@Throttle(20, 60) // 每分钟最多20次
async complete() {
  // ...
}
```

### Token 消耗控制

```typescript
// 预检查余额
const estimatedCost = await this.estimateCost(agent, input);
if (!(await this.hasEnoughBalance(userId, estimatedCost))) {
  throw new BadRequestException('余额不足');
}
```

---

## 📈 监控和日志

### 日志记录

```typescript
this.logger.log(
  `[Agent执行] agentId=${agent.id}, userId=${userId}, action=${actionType}`,
);
this.logger.debug(`[上下文] ${JSON.stringify(context)}`);
this.logger.log(`[结果] 耗时=${duration}ms, tokens=${usage.total}`);
```

### 统计指标

- Agent 使用次数
- 平均响应时间
- Token 消耗统计
- 错误率
- 用户满意度

---

## 🎯 里程碑

### M1: 基础功能（第4周末）

- ✅ Agent CRUD
- ✅ 内联补全
- ✅ 对话协作
- ✅ 快速操作

### M2: 高级功能（第8周末）

- ✅ 结构操作
- ✅ Agent 编排
- ✅ 自动触发
- ✅ Thoughts 显示

### M3: 完整系统（第13周末）

- ✅ Agent 市场
- ✅ 前端全部集成
- ✅ 测试覆盖率 > 80%
- ✅ 文档完善

---

## 📚 相关文档

- [API 文档](../../../API/24-Agent智能助手系统.md)
- [协作机制](./AGENT_ORCHESTRATION.md)
- [使用指南](./AGENT_USAGE_GUIDE.md)
