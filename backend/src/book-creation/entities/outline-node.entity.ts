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
import { BookCreationTask } from './book-creation-task.entity';
import { Novel } from '../../novels/entities/novel.entity';
import { Volume } from '../../novels/entities/volume.entity';
import { Chapter } from '../../novels/entities/chapter.entity';
import { OutlineNodeStatus } from '../enums';

/**
 * 大纲节点实体
 * 支持三级结构：
 * - level 1: 主大纲
 * - level 2: 卷纲
 * - level 3: 细纲（章节）
 */
@Entity('outline_nodes')
export class OutlineNode {
  @PrimaryGeneratedColumn({ comment: '主键' })
  id: number;

  @Column({ name: 'task_id', comment: '关联任务ID' })
  taskId: number;

  @ManyToOne(() => BookCreationTask, (task) => task.outlineNodes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: BookCreationTask;

  @Column({ name: 'novel_id', comment: '关联作品ID' })
  novelId: number;

  @ManyToOne(() => Novel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'novel_id' })
  novel: Novel;

  @Column({
    name: 'parent_id',
    nullable: true,
    comment: '父节点ID',
  })
  parentId: number;

  @ManyToOne(() => OutlineNode, (node) => node.children, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: OutlineNode;

  @OneToMany(() => OutlineNode, (node) => node.parent)
  children: OutlineNode[];

  @Column({
    type: 'int',
    comment: '层级：1=主大纲, 2=卷纲, 3=细纲',
  })
  level: number;

  @Column({
    type: 'varchar',
    length: 200,
    comment: '标题',
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '详细内容',
  })
  content: string;

  @Column({
    type: 'int',
    default: 0,
    comment: '排序顺序',
  })
  order: number;

  @Column({
    type: 'enum',
    enum: OutlineNodeStatus,
    default: OutlineNodeStatus.DRAFT,
    comment: '节点状态',
  })
  status: OutlineNodeStatus;

  @Column({
    name: 'volume_id',
    nullable: true,
    comment: '关联分卷ID（level=2时关联）',
  })
  volumeId: number;

  @ManyToOne(() => Volume, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'volume_id' })
  volume: Volume;

  @Column({
    name: 'chapter_id',
    nullable: true,
    comment: '关联章节ID（level=3时关联）',
  })
  chapterId: number;

  @ManyToOne(() => Chapter, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}

