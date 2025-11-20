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
import { Character } from '../../novels/entities/character.entity';
import { WorldSetting } from '../../novels/entities/world-setting.entity';

export enum PromptRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export enum PromptContentType {
  TEXT = 'text',
  CHARACTER = 'character',
  WORLDVIEW = 'worldview',
}

@Entity('prompt_contents')
@Index(['promptId', 'order'])
export class PromptContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'prompt_id', type: 'int', comment: '提示词ID' })
  promptId: number;

  @Column({ type: 'varchar', length: 255, comment: '内容名称' })
  name: string;

  @Column({
    type: 'enum',
    enum: PromptRole,
    comment: '角色类型',
  })
  role: PromptRole;

  @Column({ type: 'text', nullable: true, comment: '内容文本（可包含参数占位符，如{{参数名}}或${参数名}）' })
  content: string;

  @Column({ type: 'int', default: 0, comment: '排序顺序' })
  order: number;

  @Column({
    type: 'enum',
    enum: PromptContentType,
    default: PromptContentType.TEXT,
    comment: '内容类型',
  })
  type: PromptContentType;

  @Column({ name: 'reference_id', type: 'int', nullable: true, comment: '引用ID（人物卡或世界观的ID，可为null表示插槽）' })
  referenceId: number;

  @Column({ name: 'is_enabled', type: 'boolean', default: true, comment: '该消息是否启用' })
  isEnabled: boolean;

  @Column({ type: 'json', nullable: true, comment: '参数配置（JSON格式：[{name, required, description}]）' })
  parameters: Array<{
    name: string;
    required: boolean;
    description: string;
  }>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 关联提示词
  @ManyToOne(() => Prompt, (prompt) => prompt.contents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;

  // 关联人物卡（可选）
  @ManyToOne(() => Character, { nullable: true })
  @JoinColumn({ name: 'reference_id' })
  character: Character;

  // 关联世界观（可选）
  @ManyToOne(() => WorldSetting, { nullable: true })
  @JoinColumn({ name: 'reference_id' })
  worldview: WorldSetting;
}
