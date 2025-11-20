# API 更新日志

## 2025-11-19 - 模型配置按分类展示

### ✨ 功能改进

- `/api/v1/ai-models/active/basic` 返回模型所属分类的 ID、名称、图标、描述和排序，方便前端分组展示。
- 编辑器前端的 AI 模型配置面板改为按照模型分类（而非提供商）切换，移动端横滑、桌面端纵向切换体验保持一致。
- 管理后台的 AI 模型配置弹窗重构为卡片化布局，字段分组更清晰，并在“连接与提供商”卡片中增加测试按钮。
- 新增 `POST /api/v1/ai-models/test-connection`，可依据当前填写的 Base URL 与 API Key 即时检测模型是否可用，失败时返回明确原因。

### 📄 文档

- 更新 `API/10-AI模型管理.md`，补充基础信息接口的分类字段说明，并新增模型连接测试接口文档。
- 在本更新日志记录此次调整。

## 2025-11-06 - 一键成书流式优化功能

### ✨ 新功能

#### 1. 一键成书阶段优化 - 流式输出支持

**功能描述**：
为一键成书系统的阶段优化功能添加流式输出支持，用户可以实时看到 AI 生成的内容，提升用户体验。

**核心特性**：

- ✅ **实时流式输出**：通过 SSE (Server-Sent Events) 实时推送生成内容
- ✅ **元数据返回**：流式完成后返回字数消耗等元数据
- ✅ **WebSocket 进度通知**：同时通过 WebSocket 推送阶段状态变化
- ✅ **任务自动更新**：流式完成后自动更新任务数据
- ✅ **前端实时显示**：前端组件实时显示流式内容，支持 Markdown 渲染

**新增 API 接口（1 个）**：

- `POST /api/v1/book-creation/tasks/:taskId/stages/:stageType/optimize/stream` - 优化阶段产出（流式输出）

**技术实现**：

- **后端**:
  - 新增 `generateStreamWithMetadata` 方法，支持流式输出并返回元数据
  - 修改 `optimizeStage1Stream` 方法，使用流式 API 并更新任务数据
  - 在 Controller 中添加流式接口 `optimizeStageStream`
- **前端**:
  - 新增 `optimizeStageStream` API 方法，支持 SSE 流式接收
  - 修改 `StagePanel` 组件，添加流式内容显示区域
  - 实时 Markdown 渲染流式内容

**响应格式**：

```
data: {"content":"文本片段"}
data: {"type":"metadata","content":"完整内容","inputChars":1000,"outputChars":2000,"modelId":1}
data: [DONE]
```

**WebSocket 事件**：

```typescript
// 开始事件
{ event: 'stage_started', stage: 'stage_1_idea', data: { message: '开始脑洞优化' } }

// 完成事件
{ event: 'stage_completed', stage: 'stage_1_idea', data: { message: '脑洞优化完成', result: {...}, charactersConsumed: 2500 } }

// 错误事件
{ event: 'error', stage: 'stage_1_idea', data: { error: '错误信息' } }
```

**使用场景**：

- 一键成书阶段 1（脑洞扩展）的优化
- 未来可扩展到其他阶段的优化

**文档更新**：

- ✅ 更新 `API/28-一键成书系统.md`，添加流式优化接口文档
- ✅ 更新 `API/CHANGELOG.md`，记录本次变更

---

## 2025-11-03 - 一键成书：人物卡和世界观自动提取功能 + 帮助文档

### ✨ 新增功能

#### 1. 自动提取人物卡和世界观（后端）

在阶段 3（大纲生成）完成后，系统会自动从章节大纲中提取人物卡和世界观信息并创建对应实体。

**功能特性**：

- ✅ **支持两种格式**：
  - 旧格式：简单字符串数组 `["主角：林渊", "导师：云长老"]`
  - 新格式：完整对象格式（包含 `name`, `category`, `fields`）
- ✅ **自动创建实体**：
  - 自动创建 `Character` 实体（人物卡表）
  - 自动创建 `WorldSetting` 实体（世界观表）
- ✅ **智能去重**：同名人物卡/世界观不会重复创建
- ✅ **容错设计**：提取失败不会阻塞流程，只记录日志

**技术实现**：

- 新增服务：`CharacterWorldviewExtractorService`
- 集成位置：`OutlineBuilderService.buildCompleteOutline()` 方法（第 83-97 行）
- 相关文件：
  - `backend/src/book-creation/services/character-worldview-extractor.service.ts` - 提取服务
  - `backend/src/book-creation/services/outline-builder.service.ts` - 集成调用
  - `backend/src/book-creation/book-creation.module.ts` - 服务注册

**影响范围**：

- ⚠️ **无接口变更**：仅内部逻辑增强，无破坏性变更
- ✅ **用户体验提升**：用户在阶段 3 完成后可以直接看到自动创建的人物卡和世界观
- ✅ **阶段 4 优化**：正文生成阶段可以直接使用这些自动创建的人物卡和世界观

#### 2. 帮助文档页面（前端）

**新增页面**：`/dashboard/book-creation/help`

**功能特性**：

- ✅ **双 Tab 设计**：

  - **普通用户指南**：
    - 快速开始（5 步骤时间线）
    - 五个创作阶段详解
    - 章节逐章生成流程说明（解答"下一章怎么生成"）
    - 常见问题（6 个折叠 FAQ）
    - 使用技巧和注意事项
  - **提示词作者指南**：
    - 参数类型说明（用户参数 vs 系统参数）
    - 12 个提示词完整说明（5 个生成 + 7 个优化）
    - 格式要求总结表
    - 参数映射表（系统自动参数来源）
    - 常见错误和最佳实践

- ✅ **导航优化**：目录导航 + 锚点快速跳转

- ✅ **通俗易懂**：移除代码和数据库术语，使用通俗语言

- ✅ **重点说明**：
  - 章节批量并发生成机制
  - 人物卡/世界观格式化方式和过度发挥问题
  - 世界观可包含词条、物品、势力等

**访问入口**：

- 任务列表页："帮助文档"按钮
- 路由：`/dashboard/book-creation/help`

**相关文件**：

- `frontend/src/pages/book-creation/BookCreationHelpPage.tsx` - 帮助页面组件
- `frontend/src/pages/book-creation/BookCreationPage.tsx` - 添加帮助按钮
- `frontend/src/pages/dashboard/Dashboard.tsx` - 路由配置

---

**提示词要求**：

章节大纲生成提示词应输出包含 `characters` 和 `worldviews` 字段的 JSON：

```json
[
  {
    "title": "第一章 初入修仙界",
    "summary": "主角穿越到修仙世界...",
    "characters": [
      {
        "name": "林渊",
        "category": "主要人物",
        "fields": {
          "性别": "男",
          "年龄": "18",
          "身份": "穿越者"
        }
      }
    ],
    "worldviews": [
      {
        "name": "修仙世界",
        "category": "世界设定",
        "fields": {
          "世界类型": "修仙世界",
          "修炼体系": "灵根修炼"
        }
      }
    ]
  }
]
```

---

## 2025-11-03 - 一键成书架构重构（移除 initialIdea，全面提示词组化）

### 🔄 重大变更

#### 一键成书系统架构调整

**核心变更**：

1. **移除 `initialIdea` 字段** ⚠️ 破坏性变更

   - 不再需要用户手动输入想法
   - 想法现在由脑洞生成提示词的参数提供
   - 简化了创建流程，使其更加自动化

2. **添加提示词组支持**

   - 新增 `promptGroupId` 字段，一旦设置不可更改
   - 支持直接使用提示词组或配置单个提示词
   - 提示词组与单个提示词配置二选一

3. **扩展提示词类型（10 个 → 12 个）**

   - 新增 `mainOutlineOptimizePromptId` - 大纲优化提示词
   - 新增 `volumeOutlineOptimizePromptId` - 卷纲优化提示词
   - 新增 `chapterOutlineOptimizePromptId` - 细纲优化提示词

4. **精简 `taskConfig` 配置（6 个 → 2 个）**
   - 移除 `targetTotalWords`、`wordsPerChapter`、`chaptersPerVolume`、`targetVolumes`
   - 保留 `enableReview` - 是否启用审稿
   - 保留 `concurrencyLimit` - 并发限制
   - 字数、章节数等参数现在由提示词参数提供

**新增 API 接口**：

- `PATCH /api/v1/book-creation/tasks/:taskId/prompt-config` - 更新提示词配置（仅允许更新单个提示词）

**修改的 API 接口**：

- `POST /api/v1/book-creation/tasks` - 创建任务
  - 移除 `initialIdea` 参数（破坏性变更）
  - 移除 `promptConfig` 参数（不再支持创建时手动配置）
  - 新增 `promptGroupId` 参数（可选）
  - 简化 `taskConfig` 结构（6 个字段 → 2 个字段）

**数据库变更**：

```sql
-- 添加提示词组ID字段
ALTER TABLE book_creation_tasks
ADD COLUMN prompt_group_id INT UNSIGNED NULL;

-- 添加外键约束
ALTER TABLE book_creation_tasks
ADD CONSTRAINT fk_book_creation_tasks_prompt_group
FOREIGN KEY (prompt_group_id) REFERENCES prompt_groups(id) ON DELETE SET NULL;

-- 移除初始想法字段（破坏性变更）
ALTER TABLE book_creation_tasks
DROP COLUMN initial_idea;

-- 添加索引
CREATE INDEX idx_book_creation_tasks_prompt_group_id ON book_creation_tasks(prompt_group_id);
```

**权限同步增强**：

1. **申请通过后自动授权组内提示词**

   - 当提示词组申请被批准时，自动授予用户组内所有提示词的 USE 权限
   - 用户可以直接在提示词广场使用这些提示词

2. **同步 requireApplication 状态**
   - 当提示词组设置为"需要申请"时，组内所有提示词自动设置为需要申请
   - 确保提示词组和单个提示词的权限控制一致

**迁移指南**：

1. 执行 SQL 脚本：`backend/sql/add_prompt_group_to_book_creation.sql`
2. 现有任务的 `initialIdea` 数据将丢失，建议在迁移前备份
3. 前端创建任务页面已更新，引导用户选择提示词组
4. 新增提示词组创建/编辑页面和权限管理页面

---

## 2025-11-03 - 提示词组功能（一键成书增强）

### ✨ 新功能

#### 1. 提示词组系统 - 一键成书提示词套装

**功能描述**：
为一键成书系统添加提示词组功能，允许用户创建和分享提示词套装，包含多个阶段的提示词配置。

**核心特性**：

- ✅ **提示词组管理**：创建、编辑、发布提示词组
- ✅ **隐私控制**：支持公开/私有、需要申请等权限设置
- ✅ **参数提取**：自动提取所有提示词的参数，用于任务创建时渲染
- ✅ **使用统计**：浏览次数、使用次数、点赞次数、热度值
- ✅ **申请审核**：支持需要申请才能使用的提示词组
- ✅ **Markdown 描述**：支持 Markdown 格式的提示词组描述（可插入链接）

**新增 API 接口（7 个）**：

**提示词组管理**：

- `POST /api/v1/prompt-groups` - 创建提示词组
- `GET /api/v1/prompt-groups` - 获取提示词组列表（支持筛选、排序、分页）
- `GET /api/v1/prompt-groups/:id` - 获取提示词组详情
- `PATCH /api/v1/prompt-groups/:id` - 更新提示词组
- `DELETE /api/v1/prompt-groups/:id` - 删除提示词组

**提示词组使用**：

- `GET /api/v1/prompt-groups/:id/parameters` - 获取提示词组所有参数
- `POST /api/v1/prompt-groups/:id/use` - 记录使用次数

**提示词组申请**：

- `POST /api/v1/prompt-groups/:id/apply` - 申请使用提示词组
- `GET /api/v1/prompt-groups/applications/my` - 获取我的申请列表
- `GET /api/v1/prompt-groups/applications/pending` - 获取待审核的申请列表
- `PATCH /api/v1/prompt-groups/applications/:id/review` - 审核申请

**提示词组互动**：

- `POST /api/v1/prompt-groups/:id/like` - 点赞提示词组
- `DELETE /api/v1/prompt-groups/:id/like` - 取消点赞

**新增数据表（5 个）**：

- `prompt_groups` - 提示词组表
- `prompt_group_items` - 提示词组项表
- `prompt_group_permissions` - 提示词组权限表
- `prompt_group_applications` - 提示词组申请表
- `prompt_group_likes` - 提示词组点赞表

**前端变更**：

**创建任务流程优化**：

- 新增三种提示词来源选择：
  1. **提示词组**：选择公开的提示词组，自动配置所有阶段的提示词
  2. **单个提示词**：从提示词市场选择（待实现）
  3. **自定义**：手动填写提示词 ID（原有功能）
- 提示词组选择界面：展示名称、描述、使用统计、点赞状态
- 自动记录提示词组使用次数

**技术实现**：

- 后端：NestJS + TypeORM
- 前端：React + TypeScript
- 类型定义：完整的 TypeScript 类型支持
- API 文档：已同步更新到 `API/28-一键成书系统.md`

**使用场景**：

1. 内容创作者可以创建专门针对某种类型小说（如玄幻、科幻）的提示词组
2. 用户可以直接使用经过验证的提示词组，无需逐个配置提示词
3. 提示词组创建者可以选择公开分享或私有使用
4. 支持需要申请才能使用的高级提示词组

---

## 2025-11-03 - 一键成书系统

### ✨ 新功能

#### 1. 一键成书系统 - AI 辅助创作完整流程

**功能描述**：
提供从想法到成书的完整 AI 辅助创作流程，包括 5 个渐进式阶段，支持用户在每个阶段介入优化。

**核心特性**：

- ✅ **多阶段渐进式生成**：5 个主要阶段（想法扩展 → 书名简介 → 大纲生成 → 正文生成 → 审稿优化）
- ✅ **结构化大纲管理**：三级大纲（大纲 → 卷纲 → 细纲）自动同步到作品
- ✅ **智能上下文关联**：自动关联人物卡、世界观、备忘录、前文梗概
- ✅ **实时进度追踪**：WebSocket 实时推送任务进度（章节 x/y）
- ✅ **用户自定义提示词**：使用提示词市场中的提示词，完全可配置
- ✅ **字数消耗控制**：精确记录每阶段消耗，创建前检查余额（最低 5 万字）
- ✅ **批量生成优化**：章节批量生成，支持并发控制（5 个并发）
- ✅ **任务状态管理**：支持暂停、恢复、取消

**新增 API 接口（16 个）**：

**任务管理（7 个）**：

- `POST /api/v1/book-creation/tasks` - 创建成书任务
- `GET /api/v1/book-creation/tasks/:taskId` - 获取任务详情
- `GET /api/v1/book-creation/tasks` - 获取任务列表
- `POST /api/v1/book-creation/tasks/:taskId/execute-stage` - 执行阶段
- `POST /api/v1/book-creation/tasks/:taskId/pause` - 暂停任务
- `POST /api/v1/book-creation/tasks/:taskId/resume` - 恢复任务
- `DELETE /api/v1/book-creation/tasks/:taskId` - 取消任务

**阶段优化（1 个）**：

- `POST /api/v1/book-creation/tasks/:taskId/stages/:stageType/optimize` - 优化阶段产出

**大纲管理（3 个）**：

- `GET /api/v1/book-creation/tasks/:taskId/outline` - 获取大纲树
- `PATCH /api/v1/book-creation/tasks/:taskId/outline-nodes/:nodeId` - 编辑大纲节点
- `POST /api/v1/book-creation/tasks/:taskId/outline/sync-to-novel` - 同步大纲到作品

**内容生成（2 个）**：

- `POST /api/v1/book-creation/tasks/:taskId/generate-chapters` - 批量生成章节
- `POST /api/v1/book-creation/tasks/:taskId/chapters/:chapterId/regenerate` - 重新生成章节

**审稿优化（2 个）**：

- `POST /api/v1/book-creation/tasks/:taskId/chapters/:chapterId/review` - 审稿章节
- `POST /api/v1/book-creation/tasks/:taskId/chapters/:chapterId/optimize` - 优化章节

**进度查询（1 个）**：

- `GET /api/v1/book-creation/tasks/:taskId/progress` - 获取任务进度

**WebSocket 事件**：

- `join_book_creation_room` - 加入任务房间（带权限验证）
- `leave_book_creation_room` - 离开任务房间
- `book_creation_progress` - 接收进度更新
  - `stage_started` - 阶段开始
  - `stage_progress` - 阶段进度（章节 x/y）
  - `stage_completed` - 阶段完成
  - `task_completed` - 任务完成
  - `error` - 错误通知

