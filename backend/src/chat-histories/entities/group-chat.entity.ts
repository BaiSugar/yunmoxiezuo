import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from './message.entity';
import { GroupMember } from './group-member.entity';

/**
 * 群聊实体
 */
@Entity('group_chats')
@Index(['userId', 'createdAt'])
export class GroupChat {
  @PrimaryGeneratedColumn()
  id: number;

  /** 用户ID（群主） */
  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  /** 群聊名称 */
  @Column({ name: 'group_name' })
  groupName: string;

  /** 群聊描述 */
  @Column({ name: 'description', type: 'text', nullable: true })
  description: string;

  /** 群聊头像URL */
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  /** 群聊元数据（JSON） */
  @Column({ name: 'group_metadata', type: 'json', nullable: true })
  groupMetadata: Record<string, any>;

  /** 消息总数 */
  @Column({ name: 'message_count', default: 0 })
  messageCount: number;

  /** 最后消息时间 */
  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  /** 是否归档 */
  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ==================== 关系 ====================

  /** 群主 */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 群聊成员 */
  @OneToMany(() => GroupMember, (member) => member.group)
  members: GroupMember[];

  /** 消息列表 */
  @OneToMany(() => Message, (message) => message.groupChat)
  messages: Message[];
}
