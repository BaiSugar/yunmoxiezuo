import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Novel } from '../../novels/entities/novel.entity';
import { TaskStatus } from '../enums';
import { BookCreationStage } from './book-creation-stage.entity';
import { OutlineNode } from './outline-node.entity';

/**
 * 成书任务实体
 */
@Entity('book_creation_tasks')
export class BookCreationTask {
  @PrimaryGeneratedColumn({ comment: '主键' })
  id: number;

  @Column({ name: 'user_id', comment: '用户ID' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'novel_id', nullable: true, comment: '关联作品ID（阶段2后创建）' })
  novelId: number;

  @ManyToOne(() => Novel, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'novel_id' })
  novel: Novel;

  @Column({
    type: 'varchar',
    length: 50,
    default: TaskStatus.IDEA_GENERATING,
    comment: '任务状态',
  })
  status: TaskStatus;

  @Column({
    name: 'current_stage',
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: '当前阶段',
  })
  currentStage: string;

  @Column({
    name: 'prompt_group_id',
    nullable: true,
    type: 'int',
    unsigned: true,
    comment: '选择的提示词组ID（一旦设置不可更改）',
  })
  promptGroupId: number;

  @Column({
    name: 'model_id',
    nullable: true,
    type: 'int',
    unsigned: true,
    comment: '选择的AI模型ID',
  })
  modelId: number;

  @Column({
    name: 'processed_data',
    type: 'json',
    nullable: true,
    comment: '各阶段产出数据',
  })
  processedData: {
    brainstorm?: string; // 阶段1产出：脑洞
    brainstormOptimized?: string; // 阶段1产出：优化后的脑洞
    titles?: string[]; // 阶段2产出：候选书名
    selectedTitle?: string; // 阶段2产出：选定书名
    synopsis?: string; // 阶段2产出：简介
    mainOutline?: any[]; // 阶段3a产出：主大纲
    mainOutlineOptimized?: any[]; // 阶段3a产出：优化后的主大纲
    volumeOutlines?: any[]; // 阶段3b产出：卷纲
    volumeOutlinesOptimized?: any[]; // 阶段3b产出：优化后的卷纲
    chapterOutlines?: any[]; // 阶段3c产出：细纲
    chapterOutlinesOptimized?: any[]; // 阶段3c产出：优化后的细纲
    generationSummary?: any; // 阶段4产出：生成摘要
    reviewSummary?: any; // 阶段5产出：审稿摘要
    [key: string]: any; // 其他扩展字段
  };

  @Column({
    name: 'prompt_config',
    type: 'json',
    nullable: true,
    comment: '用户配置的提示词ID（单个提示词可更改）',
  })
  promptConfig: {
    ideaPromptId?: number; // 脑洞生成提示词ID
    ideaOptimizePromptId?: number; // 脑洞优化提示词ID
    titlePromptId?: number; // 书名简介生成提示词ID
    mainOutlinePromptId?: number; // 主大纲生成提示词ID
    mainOutlineOptimizePromptId?: number; // 大纲优化提示词ID
    volumeOutlinePromptId?: number; // 卷纲生成提示词ID
    volumeOutlineOptimizePromptId?: number; // 卷纲优化提示词ID
    chapterOutlinePromptId?: number; // 细纲生成提示词ID
    chapterOutlineOptimizePromptId?: number; // 细纲优化提示词ID
    contentPromptId?: number; // 章节正文生成提示词ID
    reviewPromptId?: number; // 章节审稿提示词ID
    summaryPromptId?: number; // 章节梗概生成提示词ID
  };

  @Column({
    name: 'task_config',
    type: 'json',
    nullable: true,
    comment: '任务配置参数',
  })
  taskConfig: {
    enableReview?: boolean; // 是否启用审稿（默认true）
    concurrencyLimit?: number; // 并发限制（默认5）- 仅用于后端控制，不传给AI
    temperature?: number; // AI温度参数（0-2，默认0.7）
    historyMessageLimit?: number; // 历史消息数量限制（默认10）
  };

  @Column({
    name: 'total_characters_consumed',
    type: 'int',
    default: 0,
    comment: '累计消耗字数',
  })
  totalCharactersConsumed: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @Column({
    name: 'completed_at',
    type: 'datetime',
    nullable: true,
    comment: '完成时间',
  })
  completedAt: Date;

  // 关联阶段记录
  @OneToMany(() => BookCreationStage, (stage) => stage.task)
  stages: BookCreationStage[];

  // 关联大纲节点
  @OneToMany(() => OutlineNode, (node) => node.task)
  outlineNodes: OutlineNode[];
}