**数据库变更**：

- 新增 `book_creation_tasks` 表
  - 字段包含 `prompt_config` JSON（存储 10 个提示词 ID 配置）
- 新增 `book_creation_stages` 表
- 新增 `outline_nodes` 表
- `novels` 表新增字段：
  - `outline_data` - JSON 类型，存储完整大纲树
  - `creation_task_id` - 关联创建任务 ID
- `token_consumption_records` 表的 `source` 枚举新增 `book_creation`

**权限配置**：

新增权限（所有用户默认拥有）：

- `book_creation:task:create` - 创建成书任务
- `book_creation:task:view` - 查看任务详情
- `book_creation:stage:execute` - 执行阶段
- `book_creation:stage:optimize` - 优化阶段
- `book_creation:task:cancel` - 取消任务

管理员权限：

- `book_creation:admin:view_all` - 查看所有用户任务

**前端页面**：

- 新增 `/dashboard/book-creation` - 任务列表页
- 新增 `/dashboard/book-creation/new` - 创建任务页（含提示词配置）
- 新增 `/dashboard/book-creation/:taskId` - 任务详情页（含 WebSocket 实时更新）
- 侧边栏新增"一键成书"菜单项

**技术亮点**：

1. **提示词完全自定义** - 不绑定固定提示词，用户在创建任务时配置 10 个提示词 ID
2. **实时进度推送** - WebSocket 房间机制 + 完整权限验证 + 细粒度进度（章节 x/y）
3. **循环依赖处理** - 使用 forwardRef 处理 BookCreationModule 和 WebSocketModule 的循环依赖
4. **智能上下文构建** - 自动关联人物卡、世界观、备忘录、前文梗概
5. **批量并发控制** - 章节生成限制 5 个并发，避免资源耗尽

### 📝 相关文档

- [28-一键成书系统.md](./28-一键成书系统.md) - 完整 API 文档
- [README.md](../backend/src/book-creation/README.md) - 功能说明
- [PROMPT_INTEGRATION.md](../backend/src/book-creation/PROMPT_INTEGRATION.md) - 提示词集成
- [WEBSOCKET_INTEGRATION.md](../backend/src/book-creation/WEBSOCKET_INTEGRATION.md) - WebSocket 集成
- [已完成部分.md](../backend/src/book-creation/已完成部分.md) - 完成度详情

### ⚠️ 使用说明

1. **执行 SQL 迁移**：按顺序执行 5 个 SQL 文件（见 `backend/sql/一键成书系统_执行顺序.md`）
2. **创建提示词**：在提示词市场创建 10 个提示词，记录 ID
3. **配置任务**：创建任务时在 `promptConfig` 中传入提示词 ID
4. **执行流程**：按阶段执行，WebSocket 实时接收进度

### 🔧 Breaking Changes

无

---

## 2025-11-02 - 字体管理系统（服务器下发字体文件）

### ✨ 新功能

#### 1. 字体文件上传和管理

**功能描述**：
管理员可以上传字体文件到服务器，前端通过 @font-face 自动加载，确保所有用户都能看到相同的字体效果。

**核心特性**：

- ✅ 支持上传字体文件（.woff2, .woff, .ttf, .otf）
- ✅ 字体文件存储在服务器 `uploads/fonts/` 目录
- ✅ 前端动态生成 @font-face CSS 规则
- ✅ 自动预加载字体文件
- ✅ 浏览器缓存机制（首次慢，后续快）
- ✅ 所有用户字体效果完全一致

**新增接口**：

- `GET /api/v1/fonts/enabled` - 获取所有启用的字体（公开）
- `GET /api/v1/fonts` - 获取所有字体（管理员）
- `POST /api/v1/fonts/upload` - 上传字体文件（管理员）
- `PUT /api/v1/fonts/:id` - 更新字体信息（管理员）
- `POST /api/v1/fonts/:id/set-default` - 设置默认字体（管理员）
- `DELETE /api/v1/fonts/:id` - 删除字体（管理员）

**数据库变更**：

- 新增 `fonts` 表
- 存储字体文件路径、格式、大小等信息
- 支持系统字体和 Web 字体两种类型

**管理后台**：

- 新增"字体管理"页面
- 支持字体上传、编辑、启用/禁用、删除
- 实时显示字体文件大小和格式
- 可设置默认字体

#### 2. 字体动态加载系统

**前端工具**：`FontLoader` 类

**功能**：

- 动态生成 @font-face CSS 规则
- 使用 FontFaceSet API 预加载字体
- 字体加载状态检测
- 字体回退栈管理

**使用方式**：

```typescript
// 加载所有字体
await FontLoader.loadFonts(fonts);

// 获取字体 CSS 值
const fontFamily = FontLoader.getFontFamily(font);

// 应用到编辑器
style: `font-family: ${fontFamily};`;
```

#### 3. 字体类型支持

**系统字体** (`format: 'system'`):

- 无需文件，使用用户操作系统字体
- 使用字体回退栈确保跨平台兼容
- 示例：`PingFang SC, Microsoft YaHei, sans-serif`

**Web 字体** (`format: 'woff2'` 等):

- 从服务器下载字体文件
- 所有用户效果完全一致
- 支持 WOFF2（推荐）、WOFF、TTF、OTF

**权限配置**：

- `font:view` - 查看字体列表（管理员）
- `font:upload` - 上传字体（管理员）
- `font:update` - 更新字体信息（管理员）
- `font:delete` - 删除字体（管理员）

### 📝 文档更新

- 新增 [27-字体管理.md](./27-字体管理.md) API 文档
- 新增 [字体系统实现说明.md](../docs/字体系统实现说明.md)
- 包含完整的上传、管理、使用流程

---

## 2025-11-02 - 编辑器设置系统

### ✨ 新功能

#### 1. 编辑器个性化设置

**功能描述**：
新增用户级别的编辑器个性化配置功能，支持以下设置项：

- **字体设置**：自定义字体系列
- **字体大小**：12-32px 可调
- **行距**：1.0-3.0 倍可调
- **主题**：支持浅色、深色、跟随系统三种模式
- **段落格式**：段首空格数（0-10 个全角空格）
- **段间距**：段落间空行数（0-5 行）
- **自动保存**：开关及保存间隔（10-300 秒）
- **字数统计**：显示/隐藏字数统计

**新增接口**：

- `GET /api/v1/editor-settings` - 获取编辑器设置
- `POST /api/v1/editor-settings` - 创建/保存编辑器设置
- `PUT /api/v1/editor-settings` - 更新编辑器设置
- `POST /api/v1/editor-settings/reset` - 重置为默认设置
- `DELETE /api/v1/editor-settings` - 删除编辑器设置

**数据库变更**：

- 新增 `editor_settings` 表
- 每个用户只能有一个编辑器配置（userId 唯一索引）
- 级联删除：删除用户时自动删除其编辑器设置

**权限配置**：

- `editor-settings:view` - 查看编辑器设置（普通用户）
- `editor-settings:update` - 更新编辑器设置（普通用户）
- `editor-settings:reset` - 重置编辑器设置（普通用户）

**默认配置**：

- 字体：Microsoft YaHei, PingFang SC, SimSun, sans-serif
- 字体大小：16px
- 行距：1.8
- 主题：auto（跟随系统）
- 段首空格：2 个全角空格
- 段间空行：1 行
- 自动保存：开启（30 秒间隔）
- 字数统计：显示

#### 2. 智能默认配置

**功能描述**：
用户首次获取编辑器设置时，如果没有配置，系统会自动创建默认配置并返回。

**影响**：

- 新用户无需手动配置即可使用编辑器
- 所有用户都有一致的初始体验
- 简化前端逻辑，无需处理"无配置"的情况

### 📝 文档更新

- 新增 [26-编辑器设置.md](./26-编辑器设置.md) API 文档
- 包含完整的接口说明、字段描述、使用示例

---

## 2025-11-01 - 提示词举报自动下架与审核机制

### ✨ 新功能

#### 1. 举报通过自动下架提示词

**功能描述**：
当管理员审核举报并通过时，系统会自动执行以下操作：

- 将提示词状态改为 `draft`（草稿）
- 将 `isPublic` 设置为 `false`（不公开）
- 将 `needsReview` 设置为 `true`（需要管理员审核）

**影响**：

- 违规提示词会立即下架，无法在市场中展示
- 无法在生成时被调用
- 作者无法直接重新发布

#### 2. 提示词二次审核机制

**新增字段**：

- `prompts.needs_review` - 标记提示词是否需要管理员审核才能发布

**发布限制**：

- 被举报下架的提示词（`needsReview = true`），作者尝试发布时会被阻止
- 错误提示：「该提示词因违规被下架，需要管理员审核通过后才能重新发布，请联系管理员」

#### 3. 管理员审核通过接口

**新增接口**：

- `POST /api/v1/prompts/:id/approve` - 管理员审核通过提示词

**参数**：

- `autoPublish` (boolean, 可选) - 是否自动发布（默认 false）
- `reviewNote` (string, 可选) - 审核备注

**功能**：

- 如果 `autoPublish = true`：提示词将自动发布并公开
- 如果 `autoPublish = false`：仅解除审核限制，作者可以自行决定是否发布

#### 4. 通知增强

**新增通知类型**：

- `prompt-approved` - 管理员审核通过（通知提示词作者）

**更新通知内容**：

- 举报通过时，通知作者「您的提示词因违规已下架。如需重新发布，请修改后提交管理员审核。」

### 🔄 变更

#### 数据库变更

**新增字段**：

```sql
ALTER TABLE prompts
ADD COLUMN needs_review TINYINT(1) NOT NULL DEFAULT 0
COMMENT '是否需要管理员审核才能发布';
```

**迁移文件**：

- `backend/sql/add-prompt-needs-review.sql`

#### API 变更

**修改的接口**：

- `PATCH /api/v1/prompts/reports/:reportId/review` - 审核通过时自动下架提示词
- `PATCH /api/v1/prompts/:id` - 检查 `needsReview` 标记，限制发布

### 📝 文档更新

- `API/25-提示词举报系统.md` - 添加自动下架机制说明和审核通过接口文档
- `backend/src/prompts/entities/prompt.entity.ts` - 添加 `needsReview` 字段

### 🔐 权限说明

- `prompt:manage:all` - 管理员审核通过提示词的权限（复用现有权限）

### 💡 使用流程

1. **用户举报违规提示词** → 管理员收到举报
2. **管理员审核举报并通过** → 系统自动：
   - 下架提示词（status=draft, isPublic=false）
   - 保存违规内容快照（reviewSnapshot）
   - 标记需要审核（needsReview=true, reviewSubmittedAt=null）
   - 通知作者（提示词已下架）
   - **⚠️ 此时不通知管理员**，等作者修改后再通知
3. **作者修改提示词内容** → 修改后点击"提交审核"按钮
4. **系统设置提交时间** → `reviewSubmittedAt = 当前时间`
5. **系统通知管理员** → 发送汇总通知（"当前有 X 个提示词待审核"）
6. **管理员审核** → 查看详细对比（快照 vs 当前内容）
   - **通过**：解除审核限制，清除快照和时间戳，作者可发布（或自动发布）
   - **拒绝**：清除 `reviewSubmittedAt`，保持 `needsReview=true`，作者需要重新修改提交

### 🔔 通知优化

**提交审核通知机制**：

- ✅ **汇总通知**：多个用户提交审核时，管理员只收到一个汇总通知
- ✅ **实时统计**：通知内容显示当前总共有多少个待审核
- ✅ **避免轰炸**：不会一个一个发送，避免前端通知爆炸

---

## 2025-11-01 - 字数消耗系统修复

### 🐛 修复

#### 修复字数扣除未包含推理过程的严重问题

**问题描述**：

- 系统使用文本字符数统计，未使用 API 返回的真实 token 数
- Claude thinking 模式和 OpenAI o1 推理模式的推理过程 token 完全未被计费
- 造成用户占便宜，平台成本损失

**修复方案**：

- **非流式生成**：优先使用 API 返回的 `usage.prompt_tokens` 和 `usage.completion_tokens`
- **流式生成**：继续使用文本字符数统计（流式响应的技术限制）
- Token 数转换为字符数使用 `tokenToChars()` 方法（1 token ≈ 2.5 字符）
- 当 API 未返回 usage 时，降级使用文本字符数统计

**影响范围**：

- ✅ 修复了 Claude thinking 模式的计费问题
- ✅ 修复了 OpenAI o1 系列推理模式的计费问题
- ⚠️ 流式生成仍然可能无法完整计费推理过程（建议精确计费场景使用非流式）

**相关文件**：

- `backend/src/generation/services/writing-generation.service.ts`
- `backend/src/token-balances/services/character-counter.service.ts`
- `API/21-字数消耗系统.md`

---

## 2025-01-XX - 提示词举报系统

### ✨ 新功能

#### 1. 提示词举报功能

- **用户举报**：用户可以举报违规的提示词
  - `POST /api/v1/prompts/reports/:promptId` - 举报提示词
  - `GET /api/v1/prompts/reports/my` - 查询我的举报记录
  - 支持多种举报原因：垃圾信息、不当内容、暴力内容、仇恨言论、色情内容、版权侵犯、欺诈内容等

#### 2. 后台审核功能

- **管理员审核**：管理员可以审核举报记录
  - `GET /api/v1/prompts/reports` - 查询所有举报列表（管理员）
  - `PATCH /api/v1/prompts/reports/:reportId/review` - 审核举报（管理员）
  - `DELETE /api/v1/prompts/reports/:reportId` - 删除举报记录（管理员）
  - `GET /api/v1/prompts/reports/stats/:promptId` - 获取提示词的举报统计（管理员）

#### 3. 提示词封禁功能

- **封禁管理**：管理员可以封禁/解封违规提示词
  - `POST /api/v1/prompts/:id/ban` - 封禁提示词（管理员）
  - `POST /api/v1/prompts/:id/unban` - 解封提示词（管理员）
  - WebSocket 通知：`prompt:banned` - 提示词被封禁时实时通知作者
  - WebSocket 通知：`prompt:unbanned` - 提示词解封时实时通知作者

#### 4. 批量管理功能

- **批量操作**：用户可以批量管理自己的提示词
  - `POST /api/v1/prompts/batch-update` - 批量更新提示词（公开性、内容公开性、申请要求等）
  - `GET /api/v1/prompts/admin/all` - 获取所有提示词列表（管理员）

### 📊 数据库变更

#### 新增表

- `prompt_reports` - 提示词举报记录表

#### 修改表

- `prompts` 表新增字段：
  - `is_banned` (boolean) - 是否被封禁
  - `banned_reason` (text) - 封禁原因
  - `banned_at` (datetime) - 封禁时间

### 🔐 权限配置

#### 新增权限

- `prompt:report` - 举报提示词（普通用户）
- `prompt:report:view` - 查看自己的举报记录（普通用户）
- `prompt:batch_update` - 批量更新提示词（普通用户）
- `prompt:report:review` - 审核举报（管理员）
- `prompt:ban` - 封禁提示词（管理员）
- `prompt:unban` - 解封提示词（管理员）

### 💡 功能说明

1. **举报流程**：用户举报 → 管理员审核 → 批准/驳回
2. **封禁通知**：封禁/解封操作会通过 WebSocket 实时通知提示词作者
3. **批量管理**：用户可以批量设置多个提示词的属性，管理员可以批量管理所有提示词
4. **权限控制**：普通用户只能举报和管理自己的提示词，管理员拥有完整的审核和封禁权限

---

## 2025-10-31 - 创意工坊：聊天历史分类筛选

### ✨ 新功能

#### 1. 聊天历史支持按提示词分类筛选

- **功能**: 创意工坊中每个功能模块（书名、人物等）拥有独立的生成历史
- **数据库**: `chat_histories` 表新增 `category_id` 字段
- **API**:
  - 创建聊天时可传入 `categoryId`
  - 查询历史时可按 `categoryId` 筛选

### 🐛 修复

#### 1. 修复创意工坊提示词选择逻辑

**问题**：Dashboard 创意工坊选择提示词后，状态被重置，配置区域不显示

**根本原因**：

- `WorkshopGeneratorPage` 的 `useEffect` 依赖了 `showError` 和 `navigate` 函数
- 这些函数每次渲染都是新引用，导致不断重新加载 `category`
- `category` 对象引用改变导致 ChatTab 重新挂载，所有状态重置

**修复方案**：

- 移除 `showError` 和 `navigate` 依赖，只依赖 `categoryId`
- 为 ChatTab 添加稳定的 `key` 属性

**影响文件**：

