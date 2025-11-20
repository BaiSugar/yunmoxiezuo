import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';
import { PromptContent } from './prompt-content.entity';
import { PromptPermission } from './prompt-permission.entity';
import { PromptApplication } from './prompt-application.entity';

export enum PromptStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('prompts')
@Index(['authorId'])
@Index(['categoryId'])
@Index(['hotValue'])
@Index(['isPublic', 'status'])
export class Prompt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, comment: '提示词名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '提示词描述' })
  description: string;

  @Column({ name: 'is_public', type: 'boolean', default: true, comment: '是否公开（提示词本身的可见性）' })
  isPublic: boolean;

  @Column({ name: 'is_content_public', type: 'boolean', default: true, comment: '内容是否公开' })
  isContentPublic: boolean;

  @Column({ name: 'require_application', type: 'boolean', default: false, comment: '是否需要申请才能使用' })
  requireApplication: boolean;

  @Column({ name: 'is_banned', type: 'boolean', default: false, comment: '是否被封禁' })
  isBanned: boolean;

  @Column({ name: 'banned_reason', type: 'text', nullable: true, comment: '封禁原因' })
  bannedReason: string | null;

  @Column({ name: 'banned_at', type: 'datetime', nullable: true, comment: '封禁时间' })
  bannedAt: Date | null;

  @Column({ name: 'needs_review', type: 'boolean', default: false, comment: '是否需要管理员审核才能发布' })
  needsReview: boolean;

  @Column({ name: 'review_snapshot', type: 'json', nullable: true, comment: '审核快照（保存举报前的内容用于对比）' })
  reviewSnapshot?: {
    name: string;
    description: string;
    contents: any[];
    snapshotAt: Date;
  } | null;

  @Column({ name: 'review_submitted_at', type: 'datetime', nullable: true, comment: '提交审核时间（用于区分是否已提交审核）' })
  reviewSubmittedAt: Date | null;

  @Column({ name: 'author_id', type: 'int', comment: '作者ID' })
  authorId: number;

  @Column({ name: 'category_id', type: 'int', nullable: true, comment: '分类ID' })
  categoryId: number;

  @Column({ name: 'hot_value', type: 'int', default: 0, comment: '热度值' })
  hotValue: number;

  @Column({ name: 'view_count', type: 'int', default: 0, comment: '查看次数' })
  viewCount: number;

  @Column({ name: 'use_count', type: 'int', default: 0, comment: '使用次数' })
  useCount: number;

  @Column({ name: 'like_count', type: 'int', default: 0, comment: '点赞次数' })
  likeCount: number;

  @Column({
    type: 'enum',
    enum: PromptStatus,
    default: PromptStatus.DRAFT,
    comment: '状态',
  })
  status: PromptStatus;

  @Column({
    name: 'roleplay_config',
    type: 'json',
    nullable: true,
    comment: '角色扮演配置（包含世界书条目）',
  })
  roleplayConfig?: object;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // 关联作者
  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  // 关联分类
  @ManyToOne(() => Category, (category) => category.prompts)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  // 关联提示词内容
  @OneToMany(() => PromptContent, (content) => content.prompt, { cascade: true })
  contents?: PromptContent[];

  // 关联权限
  @OneToMany(() => PromptPermission, (permission) => permission.prompt)
  permissions?: PromptPermission[];

  // 关联申请
  @OneToMany(() => PromptApplication, (application) => application.prompt)
  applications?: PromptApplication[];

  // 动态字段（不存储在数据库，由查询时注入）
  isLiked?: boolean;
  isFavorited?: boolean;
  pendingApplicationsCount?: number;
}
