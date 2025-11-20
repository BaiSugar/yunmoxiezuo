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
import type { ChatMetadata } from '../interfaces';
import { Message } from './message.entity';

/**
 * 聊天历史实体
 */
@Entity('chat_histories')
@Index(['userId', 'createdAt'])
@Index(['characterCardId', 'userId'])
@Index(['novelId', 'userId'])
@Index(['categoryId'])
@Index(['userId', 'categoryId', 'createdAt'])
export class ChatHistory {
  @PrimaryGeneratedColumn()
  id: number;

  /** 用户ID */
  @Column({ name: 'user_id' })
  @Index()
  userId: number;

  /** 小说ID（AI写作场景） */
  @Column({ name: 'novel_id', nullable: true })
  novelId: number;

  /** 聊天名称 */
  @Column({ name: 'chat_name', nullable: true })
  chatName: string;

  /** 角色卡ID（角色扮演场景） */
  @Column({ name: 'character_card_id', nullable: true })
  characterCardId: number;

  /** 提示词分类ID（创意工坊场景） */
  @Column({ name: 'category_id', nullable: true })
  categoryId: number;

  /** 角色名称 */
  @Column({ name: 'character_name', nullable: true })
  characterName: string;

  /** 用户人设名称 */
  @Column({ name: 'user_persona_name', nullable: true })
  userPersonaName: string;

  /** 聊天元数据（JSON） */
  @Column({ name: 'chat_metadata', type: 'json', nullable: true })
  chatMetadata: ChatMetadata;

  /** 消息总数 */
  @Column({ name: 'message_count', default: 0 })
  messageCount: number;

  /** 最后消息时间 */
  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ==================== 关系 ====================

  /** 所属用户 */
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  /** 消息列表 */
  @OneToMany(() => Message, (message) => message.chat)
  messages: Message[];
}
