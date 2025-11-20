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
import { Prompt } from './prompt.entity';

export enum ReportStatus {
  PENDING = 'pending',      // 待审核
  APPROVED = 'approved',    // 已批准（确认违规）
  REJECTED = 'rejected',    // 已驳回（不违规）
}

export enum ReportReason {
  SPAM = 'spam',                    // 垃圾信息
  INAPPROPRIATE = 'inappropriate',  // 不当内容
  VIOLENCE = 'violence',            // 暴力内容
  HATE_SPEECH = 'hate_speech',      // 仇恨言论
  PORNOGRAPHY = 'pornography',      // 色情内容
  COPYRIGHT = 'copyright',          // 版权侵犯
  FRAUD = 'fraud',                  // 欺诈内容
  OTHER = 'other',                  // 其他
}

@Entity('prompt_reports')
@Index(['promptId'])
@Index(['reporterId'])
@Index(['status'])
export class PromptReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'prompt_id', type: 'int', comment: '被举报的提示词ID' })
  promptId: number;

  @Column({ name: 'reporter_id', type: 'int', comment: '举报人ID' })
  reporterId: number;

  @Column({
    type: 'enum',
    enum: ReportReason,
    comment: '举报原因类型',
  })
  reason: ReportReason;

  @Column({ type: 'text', nullable: true, comment: '详细描述' })
  description: string | null;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
    comment: '处理状态',
  })
  status: ReportStatus;

  @Column({ name: 'reviewer_id', type: 'int', nullable: true, comment: '审核人ID' })
  reviewerId: number | null;

  @Column({ name: 'review_note', type: 'text', nullable: true, comment: '审核备注' })
  reviewNote: string | null;

  @Column({ name: 'reviewed_at', type: 'datetime', nullable: true, comment: '审核时间' })
  reviewedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 关联被举报的提示词
  @ManyToOne(() => Prompt)
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;

  // 关联举报人
  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  // 关联审核人
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;
}

