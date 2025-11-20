import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * 字体文件实体
 */
@Entity('fonts')
export class Font {
  @PrimaryGeneratedColumn({ comment: '字体ID' })
  id: number;

  @Column({
    name: 'user_id',
    type: 'int',
    unsigned: true,
    nullable: true,
    comment: '用户ID（NULL=系统字体，有值=用户私有字体）',
  })
  userId: number | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '字体名称（用于 font-family）',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 100,
    comment: '字体显示名称',
  })
  displayName: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '字体分类（中文/英文/特殊）',
  })
  category: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '字体描述',
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 500,
    comment: '字体文件路径（相对路径）',
  })
  filePath: string;

  @Column({
    type: 'varchar',
    length: 50,
    comment: '字体文件格式（woff2/woff/ttf/otf）',
  })
  format: string;

  @Column({
    type: 'int',
    unsigned: true,
    comment: '文件大小（字节）',
  })
  fileSize: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '是否启用',
  })
  isEnabled: boolean;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: '是否为默认字体',
  })
  isDefault: boolean;

  @Column({
    type: 'int',
    default: 0,
    comment: '排序顺序',
  })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', comment: '上传时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}