- `frontend/src/pages/creative-workshop/WorkshopGeneratorPage.tsx`
- `frontend/src/pages/editor/components/ai-assistant/ChatTab.tsx`

#### 2. 修复历史记录查询逻辑 - 分类隔离

**问题**：创意工坊对话会出现在"普通对话"列表中

**修复**：

- 查询普通对话（`novelId=x`）时，自动排除 `categoryId IS NOT NULL` 的记录
- 查询条件：`novelId=x AND categoryId IS NULL`
- 创意工坊对话只出现在对应分类的历史记录中
- 首页创意工坊和编辑器创意工坊的历史记录共通

**影响文件**：

- `backend/src/chat-histories/services/chat-histories.service.ts`
- `frontend/src/services/chat-histories.api.ts`
- `API/16-会话管理.md`

#### 3. 修复分类切换时消息清空

**问题**：从普通对话切换到创意工坊时，普通对话的消息会带入

**修复**：

- 监听 `fixedCategoryId` 变化
- 当分类 ID 改变时，清空消息和重置状态

**影响文件**：

- `frontend/src/pages/editor/components/ai-assistant/ChatTab.tsx`

#### 2. 查询参数扩展

**接口**: `GET /api/v1/chat-histories`

**新增参数**:

- `categoryId`: 按提示词分类 ID 筛选

**使用场景**:

```bash
# 场景1：书名生成器的历史
GET /api/v1/chat-histories?categoryId=5

# 场景2：某作品下书名生成的历史
GET /api/v1/chat-histories?novelId=123&categoryId=5

# 场景3：所有历史（不筛选）
GET /api/v1/chat-histories
```

#### 3. 前端界面优化

- **历史记录标题**: 显示分类名称（如"书名生成器"）
- **AI 助手工坊**: 历史记录模态窗移到最外层
- **智能筛选**:
  - 普通对话模式：显示所有历史
  - 创意工坊模式：只显示该分类的历史

### 📝 修改文件

**后端**:

- ✅ `backend/sql/05_add_category_id_to_chat_histories.sql` - 数据库迁移
- ✅ `backend/src/chat-histories/entities/chat-history.entity.ts` - 添加 categoryId 字段
- ✅ `backend/src/chat-histories/dto/create-chat.dto.ts` - 支持传入 categoryId
- ✅ `backend/src/chat-histories/dto/query-chats.dto.ts` - 支持 categoryId 筛选
- ✅ `backend/src/chat-histories/services/chat-histories.service.ts` - 实现分类筛选逻辑

**前端**:

- ✅ `frontend/src/services/chat-histories.api.ts` - API 添加 categoryId 参数
- ✅ `frontend/src/pages/editor/components/ai-assistant/ChatHistoryModal.tsx` - 支持显示分类名称
- ✅ `frontend/src/pages/editor/components/ai-assistant/AIAssistantPanel.tsx` - 历史记录移到最外层
- ✅ `frontend/src/pages/editor/components/ai-assistant/GeneratorInterface.tsx` - 传递分类信息
- ✅ `frontend/src/pages/creative-workshop/WorkshopGeneratorPage.tsx` - Dashboard 模式支持

**文档**:

- ✅ `API/16-会话管理.md` - 添加创意工坊场景说明
- ✅ `backend/docs/CREATIVE_WORKSHOP_BACKEND_REQUIREMENTS.md` - 技术实现文档

### 🎯 功能效果

用户在创意工坊的每个功能模块中：

- 📚 书名生成器 → 只显示书名相关的历史
- 👤 人物生成器 → 只显示人物相关的历史
- 📖 情节生成器 → 只显示情节相关的历史

同时在普通对话模式中不受影响，继续显示全部历史。

---

## 2025-10-30 - 新增页脚配置功能

### ✨ 新功能

#### 1. 页脚联系方式管理

- **功能**: 在系统配置中添加页脚配置，支持 QQ 群和微信二维码的展示
- **图片上传**: 管理后台提供一键上传功能，无需手动填写 URL
- **配置项**:
  - `qq_group_image`: QQ 群二维码图片 URL
  - `qq_group_number`: QQ 群号
  - `wechat_image`: 微信二维码图片 URL
  - `wechat_text`: 微信说明文字
  - `show_qq`: 是否显示 QQ 群
  - `show_wechat`: 是否显示微信
- **特点**:
  - 所有配置项都是公开的（`isPublic=true`），前端可直接访问
  - 支持图片相对路径（如 `/uploads/footer/qq.png`）或完整 URL
  - 可单独控制显示/隐藏

#### 2. Footer 组件实现

- **位置**: `frontend/src/components/common/Footer.tsx`
- **功能**:
  - 支持两种显示模式：页面底部模式和侧边栏模式
  - 页面底部模式：完整展示 QQ 群和微信二维码，带 hover 效果
  - 侧边栏模式：紧凑显示，点击展开二维码弹窗
  - 图片加载失败时自动显示占位图
- **集成位置**:
  - 前台首页（Home 页面）：页脚底部完整展示
  - Dashboard 侧边栏：紧凑模式，底部固定显示

#### 3. 管理后台配置界面

- **位置**: `admin/src/pages/system-settings/SystemSettings.tsx`
- **功能**: 新增"页脚配置"标签页，支持配置所有页脚相关参数
- **图片上传**:
  - 点击"选择图片"按钮上传二维码
  - 支持格式：JPG、PNG、WebP（最大 2MB）
  - 实时预览上传的图片
  - 自动填充图片 URL
  - 也可手动输入外部图片 URL

#### 4. 后端图片上传接口

- **接口**: `POST /api/v1/system-settings/upload/footer`
- **功能**: 上传页脚图片到服务器
- **限制**:
  - 格式：JPG、JPEG、PNG、WebP
  - 大小：最大 2MB
  - 推荐尺寸：200x200 像素
- **返回**: 图片访问 URL

**新增文件**:

- ✅ `backend/sql/add_footer_settings.sql` - 页脚配置初始化 SQL
- ✅ `backend/src/system-settings/controllers/upload.controller.ts` - 图片上传控制器
- ✅ `frontend/src/services/system-settings.api.ts` - 前端系统配置 API 服务
- ✅ `frontend/src/components/common/Footer.tsx` - 页脚组件
- ✅ `admin/src/api/upload.ts` - 管理后台图片上传 API

**修改文件**:

- ✅ `frontend/src/pages/home/Home.tsx` - 集成页脚组件
- ✅ `frontend/src/pages/dashboard/Dashboard.tsx` - 在侧边栏底部添加联系方式
- ✅ `admin/src/pages/system-settings/SystemSettings.tsx` - 添加页脚配置标签页和图片上传功能
- ✅ `backend/src/system-settings/system-settings.module.ts` - 注册上传控制器
- ✅ `API/09-系统配置管理.md` - 更新文档，添加页脚配置和图片上传说明

**使用指南**:

1. 登录管理后台
2. 进入"系统配置" → "页脚配置"
3. 点击"选择图片"按钮上传二维码（或手动输入 URL）
4. 填写 QQ 群号和微信说明（可选）
5. 保存配置
6. 前台首页和 Dashboard 侧边栏将自动显示

---

## 2025-10-30 - 修复邀请系统 bug

### 🐛 Bug 修复

#### 1. 邀请奖励未发放

- **问题**: 使用邀请码注册后，被邀请人和邀请人都未收到字数奖励
- **根本原因**: 在数据库事务中调用 `tokenBalancesService.recharge()` 方法，而该方法内部也创建了新事务，导致**事务嵌套冲突**
- **解决方案**: 将奖励发放逻辑移到事务外部执行

  ```typescript
  // ❌ 错误：在事务内调用包含事务的方法
  await this.dataSource.transaction(async (manager) => {
    await this.tokenBalancesService.recharge(...); // recharge 内部也有事务
  });

  // ✅ 正确：先完成事务，再调用包含事务的方法
  const invitationId = await this.dataSource.transaction(async (manager) => {
    // 只创建记录
    return savedInvitation.id;
  });
  await this.tokenBalancesService.recharge(...); // 事务外执行
  ```

#### 2. 新用户邀请码未生成

- **问题**: 新注册用户的 `inviteCode` 字段为空
- **根本原因**: 邀请码在用户保存后通过 `update` 操作设置，但后续流程中使用的 `savedUser` 对象未包含新设置的邀请码
- **解决方案**: 在创建用户对象时就生成并设置邀请码

  ```typescript
  // ❌ 错误：先保存后更新
  const savedUser = await this.userRepository.save(user);
  const inviteCode = await this.generateInviteCode();
  await this.userRepository.update(savedUser.id, { inviteCode });

  // ✅ 正确：创建时就包含邀请码
  const inviteCode = await this.generateInviteCode();
  const user = this.userRepository.create({
    ...otherFields,
    inviteCode, // 直接设置
  });
  const savedUser = await this.userRepository.save(user);
  ```

**修改文件**:

- ✅ `backend/src/auth/auth.service.ts` - 修复事务嵌套和邀请码生成，添加调试日志
- ✅ `backend/scripts/check-invitation-rewards.sql` - 诊断 SQL 脚本
- ✅ `backend/scripts/check-user-invite-fields.sql` - 检查用户邀请字段
- ✅ `backend/scripts/test-update-invited-by-code.sql` - 测试更新逻辑
- ✅ `backend/scripts/fix-missing-invite-codes.sql` - 修复 SQL 脚本
- ✅ `backend/src/common/scripts/fix-invite-codes.ts` - 批量修复脚本

**修复已存在用户**:

```bash
# 批量为缺失邀请码的用户生成邀请码
npm run ts-node src/common/scripts/fix-invite-codes.ts
```

**防刷机制**:

- ✅ IP 限制：同一 IP 1 小时内最多注册 3 次
- ✅ Guard 实现：`RegisterRateLimitGuard`（需配置 Redis）
- ✅ 邮箱验证：建议延迟发放奖励直到邮箱验证
- 📖 详细策略：`backend/src/auth/strategies/anti-abuse.strategy.md`

**影响范围**:

- ✅ 新注册用户现在可以正常获得邀请奖励（被邀请人 8 万字，邀请人 8 千字）
- ✅ 新注册用户现在可以正常生成邀请码
- ✅ IP 限制防止恶意刷号（不限制邀请次数）
- ⚠️ 已注册但未收到奖励的用户需要联系管理员手动补发

---

## 2025-10-29 - 调整每日免费字数额度

### 🔧 配置调整

#### 每日免费字数额度从 5 万 调整为 1 万

- **影响范围**: 所有新用户和老用户
- **调整内容**:
  - 新用户注册每日免费额度：~~5 万字~~ → **1 万字**
  - 老用户兜底额度：~~5 万字~~ → **1 万字**
  - 初始化脚本默认值：~~5 万字~~ → **1 万字**

**修改文件**:

- ✅ `backend/src/auth/auth.service.ts` - 新用户注册奖励
- ✅ `backend/src/token-balances/services/token-balances.service.ts` - 老用户兜底逻辑（两处）
- ✅ `backend/src/common/scripts/init-user-balances.ts` - 批量初始化脚本（两处）
- ✅ `admin/src/components/forms/TokenRechargeModal.tsx` - 管理员设置每日额度默认值
- ✅ `API/01-认证模块.md` - API 文档
- ✅ `API/CHANGELOG.md` - 更新日志
- ✅ `backend/src/token-balances/USER_BALANCE_MIGRATION.md` - 迁移文档

**重置机制**（不变）:

- ✅ 每日 0 点自动重置已用额度
- ✅ 首次 AI 请求时自动检查并重置
- ✅ 跨天访问自动触发重置

**注册赠送**（不变）:

- ✅ 新用户仍赠送 50 万字数（一次性）
- ✅ 每日免费额度独立计算，每天自动刷新

---

## 2025-01-26 - WebSocket 实时推送系统完整实现

### ⚠️ 重要修复

#### 前后端协议统一

- **问题**: 前端使用原生 WebSocket，后端使用 Socket.IO，协议不兼容导致无法通信
- **修复**: 前端改用 `socket.io-client`，与后端 Socket.IO 协议统一
- **影响**: 现在前后端可以正常通信，实时通知功能完全可用

### ✨ 新增功能

#### WebSocket 实时推送系统

- **功能**: 提供实时双向通信能力，支持公告推送、系统通知、在线状态等
- **端点**: Socket.IO 连接（自动选择 WebSocket 或 Polling）
- **协议**: Socket.IO
- **文档**: [WebSocket API 文档](./22-WebSocket实时推送.md)

**核心特性**:

- ✅ **JWT 认证**: 连接时验证 Token，确保安全性
- ✅ **权限检查**: 根据用户角色推送不同内容
- ✅ **速率限制**: 防止恶意客户端频繁发送消息（60 条/分钟）
- ✅ **消息节流**: 频繁推送时自动节流和批量处理
- ✅ **XSS 防护**: 所有推送内容自动过滤危险代码
- ✅ **自动重连**: 客户端断线自动重连（最多 5 次）
- ✅ **心跳保活**: 定期心跳保持连接活跃（30 秒）
- ✅ **多端支持**: 同一用户可同时在线多个设备
- ✅ **在线管理**: 实时统计在线用户和连接数

**推送策略**:

1. **全部用户** (`all`): 广播给所有在线用户
2. **指定用户** (`user`): 推送给指定用户 ID 列表
3. **指定角色** (`role`): 推送给拥有指定角色的用户
4. **指定会员** (`membership`): 推送给指定会员等级的用户

**消息类型**:

- `connection:success`: 连接成功
- `ping/pong`: 心跳保活
- `error`: 错误消息
- `announcement:new`: 新公告推送
- `announcement:update`: 公告更新
- `announcement:delete`: 公告删除
- `notification:new`: 新通知
- `chat:message`: 聊天消息
- `users:online`: 在线用户列表

**性能优化**:

- **消息节流**: 2 秒内最多推送 10 条，自动批量处理
- **批量推送**: 大于 10 个用户时自动分批，避免服务器压力
- **增量更新**: 只推送变化的数据，减少带宽
- **消息压缩**: 使用 Socket.IO 自带压缩，节省带宽

**安全措施**:

- **Token 验证**: 每次连接验证 JWT，过期自动断开
- **权限检查**: 推送前检查用户权限，防止越权
- **速率限制**: 超出限制返回错误，记录日志
- **XSS 防护**: 移除危险标签和属性，保留安全 HTML
- **连接管理**: 定期清理超时连接（5 分钟无心跳）

**集成到公告系统**:

- 发布公告时自动推送（`isPush=true` 且 `isPopup=true`）
- 支持手动推送已发布的公告
- 根据目标类型智能推送（全部/用户/角色/会员）
- 推送前自动 XSS 过滤，确保安全

**模块结构**:

```
backend/src/websocket/
├── guards/
│   └── ws-jwt-auth.guard.ts           # JWT认证守卫
├── services/
│   ├── websocket-client.service.ts    # 客户端管理
│   ├── websocket-rate-limit.service.ts # 速率限制
│   ├── websocket-throttle.service.ts  # 消息节流
│   └── websocket-xss-filter.service.ts # XSS防护
├── interfaces/
│   └── websocket-message.interface.ts # 消息接口
├── dto/
│   └── websocket.dto.ts               # DTO定义
├── websocket.gateway.ts               # WebSocket Gateway
├── websocket.module.ts                # WebSocket模块
└── README.md                          # 模块文档
```

**相关 API**:

- `POST /api/v1/announcements/:id/push` - 手动推送公告（需要权限）

**性能指标**:

- 单服务器支持: 10,000+ 并发连接
- 消息延迟: < 100ms
- 重连时间: < 3 秒
- 内存占用: 每个连接约 10KB

### 📝 文档更新

- ✅ 新增 [WebSocket 实时推送 API 文档](./22-WebSocket实时推送.md)
- ✅ 新增 [WebSocket 模块 README](../backend/src/websocket/README.md)
- ✅ 前端已有 [WebSocket 使用指南](../frontend/src/services/WEBSOCKET_GUIDE.md)

---

## 2025-01-26 - 前端公告系统集成（支持 WebSocket 实时推送）

### ✨ 新增功能

#### 公告系统前端实现（两种显示方式 + WebSocket 实时推送）

- **功能**: 提供模态窗和 Toast 两种公告显示方式，支持 WebSocket 实时推送
- **实现**:
  1. 创建公告类型定义（`types/announcement.ts`）
  2. 创建公告 API 服务（`services/announcements.api.ts`）
  3. 创建公告按钮组件（`AnnouncementButton.tsx`）
  4. 创建公告模态窗组件（`AnnouncementModal.tsx`）- 用户主动查看
  5. 创建 Toast 通知组件（`AnnouncementToast.tsx`）- 自动弹出
  6. 集成到 Dashboard 布局

