import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../prompts/entities/category.entity';
import { PromptGroupItem } from './prompt-group-item.entity';
import { PromptGroupPermission } from './prompt-group-permission.entity';
import { PromptGroupApplication } from './prompt-group-application.entity';
import { PromptGroupLike } from './prompt-group-like.entity';

export enum PromptGroupStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/**
 * 提示词组实体
 */
@Entity('prompt_groups')
@Index(['userId'])
@Index(['categoryId'])
@Index(['hotValue'])
@Index(['isPublic', 'status'])
export class PromptGroup {
  @PrimaryGeneratedColumn({ comment: '主键' })
  id: number;

  @Column({ name: 'user_id', type: 'int', comment: '创建者ID' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ length: 100, comment: '提示词组名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '描述（支持Markdown）' })
  description: string;

  @Column({ name: 'is_public', type: 'boolean', default: true, comment: '是否公开到广场' })
  isPublic: boolean;

  @Column({ name: 'require_application', type: 'boolean', default: false, comment: '是否需要申请' })
  requireApplication: boolean;

  @Column({ name: 'category_id', type: 'int', nullable: true, comment: '分类ID' })
  categoryId: number;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({
    type: 'enum',
    enum: PromptGroupStatus,
    default: PromptGroupStatus.DRAFT,
    comment: '状态',
  })
  status: PromptGroupStatus;

  @Column({ name: 'view_count', type: 'int', default: 0, comment: '浏览次数' })
  viewCount: number;

  @Column({ name: 'use_count', type: 'int', default: 0, comment: '使用次数' })
  useCount: number;

  @Column({ name: 'like_count', type: 'int', default: 0, comment: '点赞次数' })
  likeCount: number;

  @Column({ name: 'hot_value', type: 'int', default: 0, comment: '热度值' })
  hotValue: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', comment: '软删除时间' })
  deletedAt: Date;

  // 关联提示词组项
  @OneToMany(() => PromptGroupItem, (item) => item.group, { cascade: true })
  items: PromptGroupItem[];

  // 关联权限
  @OneToMany(() => PromptGroupPermission, (permission) => permission.group)
  permissions: PromptGroupPermission[];

  // 关联申请
  @OneToMany(() => PromptGroupApplication, (application) => application.group)
  applications: PromptGroupApplication[];

  // 关联点赞
  @OneToMany(() => PromptGroupLike, (like) => like.group)
  likes: PromptGroupLike[];

  // 动态字段（不存储在数据库，由查询时注入）
  isLiked?: boolean;
  pendingApplicationsCount?: number;
}

