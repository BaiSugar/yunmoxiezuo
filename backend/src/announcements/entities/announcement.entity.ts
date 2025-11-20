import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import {
  AnnouncementType,
  AnnouncementLevel,
  LinkTarget,
  LinkPosition,
  TargetType,
} from '../enums';
import { AnnouncementRead } from './announcement-read.entity';

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // 核心内容
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  summary: string;

  // 类型与级别
  @Column({
    type: 'enum',
    enum: AnnouncementType,
    default: AnnouncementType.NOTICE,
  })
  type: AnnouncementType;

  @Column({ type: 'int', default: 5 })
  priority: number;

  @Column({
    type: 'enum',
    enum: AnnouncementLevel,
    default: AnnouncementLevel.INFO,
  })
  level: AnnouncementLevel;

  // 链接跳转
  @Column({ type: 'boolean', default: false })
  hasLink: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  linkText: string;

  @Column({
    type: 'enum',
    enum: LinkTarget,
    default: LinkTarget.BLANK,
  })
  linkTarget: LinkTarget;

  @Column({
    type: 'enum',
    enum: LinkPosition,
    default: LinkPosition.BUTTON,
  })
  linkPosition: LinkPosition;

  // 显示控制
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isTop: boolean;

  @Column({ type: 'boolean', default: false })
  isPush: boolean;

  @Column({ type: 'boolean', default: false })
  isPopup: boolean;

  @Column({ type: 'boolean', default: false })
  needRead: boolean;

  // 时间控制
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  // 目标受众
  @Column({
    type: 'enum',
    enum: TargetType,
    default: TargetType.ALL,
  })
  targetType: TargetType;

  @Column({ type: 'json', nullable: true })
  targetIds: number[];

  // 统计字段
  @Column({ type: 'int', default: 0 })
  viewCount: number;

  @Column({ type: 'int', default: 0 })
  readCount: number;

  @Column({ type: 'int', default: 0 })
  clickCount: number;

  // 附件与样式
  @Column({ type: 'json', nullable: true })
  attachments: any;

  @Column({ type: 'json', nullable: true })
  styleConfig: any;

  // 关联创建人
  @Column({ type: 'int', unsigned: true })
  creatorId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  // 关联阅读记录
  @OneToMany(() => AnnouncementRead, (read) => read.announcement)
  reads: AnnouncementRead[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