**核心功能**:

- ✅ **未读数量提醒**: 右上角公告按钮显示未读数量气泡（红色，超过 9 显示"9+"）
- ✅ **响应式设计**: 完美适配 PC、平板、手机三端
- ✅ **公告列表**: 桌面端左侧列表 + 右侧详情，移动端下拉选择
- ✅ **公告详情**: 支持 HTML 内容、链接跳转、阅读标记
- ✅ **自动刷新**: 每 5 分钟自动刷新未读数量
- ✅ **类型图标**: 根据公告级别显示不同颜色和图标（info/success/warning/error）
- ✅ **状态标签**: 置顶、未读等状态标签
- ✅ **Toast 通知**: 右上角自动弹出，支持自动关闭（5 秒）或手动关闭
- ✅ **WebSocket 实时推送**: 后端发布公告后，前端立即接收并显示

**WebSocket 实时推送**:

- 用户登录后自动建立 WebSocket 连接
- 后端发布新公告时推送 `announcement:new` 事件
- Toast 组件实时接收并显示新公告
- 自动重连机制（最多 5 次，指数退避）
- 心跳保活（30 秒一次）
- 用户退出时自动断开连接

**两种显示方式**:

1. **模态窗（Modal）**:

   - 用户点击公告按钮主动查看
   - 显示所有有效公告（`isActive = true`）
   - 完整内容展示，支持 HTML 渲染
   - 左右分栏（PC）或下拉选择（手机）

2. **Toast 通知（自动弹出）**:
   - 页面加载时自动显示 `isPopup = true` 的公告
   - 右上角小窗口，多个堆叠显示
   - 标题+摘要，适合简短提醒
   - 不需要确认阅读的公告 5 秒后自动关闭（带进度条）
   - 需要确认阅读的公告必须手动关闭

**响应式特性**:

- **PC 端**: 左右分栏布局，列表 + 详情
- **平板端**: 保持 PC 布局，宽度自适应
- **手机端**: 下拉选择公告，全屏详情显示

**用户体验**:

- 点击公告按钮打开模态窗
- 选择公告自动标记为已读（如果需要）
- 点击链接自动追踪点击统计
- 关闭模态窗自动刷新未读数量

**技术实现**:

- 使用 Tailwind CSS 响应式断点（`md:`, `sm:`, `lg:`）
- 组件化设计，代码清晰可维护
- TypeScript 类型安全
- 与后端公告系统 API 完美对接

**相关文件**:

- `frontend/src/types/announcement.ts` - 类型定义
- `frontend/src/services/announcements.api.ts` - API 服务
- `frontend/src/services/websocket.ts` - WebSocket 服务（核心）
- `frontend/src/contexts/WebSocketContext.tsx` - WebSocket 上下文
- `frontend/src/components/announcements/AnnouncementButton.tsx` - 公告按钮
- `frontend/src/components/announcements/AnnouncementModal.tsx` - 公告模态窗
- `frontend/src/components/announcements/AnnouncementToast.tsx` - Toast 通知（支持 WebSocket）
- `frontend/src/components/announcements/README.md` - 使用文档
- `frontend/src/pages/dashboard/Dashboard.tsx` - 集成到布局
- `frontend/src/App.tsx` - WebSocket Provider 集成

**后端 API 依赖**:

- `GET /api/v1/announcements/active` - 获取有效公告（模态窗）
- `GET /api/v1/announcements/popup` - 获取需要弹窗的公告（Toast）
- `GET /api/v1/announcements/unread-count` - 获取未读数量
- `GET /api/v1/announcements/:id` - 获取公告详情
- `POST /api/v1/announcements/:id/read` - 标记已读（支持 needClick 参数）

**后端 WebSocket 需求**:

- `WebSocket /ws?token=<accessToken>` - WebSocket 连接端点
- 发送事件类型：`announcement:new` - 新公告发布时推送
- 消息格式：`{ type: 'announcement:new', data: Announcement }`
- 需要支持 JWT Token 认证
- 需要支持心跳（`ping` 消息）

---

## 2025-01-26 - 提示词权限管理显示申请列表

### ✨ 新增功能

#### 我的提示词列表添加申请数量气泡提醒

- **功能**: 在"我的提示词"列表的权限管理按钮右上角显示待审核申请数量气泡
- **实现**:
  1. 后端在 `findMyPrompts` 方法中批量查询每个提示词的待审核申请数量
  2. 添加 `getBatchPendingApplicationsCounts` 私有方法高效查询
  3. 将 `pendingApplicationsCount` 字段注入到提示词对象中
  4. 前端在权限管理按钮上显示红色数字气泡（超过 9 显示"9+"）

**效果**:

- ✅ 作者可以一眼看到哪些提示词有待审核申请
- ✅ 显示具体申请数量（1-9 显示数字，10+显示"9+"）
- ✅ 红色气泡醒目提醒
- ✅ 性能优化：批量查询，避免 N+1 问题

**相关文件**:

- `backend/src/prompts/entities/prompt.entity.ts` - 添加动态字段声明
- `backend/src/prompts/services/prompts.service.ts` - 添加批量查询待审核申请数量
- `frontend/src/types/prompt.ts` - 添加 pendingApplicationsCount 字段
- `frontend/src/pages/prompts/MyPrompts.tsx` - 显示气泡提醒

**重要说明**: 在 Prompt 实体类中必须声明 `isLiked`、`isFavorited`、`pendingApplicationsCount` 这些动态字段，否则 TypeScript 序列化时会过滤掉它们。

---

### 🐛 Bug 修复

#### 权限管理页面未显示申请列表

- **问题**: 用户提交提示词使用申请后，作者在权限管理页面看不到申请记录
- **原因**: `PromptPermissions.tsx` 页面只显示已授权用户（`permissions`），没有显示申请列表（`applications`）
- **修复**:
  1. 添加 Tab 切换：申请列表 + 已授权用户
  2. 在"申请列表" Tab 中显示所有申请记录（待审核、已通过、已拒绝）
  3. 为待审核申请添加"通过"和"拒绝"审核按钮
  4. 显示待审核申请数量徽章
  5. 页面默认打开"申请列表" Tab

**新增功能**:

- ✅ 申请列表展示（支持移动端和桌面端）
- ✅ 一键审核（通过/拒绝，可填写拒绝理由）
- ✅ 申请状态标签（待审核/已通过/已拒绝）
- ✅ 待审核数量提醒（红色徽章）

**相关文件**:

- `frontend/src/pages/prompts/PromptPermissions.tsx` - 添加申请列表功能

---

## 2025-01-26 - 注册接口支持密码确认和昵称

### 🐛 Bug 修复

#### 修复注册接口数据验证错误

- **问题**: 前端发送 `nickname` 和 `confirmPassword` 字段时报错 "property should not exist"
- **原因**: `RegisterDto` 缺少这两个字段的定义
- **修复**:
  1. 在 `RegisterDto` 中添加 `confirmPassword`（必填）和 `nickname`（可选）字段
  2. 在 `AuthService.register` 方法中验证两次密码一致性
  3. 注册时保存昵称，默认使用用户名

**字段定义**:

```typescript
@ApiProperty({
  description: '确认密码（必须与密码一致）',
  minLength: 8,
  maxLength: 32,
})
confirmPassword: string;

@ApiPropertyOptional({
  description: '昵称（可选）',
  maxLength: 50,
})
nickname?: string;
```

**相关文件**:

- `backend/src/auth/dto/register.dto.ts` - 添加字段定义
- `backend/src/auth/auth.service.ts` - 添加密码验证和昵称保存
- `API/01-认证模块.md` - 更新接口文档

#### 修复登录/注册/profile 接口返回 nickname 字段

- **问题**: `/api/v1/auth/profile`、登录和注册接口响应中缺少 `nickname` 字段
- **修复**:
  1. 在 `AuthResponse` 接口的 user 对象中添加 `nickname` 字段
  2. 在 `auth.service.ts` 的 `generateTokens` 方法中返回 `nickname`
  3. 在 `auth.controller.ts` 的 `getProfile` 方法中返回 `nickname`

**相关文件**:

- `backend/src/auth/interfaces/auth-response.interface.ts` - 添加类型定义
- `backend/src/auth/auth.service.ts` - 登录/注册响应中返回 nickname
- `backend/src/auth/auth.controller.ts` - profile 接口返回 nickname

---

## 2025-01-26 - AI 写作生成集成字数消耗

### ✨ 新增功能

#### AI 写作生成自动扣费

- **模块**: `backend/src/generation/`
- **功能**: AI 写作生成成功后自动扣除字数

**扣费规则**:

- ✅ 生成成功后自动扣费
- ✅ 内容被安全策略截断（`finishReason: content_filter`）仍需付费
- ❌ 无效请求（参数错误、权限不足）不扣费

**实现细节**:

- 在 `GenerationModule` 导入 `TokenBalancesModule`
- 在 `WritingGenerationService` 注入 `TokenConsumptionService` 和 `CharacterCounterService`
- 在非流式生成完成后，计算输入输出字符数并调用消耗服务
- 在响应中返回 `consumption` 字段

**响应新增字段**:

```typescript
consumption: {
  totalCost: number; // 总消耗字数
  inputCost: number; // 输入消耗字数
  outputCost: number; // 输出消耗字数
  usedDailyFree: number; // 使用的每日免费额度
  usedPaid: number; // 使用的付费额度
  memberBenefitApplied: boolean; // 是否应用会员特权
}
```

**相关文件**:

- `backend/src/generation/generation.module.ts` - 导入 TokenBalancesModule
- `backend/src/generation/services/writing-generation.service.ts` - 实现扣费逻辑
- `backend/src/generation/dto/generation-response.dto.ts` - 添加 consumption 字段
- `API/21-AI生成系统.md` - 更新 API 文档，添加字数消耗说明

**注意事项**:

- 流式生成暂未实现字数扣费（需要收集所有流式输出块后才能计算）
- 余额不足时会抛出异常，生成不会执行
- 字数扣费失败会记录日志，但不影响返回结果（除非是业务异常如余额不足）

---

## 2025-01-26 - 新用户注册奖励

### ✨ 新增功能

#### 新用户注册自动发放字数奖励

- **模块**: `backend/src/auth/`
- **功能**: 新用户注册时自动发放字数奖励和每日免费额度

**奖励规则**:

- 🎁 注册即送 **50 万字数**（giftTokens）
- 🎁 每日免费 **1 万字数**（dailyFreeQuota，每日自动重置）

**实现细节**:

- 在 `AuthService.register` 方法中，用户创建成功后自动调用 `TokenBalancesService`
- 创建用户字数余额记录
- 发放 50 万赠送字数（类型：`register_gift`）
- 设置每日免费额度 1 万字数
- 注册奖励失败不影响注册流程（容错处理）

**相关文件**:

- `backend/src/auth/auth.module.ts` - 导入 TokenBalancesModule
- `backend/src/auth/auth.service.ts` - 注入 TokenBalancesService 并实现奖励逻辑
- `API/01-认证模块.md` - 更新注册接口文档

#### 新增管理员接口：手动重置每日免费额度

- **模块**: `backend/src/token-balances/`
- **功能**: 管理员可手动重置单个或所有用户的每日免费额度

**新增 API 接口**:

- `POST /api/v1/token-balances/admin/reset-daily-quota/:userId` - 重置指定用户的每日免费额度
- `POST /api/v1/token-balances/admin/reset-all-daily-quotas` - 批量重置所有用户的每日免费额度

**调用说明**:

- `resetDailyQuota(userId)` - 现在可通过管理员 API 调用
- 定时任务每天凌晨 00:00 自动执行批量重置
- 消耗字数时会自动检查并重置（实时保障）

**相关文件**:

- `backend/src/token-balances/controllers/token-balances.controller.ts` - 新增两个管理员接口
- `API/21-字数消耗系统.md` - 更新管理端接口文档

---

## 2025-01-25 - 字数消耗系统

### ✨ 新增功能

#### 基于模型倍率的字数消耗计算系统

- **模块**: `backend/src/token-balances/`
- **功能**: 实现完整的字数消耗计算、每日免费额度管理、会员特权支持

**核心规则**:

- ✅ 消耗公式：`消耗字数 = (输入字符数 ÷ 输入倍率) + (生成字符数 ÷ 输出倍率)`
- ✅ 优先使用每日免费额度，用完后自动使用付费额度
- ✅ 输入少于 10000 字符不消耗输入字数
- ✅ 免费模型无额度消耗
- ✅ 会员输出完全免费 + 会员输入部分免费

**新增服务**:

- `CharacterCounterService` - 字符数统计和 Token 转换
- `TokenConsumptionService` - 消耗计算和余额扣除
- `DailyQuotaResetTask` - 每日额度重置定时任务

**新增 DTO**:

- `ConsumptionParamsDto` - 消耗参数
- `ConsumptionResultDto` - 消耗结果
- `QueryConsumptionDto` - 查询消耗记录
- `ConsumptionStatsDto` - 消耗统计

**新增权限**:

```typescript
export const TOKEN_CONSUMPTION_PERMISSIONS = {
  VIEW_RECORDS: "token-consumption:view-records",
  VIEW_STATISTICS: "token-consumption:view-statistics",
  ADMIN_MANAGE: "token-consumption:admin-manage",
  RESET_QUOTA: "token-consumption:reset-quota",
} as const;
```

**新增 API 接口**:

- `GET /api/v1/token-balances/daily-quota` - 查询每日免费额度
- `GET /api/v1/token-balances/consumptions` - 查询消耗记录（分页）
- `GET /api/v1/token-balances/statistics` - 查询消耗统计
- `POST /api/v1/token-balances/:userId/daily-quota` - 设置用户每日免费额度（管理员）
- `POST /api/v1/token-balances/admin/reset-daily-quotas` - 手动重置所有用户每日额度（管理员）

**API 响应变更**:

- `POST /api/v1/chat/completions` - 响应新增 `consumption` 字段
- `POST /api/v1/generation/writing` - 响应新增 `consumption` 字段

### 🗄️ 数据库变更

**ai_models 表新增字段**:

- `input_ratio` DECIMAL(8,2) - 输入倍率（默认 1.0）
- `output_ratio` DECIMAL(8,2) - 输出倍率（默认 1.0）
- `is_free` BOOLEAN - 是否为免费模型（默认 false）
- `min_input_chars` INT - 最小消耗输入字符数（默认 10000）

**user_token_balances 表新增字段**:

- `daily_free_quota` BIGINT - 每日免费额度
- `daily_used_quota` BIGINT - 今日已用免费额度
- `quota_reset_date` DATE - 额度重置日期
- `paid_tokens` BIGINT - 付费字数余额

**membership_plans 表新增字段**:

- `free_input_chars_per_request` INT - 每次请求免费输入字符数（会员特权）
- `output_free` BOOLEAN - 输出是否完全免费（会员特权）

**新增数据库表**:

- `token_consumption_records` - 消耗记录表（16 字段，4 索引）

**SQL 文件**:

- `backend/sql/01_add_ratio_fields_to_ai_models.sql`
- `backend/sql/02_add_daily_quota_to_user_token_balances.sql`
- `backend/sql/03_add_member_benefits_to_membership_plans.sql`
- `backend/sql/04_create_token_consumption_records.sql`
- `backend/sql/init-token-consumption-permissions.sql`

### 📚 文档更新

- **新增**: `API/21-字数消耗系统.md` - 完整 API 文档
- **新增**: `backend/src/token-balances/README.md` - 模块文档
- **新增**: `docs/字数消耗系统/` - 完整规划文档（7 个文档）

### ⚙️ 定时任务

**每日额度重置任务**:

- 执行时间：每天 00:00（Asia/Shanghai 时区）
- 功能：重置所有用户的 `dailyUsedQuota` 为 0
- 类：`DailyQuotaResetTask`

### 🔧 依赖更新

需要安装 `@nestjs/schedule` 包用于定时任务：

```bash
npm install @nestjs/schedule
```

---

## 2025-01-24 - AI 生成系统（AI 写作模式）

### ✨ 新增功能

#### AI 写作生成服务

- **模块**: `backend/src/generation/`
- **功能**: 完整实现 AI 写作生成系统，基于提示词模板生成创意内容

**核心特性**:

- ✅ 提示词模板系统
- ✅ 三种内容类型（文本/人物卡/世界观）
- ✅ 参数替换（{{参数名}}）
- ✅ 宏系统集成（{{char}}, {{time}} 等）
- ✅ Token 预算控制
- ✅ 流式/非流式输出
- ✅ 多轮对话支持
- ✅ 权限控制

