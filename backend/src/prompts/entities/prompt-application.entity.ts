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
import { Prompt } from './prompt.entity';
import { User } from '../../users/entities/user.entity';

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('prompt_applications')
@Index(['promptId', 'status'])
@Index(['userId'])
export class PromptApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'prompt_id', type: 'int', comment: '提示词ID' })
  promptId: number;

  @Column({ name: 'user_id', type: 'int', comment: '申请者ID' })
  userId: number;

  @Column({ type: 'text', nullable: true, comment: '申请理由' })
  reason: string;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.PENDING,
    comment: '申请状态',
  })
  status: ApplicationStatus;

  @Column({ name: 'reviewed_by', type: 'int', nullable: true, comment: '审核者ID' })
  reviewedBy?: number;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true, comment: '审核时间' })
  reviewedAt?: Date;

  @Column({ name: 'review_note', type: 'text', nullable: true, comment: '审核备注' })
  reviewNote?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 关联提示词
  @ManyToOne(() => Prompt, (prompt) => prompt.applications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;

  // 关联申请者
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 关联审核者
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User;
}
