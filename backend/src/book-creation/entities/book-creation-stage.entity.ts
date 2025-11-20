import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { BookCreationTask } from './book-creation-task.entity';
import { Prompt } from '../../prompts/entities/prompt.entity';
import { StageType, StageStatus } from '../enums';

/**
 * 成书阶段记录实体
 */
@Entity('book_creation_stages')
export class BookCreationStage {
  @PrimaryGeneratedColumn({ comment: '主键' })
  id: number;

  @Column({ name: 'task_id', comment: '关联任务ID' })
  taskId: number;

  @ManyToOne(() => BookCreationTask, (task) => task.stages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'task_id' })
  task: BookCreationTask;

  @Column({
    name: 'stage_type',
    type: 'varchar',
    length: 50,
    comment: '阶段类型',
  })
  stageType: StageType;

  @Column({
    type: 'enum',
    enum: StageStatus,
    default: StageStatus.PENDING,
    comment: '阶段状态',
  })
  status: StageStatus;

  @Column({
    name: 'input_data',
    type: 'json',
    nullable: true,
    comment: '输入数据',
  })
  inputData: Record<string, any>;

  @Column({
    name: 'output_data',
    type: 'json',
    nullable: true,
    comment: '输出数据',
  })
  outputData: Record<string, any>;

  @Column({
    name: 'prompt_id',
    nullable: true,
    comment: '使用的提示词ID',
  })
  promptId: number;

  @ManyToOne(() => Prompt, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;

  @Column({
    name: 'characters_consumed',
    type: 'int',
    default: 0,
    comment: '本阶段消耗字数',
  })
  charactersConsumed: number;

  @Column({
    name: 'retry_count',
    type: 'int',
    default: 0,
    comment: '重试次数',
  })
  retryCount: number;

  @Column({
    name: 'error_message',
    type: 'text',
    nullable: true,
    comment: '错误信息',
  })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @Column({
    name: 'completed_at',
    type: 'datetime',
    nullable: true,
    comment: '完成时间',
  })
  completedAt: Date;
}

