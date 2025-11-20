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
import { ModelCategory } from './model-category.entity';
import { CryptoUtil } from '../../common/utils/crypto.util';

/**
 * AI 模型状态
 */
export enum ModelStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEPRECATED = 'deprecated',
}

/**
 * 模型定价信息
 */
export interface IModelPricing {
  inputTokenPrice?: number; // 每千token价格
  outputTokenPrice?: number;
  currency?: string;
}

/**
 * 模型限制
 */
export interface IModelLimits {
  maxInputTokens?: number;
  maxOutputTokens?: number;
  maxContextWindow?: number;
  rateLimit?: {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
  };
}

/**
 * AI 模型实体
 */
@Entity('ai_models')
export class AiModel {
  @PrimaryGeneratedColumn()
  id: number;

  /** 模型标识符（如 gpt-4-turbo） */
  @Column({ type: 'varchar', length: 200, name: 'model_id' })
  modelId: string;

  /** 模型显示名称 */
  @Column({ type: 'varchar', length: 200, name: 'display_name' })
  displayName: string;

  /** 模型描述 */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** 模型状态 */
  @Column({
    type: 'enum',
    enum: ModelStatus,
    default: ModelStatus.ACTIVE,
  })
  status: ModelStatus;

  /** 所属提供商ID */
  @Column({ type: 'int', name: 'provider_id' })
  providerId: number;

  /** 关联的提供商 */
  @ManyToOne(() => AiProvider, (provider) => provider.models, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'provider_id' })
  provider: AiProvider;

  /** 所属分类ID（可选） */
  @Column({ type: 'int', nullable: true, name: 'category_id' })
  categoryId: number;

  /** 关联的分类 */
  @ManyToOne(() => ModelCategory, (category) => category.models, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category: ModelCategory;

  /** API Base URL */
  @Column({ type: 'varchar', length: 500, nullable: true, name: 'base_url', comment: 'API Base URL' })
  baseUrl: string;

  /** API Key（加密存储） */
  @Column({ type: 'text', nullable: true, name: 'api_key', comment: 'API Key（加密存储）' })
  apiKey: string;

  /** API Key脱敏显示（不存储到数据库） */
  maskedApiKey?: string;

  /** 原始解密后的API Key（临时存储，不持久化） */
  private _decryptedApiKey?: string;

  /** 模型版本 */
  @Column({ type: 'varchar', length: 100, nullable: true })
  version: string;

  /** 上下文窗口大小 */
  @Column({ type: 'int', nullable: true, name: 'context_window' })
  contextWindow: number;

  /** 最大输出tokens */
  @Column({ type: 'int', nullable: true, name: 'max_output_tokens' })
  maxOutputTokens: number;

  /** 模型定价（JSON） */
  @Column({ type: 'json', nullable: true })
  pricing: IModelPricing;

  /** 模型限制（JSON） */
  @Column({ type: 'json', nullable: true })
  limits: IModelLimits;

  /** 支持的功能标签 */
  @Column({ type: 'simple-array', nullable: true })
  features: string[];

  /** 是否支持流式输出 */
  @Column({ type: 'boolean', default: true, name: 'supports_streaming' })
  supportsStreaming: boolean;

  /** 是否支持工具调用 */
  @Column({ type: 'boolean', default: false, name: 'supports_tools' })
  supportsTools: boolean;

  /** 是否支持视觉输入 */
  @Column({ type: 'boolean', default: false, name: 'supports_vision' })
  supportsVision: boolean;

  /** 是否为默认模型 */
  @Column({ type: 'boolean', default: false, name: 'is_default' })
  isDefault: boolean;

  /** 排序顺序 */
  @Column({ type: 'int', default: 0 })
  order: number;

  /** 所属用户ID（null表示系统级） */
  @Column({ type: 'int', nullable: true, name: 'user_id' })
  userId: number;

  /** 输入倍率 */
  @Column({ 
    type: 'decimal', 
    precision: 8, 
    scale: 2, 
    default: 1.0,
    name: 'input_ratio',
    comment: '输入倍率' 
  })
  inputRatio: number;

  /** 输出倍率 */
  @Column({ 
    type: 'decimal', 
    precision: 8, 
    scale: 2, 
    default: 1.0,
    name: 'output_ratio',
    comment: '输出倍率' 
  })
  outputRatio: number;

  /** 是否为免费模型 */
  @Column({ 
    type: 'boolean', 
    default: false,
    name: 'is_free',
    comment: '是否为免费模型' 
  })
  isFree: boolean;

  /** 最小消耗输入字符数 */
  @Column({ 
    type: 'int', 
    default: 10000,
    name: 'min_input_chars',
    comment: '最小消耗输入字符数' 
  })
  minInputChars: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

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
  toSafeObject(): Partial<AiModel> {
    const { apiKey, _decryptedApiKey, ...safe } = this;
    return {
      ...safe,
      maskedApiKey: this.maskedApiKey,
    };
  }
}
