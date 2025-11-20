import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
} from 'typeorm';
import {
  ChatCompletionSource,
  ProviderAuthType,
  ProviderStatus,
} from '../types';
import type { IProviderConfig, IProviderCapabilities } from '../types';
import { AiModel } from './ai-model.entity';
import { CryptoUtil } from '../../common/utils/crypto.util';

/**
 * AI 提供商实体
 */
@Entity('ai_providers')
export class AiProvider {
  @PrimaryGeneratedColumn()
  id: number;

  /** 提供商名称 */
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  /** 提供商类型 */
  @Column({
    type: 'enum',
    enum: ChatCompletionSource,
  })
  source: ChatCompletionSource;

  /** 提供商显示名称 */
  @Column({ type: 'varchar', length: 200, name: 'display_name' })
  displayName: string;

  /** 提供商描述 */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** 提供商状态 */
  @Column({
    type: 'enum',
    enum: ProviderStatus,
    default: ProviderStatus.ACTIVE,
  })
  status: ProviderStatus;

  /** 提供商配置（JSON） */
  @Column({ type: 'json' })
  config: IProviderConfig;

  /** 提供商能力（JSON） */
  @Column({ type: 'json' })
  capabilities: IProviderCapabilities;

  /** API 密钥（加密存储） */
  @Column({ type: 'text', nullable: true, name: 'api_key' })
  apiKey: string;

  /** API 密钥脱敏显示（不存储到数据库） */
  maskedApiKey?: string;

  /** 额外认证信息（JSON，加密存储） */
  @Column({ type: 'json', nullable: true, name: 'auth_credentials' })
  authCredentials: Record<string, any>;

  /** 是否为默认提供商 */
  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean;

  /** 排序顺序 */
  @Column({ type: 'int', default: 0 })
  order: number;

  /** 所属用户ID（null表示系统级） */
  @Column({ type: 'int', nullable: true, name: 'user_id' })
  userId: number;

  /** 关联的模型 */
  @OneToMany(() => AiModel, (model) => model.provider)
  models: AiModel[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /** 原始解密后的API Key（临时存储，不持久化） */
  private _decryptedApiKey?: string;

  /**
   * 保存前加密敏感信息
   */
  @BeforeInsert()
  @BeforeUpdate()
  encryptSensitiveData() {
    if (this.apiKey && !this.apiKey.includes(':')) {
      // 如果apiKey不包含':'，说明是明文，需要加密
      this.apiKey = CryptoUtil.encrypt(this.apiKey);
    }

    if (this.authCredentials) {
      // 加密额外认证信息中的敏感字段
      const encrypted: Record<string, any> = {};
      for (const [key, value] of Object.entries(this.authCredentials)) {
        if (typeof value === 'string' && value) {
          encrypted[key] = CryptoUtil.encrypt(value);
        } else {
          encrypted[key] = value;
        }
      }
      this.authCredentials = encrypted;
    }
  }

  /**
   * 加载后解密和脱敏
   */
  @AfterLoad()
  decryptAndMaskSensitiveData() {
    if (this.apiKey) {
      // 解密
      this._decryptedApiKey = CryptoUtil.decrypt(this.apiKey);
      // 脱敏显示
      this.maskedApiKey = CryptoUtil.mask(this._decryptedApiKey);
    }

    if (this.authCredentials) {
      // 解密额外认证信息
      const decrypted: Record<string, any> = {};
      for (const [key, value] of Object.entries(this.authCredentials)) {
        if (typeof value === 'string' && value) {
          decrypted[key] = CryptoUtil.decrypt(value);
        } else {
          decrypted[key] = value;
        }
      }
      this.authCredentials = decrypted;
    }
  }

  /**
   * 获取解密后的API Key（仅用于内部使用，如测试连接）
   */
  getDecryptedApiKey(): string | null {
    return this._decryptedApiKey || null;
  }

  /**
   * 转换为安全的返回对象（隐藏敏感信息）
   */
  toSafeObject(): Partial<AiProvider> {
    const { apiKey, authCredentials, _decryptedApiKey, ...safe } = this;
    return {
      ...safe,
      maskedApiKey: this.maskedApiKey,
    };
  }
}