**新增权限**:

```typescript
export const GENERATION_PERMISSIONS = {
  WRITING_GENERATE: "generation:writing:generate",
  ROLEPLAY_GENERATE: "generation:roleplay:generate",
} as const;
```

**API 接口**:

- `POST /api/v1/generation/writing` - AI 写作生成（非流式）
- `POST /api/v1/generation/writing/stream` - AI 写作生成（流式 SSE）

**目录结构**:

```
generation/
├── controllers/
│   └── writing-generation.controller.ts
├── services/
│   └── writing-generation.service.ts
├── dto/
│   ├── writing-generation.dto.ts
│   └── generation-response.dto.ts
├── interfaces/
│   └── resolved-content.interface.ts
├── enums/
│   └── generation-mode.enum.ts
└── generation.module.ts
```

**依赖服务**:

- `ChatCompletionService`: AI 模型调用
- `MacroReplacerService`: 宏替换
- `AdvancedTokenManagerService`: Token 估算
- `CharactersService`: 人物卡加载
- `WorldSettingsService`: 世界观加载

**工作流程**:

1. 加载提示词及内容
2. 解析人物卡/世界观引用
3. 应用宏替换（参数占位符）
4. 构建消息数组
5. Token 估算
6. 调用 AI 生成
7. 返回结果

**权限配置**:

- 添加 `generation:writing:generate` 到普通用户默认权限
- 添加 `generation:roleplay:generate` 到普通用户默认权限（待实现）

**文档**:

- `API/21-AI生成系统.md` - API 完整文档
- `backend/src/generation/README.md` - 模块开发文档

**集成**:

- 已集成到 `AppModule`
- 已添加权限常量到 `permissions.config.ts`

---

## 2025-01-24 - 分类使用场景类型

### ✨ 功能增强

#### 分类级别的场景区分

- **模块**: `backend/src/prompts/`
- **功能**: 为提示词**分类**添加 `usageType` 字段，实现 AI 写作 和 角色扮演 的场景分离

**新增枚举**:

```typescript
enum CategoryUsageType {
  WRITING = "writing", // AI写作（默认）
  ROLEPLAY = "roleplay", // 角色扮演
}
```

**数据库变更**:

- `prompt_categories` 表新增 `usage_type` 列
- 类型: `ENUM('writing', 'roleplay')`
- 默认值: `'writing'`
- 新增索引: `IDX_CATEGORY_USAGE_TYPE`

**API 变更**:

- `POST /prompt-categories` - 创建分类时可指定 `usageType`
- `PATCH /prompt-categories/:id` - 更新分类时可修改 `usageType`
- `GET /prompt-categories` - 返回分类时包含 `usageType` 字段

**设计思路**:

- 分类的 `usageType` 决定了该分类下所有提示词的使用场景
- 前端根据分类的 `usageType` 自动过滤：
  - AI 写作区只显示 `usageType='writing'` 的分类
  - 角色扮演区只显示 `usageType='roleplay'` 的分类
- 用户创建提示词时选择分类，自动继承分类的使用场景
- 避免在 AI 写作区看到角色扮演的提示词，反之亦然

**初始分类建议**:

- **AI 写作** (`writing`): 小说创作、文案撰写、诗歌创作、剧本编写
- **角色扮演** (`roleplay`): 历史人物、虚拟角色、职业角色

**迁移文件**:

- `migrations/1737701000000-AddUsageTypeToCategories.ts`

**文档更新**:

- `API/06-提示词管理.md` - 添加分类 `usageType` 字段说明

---

## 2025-10-23 - 公告管理前端界面

### 🎨 前端更新

#### 公告管理界面

- **模块**: `admin/src/pages/announcements/`
- **功能**: 完整的公告管理后台界面

**新增组件**:

- `Announcements.tsx` - 公告列表管理页面
- `AnnouncementModal.tsx` - 创建/编辑公告模态框

**新增 API 服务**:

- `admin/src/api/announcements.ts` - 公告 API 服务封装

**新增类型定义**:

- `admin/src/types/announcement.ts` - 公告相关类型定义

**核心功能**:

- ✅ 公告列表展示（响应式设计，支持移动端和 PC 端）
- ✅ 多维度筛选（类型、级别、启用状态）
- ✅ 创建/编辑公告（完整表单配置）
- ✅ 发布/推送操作
- ✅ 删除操作（带二次确认）
- ✅ 统计信息展示
- ✅ 权限控制（按钮级别）

**权限配置**:

- 新增 `ANNOUNCEMENT_PERMISSIONS` 权限常量
- 支持 8 种权限：查看、创建、读取、更新、删除、发布、推送、统计

**路由配置**:

- 路径: `/announcements`
- 权限: `announcement:view`

**文档**:

- `admin/docs/ANNOUNCEMENT_MODULE.md` - 前端模块文档

---

## 2025-01-26 - 公告系统

### 🚀 新增功能

#### 公告系统（后端）

- **模块**: `backend/src/announcements/`
- **功能**: 完整的公告发布、推送和统计系统

**新增实体**:

- `Announcement` - 公告表（标题、内容、类型、级别、链接等）
- `AnnouncementRead` - 阅读记录表（已读状态、点击记录）
- `AnnouncementLinkClick` - 链接点击详细记录表

**核心功能**:

- ✅ 公告管理（创建、更新、删除、发布）
- ✅ 链接跳转（支持内链/外链、新窗口/当前窗口）
- ✅ 目标受众（所有用户/特定角色/特定用户/会员等级）
- ✅ 显示控制（置顶、弹窗、实时推送、时间范围）
- ✅ 阅读统计（浏览次数、已读人数、点击率）
- ✅ 多种类型（系统/活动/维护/新功能/通知）
- ✅ 提示级别（info/warning/error/success）

**API 接口**: 13 个

- 管理端：创建、列表、更新、删除、发布、推送、统计
- 用户端：有效公告、弹窗公告、未读数量、详情、标记已读、记录点击
- 文档: `API/20-公告系统.md`

**WebSocket 支持**:

- 实时推送新公告
- 公告更新通知
- 公告删除通知

---

## 2025-01-26 - AI 字数包、会员、卡密系统

### 🚀 新增功能

#### 1. 会员系统

- **模块**: `backend/src/memberships/`
- **功能**: 完整的多等级会员体系

**新增实体**:

- `MembershipPlan` - 会员套餐（价格、时长、权益配置）
- `UserMembership` - 用户会员记录（激活、过期管理）

**核心功能**:

- ✅ 会员套餐管理（CRUD、上下架）
- ✅ 会员激活（购买、兑换、赠送、活动）
- ✅ 会员叠加规则（同级延期、不同级升级）
- ✅ 自动续费支持
- ✅ 过期自动处理

**API 接口**: 9 个

- 文档: `API/16-会员系统.md`

---

#### 2. 字数包系统

- **模块**: `backend/src/token-packages/` + `backend/src/token-balances/`
- **功能**: AI 字数购买和余额管理

**新增实体**:

- `TokenPackage` - 字数包（数量、价格、有效期）
- `UserTokenBalance` - 用户字数余额（总额、赠送、冻结）
- `TokenTransaction` - 字数流水记录（充值、消费、退款）

**核心功能**:

- ✅ 字数包管理（CRUD、上下架）
- ✅ 字数充值（购买、赠送）
- ✅ 字数消费（事务保证、余额检查）
- ✅ 扣费优先级（先扣赠送，后扣购买）
- ✅ 流水记录（完整的消费追踪）
- ✅ 退款处理

**API 接口**: 8 个

- 文档: `API/17-字数包系统.md`

---

#### 3. 卡密系统

- **模块**: `backend/src/redemption-codes/`
- **功能**: 卡密生成和兑换管理

**新增实体**:

- `RedemptionCode` - 卡密（类型、使用限制、有效期）
- `RedemptionRecord` - 使用记录（用户、IP、时间）

**核心功能**:

- ✅ 单个/批量生成卡密
- ✅ 三种卡密类型（会员、字数、混合）
- ✅ 使用次数限制（一次性、多次、无限）
- ✅ 有效期控制
- ✅ 批次管理
- ✅ 使用追踪（IP、User-Agent）
- ✅ 自动发货

**卡密格式**: `XXXX-XXXX-XXXX-XXXX`（16 位，去除易混淆字符）

**API 接口**: 6 个

- 文档: `API/18-卡密系统.md`

---

#### 4. 订单系统

- **模块**: `backend/src/orders/`
- **功能**: 会员和字数包购买流程

**新增实体**:

- `Order` - 订单（类型、金额、状态、支付信息）

**核心功能**:

- ✅ 订单创建（会员/字数包）
- ✅ 支付处理（模拟支付）
- ✅ 自动发货（事务保证）
- ✅ 退款处理
- ✅ 订单查询

**订单状态**: pending → paid → refunded / cancelled

**API 接口**: 6 个

- 文档: `API/19-订单系统.md`

---

### 📊 数据库变更

**新增表（9 个）**:

1. `membership_plans` - 会员套餐表
2. `user_memberships` - 用户会员记录表
3. `token_packages` - 字数包表
4. `user_token_balances` - 用户字数余额表
5. `token_transactions` - 字数流水记录表
6. `redemption_codes` - 卡密表
7. `redemption_records` - 卡密使用记录表
8. `orders` - 订单表

**迁移文件**:

- `migrations/1737800000000-CreateMembershipSystem.ts`
- `migrations/1737800100000-CreateTokenSystem.ts`
- `migrations/1737800200000-CreateRedemptionSystem.ts`
- `migrations/1737800300000-CreateOrderSystem.ts`

---

### 🔒 权限配置

**新增权限**:

```typescript
// 会员管理
"membership:plan:create";
"membership:plan:update";
"membership:plan:delete";

// 字数包管理
"token:package:create";
"token:package:update";
"token:package:delete";

// 卡密管理
"redemption:code:create";
"redemption:code:view";
"redemption:code:update";
```

---

### 📝 业务流程

#### 购买流程

```
1. 用户选择套餐 → 创建订单
2. 跳转支付 → 支付成功回调
3. 更新订单状态 → 自动发货
   - 会员: 激活会员记录
   - 字数包: 充值到余额
```

#### 卡密兑换流程

```
1. 用户输入卡密 → 验证有效性
2. 检查使用限制 → 执行兑换
3. 自动发货 → 记录使用记录
```

#### 字数消费流程

```
1. AI调用前 → 检查余额
2. 消费字数 → 记录流水
3. 扣费优先级: 赠送字数 → 购买字数
```

---

### 🎯 模块化设计

**架构原则**:

- ✅ 完全模块化（每个功能独立目录）
- ✅ 高内聚低耦合（服务分离、职责清晰）
- ✅ 事务保证（支付、充值、消费）
- ✅ 完整权限控制（JWT 认证 + 权限装饰器）

**目录结构**:

```
backend/src/
├── memberships/          # 会员系统
│   ├── controllers/
│   ├── dto/
│   ├── entities/
│   ├── enums/
│   └── services/
├── token-packages/       # 字数包系统
├── token-balances/       # 余额管理
├── redemption-codes/     # 卡密系统
└── orders/               # 订单系统
```

---

## 2025-01-23 - 会话管理系统扩展

### 🚀 新增功能

#### 1. 群聊功能

- **模块**: 扩展 `backend/src/chat-histories/` 模块
- **功能**: 支持与多个角色的群组对话

**新增实体**:

- `GroupChat` - 群聊实体（支持多成员、归档管理）
- `GroupMember` - 群聊成员实体（可启用/禁用、显示顺序）

**新增服务**:

- `GroupChatsService` - 群聊管理服务（完整 CRUD、成员管理）
- `SessionsService` - 会话管理服务（跨聊天和群聊的统一管理）
- `SessionBackupService` - 会话备份服务（备份、恢复、完整性验证）

**新增 API 接口（23 个）**:

**群聊管理（10 个）**:

- `POST /group-chats` - 创建群聊
- `GET /group-chats` - 查询群聊列表（分页、搜索、归档筛选）
- `GET /group-chats/:id` - 获取群聊详情
- `PUT /group-chats/:id` - 更新群聊信息
- `DELETE /group-chats/:id` - 删除群聊
- `POST /group-chats/:id/archive` - 归档群聊
- `POST /group-chats/:id/unarchive` - 取消归档
- `POST /group-chats/:id/members` - 添加群聊成员
- `DELETE /group-chats/:id/members/:memberId` - 移除成员
- `PUT /group-chats/:id/members/:memberId/toggle` - 启用/禁用成员
- `PUT /group-chats/:id/members/order` - 更新成员显示顺序

**会话管理（6 个）**:

- `GET /sessions/recent` - 获取最近会话列表（包含聊天和群聊）
- `GET /sessions/search` - 全局搜索会话
- `GET /sessions/stats` - 获取会话统计信息
- `POST /sessions/backup/chat/:chatId` - 备份普通聊天
- `POST /sessions/backup/group/:groupId` - 备份群聊
- `POST /sessions/restore` - 从备份恢复会话

**核心特性**:

1. ✅ **群聊支持**: 与多个角色同时对话
2. ✅ **成员管理**: 动态添加/移除成员、调整顺序
3. ✅ **统一会话视图**: 普通聊天和群聊统一展示
4. ✅ **最近会话**: 按最后消息时间排序展示所有会话
5. ✅ **全局搜索**: 跨所有聊天和群聊搜索
6. ✅ **备份恢复**: 完整的会话备份和恢复功能
7. ✅ **完整性校验**: SHA256 校验确保备份数据完整性

**数据库变更**:

- 新增 `group_chats` 表 - 群聊主表
- 新增 `group_members` 表 - 群聊成员表
- 修改 `messages` 表 - 添加 `group_chat_id` 字段，支持群聊消息
- 迁移文件: `migrations/1737620000000-AddGroupChats.ts`

**权限控制**:

- ✅ 所有接口需要 JWT 认证（全局 Guard）
- ✅ 用户只能访问自己创建的群聊（作为群主）
- ✅ 所有操作验证群聊所有权
- ✅ 级联删除：删除群聊自动删除成员和消息

**文档**:

- 新增: `API/16-会话管理.md` - 会话管理 API 文档
- 参考: `docs/会话管理系统完整文档.md` - 系统设计文档

---

## 2025-01-23 - 历史消息管理系统

### 🚀 新增功能

#### 1. 聊天历史管理模块

- **模块路径**: `backend/src/chat-histories/`
- **功能**: 完整的对话历史记录管理系统，支持消息存储、多版本生成、导入导出
- **设计原则**: 模块化、高内聚低耦合、完整的权限控制

**核心服务（5 个独立服务 + 1 个复用服务）**:

- `ChatHistoriesService` - 聊天管理服务（CRUD、统计）
- `MessagesService` - 消息管理服务（CRUD、消息操作）
- `SwipesService` - Swipe 管理服务（多版本生成）
- `ChatExportService` - 导出服务（4 种格式）
- `ChatImportService` - 导入服务（7 种来源）
- `TokenManagerService` - 复用提示词系统的 Token 计数服务（避免重复代码）

**核心功能**:

1. **聊天管理**: 创建、查询、更新、删除聊天
2. **消息管理**: 完整的消息 CRUD 操作
3. **Swipes 系统**: 为每条消息生成多个版本，可自由切换
4. **导入导出**: 支持 JSONL、TXT、HTML、Markdown 格式导出
5. **多平台导入**: 支持 SillyTavern、Ooba、CAI Tools 等 7 种平台
6. **Token 计数**: 自动估算消息 Token 数量
7. **附件支持**: 支持文件和图片附件
8. **完整权限**: 所有操作都验证聊天所有权

**数据库设计**:

- `chat_histories` - 聊天表（10 字段，3 索引）
- `messages` - 消息表（21 字段，3 索引）
- `swipes` - Swipe 版本表（9 字段，2 索引）

**API 接口（20 个）**:

**聊天管理**:

- `POST /chat-histories` - 创建聊天
- `GET /chat-histories` - 查询聊天列表（分页、筛选、搜索）
- `GET /chat-histories/:id` - 获取聊天详情
- `PUT /chat-histories/:id` - 更新聊天
- `DELETE /chat-histories/:id` - 删除聊天
- `POST /chat-histories/batch-delete` - 批量删除聊天
- `GET /chat-histories/stats/summary` - 获取聊天统计
- `GET /chat-histories/:id/export` - 导出聊天
- `POST /chat-histories/import` - 导入聊天

**消息管理**:

