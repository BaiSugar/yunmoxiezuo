import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Chapter } from './chapter.entity';

@Entity('chapter_versions', {
  engine: 'InnoDB ROW_FORMAT=COMPRESSED',
})
@Index(['chapterId', 'version'])
@Index(['createdAt'])
export class ChapterVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'chapter_id', type: 'int' })
  chapterId: number;

  @Column({ type: 'int', comment: '版本号' })
  version: number;

  @Column({ length: 200, comment: '章节标题' })
  title: string;

  @Column({ type: 'mediumtext', comment: '章节内容' })
  content: string;

  @Column({ name: 'word_count', type: 'int', default: 0, comment: '字数' })
  wordCount: number;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '版本说明' })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // 关联章节
  @ManyToOne(() => Chapter, (chapter) => chapter.versions)
  @JoinColumn({ name: 'chapter_id' })
  chapter: Chapter;
}
