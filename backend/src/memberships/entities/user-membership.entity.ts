import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { MembershipPlan } from './membership-plan.entity';
import { MembershipSource } from '../enums/membership-source.enum';

/**
 * 用户会员记录实体
 */
@Entity('user_memberships')
@Index(['userId', 'isActive'])
@Index(['endDate'])
export class UserMembership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', comment: '用户ID' })
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'plan_id', comment: '套餐ID' })
  planId: number;

  @ManyToOne(() => MembershipPlan)
  @JoinColumn({ name: 'plan_id' })
  plan: MembershipPlan;

  @Column({ name: 'level', type: 'int', comment: '会员等级（冗余字段，便于查询）' })
  level: number;

  @Column({ name: 'start_date', type: 'timestamp', comment: '生效时间' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp', nullable: true, comment: '过期时间，NULL表示永久' })
  endDate: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: '是否生效中' })
  isActive: boolean;

  @Column({
    name: 'source',
    type: 'enum',
    enum: MembershipSource,
    comment: '来源',
  })
  source: MembershipSource;

  @Column({ name: 'order_id', nullable: true, comment: '关联订单ID' })
  orderId: number;

  @Column({ name: 'redeem_code_id', nullable: true, comment: '关联卡密ID' })
  redeemCodeId: number;

  @Column({ name: 'auto_renew', type: 'boolean', default: false, comment: '是否自动续费' })
  autoRenew: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
