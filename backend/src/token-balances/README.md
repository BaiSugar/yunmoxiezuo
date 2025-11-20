# 字数余额与消耗系统

## 模块概述

本模块负责管理用户的字数余额、记录消耗、处理每日免费额度等功能。

## 目录结构

```
token-balances/
├── controllers/
│   └── token-balances.controller.ts     # 余额管理控制器
├── dto/
│   ├── consumption.dto.ts                # 消耗相关DTO
│   └── ...                               # 其他DTO
├── entities/
│   ├── user-token-balance.entity.ts      # 用户余额实体
│   ├── token-transaction.entity.ts       # 交易流水实体
│   └── token-consumption-record.entity.ts # 消耗记录实体
├── services/
│   ├── token-balances.service.ts         # 余额管理服务
│   ├── token-consumption.service.ts      # 消耗计算服务
│   └── character-counter.service.ts      # 字符统计服务
├── tasks/
│   └── daily-quota-reset.task.ts         # 每日额度重置任务
└── token-balances.module.ts
```

## 核心功能

### 1. 余额管理
- 查询用户余额
- 充值字数
- 消费字数
- 退款字数
- 区分付费和赠送余额

### 2. 消耗计算
- 基于模型倍率计算消耗
- 处理10000字符阈值
- 应用会员特权
- 优先使用每日免费额度

### 3. 每日免费额度
- 自动重置（每天00:00）
- 手动重置（管理员）
- 额度查询

### 4. 消耗记录
- 详细记录每次消耗
- 按来源分类
- 统计分析

## 核心规则

### 消耗计算公式
```
消耗字数 = (输入字符数 ÷ 输入倍率) + (生成字符数 ÷ 输出倍率)
```

### 计算示例
- 输入计算：10000字 ÷ 4倍率 = 2500字
- 输出计算：1000字 ÷ 1倍率 = 1000字
- 总消耗：3500字 = 2500 + 1000

### 消耗优先级
1. ✅ 优先使用每日免费额度
2. ✅ 用完后自动使用付费额度

### 特殊规则
- ⚠️ 合计输入小于10000字符不消耗输入字数
- ⚠️ 继续对话将完整消耗输入字数
- ⚠️ 输入倍率和输出倍率均为0的模型不消耗任何字数（但需余额>0）
- ⚠️ 免费模型无额度消耗
- 🎯 **字符数统计**：
  - **非流式生成**：优先使用 API 返回的 `token` 数据（**包含推理过程等所有输出**）
  - **流式生成**：使用实际文本字符数统计（流式响应限制）
- 🔴 **重要**：使用 thinking 模式（Claude）或推理模式（o1）时，推理过程的 token 也会被正确计费

### 会员特权
- 🎁 **输出完全免费**：会员用户的AI生成输出内容完全免费
- 🎁 **输入免费额度**：每次请求在会员免费字符数内的输入不消耗字数

## 服务说明

### TokenBalancesService

**职责**：管理用户余额的增减

**核心方法**：
- `getOrCreateBalance(userId)` - 获取或创建余额记录
- `recharge(userId, amount, isGift)` - 充值
- `consume(userId, amount, modelName, source)` - 消费
- `refund(userId, amount, source)` - 退款
- `getDailyQuotaInfo(userId)` - 查询每日免费额度
- `resetAllDailyQuotas()` - 批量重置每日额度

### TokenConsumptionService

**职责**：计算并记录字数消耗

**核心方法**：
- `calculateAndConsume(params)` - 计算并消耗（事务）
- `estimateCost(modelId, inputChars, outputChars, userId)` - 预估消耗
- `checkBalance(userId, estimatedCost)` - 检查余额
- `getStatistics(userId, startDate, endDate)` - 查询统计

**计算逻辑**：
```typescript
// 1. 免费模型 → 跳过
if (model.isFree) return 0;

// 2. 倍率为0 → 只校验余额>0
if (model.inputRatio === 0 && model.outputRatio === 0) {
  if (balance <= 0) throw new Error('余额必须>0');
  return 0;
}

// 3. 计算输入消耗
let inputCost = 0;
if (inputChars >= model.minInputChars && model.inputRatio > 0) {
  inputCost = Math.ceil(inputChars / model.inputRatio);
}

// 4. 计算输出消耗
let outputCost = 0;
if (model.outputRatio > 0) {
  outputCost = Math.ceil(outputChars / model.outputRatio);
}

// 5. 应用会员特权
if (memberPlan) {
  if (memberPlan.outputFree) {
    outputCost = 0;
  }
  if (memberPlan.freeInputCharsPerRequest > 0) {
    const freeInputCost = Math.ceil(
      Math.min(inputChars, memberPlan.freeInputCharsPerRequest) / model.inputRatio
    );
    inputCost = Math.max(0, inputCost - freeInputCost);
  }
}

// 6. 总消耗
return inputCost + outputCost;
```

### CharacterCounterService

**职责**：字符数统计和Token转换

**核心方法**：
- `tokenToChars(tokens, language)` - Token转字符数
- `detectLanguage(text)` - 检测语言
- `countChars(text)` - 统计字符数
- `countMessageChars(messages)` - 统计消息数组字符数
- `estimateTokens(text)` - 估算Token数

**转换系数**：
- 中文：1 token ≈ 1.5 字符
- 英文：1 token ≈ 4 字符
- 混合：1 token ≈ 2.5 字符

## 定时任务

### DailyQuotaResetTask

**执行时间**：每天00:00（UTC+8）

**功能**：重置所有用户的 `dailyUsedQuota` 为 0

## 数据库表

### user_token_balances
- 用户余额主表
- 包含总余额、付费余额、赠送余额、每日免费额度等

### token_transactions
- 余额变动流水表
- 记录充值、消费、退款等操作

### token_consumption_records
- 消耗详细记录表
- 记录每次AI调用的消耗明细

## 权限

- `token-consumption:view-records` - 查看消耗记录
- `token-consumption:view-statistics` - 查看消耗统计
- `token-consumption:admin-manage` - 管理用户额度
- `token-consumption:reset-quota` - 重置每日额度

## 使用示例

### 1. 在AI调用中集成消耗

```typescript
// ChatCompletionService.complete()

// 1. 预估消耗
const estimatedCost = await this.tokenConsumptionService.estimateCost(
  model.id,
  inputChars,
  outputChars,
  userId,
);

// 2. 检查余额
const hasEnough = await this.tokenConsumptionService.checkBalance(userId, estimatedCost);
if (!hasEnough) {
  throw new BadRequestException('字数余额不足');
}

// 3. 调用AI
const response = await this.callAI(...);

// 4. 记录实际消耗
await this.tokenConsumptionService.calculateAndConsume({
  userId,
  modelId: model.id,
  inputChars: actualInputChars,
  outputChars: actualOutputChars,
  source: ConsumptionSource.CHAT,
});
```

## 注意事项

1. **事务处理**：余额扣除和记录创建必须在同一事务中
2. **并发控制**：考虑使用乐观锁或悲观锁防止余额并发扣减
3. **性能优化**：考虑使用Redis缓存用户余额
4. **错误处理**：余额不足时应在AI调用前拒绝，避免浪费API调用
5. **日志记录**：所有消耗操作都应记录详细日志

## 相关文档

- [总体规划](../../../docs/字数消耗系统/00-总体规划.md)
- [数据库改造](../../../docs/字数消耗系统/01-数据库改造.md)
- [SQL文件](../../../sql/)
