import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
}

@Entity('system_settings')
export class SystemSetting {
  @PrimaryGeneratedColumn({ unsigned: true, comment: '配置ID' })
  id: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: '配置分类（如：email, system, security）',
  })
  category: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '配置键名',
  })
  key: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '配置值',
  })
  value: string;

  @Column({
    type: 'enum',
    enum: SettingType,
    default: SettingType.STRING,
    comment: '值类型',
  })
  type: SettingType;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: '配置项显示名称',
  })
  label: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '配置项描述',
  })
  description: string;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: '是否加密存储（如密码）',
  })
  isEncrypted: boolean;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: '是否可被前端读取',
  })
  isPublic: boolean;

  @Column({
    type: 'int',
    default: 0,
    comment: '排序顺序',
  })
  sortOrder: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
