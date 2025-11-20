import { Injectable, Logger } from '@nestjs/common';

/**
 * 速率限制配置
 */
interface RateLimitConfig {
  windowMs: number;  // 时间窗口（毫秒）
  maxRequests: number;  // 最大请求数
}

/**
 * 用户速率限制记录
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

/**
 * WebSocket 速率限制服务
 * 
 * 功能：
 * 1. 防止恶意客户端频繁发送消息
 * 2. 基于滑动窗口的速率限制
 * 3. 自动清理过期记录
 */
@Injectable()
export class WebSocketRateLimitService {
  private readonly logger = new Logger(WebSocketRateLimitService.name);
  private readonly rateLimits = new Map<string, RateLimitRecord>();
  
  // 默认配置: 每分钟最多60条消息
  private readonly defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000,  // 60秒
    maxRequests: 60,
  };

  constructor() {
    // 每5分钟清理一次过期记录
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * 检查是否超出速率限制
   * @param userId 用户ID
   * @param config 自定义配置（可选）
   * @returns true表示允许，false表示超出限制
   */
  checkLimit(userId: number, config?: Partial<RateLimitConfig>): boolean {
    const key = `user:${userId}`;
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    
    const record = this.rateLimits.get(key);
    
    // 首次请求或已过期
    if (!record || now >= record.resetAt) {
      this.rateLimits.set(key, {
        count: 1,
        resetAt: now + finalConfig.windowMs,
      });
      return true;
    }
    
    // 检查是否超出限制
    if (record.count >= finalConfig.maxRequests) {
      this.logger.warn(`用户 ${userId} 超出速率限制: ${record.count}/${finalConfig.maxRequests}`);
      return false;
    }
    
    // 增加计数
    record.count++;
    return true;
  }

  /**
   * 重置用户的速率限制
   */
  reset(userId: number): void {
    const key = `user:${userId}`;
    this.rateLimits.delete(key);
  }

  /**
   * 清理过期的速率限制记录
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, record] of this.rateLimits.entries()) {
      if (now >= record.resetAt) {
        this.rateLimits.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      this.logger.debug(`清理了 ${cleaned} 条过期的速率限制记录`);
    }
  }

  /**
   * 获取当前限制状态
   */
  getStatus(userId: number): { count: number; limit: number; resetAt: number } | null {
    const key = `user:${userId}`;
    const record = this.rateLimits.get(key);
    
    if (!record) {
      return null;
    }
    
    return {
      count: record.count,
      limit: this.defaultConfig.maxRequests,
      resetAt: record.resetAt,
    };
  }
}

