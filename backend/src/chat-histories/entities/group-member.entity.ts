import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { GroupChat } from './group-chat.entity';

/**
 * 群聊成员实体
 */
@Entity('group_members')
@Index(['groupId', 'characterCardId'], { unique: true })
export class GroupMember {
  @PrimaryGeneratedColumn()
  id: number;

  /** 群聊ID */
  @Column({ name: 'group_id' })
  @Index()
  groupId: number;

  /** 角色卡ID */
  @Column({ name: 'character_card_id' })
  characterCardId: number;

  /** 角色名称 */
  @Column({ name: 'character_name' })
  characterName: string;

  /** 角色头像URL */
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  /** 加入时间 */
  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  /** 排序顺序 */
  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  /** 是否启用 */
  @Column({ name: 'is_enabled', default: true })
  isEnabled: boolean;

  // ==================== 关系 ====================

  /** 所属群聊 */
  @ManyToOne(() => GroupChat, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: GroupChat;
}
