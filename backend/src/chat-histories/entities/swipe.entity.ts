import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Message } from './message.entity';
import type { MessageExtra } from '../interfaces';

/**
 * Swipe实体（多版本生成）
 */
@Entity('swipes')
@Index(['messageId', 'swipeIndex'])
export class Swipe {
  @PrimaryGeneratedColumn()
  id: number;

  /** 消息ID */
  @Column({ name: 'message_id' })
  @Index()
  messageId: number;

  /** Swipe索引（从0开始） */
  @Column({ name: 'swipe_index' })
  swipeIndex: number;

  /** Swipe内容 */
  @Column({ type: 'text' })
  content: string;

  /** 发送时间（时间戳） */
  @Column({ name: 'send_date', type: 'bigint' })
  sendDate: number;

  /** 生成开始时间 */
  @Column({ name: 'gen_started', type: 'bigint', nullable: true })
  genStarted: number;

  /** 生成结束时间 */
  @Column({ name: 'gen_finished', type: 'bigint', nullable: true })
  genFinished: number;

  /** 生成ID */
  @Column({ name: 'gen_id', nullable: true })
  genId: string;

  /** 扩展信息（JSON） */
  @Column({ type: 'json', nullable: true })
  extra: MessageExtra;

  /** 创建时间 */
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ==================== 关系 ====================

  /** 所属消息 */
  @ManyToOne(() => Message, (message) => message.swipes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;
}
