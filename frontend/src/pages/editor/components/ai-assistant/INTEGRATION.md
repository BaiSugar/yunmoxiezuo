# AI 助手真实数据集成文档

## 概述

本文档记录了 AI 助手组件从硬编码数据改为使用真实 API 数据的完整改造过程。

## 改造范围

### 1. 新增文件

#### 类型定义
- **`frontend/src/types/ai-model.ts`** - AI 模型和用户偏好的类型定义
  - `AIModel` - AI 模型实体
  - `AIProvider` - AI 提供商实体
  - `UserModelPreference` - 用户模型偏好设置
  - `CreateUserModelPreferenceDto` - 创建/更新 DTO
  - 枚举类型：`ModelStatus`, `ModelFeature`
  - `PromptSelectionModal` - 提示词选择模态窗口

#### API 服务
- **`frontend/src/services/ai-models.api.ts`** - AI 模型管理 API 服务
  - `aiModelsApi.getModels()` - 获取所有模型
  - `aiModelsApi.getActiveModels()` - 获取活跃模型
  - `aiModelsApi.getDefaultModel()` - 获取默认模型
  - `aiModelsApi.getModelsByProvider()` - 按提供商筛选
  - `aiModelsApi.getModelsByFeatures()` - 按特性筛选
  - `aiProvidersApi.*` - 提供商相关 API

- **`frontend/src/services/user-preferences.api.ts`** - 用户模型偏好 API 服务
  - `createOrUpdate()` - 创建或更新偏好设置
  - `getAll()` - 获取所有偏好设置
  - `getByModel()` - 获取指定模型的偏好
  - `update()` - 更新偏好（按 ID）
  - `delete()` - 删除偏好

### 2. 修改文件

#### `ModelConfigModal.tsx`
**改动**：
- ✅ 从后端加载真实的活跃模型列表
- ✅ 显示模型的完整信息（名称、描述、上下文窗口）
- ✅ 支持默认模型标识
- ✅ 添加加载状态和错误处理
- ✅ 模型列表支持滚动（超过一定数量）

**移除**：
- ❌ 硬编码的模型列表（GPT-4 Turbo, Claude 3 等）

#### `GenerateTab.tsx`
**改动**：
- ✅ 从后端加载真实的提示词列表
- ✅ 筛选已发布和草稿状态的提示词
- ✅ 加载和保存用户模型偏好设置
- ✅ 添加加载状态显示
- ✅ 使用 `userPreferencesApi` 替代硬编码 API 调用

**移除**：
- ❌ 模拟的提示词数据
- ❌ 硬编码的默认模型（"gpt-4-turbo"）

#### `ChatTab.tsx`
**改动**：
- ✅ 使用 `userPreferencesApi` 服务
- ✅ 统一 API 调用方式
- ✅ 完善错误处理

**移除**：
- ❌ 直接调用 `apiService.get('/user-model-preferences/...')`
- ❌ 直接调用 `apiService.post('/user-model-preferences', ...)`

## 数据流程

### 提示词数据流
```
用户打开 AI 助手
  ↓
加载提示词列表：GET /api/v1/prompts?page=1&limit=100
  ↓
筛选：status === 'published' || status === 'draft'
  ↓
显示在下拉列表中
```

### 模型配置数据流
```
用户点击"专业模型"
  ↓
打开 ModelConfigModal
  ↓
加载活跃模型：GET /api/v1/ai-models/active
  ↓
显示模型列表
  ↓
用户选择模型并调整温度
  ↓
保存：POST /api/v1/user-model-preferences
  {
    "modelId": "gpt-4-turbo",
    "temperature": 0.7
  }
  ↓
下次打开自动加载保存的偏好
```

### 偏好加载流程
```
组件挂载 / selectedModel 变化
  ↓
GET /api/v1/user-model-preferences/model/{modelId}
  ↓
404: 使用默认温度 (0.7)
200: 使用保存的温度
  ↓
更新 temperature 状态
```

## 后端接口依赖

### AI 模型管理
- `GET /api/v1/ai-models` - 获取所有模型
- `GET /api/v1/ai-models/active` - 获取活跃模型（主要使用）
- `GET /api/v1/ai-models/default` - 获取默认模型
- **权限**：`ai:model:read`

