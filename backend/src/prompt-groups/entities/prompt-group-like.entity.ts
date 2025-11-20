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
import { User } from '../../users/entities/user.entity';

/**
 * 提示词组点赞实体
 */
@Entity('prompt_group_likes')
@Index(['groupId'])
@Index(['userId'])
@Index(['groupId', 'userId'], { unique: true })
export class PromptGroupLike {
  @PrimaryGeneratedColumn({ comment: '主键' })
  id: number;

  @Column({ name: 'group_id', type: 'int', comment: '提示词组ID' })
  groupId: number;

  @ManyToOne(() => PromptGroup, (group) => group.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: PromptGroup;

  @Column({ name: 'user_id', type: 'int', comment: '用户ID' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at', comment: '点赞时间' })
  createdAt: Date;
}