- `POST /messages` - 创建消息
- `GET /messages/chat/:chatId` - 查询消息列表
- `GET /messages/:id` - 获取消息详情
- `PUT /messages/:id` - 更新消息
- `DELETE /messages/:id` - 删除消息
- `DELETE /messages/:id/from` - 删除指定消息及之后的所有消息

**Swipes 管理**:

- `POST /messages/:id/swipes` - 添加 Swipe 版本
- `PUT /messages/:id/swipes/:swipeIndex` - 切换 Swipe 版本
- `DELETE /messages/:id/swipes/:swipeIndex` - 删除 Swipe 版本

**消息对象完整字段**:

- **核心字段**: name, is_user, mes, send_date
- **Swipes 字段**: swipes, swipe_id, swipe_info
- **生成信息**: gen_started, gen_finished, gen_id, api, model
- **扩展字段**: extra (token_count, file, image, metadata 等)

**导出格式**:

- **JSONL** - SillyTavern 原生格式（可重新导入）
- **TXT** - 纯文本格式（可读性强）
- **HTML** - 网页格式（带样式）
- **Markdown** - Markdown 格式（适合文档）

**导入来源**:

- **SillyTavern** - 原生 JSONL 格式
- **Ooba** - Text Generation WebUI 格式
- **CAI Tools** - Character.AI Tools 格式
- **Agnai** - Agnai 格式
- **RisuAI** - RisuAI 格式
- **Chub** - Chub.ai 格式
- **Kobold Lite** - Kobold Lite 格式

**模块结构**:

```
chat-histories/
├── controllers/          # 2个控制器
├── dto/                  # 7个DTO
├── entities/             # 3个实体
├── enums/                # 2个枚举
├── interfaces/           # 3个接口
├── services/             # 6个服务
├── chat-histories.module.ts
├── index.ts
└── README.md
```

**权限控制**:

- ✅ 所有接口都需要 JWT 认证
- ✅ 用户只能访问自己的聊天和消息
- ✅ 所有操作都验证聊天所有权
- ✅ 使用 `@CurrentUser()` 装饰器获取当前用户

**性能优化**:

- ✅ 消息分页加载（默认 50 条/页）
- ✅ 索引优化（用户 ID、聊天 ID、时间）
- ✅ 懒加载 Swipes 关系
- ✅ Token 自动估算（避免重复计算）

**集成系统**:

- 与**角色卡系统**集成（关联 characterCardId）
- 与**宏系统**集成（消息内容支持宏替换）
- 与**用户系统**集成（用户认证和权限）

**相关文档**:

- API 文档: `API/15-历史消息管理.md`
- 模块文档: `backend/src/chat-histories/README.md`
- 系统文档: `docs/历史消息系统完整文档.md`

---

## 2025-10-23 - 宏（参数替换）系统

### 🚀 新增功能

#### 1. 宏系统模块

- **模块路径**: `backend/src/macros/`
- **功能**: 提供完整的 SillyTavern 风格宏替换功能
- **设计原则**: 模块化、高内聚低耦合、代码分散到多个文件

**核心服务**:

- `MacroReplacerService` - 主宏替换服务（协调所有宏处理器）
- `CharacterMacroService` - 角色相关宏处理（{{char}}, {{user}}）
- `TimeMacroService` - 时间相关宏处理（{{time}}, {{date}}）
- `ConversationMacroService` - 对话相关宏处理（{{lastMessage}}）
- `RandomMacroService` - 随机与计算宏处理（{{roll:1d20}}, {{random::}}）
- `TextMacroService` - 文本处理宏处理（{{trim}}, 管道操作）
- `VariableMacroService` - 变量宏处理（{{getvar::}}, {{setvar::}}）

**支持的宏类型**:

1. **角色相关**: {{char}}, {{user}}, {{charIfNotGroup}}, {{charPrompt}}
2. **时间相关**: {{time}}, {{date}}, {{weekday}}, {{isotime}}
3. **对话相关**: {{lastMessage}}, {{lastCharMessage}}, {{lastUserMessage}}
4. **随机计算**: {{roll:1d20}}, {{random::选项1::选项2}}, {{pick::变量名}}
5. **文本处理**: {{trim}}, {{宏::uppercase}}, {{宏::lowercase}}, {{宏::length}}
6. **变量操作**: {{getvar::变量名}}, {{setvar::变量名::值}}

**宏替换阶段**:

- `LOAD`: 加载时（静态宏）
- `BUILD`: 构建时（上下文宏）
- `BEFORE_SEND`: 发送前（所有动态宏）

**重要说明**:

- ✅ `{{user}}` 宏来自 `User.nickname` 字段（昵称），而不是 `User.username`
- ✅ 支持嵌套宏（建议最多 2-3 层）
- ✅ 替换顺序：静态宏 → 变量宏 → 对话宏 → 时间宏 → 随机宏 → 文本宏
- ✅ 完全模块化：代码分散到 7 个独立服务文件

**模块结构**:

```
macros/
├── enums/                    # 枚举定义
├── interfaces/               # 接口定义
├── services/                 # 7个独立服务
├── macros.module.ts          # 模块定义
├── index.ts                  # 模块导出
└── README.md                 # 模块文档
```

**适用场景**:

- 角色卡内容动态替换
- 世界书条目内容替换
- 提示词模板处理
- AI 对话上下文构建

**文档**:

- API 文档: `API/14-宏系统.md`
- 模块 README: `backend/src/macros/README.md`
- 完整宏文档: `docs/参数替换系统完整文档.md`

---

## 2025-01-23 - SillyTavern 角色卡系统

### 🚀 新增功能

#### 1. 角色卡管理系统

- **模块路径**: `backend/src/character-cards/`
- **功能**:
  - 完整的角色卡 CRUD 操作
  - 支持 V1/V2/V3 三种格式
  - 格式自动识别和转换
  - 草稿、已发布、已归档状态管理
  - 公开性控制
  - 点赞、收藏、统计功能

**核心服务**:

- `CharacterCardsService` - 角色卡主服务（CRUD、状态管理、互动）
- `CharacterCardConverterService` - 格式转换服务（V1↔V2）
- `CharacterCardImportService` - 导入服务（JSON/PNG）
- `CharacterCardExportService` - 导出服务（JSON/PNG）
- `PngMetadataService` - PNG 元数据处理服务（tEXt 块读写、CRC32 计算）

**API 端点**:

- `POST /api/v1/character-cards` - 创建角色卡
- `GET /api/v1/character-cards` - 查询列表（分页、筛选、排序）
- `GET /api/v1/character-cards/:id` - 获取详情
- `PUT /api/v1/character-cards/:id` - 更新角色卡
- `DELETE /api/v1/character-cards/:id` - 删除角色卡
- `POST /api/v1/character-cards/:id/publish` - 发布
- `POST /api/v1/character-cards/:id/archive` - 归档
- `POST /api/v1/character-cards/:id/like` - 点赞
- `DELETE /api/v1/character-cards/:id/like` - 取消点赞
- `POST /api/v1/character-cards/:id/favorite` - 收藏
- `DELETE /api/v1/character-cards/:id/favorite` - 取消收藏
- `POST /api/v1/character-cards/:id/use` - 记录使用
- `POST /api/v1/character-cards/import` - 导入角色卡
- `GET /api/v1/character-cards/:id/export` - 导出角色卡

**权限要求**:

- 列表查询、详情查看：可选认证（`@OptionalAuth()`）
- 创建、更新、删除、发布、归档、互动：必需认证
- 作者权限检查：编辑/删除/发布/归档仅限作者

**数据结构**:

- `CharacterCard` - 角色卡实体
- `CharacterCardV1` - V1 格式接口
- `CharacterCardV2` - V2 格式接口
- `CharacterCardV2Data` - V2 数据主体
- `WorldBookEntry` - 世界书条目
- `CharacterBook` - 角色专属世界书

**枚举类型**:

- `CharacterCardSpec` - 规范版本（V1/V2/V3）
- `CharacterCardSpecVersion` - 版本号（1.0/2.0/3.0）
- `CharacterCardStatus` - 状态（draft/published/archived）
- `DepthPromptRole` - 深度提示角色（system/user/assistant）

**完整字段支持**:

- ✅ 所有 V2 标准字段（name, description, personality, scenario, first_mes, mes_example 等）
- ✅ 高级字段（creator_notes, system_prompt, post_history_instructions, alternate_greetings 等）
- ✅ 世界书（character_book.entries）
- ✅ 扩展字段（talkativeness, fav, world, depth_prompt, regex_scripts 等）
- ✅ 第三方扩展（pygmalion_id, github_repo, chub, risuai, sd_character_prompt 等）

**导入导出**:

- ✅ JSON 格式导入导出
- ✅ PNG 格式导入（解析 tEXt 元数据）
- ✅ PNG 格式导出（已完整实现，使用 sharp 库）

**文档**:

- `backend/src/character-cards/README.md` - 系统文档
- `API/13-角色卡管理.md` - API 接口文档

### 📝 数据库变更

新增表：

- `character_cards` - 角色卡主表
- `character_card_likes` - 点赞记录
- `character_card_favorites` - 收藏记录

### 🔧 技术实现

- **模块化设计**: 按职责分离为 entities、dto、services、controllers
- **类型安全**: 完整的 TypeScript 接口定义
- **向后兼容**: V1 格式自动转换为 V2
- **可扩展性**: extensions 字段支持自定义扩展

---

## 2025-01-23 - 提示词构建引擎

### 🚀 新增功能

#### 1. 提示词构建系统（六阶段流程）

- **模块路径**: `backend/src/prompts/builders/`
- **功能**:
  - 完整的六阶段构建流程（收集 → 分组 → 排序 →Token 控制 → 组装 → 转换）
  - 支持 12 个标准位置（system, before, charDef, after, examples, history, atDepth, anTop, anBottom 等）
  - 智能 Token 管理和预算控制
  - 支持三种 API 格式（OpenAI、Claude、Gemini）
  - 参数替换功能（`{{参数名}}`占位符）
  - 深度注入支持（atDepth 位置）
  - 调试模式

**核心服务**:

- `PromptBuilderService` - 主构建服务
- `ComponentCollectorService` - 组件收集器
- `PositionGrouperService` - 位置分组器
- `TokenManagerService` - Token 管理器
- `MessageAssemblerService` - 消息组装器
- `FormatConverterService` - 格式转换器

**API 端点**:

- `POST /api/v1/prompts/build` - 完整构建（支持对话历史、世界书）
- `POST /api/v1/prompts/build/simple` - 简化构建（仅提示词内容 + 参数替换）

**权限要求**:

- 需要 JWT 认证（`@UseGuards(JwtAuthGuard)`）
- 需要`prompt:build`权限（`@RequirePermissions('prompt:build')`）

**数据结构**:

- `PromptComponent` - 组件接口
- `PositionBucket` - 位置桶接口
- `BuildOptions` - 构建选项接口
- `TokenBudget` - Token 预算接口
- `TokenStats` - Token 统计接口

**枚举类型**:

- `PromptPosition` - 位置枚举（12 种标准位置）
- `ApiFormat` - API 格式枚举（openai/claude/gemini）

**Token 管理**:

- 简化 Token 估算算法（英文 4 字符 1token，中文 1.5 字符 1token）
- 裁剪优先级：世界书 → 历史消息 → 示例消息
- 保护必需组件和最近历史消息

**格式转换**:

- **OpenAI**: 标准 messages 数组
- **Claude**: 分离 system，确保 user/assistant 交替
- **Gemini**: systemInstruction + contents，assistant→model

**文档**:

- 新增 `API/07-提示词构建引擎.md` - 完整 API 文档
- 新增 `backend/src/prompts/builders/README.md` - 技术实现文档
- 参考 `docs/提示词构建引擎原理.md` - 理论原理说明

**设计原则**:

- ✅ 模块化：每个阶段独立服务
- ✅ 可维护：代码分层清晰
- ✅ 可扩展：易于添加新位置、格式
- ✅ 类型安全：完整 TypeScript 类型
- ✅ 权限检查：所有端点需认证和鉴权

**待实现功能**:

- 🔄 世界书激活集成（enableWorldBook）
- 🔄 递归扫描世界书
- 🔄 集成 tiktoken 精确 Token 计算
- 🔄 构建结果缓存机制

**2025-01-23 更新**：

- ✅ 完整实现 Token 预算管理系统（`AdvancedTokenManagerService`）
- ✅ 支持三种预算计算方式（固定值/百分比/动态调整）
- ✅ 支持四种分配策略（order/activation_order/token_efficiency/relevance）
- ✅ 实现 ignoreBudget 强制激活机制
- ✅ 实现预算自动扩展功能
- ✅ 实现 LRU 缓存优化（10x 性能提升）
- ✅ 实现详细预算报告生成
- ✅ 扩展 TokenBudget 和 TokenStats 接口
- ✅ 创建完整使用文档（TOKEN_BUDGET_GUIDE.md）

---

## 2025-01-23 - 世界书系统（增强版）

### 🚀 新增功能

#### 1. 世界书扫描引擎（完整版）

- **模块路径**: `backend/src/world-books/`
- **数据库表**: `world_book_activations`
- **核心功能**:
  - 基于 SillyTavern 的世界书扫描机制
  - 动态关键词匹配和条目激活
  - 选择性逻辑（AND_ANY、AND_ALL、NOT_ANY、NOT_ALL）
  - 时效性管理（Sticky 粘性、Cooldown 冷却、Delay 延迟）
  - 位置控制（8 种：before、after、ANTop、ANBottom、atDepth、EMTop、EMBottom、outlet）
  - 正则表达式支持
  - 全词匹配和大小写敏感

#### 2. 递归扫描系统 ⚡ NEW

- **服务**: `WorldBookRecursiveService`
- **功能**:
  - 链式激活（已激活内容可触发新激活）
  - 最大 5 轮递归（可配置）
  - 防止无限循环（已激活检查、空轮停止）
  - 递归控制字段（excludeRecursion、preventRecursion、delayUntilRecursion）
  - 性能优化（缓冲区复用）

#### 3. 包含组过滤系统 ⚡ NEW

- **服务**: `WorldBookInclusionGroupService`
- **功能**:
  - 组内互斥选择（同组只能激活一个）
  - 4 种选择策略：Sticky 优先 → Override 优先 → 评分选择 → 加权随机
  - 组评分机制（匹配次数 × 权重）
  - 保持状态连续性

#### 4. Token 预算管理系统 ⚡ NEW

- **服务**: `WorldBookBudgetService`
- **功能**:
  - 防止上下文爆炸
  - 4 种分配策略（order、activation_order、token_efficiency、relevance）
  - 强制激活字段（ignoreBudget）
  - Token 计算缓存（1000 条 LRU）
  - 预算扩展机制

#### 5. 最小激活数保证 ⚡ NEW

- **服务**: `WorldBookMinActivationsService`
- **功能**:
  - 保证至少激活 N 个条目
  - 2 种降级策略：激活常驻条目、按 order 激活
  - 扩展扫描深度
  - 内容丰富度保证

**核心服务**:

- `WorldBookScannerService` - 核心扫描器
- `WorldBookBufferService` - 缓冲区和关键词匹配
- `WorldBookTimedEffectsService` - 时效性管理

**数据结构**:

- `WorldBookEntry` - 世界书条目接口
- `RoleplayConfig` - 角色扮演配置（存储在 `prompts.roleplay_config`）
- `WorldBookActivation` - 激活状态实体

**数据库变更**:

- 新增表 `world_book_activations` - 存储时效性状态
- 新增字段 `prompts.roleplay_config` (JSON) - 存储世界书配置

**文档**:

- 新增 `API/10-世界书系统.md` - 完整的使用文档和测试场景
- 新增 `backend/src/world-books/README.md` - 技术实现文档

**与 SillyTavern 的对比**:

- ✅ 关键词匹配、选择性逻辑、时效性管理：100%兼容
- ✅ 正则表达式、全词匹配、大小写敏感：完全支持
- ✅ 位置类型：完全支持 8 种（before/after/ANTop/ANBottom/atDepth/EMTop/EMBottom/outlet）
- ✅ **递归扫描**：100%实现（链式激活、防无限循环）
- ✅ **包含组**：100%实现（4 种选择策略）
- ✅ **Token 预算**：100%实现（4 种分配策略、缓存优化）
- ✅ **最小激活数**：100%实现（降级策略）
- ⚠️ 装饰器、向量化匹配：预留接口，未实现
- **实现覆盖率**：约 **95%** 🎉，完全满足生产使用

---

## 2025-01-23 - AI 模型管理系统

### 🚀 新增功能

#### 1. AI 提供商管理 API

