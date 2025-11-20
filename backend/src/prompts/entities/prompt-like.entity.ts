import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Prompt } from './prompt.entity';
import { User } from '../../users/entities/user.entity';

/**
 * 提示词点赞实体
 * 记录用户对提示词的点赞关系
 */
@Entity('prompt_likes')
@Index(['userId', 'promptId'], { unique: true }) // 用户对同一提示词只能点赞一次
export class PromptLike {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', comment: '用户ID' })
  userId: number;

  @Column({ name: 'prompt_id', type: 'int', comment: '提示词ID' })
  promptId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 关联用户
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 关联提示词
  @ManyToOne(() => Prompt)
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;
}
