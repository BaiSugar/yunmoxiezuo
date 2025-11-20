import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 邮件模板类型枚举
 */
export enum EmailTemplateType {
  REGISTER = 'register', // 注册验证
  RESET_PASSWORD = 'reset_password', // 重置密码
  CHANGE_EMAIL = 'change_email', // 更换邮箱
  VERIFY_EMAIL = 'verify_email', // 验证邮箱
}

@Entity('email_templates')
export class EmailTemplate {
  @PrimaryGeneratedColumn({ unsigned: true, comment: '模板ID' })
  id: number;

  @Column({
    type: 'enum',
    enum: EmailTemplateType,
    unique: true,
    comment: '模板类型',
  })
  type: EmailTemplateType;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    comment: '邮件主题',
  })
  subject: string;

  @Column({
    type: 'text',
    nullable: false,
    comment: 'HTML模板内容（支持变量：{{code}}, {{expireText}}）',
  })
  htmlTemplate: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: '模板名称',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '模板描述',
  })
  description: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: '可用变量说明（JSON格式）',
  })
  variables: string;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 1,
    comment: '是否启用',
  })
  isActive: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}

