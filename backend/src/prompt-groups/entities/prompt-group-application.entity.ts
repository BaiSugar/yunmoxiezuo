import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PromptGroup } from './prompt-group.entity';
import { User } from '../../users/entities/user.entity';

export enum PromptGroupApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * 提示词组申请实体
 */
@Entity('prompt_group_applications')
@Index(['groupId'])
@Index(['userId'])
@Index(['status'])
@Index(['groupId', 'userId'], { unique: true })
export class PromptGroupApplication {
  @PrimaryGeneratedColumn({ comment: '主键' })
  id: number;

  @Column({ name: 'group_id', type: 'int', comment: '提示词组ID' })
  groupId: number;

  @ManyToOne(() => PromptGroup, (group) => group.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: PromptGroup;

  @Column({ name: 'user_id', type: 'int', comment: '申请者ID' })
  userId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', nullable: true, comment: '申请理由' })
  reason: string | null;

  @Column({
    type: 'enum',
    enum: PromptGroupApplicationStatus,
    default: PromptGroupApplicationStatus.PENDING,
    comment: '申请状态',
  })
  status: PromptGroupApplicationStatus;

  @CreateDateColumn({ name: 'created_at', comment: '申请时间' })
  createdAt: Date;

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true, comment: '审核时间' })
  reviewedAt: Date | null;

  @Column({ name: 'reviewed_by', type: 'int', nullable: true, comment: '审核者ID' })
  reviewedBy: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User | null;

  @Column({ name: 'review_note', type: 'text', nullable: true, comment: '审核备注' })
  reviewNote: string | null;
}

