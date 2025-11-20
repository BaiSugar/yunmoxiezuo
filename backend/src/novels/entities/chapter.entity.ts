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
import { Volume } from './volume.entity';
import { ChapterVersion } from './chapter-version.entity';

@Entity('chapters', {
  engine: 'InnoDB ROW_FORMAT=COMPRESSED',
})
@Index(['volumeId', 'order'])
@Index(['createdAt'])
export class Chapter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'novel_id', type: 'int', comment: '所属作品ID' })
  novelId: number;

  @Column({ name: 'volume_id', type: 'int', nullable: true, comment: '所属分卷ID，null表示独立章节' })
  volumeId: number | null;

  @Column({ length: 200, comment: '章节标题' })
  title: string;

  @Column({ type: 'mediumtext', comment: '章节内容' })
  content: string;

  @Column({ type: 'text', nullable: true, comment: '章节梗概/大纲' })
  summary: string;

  @Column({ type: 'int', default: 0, comment: '排序顺序' })
  order: number;

  @Column({ name: 'global_order', type: 'int', nullable: true, comment: '全局排序顺序（独立章节使用）' })
  globalOrder: number | null;

  @Column({ name: 'word_count', type: 'int', default: 0, comment: '章节字数' })
  wordCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // 关联分卷
  @ManyToOne(() => Volume, (volume) => volume.chapters)
  @JoinColumn({ name: 'volume_id' })
  volume: Volume;

  // 关联历史版本
  @OneToMany(() => ChapterVersion, (version) => version.chapter)
  versions: ChapterVersion[];
}
