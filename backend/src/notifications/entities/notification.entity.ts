import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * 系统通知实体
 */
@Entity('notifications')
@Index(['userId', 'isRead'])
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int', comment: '接收用户ID' })
  userId: number;

  @Column({ type: 'varchar', length: 255, comment: '通知标题' })
  title: string;

  @Column({ type: 'text', comment: '通知内容' })
  content: string;

  @Column({ type: 'varchar', length: 50, comment: '通知分类' })
  category: string;

  @Column({
    type: 'enum',
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info',
    comment: '通知级别',
  })
  level: 'info' | 'success' | 'warning' | 'error';

  @Column({ type: 'json', nullable: true, comment: '操作按钮' })
  action?: {
    text: string;
    url: string;
  };

  @Column({ type: 'json', nullable: true, comment: '额外数据' })
  extra?: Record<string, any>;

  @Column({ name: 'is_read', type: 'boolean', default: false, comment: '是否已读' })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true, comment: '阅读时间' })
  readAt?: Date;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  // 关联用户
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

