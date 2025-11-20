import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum VerificationType {
  REGISTER = 'register',
  RESET_PASSWORD = 'reset_password',
  CHANGE_EMAIL = 'change_email',
  VERIFY_EMAIL = 'verify_email',
}

@Entity('email_verifications')
export class EmailVerification {
  @PrimaryGeneratedColumn({ unsigned: true, comment: '记录ID' })
  id: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: '邮箱地址',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    comment: '验证码',
  })
  code: string;

  @Column({
    type: 'enum',
    enum: VerificationType,
    nullable: false,
    comment: '验证类型',
  })
  type: VerificationType;

  @Column({
    type: 'int',
    unsigned: true,
    nullable: true,
    comment: '关联用户ID（如果是已登录用户操作）',
  })
  userId: number;

  @Column({
    type: 'tinyint',
    width: 1,
    default: 0,
    comment: '是否已使用',
  })
  isUsed: boolean;

  @Column({
    type: 'timestamp',
    nullable: false,
    comment: '过期时间',
  })
  expiresAt: Date;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '使用时间',
  })
  usedAt: Date;
}
