# 用户模型偏好设置系统（AI写作专属）

## 📋 概述

用户可以为不同的AI模型保存独立的温度参数配置。例如：
- 为 `gpt-4-turbo` 设置温度 `0.7`
- 为 `claude-3-opus` 设置温度 `0.9`
- 为 `gemini-pro` 设置温度 `0.5`

## 🗄️ 数据库设计

```sql
CREATE TABLE `user_model_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `model_id` varchar(100) NOT NULL,
  `temperature` decimal(3,2) NOT NULL DEFAULT '0.70',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_user_model` (`user_id`, `model_id`),
  CONSTRAINT `FK_user_model_preferences_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);
```

**关键点：**
- `user_id` + `model_id` 联合唯一索引
- 每个用户可以为多个模型保存配置
- 每个模型只能有一个配置

## 🔌 API接口

### 1. 保存/更新配置

```http
POST /api/v1/user-model-preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "modelId": "gpt-4-turbo",
  "temperature": 0.8
}
```

**说明：**
- 如果该用户对该模型已有配置，则更新温度
- 如果没有配置，则创建新记录

### 2. 获取所有配置

```http
GET /api/v1/user-model-preferences
Authorization: Bearer <token>
```

**响应：**
```json
[
  {
    "id": 1,
    "userId": 123,
    "modelId": "gpt-4-turbo",
    "temperature": 0.8,
    "createdAt": "2025-01-24T10:00:00Z",
    "updatedAt": "2025-01-24T10:00:00Z"
  },
  {
    "id": 2,
    "userId": 123,
    "modelId": "claude-3-opus",
    "temperature": 0.9,
    "createdAt": "2025-01-24T10:05:00Z",
    "updatedAt": "2025-01-24T10:05:00Z"
  }
]
```

### 3. 获取指定模型的配置

```http
GET /api/v1/user-model-preferences/model/gpt-4-turbo
Authorization: Bearer <token>
```

**响应：**
```json
{
  "id": 1,
  "userId": 123,
  "modelId": "gpt-4-turbo",
  "temperature": 0.8,
  "createdAt": "2025-01-24T10:00:00Z",
  "updatedAt": "2025-01-24T10:00:00Z"
}
```

如果未找到配置，返回 `null`。

### 4. 更新配置（按ID）

```http
PUT /api/v1/user-model-preferences/1
Authorization: Bearer <token>
Content-Type: application/json

{
  "temperature": 0.75
}
```

**说明：** 只能更新温度参数，不能更改 `modelId`

### 5. 删除配置

```http
DELETE /api/v1/user-model-preferences/1
Authorization: Bearer <token>
```

**响应：** `204 No Content`

## 💡 生成服务集成

在 `WritingGenerationService` 中使用：

```typescript
import { UserModelPreferencesService } from '../users/services/user-model-preferences.service';

@Injectable()
export class WritingGenerationService {
  constructor(
    private readonly userModelPreferencesService: UserModelPreferencesService,
  ) {}

  async generate(userId: number, dto: GenerateWritingDto) {
    // 三层优先级
    const userPref = await this.userModelPreferencesService
      .getPreferenceForGeneration(userId, dto.modelId);

    const finalTemperature = 
      dto.temperature              // 第一优先：前端传入
      ?? userPref?.temperature     // 第二优先：用户保存的偏好
      ?? 0.7;                      // 第三优先：系统默认

    // 调用AI模型
    const response = await this.callAI({
      model: dto.modelId,
      temperature: finalTemperature,
      messages: [...],
    });

    return response;
  }
}
```

## 📊 参数优先级

```
前端传入参数 > 用户保存的偏好 > 系统默认值
     ↓              ↓               ↓
dto.temperature   userPref?.      0.7
                  temperature
```

## 🎯 使用场景

### 场景 1：用户首次使用
- 未保存任何偏好
- 使用系统默认：`temperature = 0.7`

### 场景 2：用户保存了偏好
- 保存了 `gpt-4-turbo` 的温度为 `0.8`
- 前端不传温度时，自动使用 `0.8`

### 场景 3：前端临时指定
- 用户偏好：`claude-3-opus` = `0.9`
- 前端传入：`temperature = 0.3`
- **本次使用 `0.3`**，不影响已保存的偏好

### 场景 4：多模型配置
```typescript
// 用户可以为不同模型设置不同温度
await api.post('/user-model-preferences', {
  modelId: 'gpt-4-turbo',
  temperature: 0.7  // 适合正式写作
});

await api.post('/user-model-preferences', {
  modelId: 'claude-3-opus',
  temperature: 0.9  // 适合创意写作
});

await api.post('/user-model-preferences', {
  modelId: 'gemini-pro',
  temperature: 0.5  // 适合技术文档
});
```

## 🔧 前端集成示例

### React Hook 示例

```typescript
import { useState, useEffect } from 'react';
import api from '@/services/api';

function useModelPreferences() {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);

  // 获取所有配置
  const fetchAll = async () => {
    const data = await api.get('/user-model-preferences');
    setPreferences(data);
    setLoading(false);
  };

  // 保存/更新配置
  const save = async (modelId: string, temperature: number) => {
    await api.post('/user-model-preferences', {
      modelId,
      temperature,
    });
    await fetchAll();
  };

  // 删除配置
  const remove = async (id: number) => {
    await api.delete(`/user-model-preferences/${id}`);
    await fetchAll();
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { preferences, loading, save, remove, refresh: fetchAll };
}

// 使用
function ModelSettings() {
  const { preferences, save } = useModelPreferences();

  const handleSave = async () => {
    await save('gpt-4-turbo', 0.8);
    toast.success('保存成功');
  };

  return (
    <div>
      {preferences.map(pref => (
        <div key={pref.id}>
          <span>{pref.modelId}</span>
          <span>温度: {pref.temperature}</span>
        </div>
      ))}
    </div>
  );
}
```

## 📝 文件结构

```
backend/src/users/
├── entities/
│   └── user-model-preference.entity.ts    # 数据库实体
├── dto/
│   └── user-model-preference.dto.ts       # 数据传输对象
├── services/
│   └── user-model-preferences.service.ts  # 业务逻辑
├── controllers/
│   └── user-model-preferences.controller.ts # API接口
├── users.module.ts                        # 模块配置
└── USER_MODEL_PREFERENCES.md              # 本文档
```

## ⚠️ 注意事项

1. **唯一性约束**：每个用户对每个模型只能有一个配置
2. **温度范围**：0-2，推荐 0.3-1.0
3. **删除级联**：用户删除时，自动删除所有配置
4. **权限控制**：所有接口需要JWT认证
5. **maxTokens处理**：由后端模型自动决定，不由用户配置

## 🚀 快速开始

1. **运行迁移**
```bash
npm run migration:run
```

2. **测试接口**
```bash
# 保存配置
curl -X POST http://localhost:3000/api/v1/user-model-preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modelId":"gpt-4-turbo","temperature":0.8}'

# 查询配置
curl -X GET http://localhost:3000/api/v1/user-model-preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

3. **集成到生成服务**
- 在 `WritingGenerationService` 中注入 `UserModelPreferencesService`
- 调用 `getPreferenceForGeneration(userId, modelId)` 获取用户偏好
- 应用三层优先级逻辑

---

**完成日期：** 2025-01-24  
**版本：** 1.0.0  
**状态：** ✅ 已完成
