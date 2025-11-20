import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 会员套餐实体
 */
@Entity('membership_plans')
@Index(['isActive', 'sort'])
export class MembershipPlan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name', length: 50, comment: '套餐名称' })
  name: string;

  @Column({ 
    name: 'type', 
    type: 'varchar', 
    length: 50,
    default: 'basic',
    comment: '套餐类型标识（basic, premium, vip等）' 
  })
  @Index()
  type: string;

  @Column({ name: 'level', type: 'int', comment: '会员等级，数字越大权限越高' })
  @Index()
  level: number;

  @Column({ name: 'price', type: 'decimal', precision: 10, scale: 2, comment: '价格（元）' })
  price: number;

  @Column({ name: 'duration', type: 'int', comment: '有效期（天数），0表示永久' })
  duration: number;

  @Column({ name: 'token_quota', type: 'bigint', comment: '赠送字数（tokens）' })
  tokenQuota: number;

  @Column({
    name: 'daily_token_limit',
    type: 'int',
    default: 0,
    comment: '每日字数上限，0表示无限制',
  })
  dailyTokenLimit: number;

  @Column({ name: 'max_concurrent_chats', type: 'int', default: 1, comment: '最大并发对话数' })
  maxConcurrentChats: number;

  @Column({ name: 'can_use_advanced_models', type: 'boolean', default: false, comment: '是否可使用高级模型' })
  canUseAdvancedModels: boolean;

  @Column({ name: 'priority', type: 'int', default: 5, comment: '队列优先级（1-10）' })
  priority: number;

  @Column({ name: 'features', type: 'json', nullable: true, comment: '其他权益（JSON格式）' })
  features: Record<string, any>;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: '是否上架' })
  isActive: boolean;

  @Column({ name: 'sort', type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ name: 'description', type: 'text', nullable: true, comment: '套餐描述' })
  description: string;

  @Column({ name: 'purchase_url', type: 'varchar', length: 500, nullable: true, comment: '购买地址' })
  purchaseUrl: string;

  /** 每次请求免费输入字符数（会员特权） */
  @Column({
    type: 'int',
    default: 0,
    name: 'free_input_chars_per_request',
    comment: '每次请求免费输入字符数',
  })
  freeInputCharsPerRequest: number;

  /** 输出是否完全免费（会员特权） */
  @Column({
    type: 'boolean',
    default: false,
    name: 'output_free',
    comment: '输出是否完全免费',
  })
  outputFree: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
