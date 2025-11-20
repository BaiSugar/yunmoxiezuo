import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CodeType } from '../enums/code-type.enum';
import { MembershipPlan } from '../../memberships/entities/membership-plan.entity';
import { User } from '../../users/entities/user.entity';

/**
 * 卡密实体
 */
@Entity('redemption_codes')
@Index(['isActive'])
export class RedemptionCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true, comment: '卡密码' })
  @Index()
  code: string;

  @Column({
    type: 'enum',
    enum: CodeType,
    comment: '类型',
  })
  type: CodeType;

  @Column({ name: 'membership_plan_id', nullable: true, comment: '会员套餐ID' })
  membershipPlanId: number;

  @ManyToOne(() => MembershipPlan, { nullable: true })
  @JoinColumn({ name: 'membership_plan_id' })
  membershipPlan: MembershipPlan;

  @Column({ name: 'token_amount', type: 'bigint', default: 0, comment: '赠送字数，0表示不赠送' })
  tokenAmount: number;

  @Column({ name: 'batch_id', length: 50, nullable: true, comment: '批次号' })
  @Index()
  batchId: string;

  @Column({ name: 'max_use_count', type: 'int', default: 1, comment: '最大使用次数，1=一次性，-1=无限' })
  maxUseCount: number;

  @Column({ name: 'used_count', type: 'int', default: 0, comment: '已使用次数' })
  usedCount: number;

  @Column({ name: 'valid_from', type: 'timestamp', nullable: true, comment: '生效时间' })
  validFrom: Date;

  @Column({ name: 'valid_to', type: 'timestamp', nullable: true, comment: '过期时间，NULL=永久' })
  validTo: Date;

  @Column({ name: 'is_active', type: 'boolean', default: true, comment: '是否启用' })
  isActive: boolean;

  @Column({ name: 'creator_id', nullable: true, comment: '创建人ID（管理员）' })
  creatorId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @Column({ length: 255, nullable: true, comment: '备注' })
  remark: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
