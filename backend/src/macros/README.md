# 宏（参数替换）系统

## 概述

宏系统提供了完整的 SillyTavern 风格参数替换功能，用于在角色卡、世界书、提示词等内容中动态替换占位符。

## 模块结构

```
macros/
├── enums/                    # 枚举定义
│   ├── macro-type.enum.ts   # 宏类型和替换阶段
│   └── index.ts
├── interfaces/               # 接口定义
│   ├── macro-context.interface.ts  # 宏上下文和处理器接口
│   └── index.ts
├── services/                 # 服务实现
│   ├── character-macro.service.ts      # 角色相关宏
│   ├── time-macro.service.ts           # 时间相关宏
│   ├── conversation-macro.service.ts   # 对话相关宏
│   ├── random-macro.service.ts         # 随机与计算宏
│   ├── text-macro.service.ts           # 文本处理宏
│   ├── variable-macro.service.ts       # 变量宏
│   ├── macro-replacer.service.ts       # 主替换服务
│   └── index.ts
├── macros.module.ts          # 模块定义
├── index.ts                  # 模块导出
└── README.md                 # 本文档
```

## 设计原则

### 1. 模块化

每种类型的宏处理逻辑独立成一个服务文件：

- **CharacterMacroService**: 处理 `{{char}}`, `{{user}}` 等角色相关宏
- **TimeMacroService**: 处理 `{{time}}`, `{{date}}` 等时间相关宏
- **ConversationMacroService**: 处理 `{{lastMessage}}` 等对话相关宏
- **RandomMacroService**: 处理 `{{roll:1d20}}`, `{{random::}}` 等随机宏
- **TextMacroService**: 处理 `{{trim}}` 和管道操作宏
- **VariableMacroService**: 处理 `{{getvar::}}`, `{{setvar::}}` 变量宏

### 2. 高内聚，低耦合

- 每个服务独立处理自己负责的宏类型
- 通过 `MacroProcessor` 接口统一行为
- 主服务 `MacroReplacerService` 协调所有处理器

### 3. 清晰的替换顺序

宏替换按以下顺序执行（在 `MacroReplacerService.replaceAll` 中定义）：

1. **静态宏**（角色、用户名）- 基础信息
2. **变量宏**（setvar/getvar）- 变量存储
3. **对话引用宏** - 上下文信息
4. **时间宏** - 动态时间
5. **随机/计算宏** - 随机生成
6. **文本处理宏** - 最终格式化

## 使用方法

### 基本用法

```typescript
import { MacroReplacerService, MacroContext } from './macros';

// 注入服务
constructor(
  private readonly macroReplacer: MacroReplacerService,
) {}

// 创建上下文
const context: MacroContext = {
  userId: 1,
  userName: '小明',              // 来自用户资料的 nickname 字段
  characterName: '艾莉娅',
  characterPrompt: '艾莉娅是一位精灵法师...',
};

// 替换宏
const text = '{{char}}对{{user}}说："现在是{{time}}"';
const result = await this.macroReplacer.replace(text, context);
// 结果: "艾莉娅对小明说："现在是14:35""
```

### 分阶段替换

```typescript
import { MacroReplacementStage } from './macros';

// 加载时：只替换静态宏
const loadTimeResult = await this.macroReplacer.replace(
  text,
  context,
  MacroReplacementStage.LOAD,
);

// 构建时：替换上下文宏
const buildTimeResult = await this.macroReplacer.replace(
  text,
  context,
  MacroReplacementStage.BUILD,
);

// 发送前：替换所有动态宏
const sendTimeResult = await this.macroReplacer.replace(
  text,
  context,
  MacroReplacementStage.BEFORE_SEND,
);
```

### 批量替换

```typescript
const texts = [
  '{{char}}的描述',
  '{{user}}的人设',
  '场景：{{char}}和{{user}}在{{time}}见面',
];

const results = await this.macroReplacer.replaceMultiple(texts, context);
```

## 支持的宏

### 角色相关

| 宏                   | 说明                               | 示例          |
| -------------------- | ---------------------------------- | ------------- |
| `{{char}}`           | 角色名                             | 艾莉娅        |
| `{{user}}`           | 用户显示名称（来自 User.nickname） | 小明          |
| `{{charIfNotGroup}}` | 单聊时角色名，群聊时为空           | 艾莉娅 / (空) |
| `{{charPrompt}}`     | 角色卡完整提示词                   | 完整描述      |

### 时间相关

