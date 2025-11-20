import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ApiKey, ApiKeyStatus } from '../entities/api-key.entity';
import {
  RotationStrategy,
  IKeySelectionResult,
  IKeyUsageRecord,
  IKeyHealth,
} from '../types';

/**
 * API Key 轮询服务
 * 实现多种轮询策略，支持负载均衡和故障转移
 */
@Injectable()
export class KeyRotationService {
  private readonly logger = new Logger(KeyRotationService.name);
  
  // 轮询索引缓存（每个提供商维护独立的索引）
  private roundRobinIndexes: Map<number, number> = new Map();
  
  // 错误恢复阈值
  private readonly ERROR_THRESHOLD = 5; // 连续失败5次后标记为错误状态
  private readonly COOLDOWN_DURATION = 5 * 60 * 1000; // 5分钟冷却时间

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  /**
   * 根据策略选择可用的 API Key
   */
  async selectKey(
    providerId: number,
    strategy: RotationStrategy = RotationStrategy.ROUND_ROBIN,
  ): Promise<IKeySelectionResult> {
    // 获取所有可用的 Keys
    const availableKeys = await this.getAvailableKeys(providerId);

    if (availableKeys.length === 0) {
      throw new NotFoundException(
        `提供商 ${providerId} 没有可用的 API Keys`,
      );
    }

    let selectedKey: ApiKey;
    let reason: string;

    switch (strategy) {
      case RotationStrategy.ROUND_ROBIN:
        selectedKey = this.selectByRoundRobin(providerId, availableKeys);
        reason = '轮询策略';
        break;

      case RotationStrategy.RANDOM:
        selectedKey = this.selectByRandom(availableKeys);
        reason = '随机策略';
        break;

      case RotationStrategy.WEIGHTED:
        selectedKey = this.selectByWeighted(availableKeys);
        reason = '加权轮询策略';
        break;

      case RotationStrategy.PRIORITY:
        selectedKey = this.selectByPriority(availableKeys);
        reason = '优先级策略';
        break;

      case RotationStrategy.LEAST_USED:
        selectedKey = this.selectByLeastUsed(availableKeys);
        reason = '最少使用策略';
        break;

      default:
        selectedKey = availableKeys[0];
        reason = '默认策略';
    }

    return {
      key: selectedKey,
      isFallback: false,
      reason,
    };
  }

  /**
   * 获取所有可用的 Keys
   */
  private async getAvailableKeys(providerId: number): Promise<ApiKey[]> {
    const now = new Date();

    // 查询条件：
    // 1. 状态为 ACTIVE
    // 2. 不在冷却期
    const keys = await this.apiKeyRepository.find({
      where: {
        providerId,
        status: ApiKeyStatus.ACTIVE,
      },
      order: {
        priority: 'ASC',
        weight: 'DESC',
      },
    });

    // 过滤掉仍在冷却期的 Key
    return keys.filter(key => {
      if (!key.cooldownUntil) return true;
      return new Date(key.cooldownUntil) < now;
    });
  }

  /**
   * 轮询策略
   */
  private selectByRoundRobin(
    providerId: number,
    keys: ApiKey[],
  ): ApiKey {
    let index = this.roundRobinIndexes.get(providerId) || 0;
    
    // 轮询到下一个
    index = (index + 1) % keys.length;
    this.roundRobinIndexes.set(providerId, index);
    
    return keys[index];
  }

  /**
   * 随机策略
   */
  private selectByRandom(keys: ApiKey[]): ApiKey {
    const randomIndex = Math.floor(Math.random() * keys.length);
    return keys[randomIndex];
  }

  /**
   * 加权轮询策略
   */
  private selectByWeighted(keys: ApiKey[]): ApiKey {
    // 计算总权重
    const totalWeight = keys.reduce((sum, key) => sum + key.weight, 0);
    
    // 随机选择一个权重值
    let random = Math.random() * totalWeight;
    
    // 找到对应的 Key
    for (const key of keys) {
      random -= key.weight;
      if (random <= 0) {
        return key;
      }
    }
    
    return keys[0];
  }

  /**
   * 优先级策略（优先级已在查询时排序）
   */
  private selectByPriority(keys: ApiKey[]): ApiKey {
    return keys[0];
  }

  /**
   * 最少使用策略
   */
  private selectByLeastUsed(keys: ApiKey[]): ApiKey {
    return keys.reduce((least, current) => 
      current.usageCount < least.usageCount ? current : least
    );
  }

