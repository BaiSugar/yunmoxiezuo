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
import { ChatHistory } from './chat-history.entity';
import { GroupChat } from './group-chat.entity';
import { Swipe } from './swipe.entity';
import { MessageType } from '../enums';
import type { MessageExtra } from '../interfaces';

/**
 * 消息实体
 */
@Entity('messages')
@Index(['chatId', 'sendDate'])
@Index(['chatId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  /** 聊天ID（普通聊天） */
  @Column({ name: 'chat_id', nullable: true })
  @Index()
  chatId: number;

  /** 群聊ID */
  @Column({ name: 'group_chat_id', nullable: true })
  @Index()
  groupChatId: number;

  /** 消息ID（在聊天内的索引） */
  @Column({ name: 'mes_id' })
  mesId: number;

  /** 发送者名称 */
  @Column()
  name: string;

  /** 是否为用户消息 */
  @Column({ name: 'is_user' })
  isUser: boolean;

  /** 消息内容 */
  @Column({ type: 'text' })
  mes: string;

  /** 发送时间（时间戳） */
  @Column({ name: 'send_date', type: 'bigint' })
  sendDate: number;

  /** 消息类型 */
  @Column({
    name: 'message_type',
    type: 'enum',
    enum: MessageType,
    default: MessageType.NORMAL,
  })
  messageType: MessageType;

  /** 是否为系统消息 */
  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  /** 是否为名称标签 */
  @Column({ name: 'is_name', default: false })
  isName: boolean;

  /** 强制使用的头像URL */
  @Column({ name: 'force_avatar', nullable: true })
  forceAvatar: string;

  /** 当前选中的Swipe索引 */
  @Column({ name: 'swipe_id', default: 0 })
  swipeId: number;

  /** 生成开始时间 */
  @Column({ name: 'gen_started', type: 'bigint', nullable: true })
  genStarted: number;

  /** 生成结束时间 */
  @Column({ name: 'gen_finished', type: 'bigint', nullable: true })
  genFinished: number;

  /** 生成ID */
  @Column({ name: 'gen_id', nullable: true })
  genId: string;

  /** 使用的API */
  @Column({ nullable: true })
  api: string;

  /** 使用的模型 */
  @Column({ nullable: true })
  model: string;

  /** 扩展信息（JSON） */
  @Column({ type: 'json', nullable: true })
  extra: MessageExtra;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  /** 更新时间 */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ==================== 关系 ====================

  /** 所属聊天（普通聊天） */
  @ManyToOne(() => ChatHistory, (chat) => chat.messages, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'chat_id' })
  chat: ChatHistory;

  /** 所属群聊 */
  @ManyToOne(() => GroupChat, (groupChat) => groupChat.messages, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'group_chat_id' })
  groupChat: GroupChat;

  /** Swipe版本列表 */
  @OneToMany(() => Swipe, (swipe) => swipe.message)
  swipes: Swipe[];
}
