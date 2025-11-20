import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * 编辑器主题枚举
 */
export enum EditorTheme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

/**
 * 编辑器设置实体
 * 用于存储用户的编辑器个性化配置
 */
@Entity('editor_settings')
@Index(['userId'], { unique: true }) // 每个用户只能有一个编辑器配置
export class EditorSetting {
  @PrimaryGeneratedColumn({ comment: '配置ID' })
  id: number;

  @Column({
    name: 'user_id',
    type: 'int',
    unsigned: true,
    comment: '用户ID',
  })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'varchar',
    length: 200,
    default: 'PingFang SC, Microsoft YaHei, Hiragino Sans GB, WenQuanYi Micro Hei, sans-serif',
    comment: '字体（支持字体回退栈）',
  })
  fontFamily: string;

  @Column({
    type: 'int',
    unsigned: true,
    default: 16,
    comment: '字体大小（像素）',
  })
  fontSize: number;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 1,
    default: 1.8,
    comment: '行距（倍数）',
  })
  lineHeight: number;

  @Column({
    type: 'enum',
    enum: EditorTheme,
    default: EditorTheme.AUTO,
    comment: '编辑器主题',
  })
  theme: EditorTheme;

  @Column({
    type: 'int',
    unsigned: true,
    default: 2,
    comment: '段首空格数（全角空格）',
  })
  paragraphIndent: number;

  @Column({
    type: 'int',
    unsigned: true,
    default: 1,
    comment: '段间空行数',
  })
  paragraphSpacing: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '是否启用自动保存',
  })
  autoSave: boolean;

  @Column({
    type: 'int',
    unsigned: true,
    default: 30,
    comment: '自动保存间隔（秒）',
  })
  autoSaveInterval: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '是否显示字数统计',
  })
  showWordCount: boolean;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    default: null,
    comment: '背景颜色（如: #F5F3E8 护眼黄）',
  })
  backgroundColor: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    default: null,
    comment: '背景图片路径（优先于背景颜色）',
  })
  backgroundImage: string | null;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}

