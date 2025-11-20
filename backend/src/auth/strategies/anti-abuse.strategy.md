# 邀请系统防刷策略

## 🎯 核心原则

**不限制邀请次数**，但通过多种手段防止恶意刷号。

---

## 🛡️ 防刷机制

### 1. IP限制 ⭐ 推荐

**策略**: 同一IP在1小时内最多注册3个账号

**实现**: 
- 使用 `RegisterRateLimitGuard`
- 基于Redis计数
- 支持代理IP识别（X-Forwarded-For, X-Real-IP）

**配置**:
```typescript
// 在 AuthController 的 register 方法上添加
@UseGuards(RegisterRateLimitGuard)
async register(@Body() dto: RegisterDto) { ... }
```

**优点**:
- ✅ 有效防止单人刷号
- ✅ 不影响正常用户
- ✅ 可配置阈值

**缺点**:
- ⚠️ 可能误伤公司/学校等共享IP用户
- ⚠️ 可换IP绕过

---

### 2. 邮箱验证（延迟奖励）⭐ 强烈推荐

**策略**: 注册时不立即发放邀请奖励，等邮箱验证后才发放

**实现**:
```typescript
// 注册时：创建邀请记录但不发放奖励
const invitation = await createInvitation({ 
  rewarded: false  // 标记为未发放
});

// 邮箱验证时：发放奖励
async verifyEmail(token: string) {
  // 验证邮箱
  await markEmailVerified(userId);
  
  // 发放邀请奖励
  const invitation = await findPendingInvitation(userId);
  if (invitation && !invitation.inviteeRewarded) {
    await issueReward(invitation);
  }
}
```

**优点**:
- ✅ 非常有效（需要真实邮箱）
- ✅ 提高用户质量
- ✅ 符合GDPR等法规要求

**缺点**:
- ⚠️ 增加用户注册步骤
- ⚠️ 需要实现邮件服务

---

### 3. 设备指纹

**策略**: 同一设备短时间内只能注册有限次数

**实现**: 
```typescript
// 前端生成设备指纹
const deviceId = await generateDeviceFingerprint();

// 后端验证
const recentRegistrations = await countRecentRegistrations(deviceId);
if (recentRegistrations > 3) {
  throw new BadRequestException('该设备注册次数过多');
}
```

**优点**:
- ✅ 更准确识别设备
- ✅ 难以绕过

**缺点**:
- ⚠️ 实现复杂
- ⚠️ 隐私问题

---

### 4. 人机验证

**策略**: 注册时要求完成验证码（Google reCAPTCHA / hCaptcha）

**实现**:
```typescript
@Post('register')
async register(
  @Body() dto: RegisterDto,
  @Body('captchaToken') captchaToken: string,
) {
  // 验证人机验证码
  await this.verifyCaptcha(captchaToken);
  
  // 继续注册流程
  return this.authService.register(dto);
}
```

**优点**:
- ✅ 防止自动化脚本
- ✅ 业界标准方案

**缺点**:
- ⚠️ 影响用户体验
- ⚠️ 可能需要付费

---

### 5. 手机验证（可选）

**策略**: 要求绑定手机号，发送验证码

**优点**:
- ✅ 最有效的防刷手段
- ✅ 实名制

**缺点**:
- ⚠️ 增加用户门槛
- ⚠️ 短信成本
- ⚠️ 可能降低注册转化率

---

## 📊 推荐组合方案

### 方案A：轻量级（推荐） ⭐

```
IP限制 + 邮箱验证延迟发放奖励
```

**特点**:
- 实现简单
- 用户体验好
- 防刷效果80%

### 方案B：中等强度

```
IP限制 + 邮箱验证 + 人机验证
```

**特点**:
- 防刷效果95%
- 略微影响用户体验

### 方案C：最强防护（不推荐）

```
IP限制 + 邮箱验证 + 手机验证 + 人机验证
```

**特点**:
- 防刷效果99%
- 严重影响注册转化率
- 适合高价值产品

---

## 🚀 实施步骤

### 第一阶段：IP限制（立即实施）

1. 安装依赖
   ```bash
   npm install @nestjs-modules/ioredis ioredis
   ```

2. 配置Redis连接

3. 在 `AuthController` 添加 Guard
   ```typescript
   @UseGuards(RegisterRateLimitGuard)
   @Post('register')
   async register(@Body() dto: RegisterDto) { ... }
   ```

### 第二阶段：邮箱验证延迟奖励

1. 修改 `handleInviteReward` 方法
   - 创建邀请记录但标记 `rewarded: false`
   - 不立即发放奖励

2. 在邮箱验证接口中发放奖励

### 第三阶段：人机验证（可选）

根据实际刷号情况决定是否启用

---

## ⚙️ 配置参数

```typescript
// config/anti-abuse.config.ts
export default {
  // IP限制
  ipRateLimit: {
    enabled: true,
    timeWindow: 3600,  // 1小时（秒）
    maxAttempts: 3,    // 最大注册次数
  },
  
  // 邮箱验证
  emailVerification: {
    required: true,           // 是否必须验证邮箱
    delayReward: true,        // 是否延迟发放奖励
    rewardExpiry: 604800,     // 奖励有效期（7天）
  },
  
  // 人机验证
  captcha: {
    enabled: false,           // 默认关闭
    provider: 'recaptcha',    // recaptcha | hcaptcha
  },
};
```

---

## 📈 监控指标

需要监控以下数据以调整策略：

1. **IP重复注册率**: 同一IP注册多个账号的比例
2. **邮箱验证率**: 注册后完成邮箱验证的比例
3. **奖励发放延迟**: 从注册到发放奖励的平均时间
4. **异常账号比例**: 被标记为可疑的账号比例

---

## 🔍 检测异常账号

```sql
-- 检测同一IP注册的账号
SELECT 
  COUNT(*) as count,
  DATE(created_at) as date
FROM users
WHERE register_ip = '1.2.3.4'
GROUP BY DATE(created_at);

-- 检测未验证邮箱的邀请奖励
SELECT 
  u.id,
  u.email,
  u.email_verified,
  ui.invitee_rewarded,
  ui.created_at
FROM users u
JOIN user_invitations ui ON u.id = ui.invitee_id
WHERE u.email_verified = 0 
  AND ui.invitee_rewarded = 1;
```

---

## ✅ 结论

**推荐使用方案A（轻量级）**：
- ✅ IP限制 - 立即实施
- ✅ 邮箱验证延迟奖励 - 第二阶段
- ⏸️ 人机验证 - 根据需要启用

这样既不限制邀请次数，又能有效防止恶意刷号。