| 宏            | 说明        | 示例                |
| ------------- | ----------- | ------------------- |
| `{{time}}`    | 当前时间    | 14:35               |
| `{{date}}`    | 当前日期    | 2025年10月23日      |
| `{{weekday}}` | 星期几      | 星期三              |
| `{{isotime}}` | ISO格式时间 | 2025-10-23T14:35:00 |

### 对话相关

| 宏                    | 说明             |
| --------------------- | ---------------- |
| `{{lastMessage}}`     | 最后一条消息内容 |
| `{{lastMessageId}}`   | 最后一条消息ID   |
| `{{lastCharMessage}}` | 角色最后一条消息 |
| `{{lastUserMessage}}` | 用户最后一条消息 |
| `{{currentSwipeId}}`  | 当前swipe索引    |

### 随机与计算

| 宏                         | 说明         | 示例                      |
| -------------------------- | ------------ | ------------------------- |
| `{{roll:公式}}`            | 骰子         | `{{roll:1d20}}` → 15      |
| `{{random::选项1::选项2}}` | 随机选择     | `{{random::晴::雨}}` → 雨 |
| `{{pick::变量名}}`         | 从列表随机选 | 配合变量使用              |

### 文本处理

| 宏                  | 说明             |
| ------------------- | ---------------- |
| `{{trim}}`          | 去除前后空格     |
| `{{trim::文本}}`    | 去除指定文本空格 |
| `{{宏::uppercase}}` | 转大写           |
| `{{宏::lowercase}}` | 转小写           |
| `{{宏::length}}`    | 获取长度         |

### 变量

| 宏                       | 说明       | 示例                     |
| ------------------------ | ---------- | ------------------------ |
| `{{getvar::变量名}}`     | 获取变量值 | `{{getvar::score}}`      |
| `{{setvar::变量名::值}}` | 设置变量   | `{{setvar::score::100}}` |

## 集成到其他模块

### 在角色卡模块中使用

```typescript
// character-cards.service.ts
import { MacroReplacerService, MacroContext } from '../macros';

constructor(
  private readonly macroReplacer: MacroReplacerService,
) {}

async processCharacterCard(card: CharacterCard, userId: number) {
  const context: MacroContext = {
    userId,
    userName: user.nickname,
    characterName: card.name,
  };

  // 替换描述中的宏
  card.description = await this.macroReplacer.replace(
    card.description,
    context,
  );

  return card;
}
```

### 在提示词模块中使用

```typescript
// prompts.service.ts
import { MacroReplacerService, MacroContext } from '../macros';

async buildPrompt(prompt: Prompt, context: MacroContext) {
  const contents = await this.macroReplacer.replaceMultiple(
    prompt.contents.map(c => c.content),
    context,
  );

  return contents.join('\n');
}
```

## 扩展新宏

如需添加新的宏类型：

1. 创建新的服务文件实现 `MacroProcessor` 接口
2. 在 `MacrosModule` 中注册新服务
3. 在 `MacroReplacerService.replaceAll` 中添加调用

示例：

```typescript
// new-macro.service.ts
import { Injectable } from '@nestjs/common';
import { MacroProcessor, MacroContext } from '../interfaces';

@Injectable()
export class NewMacroService implements MacroProcessor {
  process(text: string, context: MacroContext): string {
    // 实现宏替换逻辑
    return text.replace(/\{\{newMacro\}\}/gi, 'replacement');
  }

  getSupportedMacros(): string[] {
    return ['newMacro'];
  }
}
```

## 注意事项

1. **{{user}} 来源**: `{{user}}` 宏替换为用户资料中的 `nickname` 字段，而不是 `username`
2. **替换顺序**: 严格按照文档定义的顺序执行，避免相互干扰
3. **性能**: 大文本替换时注意性能，可以使用分阶段替换减少计算
4. **嵌套宏**: 支持2-3层嵌套，但不建议过度使用
5. **变量作用域**: 变量存储在 `MacroContext.variables` 中，仅在当前上下文有效

## 测试

建议为每个宏处理服务编写单元测试：

```typescript
describe('CharacterMacroService', () => {
  let service: CharacterMacroService;

  beforeEach(() => {
    service = new CharacterMacroService();
  });

  it('should replace {{char}} macro', () => {
    const text = '{{char}}是一位法师';
    const context: MacroContext = {
      characterName: '艾莉娅',
    };

    const result = service.process(text, context);
    expect(result).toBe('艾莉娅是一位法师');
  });
});
```
