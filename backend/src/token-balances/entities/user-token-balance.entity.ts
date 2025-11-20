import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * 用户字数余额实体
 */
@Entity('user_token_balances')
export class UserTokenBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true, comment: '用户ID' })
  @Index()
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'total_tokens', type: 'bigint', default: 0, comment: '总字数余额' })
  totalTokens: number;

  @Column({ name: 'used_tokens', type: 'bigint', default: 0, comment: '已使用字数' })
  usedTokens: number;

  @Column({ name: 'gift_tokens', type: 'bigint', default: 0, comment: '赠送字数余额' })
  giftTokens: number;

  @Column({ name: 'frozen_tokens', type: 'bigint', default: 0, comment: '冻结字数' })
  frozenTokens: number;

  /** 每日免费额度 */
  @Column({ 
    type: 'bigint', 
    default: 0,
    name: 'daily_free_quota',
    comment: '每日免费额度' 
  })
  dailyFreeQuota: number;

  /** 今日已用免费额度 */
  @Column({ 
    type: 'int', 
    default: 0,
    name: 'daily_used_quota',
    comment: '今日已用免费额度' 
  })
  dailyUsedQuota: number;

  /** 额度重置日期 */
  @Column({ 
    type: 'date', 
    nullable: true,
    name: 'quota_reset_date',
    comment: '额度重置日期' 
  })
  quotaResetDate: Date;

  /** 付费字数余额 */
  @Column({ 
    type: 'bigint', 
    default: 0,
    name: 'paid_tokens',
    comment: '付费字数余额' 
  })
  paidTokens: number;

  @Column({ name: 'last_consumed_at', type: 'timestamp', nullable: true, comment: '最后消费时间' })
  lastConsumedAt: Date;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
