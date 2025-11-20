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

export enum PermissionType {
  VIEW = 'view',
  USE = 'use',
  EDIT = 'edit',
}

@Entity('prompt_permissions')
@Index(['promptId', 'userId'], { unique: true })
export class PromptPermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'prompt_id', type: 'int', comment: '提示词ID' })
  promptId: number;

  @Column({ name: 'user_id', type: 'int', comment: '用户ID' })
  userId: number;

  @Column({
    type: 'enum',
    enum: PermissionType,
    default: PermissionType.USE,
    comment: '权限类型',
  })
  permission: PermissionType;

  @Column({ name: 'granted_by', type: 'int', comment: '授权者ID' })
  grantedBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 关联提示词
  @ManyToOne(() => Prompt, (prompt) => prompt.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prompt_id' })
  prompt: Prompt;

  // 关联用户
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 关联授权者
  @ManyToOne(() => User)
  @JoinColumn({ name: 'granted_by' })
  grantor: User;
}