- **模块路径**: `backend/src/ai-models/`
- **数据库表**: `ai_providers`
- **功能**:
  - 支持多种 AI 提供商（OpenAI、Claude、Google、OpenRouter 等 20+种）
  - 提供商配置管理（API 密钥、基础 URL、超时设置）
  - 提供商能力定义（支持的参数、功能特性）
  - 提供商状态管理（启用/禁用/错误）
  - 连接测试功能

**新增接口**:

- `POST /api/v1/ai-providers` - 创建提供商 (权限: `ai:provider:create`)
- `GET /api/v1/ai-providers` - 获取所有提供商 (权限: `ai:provider:read`)
- `GET /api/v1/ai-providers/active` - 获取活跃提供商
- `GET /api/v1/ai-providers/default` - 获取默认提供商
- `GET /api/v1/ai-providers/:id` - 获取单个提供商
- `PUT /api/v1/ai-providers/:id` - 更新提供商 (权限: `ai:provider:update`)
- `DELETE /api/v1/ai-providers/:id` - 删除提供商 (权限: `ai:provider:delete`)
- `POST /api/v1/ai-providers/:id/test` - 测试连接 (权限: `ai:provider:test`)

#### 2. AI 模型管理 API

- **数据库表**: `ai_models`
- **功能**:
  - 模型信息管理（名称、版本、上下文窗口）
  - 模型定价和限制配置
  - 模型特性标签（chat, reasoning, vision 等）
  - 批量导入模型
  - 按特性查询模型

**新增接口**:

- `POST /api/v1/ai-models` - 创建模型 (权限: `ai:model:create`)
- `GET /api/v1/ai-models` - 获取所有模型 (权限: `ai:model:read`)
- `GET /api/v1/ai-models/active` - 获取活跃模型
- `GET /api/v1/ai-models/default` - 获取默认模型
- `GET /api/v1/ai-models/provider/:providerId` - 获取指定提供商的模型
- `GET /api/v1/ai-models/features` - 根据特性查询模型
- `GET /api/v1/ai-models/:id` - 获取单个模型
- `PUT /api/v1/ai-models/:id` - 更新模型 (权限: `ai:model:update`)
- `DELETE /api/v1/ai-models/:id` - 删除模型 (权限: `ai:model:delete`)
- `POST /api/v1/ai-models/provider/:providerId/bulk-import` - 批量导入

#### 3. 统一聊天补全 API

- **功能**:
  - 统一的聊天补全接口
  - 支持流式和非流式输出
  - 自动参数适配和转换
  - 智能提供商选择

**新增接口**:

- `POST /api/v1/chat/completions` - 创建聊天补全 (权限: `ai:chat:create`)
- `GET /api/v1/chat/completions/models` - 获取可用模型列表 (权限: `ai:chat:read`)
- `GET /api/v1/chat/completions/models/default` - 获取默认模型

### 🔧 核心特性

#### 智能参数适配器

系统会根据不同的 AI 提供商自动适配参数：

1. **OpenAI 适配器**

   - 标准 OpenAI API 参数
   - 支持工具调用和结构化输出
   - Vision 模型参数过滤

2. **Claude 适配器**

   - 系统提示分离（`messages` → `system` + `messages`）
   - 自动检测思维模式（Claude 3.7+, Opus 4, Sonnet 4, Haiku 4.5）
   - 处理采样限制（Opus 4.1, Sonnet 4.5, Haiku 4.5）
   - 停止序列重命名（`stop` → `stop_sequences`）

3. **Google 适配器**

   - 消息格式转换（角色: `assistant` → `model`）
   - 参数重命名（`max_tokens` → `maxOutputTokens`）
   - 停止序列限制（最多 5 个，1-16 字符）
   - 自动添加安全设置

4. **OpenRouter 适配器**
   - 支持扩展参数（`top_k`, `top_a`, `min_p`, `repetition_penalty`）
   - 提供商选择和路由策略
   - Claude 缓存支持

#### 统一响应格式

所有 AI 提供商的响应都会转换为标准的 OpenAI 格式：

```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

### 🔐 权限系统

新增 AI 模型管理相关权限：

**提供商权限**:

- `ai:provider:create` - 创建 AI 提供商
- `ai:provider:read` - 查看 AI 提供商
- `ai:provider:update` - 更新 AI 提供商
- `ai:provider:delete` - 删除 AI 提供商
- `ai:provider:test` - 测试 AI 提供商连接

**模型权限**:

- `ai:model:create` - 创建 AI 模型
- `ai:model:read` - 查看 AI 模型
- `ai:model:update` - 更新 AI 模型
- `ai:model:delete` - 删除 AI 模型

**聊天权限**:

- `ai:chat:create` - 创建聊天补全
- `ai:chat:read` - 查看聊天信息

### 📦 数据库结构

#### ai_providers 表

- `id`, `name`, `source`, `displayName`, `description`
- `status` (active/inactive/error)
- `config` (JSON: baseUrl, authType, timeout, maxRetries, rateLimit)
- `capabilities` (JSON: supportedParameters, supportsStreaming, etc.)
- `apiKey`, `authCredentials` (加密存储)
- `isDefault`, `order`, `userId`
- `createdAt`, `updatedAt`

#### ai_models 表

- `id`, `modelId`, `displayName`, `description`
- `status` (active/inactive/deprecated)
- `providerId` (外键)
- `version`, `contextWindow`, `maxOutputTokens`
- `pricing` (JSON), `limits` (JSON), `features` (数组)
- `supportsStreaming`, `supportsTools`, `supportsVision`
- `isDefault`, `order`, `userId`
- `createdAt`, `updatedAt`

### 📚 文档

- **API 文档**: `API/10-AI模型管理.md`
- **模块文档**: `backend/src/ai-models/README.md`
- **参考资料**: `docs/api参数/` (SillyTavern 实现参考)

### ⚠️ 注意事项

1. **依赖要求**: 需要安装 `axios` 库

   ```bash
   npm install axios
   ```

2. **数据库迁移**: 需要创建迁移文件添加相关表

3. **权限配置**:

   - ✅ 已在 `common/config/permissions.config.ts` 中添加权限常量和配置
   - ✅ 已将基础 AI 使用权限添加到 `DEFAULT_USER_PERMISSIONS`（普通用户可使用）
   - 系统启动时会自动同步权限到数据库

4. **普通用户默认权限**:

   - `ai:model:read` - 查看 AI 模型列表
   - `ai:chat:create` - 创建聊天补全（使用 AI 对话）
   - `ai:chat:read` - 查看聊天信息

5. **管理员权限**（需手动分配）:

   - 提供商管理：`ai:provider:create/read/update/delete/test`
   - 模型管理：`ai:model:create/update/delete`

6. **类型修复**: 部分 TypeORM 查询类型需要优化（使用 `IsNull()`）

7. **安全性**:
   - API 密钥加密存储
   - 所有接口需要认证和权限
   - 用户只能访问自己创建的资源

### ✅ P0 功能完成（2025-01-23 下午）

**1. 完善流式输出（SSE）**:

- 标准 Server-Sent Events 实现
- 客户端断开连接自动检测
- 实时数据推送和缓冲区刷新
- 优雅的错误处理和资源释放
- 支持 `data: [DONE]` 结束标志

**2. 请求取消机制（AbortController）**:

- 60 秒请求超时控制
- 流式请求的 AbortController 集成
- 客户端主动取消支持（响应 `close` 事件）
- 超时自动清理机制

**3. 基础错误重试**:

- 智能重试策略（最多 3 次，指数退避）
- 可重试错误识别：408, 429, 500-504, 网络超时
- 计算延迟：1s → 2s → 4s（指数增长）
- 不可重试错误直接抛出

**配置参数**:

```typescript
MAX_RETRIES = 3; // 最大重试次数
RETRY_DELAY = 1000; // 初始延迟 1秒
RETRY_MULTIPLIER = 2; // 指数倍数
REQUEST_TIMEOUT = 60000; // 请求超时 60秒
```

### 🎯 后续优化

- [ ] 添加 Redis 缓存提高性能
- [ ] 添加单元测试覆盖
- [ ] 添加监控和日志
- [ ] 工具调用完整实现
- [ ] o1 系列特殊处理
- [ ] Key 查询性能优化

---

## 2025-01-23 晚上 - API Key 轮询系统

### 新功能 ✨

**API Key 轮询系统** - 支持多 API Key 负载均衡和故障转移

#### 核心特性

1. **多 Key 管理**:

   - 为每个 AI 提供商配置多个 API Keys
   - 支持单个 Key 或 Key 池两种模式
   - 兼容现有系统（不影响已有配置）

2. **5 种轮询策略**:

   - `round_robin` - 轮询：按顺序依次使用
   - `random` - 随机：随机选择可用 Key
   - `weighted` - 加权：根据权重分配使用频率
   - `priority` - 优先级：优先使用高优先级 Key
   - `least_used` - 最少使用：选择使用次数最少的 Key

3. **自动故障转移**:

   - 连续失败 5 次 → 自动标记为 ERROR 状态
   - 遇到 429 错误 → 自动进入 COOLDOWN（5 分钟）
   - 成功请求 → 自动从 ERROR 恢复为 ACTIVE

4. **健康监控**:

   - 实时监控每个 Key 的健康状态
   - 使用次数、错误次数统计
   - 错误率计算（错误次数/总使用次数）
   - 最后使用时间、最后错误时间追踪

5. **管理功能**:
   - 完整的 CRUD 接口（14 个 API）
   - 批量创建 Keys
   - 启用/禁用 Key
   - 手动恢复错误 Key
   - 清理冷却期
   - 重置统计数据

#### 数据库变更

**新增表**: `ai_api_keys`

- 字段：id, providerId, name, key, status, weight, priority
- 速率限制：requestsPerMinute, tokensPerMinute
- 统计：usageCount, errorCount, lastUsedAt, lastErrorAt
- 状态管理：cooldownUntil
- 索引：providerId, status, (priority, weight)

#### API 接口（14 个）

**CRUD 操作**:

- `POST /ai-keys` - 创建 Key
- `POST /ai-keys/bulk` - 批量创建
- `GET /ai-keys` - 列表查询
- `GET /ai-keys/:id` - 详情查询
- `GET /ai-keys/provider/:providerId` - 按提供商查询
- `PUT /ai-keys/:id` - 更新
- `DELETE /ai-keys/:id` - 删除

**管理操作**:

- `POST /ai-keys/:id/toggle` - 启用/禁用
- `GET /ai-keys/health/status` - 健康状态
- `POST /ai-keys/:id/recover` - 手动恢复
- `POST /ai-keys/cleanup/cooldowns` - 清理冷却期
- `POST /ai-keys/stats/reset` - 重置统计

#### 集成说明

**ChatCompletionService 自动集成**:

1. 请求时自动选择最优 Key（使用加权策略）
2. 自动记录使用成功/失败
3. 失败自动标记 Key 状态
4. 透明兼容单 Key 和多 Key 模式

**使用示例**:

```bash
# 1. 创建提供商（可不配置apiKey）
POST /api/v1/ai-providers

# 2. 批量添加Keys
POST /api/v1/ai-keys/bulk
{
  "providerId": 1,
  "keys": [
    { "name": "Primary", "key": "sk-xxx", "weight": 2, "priority": 0 },
    { "name": "Backup", "key": "sk-yyy", "weight": 1, "priority": 1 }
  ]
}