### 用户模型偏好
- `POST /api/v1/user-model-preferences` - 创建或更新偏好
- `GET /api/v1/user-model-preferences` - 获取所有偏好
- `GET /api/v1/user-model-preferences/model/:modelId` - 获取指定模型偏好
- `PUT /api/v1/user-model-preferences/:id` - 更新偏好
- `DELETE /api/v1/user-model-preferences/:id` - 删除偏好
- **认证**：需要 JWT Token（全局 Guard）

### 提示词管理
- `GET /api/v1/prompts` - 获取提示词列表（支持 categoryId 筛选）
- `GET /api/v1/prompts/my` - 获取我的提示词
- `GET /api/v1/prompts/favorites` - 获取我的收藏
- `GET /api/v1/prompt-categories` - 获取所有分类
- **认证**：可选认证（`@OptionalAuth()`）

## 模块化设计

### 符合 SRS 规范
- ✅ **高内聚低耦合**：API 服务独立文件，组件专注 UI
- ✅ **不在一个文件夹**：
  - 类型：`types/ai-model.ts`
  - API 服务：`services/ai-models.api.ts`, `services/user-preferences.api.ts`
  - 组件：`pages/editor/components/ai-assistant/`
- ✅ **代码可维护**：清晰的职责分离，易于扩展

### 目录结构
```
frontend/src/
├── types/
│   └── ai-model.ts              # AI 模型类型定义
├── services/
│   ├── api.ts                   # 基础 API 服务
│   ├── ai-models.api.ts         # AI 模型 API（新增）
│   └── user-preferences.api.ts  # 用户偏好 API（新增）
└── pages/editor/components/ai-assistant/
    ├── AIAssistantPanel.tsx     # 主面板
    ├── ChatTab.tsx              # 对话标签（已修改）
    ├── GenerateTab.tsx          # 生成标签（已修改）
    ├── ModelConfigModal.tsx     # 模型配置模态框（已修改）
    ├── index.ts
    ├── README.md
    └── INTEGRATION.md           # 本文档
```

## 错误处理

### API 调用错误
- **加载失败**：显示 Toast 错误提示
- **404 Not Found**：
  - 提示词列表为空：显示"暂无提示词"
  - 模型列表为空：显示"暂无可用模型"
  - 偏好不存在：使用默认值（0.7）
- **网络错误**：捕获并显示友好提示

### 加载状态
- **提示词列表**：`loadingPrompts` 状态，显示"加载中..."
- **模型列表**：`loading` 状态，显示"加载中..."
- **模态框打开时才加载**：避免不必要的 API 请求

## 测试要点

### 功能测试
1. ✅ 打开 AI 助手，提示词列表正确加载
2. ✅ 点击"专业模型"，模型列表正确显示
3. ✅ 选择模型并设置温度，保存成功
4. ✅ 下次打开，自动加载保存的模型和温度
5. ✅ 没有保存偏好时，使用默认温度 0.7
6. ✅ 对话和生成两个标签页独立工作

### 边界测试
1. ✅ 用户没有提示词：显示"暂无提示词"
2. ✅ 没有可用模型：显示"暂无可用模型"
3. ✅ 网络错误：显示错误提示
4. ✅ 未登录：根据全局 Guard 处理

### 权限测试
1. ✅ 需要 `ai:model:read` 权限查看模型
2. ✅ 需要登录才能保存偏好
3. ✅ 提示词列表支持未登录访问

## 后续优化建议

### 性能优化
- [ ] 缓存模型列表（localStorage）
- [ ] 提示词列表分页加载（目前一次加载 100 条）
- [ ] 防抖搜索提示词

### 功能增强
- [ ] 模型搜索/筛选功能
- [ ] 按特性筛选模型（chat, vision, reasoning）
- [ ] 显示模型价格信息
- [ ] 支持自定义温度预设值

### 用户体验
- [ ] 骨架屏代替"加载中..."
- [ ] 模型列表虚拟滚动（大量模型时）
- [ ] 保存成功后的视觉反馈
- [ ] 快捷键支持（ESC 关闭模态框）

## 变更日志

### 2025-01-24
- ✅ 创建 AI 模型和用户偏好 API 服务
- ✅ 创建类型定义文件
- ✅ 修改 ModelConfigModal 使用真实数据
- ✅ 修改 GenerateTab 使用真实数据
- ✅ 修改 ChatTab 使用统一 API 服务
- ✅ 完成模块化改造，符合 SRS 规范
- ✅ 创建 PromptSelectionModal 提示词选择模态窗口
- ✅ 添加分类筛选功能
- ✅ 添加需申请提示词标识（🔒图标）
- ✅ 移除"公众厅"标签
