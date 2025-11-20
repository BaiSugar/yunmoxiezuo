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

export enum PromptGroupPermissionType {
  VIEW = 'view',
  USE = 'use',
  EDIT = 'edit',
}

/**
 * 提示词组权限实体
 */
@Entity('prompt_group_permissions')
@Index(['groupId'])
@Index(['userId'])
@Index(['groupId', 'userId'], { unique: true })
export class PromptGroupPermission {
  @PrimaryGeneratedColumn({ comment: '主键' })
  id: number;

  @Column({ name: 'group_id', type: 'int', comment: '提示词组ID' })
  groupId: number;

  @ManyToOne(() => PromptGroup, (group) => group.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: PromptGroup;

  @Column({ name: 'user_id', type: 'int', comment: '用户ID' })
  userId: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: PromptGroupPermissionType,
    default: PromptGroupPermissionType.USE,
    comment: '权限类型',
  })
  permission: PromptGroupPermissionType;

  @Column({ name: 'granted_by', type: 'int', comment: '授权者ID' })
  grantedBy: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'granted_by' })
  granter: User;

  @CreateDateColumn({ name: 'granted_at', comment: '授权时间' })
  grantedAt: Date;
}

