import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import { AiProvider } from './ai-provider.entity';
import { CryptoUtil } from '../../common/utils/crypto.util';

/**
 * API Key 状态
 */
export enum ApiKeyStatus {
  ACTIVE = 'active',       // 可用
  INACTIVE = 'inactive',   // 已禁用
  ERROR = 'error',         // 错误（超出限额、无效等）
  COOLDOWN = 'cooldown',   // 冷却中（触发速率限制）
}

/**
 * API Key 实体
 * 支持为每个提供商配置多个 API Keys，实现负载均衡和故障转移
 */
@Entity('ai_api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn()
  id: number;

  /** 所属提供商 */
  @ManyToOne(() => AiProvider, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'provider_id' })
  provider: AiProvider;

  @Column({ type: 'int', name: 'provider_id' })
  providerId: number;

  /** Key 名称（用于标识） */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  /** API 密钥（加密存储） */
  @Column({ type: 'text' })
  key: string;

  /** Key 状态 */
  @Column({
    type: 'enum',
    enum: ApiKeyStatus,
    default: ApiKeyStatus.ACTIVE,
  })
  status: ApiKeyStatus;

  /** 权重（用于加权轮询，默认为1） */
  @Column({ type: 'int', default: 1 })
  weight: number;

  /** 优先级（数字越小优先级越高，默认为0） */
  @Column({ type: 'int', default: 0 })
  priority: number;

  /** 速率限制：每分钟请求数 */
  @Column({ type: 'int', nullable: true, name: 'requests_per_minute' })
  requestsPerMinute: number;

  /** 速率限制：每分钟 Token 数 */
  @Column({ type: 'int', nullable: true, name: 'tokens_per_minute' })
  tokensPerMinute: number;

  /** 当前使用次数（用于统计） */
  @Column({ type: 'int', default: 0, name: 'usage_count' })
  usageCount: number;

  /** 错误次数（连续失败次数） */
  @Column({ type: 'int', default: 0, name: 'error_count' })
  errorCount: number;

  /** 最后使用时间 */
  @Column({ type: 'timestamp', nullable: true, name: 'last_used_at' })
  lastUsedAt: Date | null;

  /** 最后错误时间 */
  @Column({ type: 'timestamp', nullable: true, name: 'last_error_at' })
  lastErrorAt: Date | null;

  /** 冷却结束时间（速率限制触发后） */
  @Column({ type: 'timestamp', nullable: true, name: 'cooldown_until' })
  cooldownUntil: Date | null;

  /** 备注 */
  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  /** 解密后的API Key（临时存储，不持久化） */
  private _decryptedKey?: string;

  /**
   * 保存前加密API Key
   */
  @BeforeInsert()
  @BeforeUpdate()
  encryptKey() {
    if (this.key && !this.key.includes(':')) {
      // 如果key不包含':'，说明是明文，需要加密
      this.key = CryptoUtil.encrypt(this.key);
    }
  }

  /**
   * 加载后解密API Key
   */
  @AfterLoad()
  decryptKey() {
    if (this.key) {
      this._decryptedKey = CryptoUtil.decrypt(this.key);
    }
  }

  /**
   * 获取解密后的API Key
   */
  getDecryptedKey(): string | null {
    return this._decryptedKey || null;
  }
}
