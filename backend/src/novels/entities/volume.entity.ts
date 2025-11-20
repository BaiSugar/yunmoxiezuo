import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Novel } from './novel.entity';
import { Chapter } from './chapter.entity';

@Entity('volumes')
@Index(['novelId', 'order'])
export class Volume {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'novel_id', type: 'int' })
  novelId: number;

  @Column({ length: 200, comment: '分卷名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '分卷简介' })
  description: string;

  @Column({ type: 'int', default: 0, comment: '排序顺序' })
  order: number;

  @Column({ name: 'global_order', type: 'int', default: 0, comment: '全局排序顺序' })
  globalOrder: number;

  @Column({ name: 'word_count', type: 'int', default: 0, comment: '分卷字数' })
  wordCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // 关联作品
  @ManyToOne(() => Novel, (novel) => novel.volumes)
  @JoinColumn({ name: 'novel_id' })
  novel: Novel;

  // 关联章节
  @OneToMany(() => Chapter, (chapter) => chapter.volume)
  chapters: Chapter[];
}
