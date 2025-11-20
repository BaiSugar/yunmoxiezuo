import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 世界书激活状态实体
 * 用于存储时效性状态（sticky/cooldown）
 */
@Entity('world_book_activations')
@Index(['sessionId', 'promptId', 'entryUid'], { unique: true })
export class WorldBookActivation {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * 会话ID（角色扮演会话）
   * 未来如果实现会话系统，这里关联到 session 表
   */
  @Column({ name: 'session_id', type: 'varchar', length: 255, comment: '会话ID' })
  sessionId: string;

  /**
   * 提示词ID
   */
  @Column({ name: 'prompt_id', type: 'int', comment: '提示词ID' })
  promptId: number;

  /**
   * 世界书条目UID
   */
  @Column({ name: 'entry_uid', type: 'varchar', length: 255, comment: '条目UID' })
  entryUid: string;

  /**
   * 最后激活时间
   */
  @Column({ name: 'last_activated_at', type: 'datetime', nullable: true, comment: '最后激活时间' })
  lastActivatedAt: Date;

  /**
   * 最后激活时的消息索引
   */
  @Column({ name: 'last_activated_message_index', type: 'int', nullable: true, comment: '最后激活时的消息索引' })
  lastActivatedMessageIndex: number;

  /**
   * 粘性剩余次数
   */
  @Column({ name: 'sticky_remaining', type: 'int', default: 0, comment: '粘性剩余次数' })
  stickyRemaining: number;

  /**
   * 冷却剩余次数
   */
  @Column({ name: 'cooldown_remaining', type: 'int', default: 0, comment: '冷却剩余次数' })
  cooldownRemaining: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
