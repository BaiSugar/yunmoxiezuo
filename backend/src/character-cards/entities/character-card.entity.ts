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
import { User } from '../../users/entities/user.entity';
import { CharacterCardSpec, CharacterCardSpecVersion } from '../enums';

/**
 * 角色卡状态
 */
export enum CharacterCardStatus {
  /** 草稿 */
  DRAFT = 'draft',
  
  /** 已发布 */
  PUBLISHED = 'published',
  
  /** 已归档 */
  ARCHIVED = 'archived',
}

/**
 * 角色卡实体
 * 存储 SillyTavern 格式的角色卡数据
 */
@Entity('character_cards')
@Index(['authorId'])
@Index(['status'])
@Index(['isPublic', 'status'])
@Index(['createdAt'])
export class CharacterCard {
  @PrimaryGeneratedColumn()
  id: number;

  // ============ 基础信息 ============
  @Column({ length: 100, comment: '角色名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '角色描述（简短介绍）' })
  description: string;

  // ============ 规范信息 ============
  @Column({
    type: 'enum',
    enum: CharacterCardSpec,
    default: CharacterCardSpec.V2,
    comment: '角色卡规范版本',
  })
  spec: CharacterCardSpec;

  @Column({
    type: 'enum',
    enum: CharacterCardSpecVersion,
    default: CharacterCardSpecVersion.V2,
    name: 'spec_version',
    comment: '规范版本号',
  })
  specVersion: CharacterCardSpecVersion;

  // ============ 角色卡数据 ============
  @Column({
    type: 'json',
    comment: '角色卡完整数据（JSON 格式）',
  })
  data: object;

  // ============ 图片存储 ============
  @Column({
    type: 'text',
    nullable: true,
    name: 'avatar_url',
    comment: '角色立绘 URL',
  })
  avatarUrl: string;

  @Column({
    type: 'longtext',
    nullable: true,
    name: 'png_data',
    comment: 'PNG 格式的完整角色卡数据（Base64 编码）',
  })
  pngData: string;

  // ============ 权限和状态 ============
  @Column({
    name: 'author_id',
    type: 'int',
    comment: '作者ID',
  })
  authorId: number;

  @Column({
    name: 'is_public',
    type: 'boolean',
    default: true,
    comment: '是否公开',
  })
  isPublic: boolean;

  @Column({
    type: 'enum',
    enum: CharacterCardStatus,
    default: CharacterCardStatus.DRAFT,
    comment: '状态',
  })
  status: CharacterCardStatus;

  // ============ 统计信息 ============
  @Column({
    name: 'view_count',
    type: 'int',
    default: 0,
    comment: '查看次数',
  })
  viewCount: number;

  @Column({
    name: 'use_count',
    type: 'int',
    default: 0,
    comment: '使用次数',
  })
  useCount: number;

  @Column({
    name: 'like_count',
    type: 'int',
    default: 0,
    comment: '点赞次数',
  })
  likeCount: number;

  @Column({
    name: 'download_count',
    type: 'int',
    default: 0,
    comment: '下载次数',
  })
  downloadCount: number;

  // ============ 分类和标签 ============
  @Column({
    type: 'simple-array',
    nullable: true,
    comment: '标签列表',
  })
  tags: string[];

  @Column({
    length: 50,
    nullable: true,
    comment: '角色类型（如：精灵、人类、机器人等）',
  })
  category: string;

  // ============ 时间戳 ============
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // ============ 关联关系 ============
  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;
}
