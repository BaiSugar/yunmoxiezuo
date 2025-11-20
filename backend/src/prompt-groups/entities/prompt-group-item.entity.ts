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
import { Prompt } from '../../prompts/entities/prompt.entity';

/**
 * 提示词组项实体
 */
@Entity('prompt_group_items')
@Index(['groupId'])
@Index(['promptId'])
@Index(['groupId', 'stageType'], { unique: true })
export class PromptGroupItem {
  @PrimaryGeneratedColumn({ comment: '主键' })
  id: number;

  @Column({ name: 'group_id', type: 'int', comment: '提示词组ID' })
  groupId: number;

  @ManyToOne(() => PromptGroup, (group) => group.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: PromptGroup;

  @Column({ name: 'prompt_id', type: 'int', comment: '提示词ID' })
  promptId: number;

  @ManyToOne(() => Prompt, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;

  @Column({ name: 'stage_type', length: 50, comment: '阶段类型' })
  stageType: string;

  @Column({ name: 'stage_label', length: 100, nullable: true, comment: '阶段显示名称' })
  stageLabel: string;

  @Column({ type: 'int', default: 0, comment: '顺序' })
  order: number;

  @Column({ name: 'is_required', type: 'boolean', default: true, comment: '是否必需' })
  isRequired: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;
}

