import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TransactionType } from '../enums/transaction-type.enum';

/**
 * 字数流水记录实体
 */
@Entity('token_transactions')
@Index(['userId', 'createdAt'])
export class TokenTransaction {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', comment: '用户ID' })
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: TransactionType,
    comment: '类型',
  })
  @Index()
  type: TransactionType;

  @Column({ type: 'bigint', comment: '变动数量（正数=增加，负数=减少）' })
  amount: number;

  @Column({ name: 'balance_before', type: 'bigint', comment: '变动前余额' })
  balanceBefore: number;

  @Column({ name: 'balance_after', type: 'bigint', comment: '变动后余额' })
  balanceAfter: number;

  @Column({ length: 50, comment: '来源' })
  source: string;

  @Column({ name: 'related_id', nullable: true, comment: '关联ID（订单ID、卡密ID等）' })
  relatedId: number;

  @Column({ name: 'model_name', length: 100, nullable: true, comment: '使用的模型（消费时记录）' })
  modelName: string;

  @Column({ length: 255, nullable: true, comment: '备注' })
  remark: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;
}