  /**
   * 记录 Key 使用
   */
  async recordUsage(record: IKeyUsageRecord): Promise<void> {
    const key = await this.apiKeyRepository.findOne({
      where: { id: record.keyId },
    });

    if (!key) {
      this.logger.warn(`Key ${record.keyId} 不存在，无法记录使用`);
      return;
    }

    // 更新使用次数和最后使用时间
    key.usageCount += 1;
    key.lastUsedAt = record.timestamp;

    if (record.success) {
      // 成功：重置错误计数
      key.errorCount = 0;
      
      // 如果之前是错误状态，恢复为 ACTIVE
      if (key.status === ApiKeyStatus.ERROR) {
        key.status = ApiKeyStatus.ACTIVE;
        this.logger.log(`Key ${key.name} (ID: ${key.id}) 已恢复正常`);
      }
    } else {
      // 失败：增加错误计数
      key.errorCount += 1;
      key.lastErrorAt = record.timestamp;

      this.logger.warn(
        `Key ${key.name} (ID: ${key.id}) 请求失败: ${record.errorMessage}`,
      );

      // 检查是否达到错误阈值
      if (key.errorCount >= this.ERROR_THRESHOLD) {
        key.status = ApiKeyStatus.ERROR;
        this.logger.error(
          `Key ${key.name} (ID: ${key.id}) 连续失败 ${key.errorCount} 次，已标记为错误状态`,
        );
      }

      // 检查是否触发速率限制
      if (record.errorMessage?.includes('rate limit') || record.errorMessage?.includes('429')) {
        key.status = ApiKeyStatus.COOLDOWN;
        key.cooldownUntil = new Date(Date.now() + this.COOLDOWN_DURATION);
        this.logger.warn(
          `Key ${key.name} (ID: ${key.id}) 触发速率限制，冷却至 ${key.cooldownUntil}`,
        );
      }
    }

    await this.apiKeyRepository.save(key);
  }

  /**
   * 获取所有 Keys 的健康状态
   */
  async getKeysHealth(providerId?: number): Promise<IKeyHealth[]> {
    const where = providerId ? { providerId } : {};
    const keys = await this.apiKeyRepository.find({
      where,
      relations: ['provider'],
    });

    return keys.map(key => {
      const errorRate = key.usageCount > 0
        ? (key.errorCount / key.usageCount) * 100
        : 0;

      const isHealthy = 
        key.status === ApiKeyStatus.ACTIVE &&
        errorRate < 10 && // 错误率低于10%
        (!key.cooldownUntil || new Date(key.cooldownUntil) < new Date());

      return {
        keyId: key.id,
        keyName: key.name,
        status: key.status,
        isHealthy,
        errorRate,
        lastUsed: key.lastUsedAt,
        lastError: key.lastErrorAt,
        usageCount: key.usageCount,
        errorCount: key.errorCount,
        cooldownUntil: key.cooldownUntil,
      };
    });
  }

  /**
   * 手动恢复错误状态的 Key
   */
  async recoverKey(keyId: number): Promise<void> {
    const key = await this.apiKeyRepository.findOne({
      where: { id: keyId },
    });

    if (!key) {
      throw new NotFoundException(`Key ${keyId} 不存在`);
    }

    key.status = ApiKeyStatus.ACTIVE;
    key.errorCount = 0;
    key.cooldownUntil = null;

    await this.apiKeyRepository.save(key);
    
    this.logger.log(`Key ${key.name} (ID: ${key.id}) 已手动恢复`);
  }

  /**
   * 清理冷却期已过的 Keys
   */
  async cleanupCooldowns(): Promise<void> {
    const now = new Date();
    
    const cooldownKeys = await this.apiKeyRepository.find({
      where: {
        status: ApiKeyStatus.COOLDOWN,
        cooldownUntil: LessThan(now),
      },
    });

    for (const key of cooldownKeys) {
      key.status = ApiKeyStatus.ACTIVE;
      key.cooldownUntil = null;
      await this.apiKeyRepository.save(key);
      
      this.logger.log(`Key ${key.name} (ID: ${key.id}) 冷却期结束，已恢复`);
    }
  }

  /**
   * 重置使用统计
   */
  async resetStatistics(keyId?: number): Promise<void> {
    if (keyId) {
      await this.apiKeyRepository.update(keyId, {
        usageCount: 0,
        errorCount: 0,
      });
    } else {
      await this.apiKeyRepository.update({}, {
        usageCount: 0,
        errorCount: 0,
      });
    }
  }
}
