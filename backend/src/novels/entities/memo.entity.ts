import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Novel } from './novel.entity';

@Entity('memos')
@Index(['novelId'])
@Index(['novelId', 'isPinned', 'updatedAt']) // 复合索引优化列表查询（使用updatedAt）
export class Memo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'novel_id', type: 'int' })
  novelId: number;

  @Column({ length: 200, comment: '备忘录标题' })
  title: string;

  @Column({ type: 'text', comment: '备忘录内容' })
  content: string;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '标签颜色' })
  color: string;

  @Column({ name: 'is_pinned', type: 'boolean', default: false, comment: '是否置顶' })
  isPinned: boolean;

  @Column({ name: 'reminder_at', type: 'timestamp', nullable: true, comment: '提醒时间' })
  reminderAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // 关联作品
  @ManyToOne(() => Novel, (novel) => novel.memos)
  @JoinColumn({ name: 'novel_id' })
  novel: Novel;
}
