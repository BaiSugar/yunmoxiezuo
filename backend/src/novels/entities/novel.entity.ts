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
import { User } from '../../users/entities/user.entity';
import { Volume } from './volume.entity';
import { Character } from './character.entity';
import { WorldSetting } from './world-setting.entity';
import { Memo } from './memo.entity';

export enum NovelGenre {
  FANTASY = 'fantasy', // 玄幻
  TRADITIONAL_FANTASY = 'traditional_fantasy', // 传统玄幻
  URBAN = 'urban', // 都市
  HISTORY = 'history', // 历史
  FICTIONAL = 'fictional', // 架空
  MYSTERY = 'mystery', // 悬疑
  SCIFI = 'scifi', // 科幻
  SPORTS = 'sports', // 体育
  WUXIA = 'wuxia', // 武侠
  APOCALYPSE = 'apocalypse', // 末日
  FANFICTION = 'fanfiction', // 动漫衍生
  FILM_TV = 'film_tv', // 影视
  ESPIONAGE = 'espionage', // 谍战
}

export enum NovelForm {
  NOVEL = 'novel', // 长篇
  SHORT_STORY = 'short_story', // 短篇
  SCRIPT = 'script', // 剧本
  OTHER = 'other', // 其他
}

export enum NovelStatus {
  ONGOING = 'ongoing', // 连载中
  COMPLETED = 'completed', // 完结
  ARCHIVED = 'archived', // 归档
  PAUSED = 'paused', // 暂停
}

@Entity('novels')
@Index(['userId', 'status'])
@Index(['createdAt'])
export class Novel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', type: 'int' })
  userId: number;

  @Column({ length: 200, comment: '作品名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '简介' })
  synopsis: string;

  @Column({
    type: 'simple-json',
    default: '[]',
    comment: '类型（支持多选）',
  })
  genres: NovelGenre[];

  @Column({
    type: 'enum',
    enum: NovelForm,
    default: NovelForm.NOVEL,
    comment: '作品形式',
  })
  form: NovelForm;

  @Column({
    type: 'enum',
    enum: NovelStatus,
    default: NovelStatus.ONGOING,
    comment: '状态',
  })
  status: NovelStatus;

  @Column({ name: 'total_word_count', type: 'int', default: 0, comment: '总字数' })
  totalWordCount: number;

  @Column({ name: 'target_words_per_chapter', type: 'int', default: 2000, comment: '每章目标字数' })
  targetWordsPerChapter: number;

  @Column({ name: 'cover_image', type: 'varchar', length: 500, nullable: true, comment: '封面图片' })
  coverImage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // 关联用户
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // 关联分卷
  @OneToMany(() => Volume, (volume) => volume.novel)
  volumes: Volume[];

  // 关联人物卡
  @OneToMany(() => Character, (character) => character.novel)
  characters: Character[];

  // 关联世界观
  @OneToMany(() => WorldSetting, (worldSetting) => worldSetting.novel)
  worldSettings: WorldSetting[];

  // 关联备忘录
  @OneToMany(() => Memo, (memo) => memo.novel)
  memos: Memo[];
}