# 3. 正常调用聊天接口（自动使用Key轮询）
POST /api/v1/chat/completions
```

#### 配置参数

```typescript
ERROR_THRESHOLD = 5; // 连续失败阈值
COOLDOWN_DURATION = 300000; // 冷却时间 5分钟
ROTATION_STRATEGY = WEIGHTED; // 默认加权策略
```

#### 文档

- 数据库迁移: `migrations/1737620400000-CreateApiKeysTable.ts`
- 实体: `entities/api-key.entity.ts`
- 服务: `services/api-keys.service.ts`, `services/key-rotation.service.ts`
- 控制器: `controllers/api-keys.controller.ts`
- 类型: `types/key-rotation.types.ts`
- README: 已更新使用说明

---

## 2025-10-22 - 全局认证机制增强

### 重大变更 ⚠️

- **启用全局 JWT 认证 Guard**: 所有接口默认需要携带有效 Token 才能访问
  - 注册全局 `JwtAuthGuard` 和 `PermissionsGuard`
  - 公开接口使用 `@Public()` 装饰器明确标记
  - 可选认证接口使用 `@OptionalAuth()` 装饰器
  - 提高系统安全性，防止未授权访问

### 新增装饰器

- **@Public()**: 标记公开接口，无需 Token 即可访问
  - 应用于：注册、登录、刷新 Token、健康检查、分类查询等
- **@OptionalAuth()**: 标记可选认证接口，支持登录和未登录两种状态
  - 应用于：提示词列表、提示词详情
  - 有 Token 时验证并注入用户信息
  - 无 Token 时允许访问，用户信息为 null

### 修改的接口行为

#### 公开接口（无需 Token）

- `POST /api/v1/auth/register` - 注册
- `POST /api/v1/auth/login` - 登录
- `POST /api/v1/auth/admin/login` - 管理员登录
- `POST /api/v1/auth/refresh` - 刷新 Token
- `GET /` - 健康检查
- `GET /api/v1/prompt-categories` - 获取分类列表
- `GET /api/v1/prompt-categories/:id` - 获取分类详情
- `GET /api/v1/prompts/:id/stats` - 获取提示词统计

#### 可选认证接口（可选 Token）

- `GET /api/v1/prompts` - 获取提示词列表
- `GET /api/v1/prompts/:id` - 获取提示词详情

#### 必须认证接口（必须 Token）

除上述公开和可选认证接口外，**所有其他接口都必须携带有效 Token**，包括：

- 用户管理：`/api/v1/users/*`
- 作品管理：`/api/v1/novels/*`
- 提示词操作：创建、编辑、删除、点赞、收藏等
- 权限和角色管理

### 前端适配要求

1. **前端 axios 已配置自动携带 Token**（`frontend/src/services/api.ts`）

   - 从 localStorage 读取 `accessToken`
   - 自动添加到 `Authorization` 请求头
   - 401 响应自动刷新 Token

2. **错误处理**
   - 401 Unauthorized: Token 无效或过期，需要重新登录或刷新
   - 403 Forbidden: Token 有效但权限不足

### 技术实现

- **全局 Guard 配置**: `backend/src/common/common.module.ts`
  - `APP_GUARD` 提供全局 `JwtAuthGuard`
  - `APP_GUARD` 提供全局 `PermissionsGuard`
- **JwtAuthGuard 增强**: `backend/src/common/guards/jwt-auth.guard.ts`

  - 支持 `@Public()` 装饰器跳过认证
  - 支持 `@OptionalAuth()` 装饰器可选认证
  - handleRequest 处理不同认证场景

- **装饰器定义**:
  - `backend/src/common/decorators/public.decorator.ts`
  - `backend/src/common/decorators/optional-auth.decorator.ts`

### 文档更新

- 更新 `API/99-通用规范.md` 认证方式章节
- 详细说明公开接口、可选认证接口、必须认证接口的区别

## 2025-10-21 - 提示词点赞去重功能

### 新增功能

- **点赞关系管理**: 添加了 `prompt_likes` 表记录用户点赞关系
  - 用户对同一提示词只能点赞一次
  - 数据库唯一索引约束防止重复点赞
  - 点赞/取消点赞时更新点赞记录和计数

### 修复

- **点赞接口 (`POST /prompts/:id/like`)**: 修复可重复点赞的问题

  - 检查用户是否已点赞，已点赞则返回错误
  - 记录用户点赞关系到 `prompt_likes` 表
  - 响应码 400: "已经点赞过了"

- **取消点赞接口 (`DELETE /prompts/:id/like`)**:

  - 检查用户是否已点赞，未点赞则返回错误
  - 删除点赞记录并减少计数
  - 响应码 400: "还未点赞"

- **提示词详情接口 (`GET /prompts/:id`)**:
  - 返回 `isLiked` 字段，标识当前用户是否已点赞
  - 未登录用户 `isLiked` 为 `false`

### 数据库变更

- 新增表 `prompt_likes`:
  - `id`: 主键
  - `user_id`: 用户 ID（外键）
  - `prompt_id`: 提示词 ID（外键）
  - `created_at`: 点赞时间
  - 唯一索引: `(user_id, prompt_id)`

## 2025-10-21 - 提示词申请逻辑修正

### 修复

- **提示词申请接口 (`POST /prompt-applications/prompts/:promptId/apply`)**: 修正申请逻辑
  - 从基于 `isPublic` 字段改为基于 `requireApplication` 字段
  - 现在只有设置了 `requireApplication: true` 的提示词才需要申请
  - 保留了作者不能申请自己提示词的检查
  - 错误消息从"公开提示词无需申请"改为"该提示词无需申请即可使用"

### 说明

三个字段完全独立：

- `isPublic`: 是否公开到广场
- `isContentPublic`: 详情页是否显示内容
- `requireApplication`: 使用时是否需要申请

## 2025-10-21 - 提示词更新接口增强

### 新增功能

- **提示词更新接口 (`PATCH /prompts/:id`)**: 现在支持 `contents` 字段
  - 修改了 `UpdatePromptDto`，允许更新内容
  - 更新服务逻辑：如果提供 contents，会完全替换现有内容
  - 支持一次性更新提示词基本信息和内容
  - 修复了编辑模式下无法保存内容的问题

## 2025-10-21 - 提示词详情接口修复

### 修复

- **提示词详情接口 (`GET /prompts/:id`)**: 添加 `OptionalJwtAuthGuard`，修复已登录用户无法正确查看提示词详情的问题
  - 创建了新的 `OptionalJwtAuthGuard`，支持可选认证
  - 已登录用户现在可以正确查看自己的草稿和归档提示词
  - 未登录用户仍可访问已发布的公开提示词
  - 修复了页面一直转圈无法加载的 bug

## 2025-10-21 - 提示词权限细化

### 🔧 优化更新

#### 提示词权限控制

- **新增字段**: `Prompt.requireApplication` - 是否需要申请才能使用
  - 类型: `boolean`
  - 默认值: `false`
  - 用途: 细化权限控制，支持三种发布模式

**三种发布模式**:

1. **完全公开**: `isPublic=true`, `isContentPublic=true`, `requireApplication=false`
   - 广场可见，内容可见，可直接使用
2. **内容隐藏但可用**: `isPublic=true`, `isContentPublic=false`, `requireApplication=false`
   - 广场可见，内容不可见，可直接使用（盲用模式）
3. **需要申请**: `isPublic=true`, `isContentPublic=false`, `requireApplication=true`
   - 广场可见，内容不可见，需申请使用
   - **申请通过后仍不显示内容，但可以使用**

#### 提示词内容

- **新增字段**: `PromptContent.name` - 提示词内容名称
  - 类型: `varchar(255)`
  - 必填: 是
  - 用途: 方便用户在创建/编辑时识别和管理多个提示词内容项
  - 示例: "系统提示"、"用户输入"、"角色设定" 等

**影响接口**:

- `POST /api/v1/prompts` - 创建提示词时需包含 `name` 和 `requireApplication` 字段
- `PATCH /api/v1/prompts/:id` - 更新提示词时可修改这些字段
- `GET /api/v1/prompts/:id` - 返回数据包含这些字段

## 2025-10-20 - 提示词系统上线

### ✨ 新增模块

#### 提示词管理系统

完整的提示词管理系统，支持创建、分类、权限、申请审核等功能。

**新增接口（共 26 个）**：

**提示词管理（10 个）**

- `POST /api/v1/prompts` - 创建提示词
- `GET /api/v1/prompts` - 获取提示词列表（支持筛选、搜索、分页）
- `GET /api/v1/prompts/my` - 获取我的提示词列表
- `GET /api/v1/prompts/:id` - 获取提示词详情
- `PATCH /api/v1/prompts/:id` - 更新提示词
- `DELETE /api/v1/prompts/:id` - 删除提示词（软删除）
- `POST /api/v1/prompts/:id/use` - 使用提示词（增加使用次数）
- `POST /api/v1/prompts/:id/like` - 点赞提示词
- `DELETE /api/v1/prompts/:id/like` - 取消点赞
- `GET /api/v1/prompts/:id/stats` - 获取统计数据

**分类管理（8 个）**

- `GET /api/v1/prompt-categories` - 获取所有分类
- `GET /api/v1/prompt-categories/:id` - 获取分类详情
- `POST /api/v1/prompt-categories` - 创建分类（管理员）
- `PATCH /api/v1/prompt-categories/:id` - 更新分类（管理员）
- `DELETE /api/v1/prompt-categories/:id` - 删除分类（管理员）
- `POST /api/v1/prompt-categories/sub` - 创建子分类（管理员）
- `PATCH /api/v1/prompt-categories/sub/:id` - 更新子分类（管理员）
- `DELETE /api/v1/prompt-categories/sub/:id` - 删除子分类（管理员）

**权限管理（3 个）**

- `POST /api/v1/prompts/:promptId/permissions` - 授予权限（仅作者）
- `GET /api/v1/prompts/:promptId/permissions` - 获取权限列表（仅作者）
- `DELETE /api/v1/prompts/:promptId/permissions/:userId` - 撤销权限（仅作者）

**申请管理（5 个）**

- `POST /api/v1/prompt-applications/prompts/:promptId/apply` - 申请使用私有提示词
- `GET /api/v1/prompt-applications/my` - 获取我的申请列表
- `GET /api/v1/prompt-applications/pending` - 获取待我审核的申请列表
- `GET /api/v1/prompt-applications/prompts/:promptId` - 获取提示词的申请列表（仅作者）
- `PATCH /api/v1/prompt-applications/:id/review` - 审核申请（仅作者）

### 🎯 核心特性

#### 1. 双重公开性控制

- **`isPublic`**: 控制提示词本身的可见性（是否在列表中显示）
- **`isContentPublic`**: 控制提示词内容是否返回（用于"预览"模式）
- **用途**: 吸引用户申请使用（看得到名字，看不到内容）

#### 2. 参数系统

```json
{
  "content": "你是一个专业的小说写作助手。主角是{{主角名字}}，背景是{{故事背景}}",
  "parameters": [
    { "name": "主角名字", "required": true, "description": "请输入主角的名字" },
    { "name": "故事背景", "required": false, "description": "请输入故事背景" }
  ]
}
```

#### 3. 权限分级

- **view**: 查看权限
- **use**: 使用权限
- **edit**: 编辑权限
- 权限等级：view < use < edit

#### 4. 自动授权机制 ⚡

当作者审核通过申请时：

1. ✅ 系统自动在 `prompt_permissions` 表创建记录
2. ✅ 授予申请用户 `use` 权限
3. ✅ 用户立即可以查看完整内容并使用提示词

**流程图**:

```
用户申请 → 作者审核通过 → 系统自动授权 → 用户获得 use 权限
```

#### 5. 热度计算

```javascript
hotValue = viewCount * 1 + useCount * 5 + likeCount * 10;
```

#### 6. 内容类型支持

- **text**: 纯文本
- **character**: 人物卡引用
- **worldview**: 世界观引用
- 支持 `referenceId` 为 null（插槽模式，用户自选）

#### 7. 消息管理

- 每条消息可单独启用/禁用（`isEnabled`）
- 禁用的消息不会发送给 AI

### 🗄️ 数据库变更

**新增表（6 张）**：

- `prompt_categories` - 基础分类表
- `prompt_sub_categories` - 子分类表
- `prompts` - 提示词主表
- `prompt_contents` - 提示词内容表
- `prompt_permissions` - 权限表
- `prompt_applications` - 申请表

**初始数据**：

- 5 个基础分类（AI 写作、角色扮演、知识问答、创意灵感、数据分析）
- 11 个子分类

**迁移脚本位置**：

- `backend/src/prompts/migrations/001_create_prompts_tables.sql`
- `backend/src/prompts/migrations/001_rollback.sql`

### 🔐 权限更新

**新增权限代码（13 个）**：

```typescript
PROMPT_PERMISSIONS = {
  LIST: "prompt:list",
  VIEW: "prompt:view",
  CREATE: "prompt:create",
  UPDATE: "prompt:update",
  DELETE: "prompt:delete",
  USE: "prompt:use",
  PUBLISH: "prompt:publish",
  MANAGE_ALL: "prompt:manage:all",
  REVIEW: "prompt:review",
  FORCE_DELETE: "prompt:force_delete",
  CATEGORY_CREATE: "prompt:category:create",
  CATEGORY_UPDATE: "prompt:category:update",
  CATEGORY_DELETE: "prompt:category:delete",
};
```

### 📝 文档更新

- `API/06-提示词管理.md` - 完整的提示词系统 API 文档
- `backend/API/CHANGELOG.md` - 后端更新日志
- `backend/src/prompts/migrations/README.md` - 数据库迁移说明

### 🔗 相关资源

- [提示词管理 API 文档](./06-提示词管理.md)
- [后端代码目录](../backend/src/prompts/)
- [数据库迁移脚本](../backend/src/prompts/migrations/)

---

**更新时间：** 2025-10-20  
**影响范围：** 新增提示词管理模块  
**升级建议：** 执行数据库迁移脚本

---

## 2025-10-18 (v2) - 封面上传功能

### ✨ 新增功能

#### 文件上传接口

**新接口**: `POST /api/v1/novels/upload/cover`

**功能**:

- 上传作品封面图片
- 支持格式：JPG, JPEG, PNG, WebP
- 文件大小限制：5MB
- 自动生成唯一文件名
- JWT 认证保护

**请求示例**:

```http
POST /api/v1/novels/upload/cover
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: [binary data]
```

**响应示例**:

```json
{
  "success": true,
  "code": 200,
  "message": "上传成功",
  "data": {
    "url": "/uploads/covers/cover-1697616000000-123456789.jpg",
    "filename": "cover-1697616000000-123456789.jpg",
    "originalName": "my-cover.jpg",
    "size": 245678,
    "mimeType": "image/jpeg"
  }
}
```

#### 静态文件访问

**路径**: `/uploads/covers/{filename}`

**示例**:

```
http://localhost:3000/uploads/covers/cover-123456.jpg
```

### 🔄 功能增强

#### 作品 API 增强

**coverImage 字段**:

- 支持本地上传 URL：`/uploads/covers/xxx.jpg`
- 支持外部 URL：`https://cdn.example.com/cover.jpg`
- 可选字段，为空时显示默认封面

**前端处理**:

- 图片加载失败自动降级
- 显示默认封面占位符
- 不影响其他功能使用

---

## 2025-10-18 (v1) - 作品类型和形式字段重大更新

### 🔄 重大变更 (Breaking Changes)

#### 1. 作品类型字段变更

**从单选改为多选数组**

| 变更前             | 变更后                         |
| ------------------ | ------------------------------ |
| `genre: "fantasy"` | `genres: ["fantasy", "wuxia"]` |
| 单个字符串         | 字符串数组                     |
| 单选               | 多选                           |

#### 2. 新增作品形式字段

**新字段：`form`**

- 类型：枚举字符串
- 选项：`novel` / `short_story` / `script` / `other`
- 默认值：`novel`

#### 3. 扩展作品类型枚举值

**原有类型（5 种）：**

- `fantasy` - 玄幻
- `urban` - 都市
- `history` - 历史
- `mystery` - 悬疑
- `scifi` - 科幻

**新增类型（8 种）：**

- `traditional_fantasy` - 传统玄幻
- `fictional` - 架空
- `sports` - 体育
- `wuxia` - 武侠
- `apocalypse` - 末日
- `fanfiction` - 动漫衍生
- `film_tv` - 影视
- `espionage` - 谍战

**总计：13 种类型**

#### 4. 默认目标字数变更

| 变更前                        | 变更后                        |
| ----------------------------- | ----------------------------- |
| `targetWordsPerChapter: 3000` | `targetWordsPerChapter: 2000` |

---

### 📝 API 变更详情

#### 创建作品 `POST /novels`

**请求体示例：**

```json
// 变更前
{
  "name": "我的小说",
  "genre": "fantasy",
  "targetWordsPerChapter": 3000
}

// 变更后
{
  "name": "我的小说",
  "genres": ["fantasy", "wuxia"],  // ✅ 数组，支持多选
  "form": "novel",                  // ✅ 新增字段
  "targetWordsPerChapter": 2000     // ✅ 默认值改为2000
}
```

**响应数据示例：**

```json
{
  "id": 1,
  "name": "我的小说",
  "genres": ["fantasy", "wuxia"], // ✅ 数组
  "form": "novel", // ✅ 新增字段
  "status": "ongoing",
  "totalWordCount": 0,
  "targetWordsPerChapter": 2000, // ✅ 默认2000
  "createdAt": "2025-10-18T12:00:00.000Z",
  "updatedAt": "2025-10-18T12:00:00.000Z"
}
```

#### 获取作品列表 `GET /novels`

#### 获取作品详情 `GET /novels/:id`

#### 更新作品 `PATCH /novels/:id`

**所有接口的响应数据结构都已更新为新格式。**

---

### 🗄️ 数据库变更

#### novels 表结构变更

```sql
-- 变更前
`genre` ENUM('fantasy', 'urban', 'history', 'mystery', 'scifi')

-- 变更后
`genres` JSON  -- 存储数组，如：["fantasy", "wuxia"]
`form` ENUM('novel', 'short_story', 'script', 'other')
```

#### 迁移脚本

位置：`backend/sql/migrations/update-novels-genres-and-form.sql`

**执行步骤：**

1. 备份数据库
2. 运行迁移脚本
3. 验证数据完整性

**迁移脚本会自动：**

- 将旧的 `genre` 单值转换为 `genres` 数组
- 添加新的 `form` 字段（默认为 `novel`）
- 更新默认目标字数为 2000

---

### 💻 前端变更

#### 类型定义更新

```typescript
// 变更前
export type NovelGenre = "fantasy" | "urban" | "history" | "mystery" | "scifi";

export interface Novel {
  genre: NovelGenre; // 单选
  targetWordsPerChapter: number;
}

// 变更后
export type NovelGenre =
  | "fantasy"
  | "traditional_fantasy"
  | "urban"
  | "history"
  | "fictional"
  | "mystery"
  | "scifi"
  | "sports"
  | "wuxia"
  | "apocalypse"
  | "fanfiction"
  | "film_tv"
  | "espionage";

export type NovelForm = "novel" | "short_story" | "script" | "other";

export interface Novel {
  genres: NovelGenre[]; // 多选数组
  form: NovelForm; // 新增
  targetWordsPerChapter: number;
}
```

#### UI 变更

**创建/编辑作品面板：**

- ✅ 类型选择：单选下拉框 → 多选 Checkbox
- ✅ 新增：作品形式下拉选择
- ✅ 布局：响应式优化（移动端友好）

**筛选面板：**

- ✅ 新增作品形式筛选
- ✅ 布局：2 列 → 3 列（类型/形式/状态）

**作品卡片：**

- ✅ 显示多个类型标签
- ✅ 显示作品形式标签（紫色标识）

---

### 🔄 兼容性说明

#### 向后兼容

**数据迁移：**

- 旧数据的 `genre` 值会自动转换为 `genres` 数组
- 例如：`"fantasy"` → `["fantasy"]`
- 所有旧作品会自动设置 `form` 为 `"novel"`

#### Breaking Changes

**前端必须更新：**

- ❌ 直接使用 `novel.genre` 会报错
- ✅ 改为使用 `novel.genres` 数组
- ✅ 添加对 `novel.form` 的处理

**API 请求必须更新：**

- ❌ 发送 `{ genre: "fantasy" }` 仍可用但不推荐
- ✅ 改为发送 `{ genres: ["fantasy"] }`

---

### 📚 更新的文档

1. **API 文档**

   - `API/05-作品管理.md` - 完整更新所有示例
   - `API/CHANGELOG.md` - 新增更新日志（本文件）

2. **数据库文档**

   - `backend/sql/novels.sql` - 更新表结构定义
   - `backend/sql/migrations/update-novels-genres-and-form.sql` - 迁移脚本
   - `backend/sql/migrations/README.md` - 迁移说明

3. **代码注释**
   - TypeScript 类型定义已更新
   - Entity 和 DTO 已更新
   - Swagger 文档自动同步

---

### ✅ 测试清单

- [ ] 创建作品（单选类型）
- [ ] 创建作品（多选类型）
- [ ] 创建作品（不同形式）
- [ ] 更新作品类型
- [ ] 类型筛选（单类型）
- [ ] 类型筛选（多类型）
- [ ] 形式筛选
- [ ] 列表展示
- [ ] 数据迁移验证

---

### 🔗 相关链接

- [作品管理 API 文档](./05-作品管理.md)
- [数据库迁移说明](../backend/sql/migrations/README.md)
- [Swagger 文档](http://localhost:3000/api/docs)

---

**更新时间：** 2025-10-18
**影响范围：** 作品管理模块所有接口
**升级建议：** 尽快更新前端代码和运行数据库迁移
