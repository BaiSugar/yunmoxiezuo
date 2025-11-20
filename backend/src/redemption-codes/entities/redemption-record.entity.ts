import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RedemptionCode } from './redemption-code.entity';
import { User } from '../../users/entities/user.entity';

/**
 * 卡密使用记录实体
 */
@Entity('redemption_records')
@Index(['userId'])
@Index(['codeId'])
@Index(['createdAt'])
export class RedemptionRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'code_id', comment: '卡密ID' })
  codeId: number;

  @ManyToOne(() => RedemptionCode)
  @JoinColumn({ name: 'code_id' })
  code: RedemptionCode;

  @Column({ name: 'code_str', length: 50, comment: '卡密码（冗余）' })
  codeStr: string;

  @Column({ name: 'user_id', comment: '使用用户ID' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'membership_id', nullable: true, comment: '获得的会员记录ID' })
  membershipId: number;

  @Column({ name: 'token_amount', type: 'bigint', default: 0, comment: '获得的字数' })
  tokenAmount: number;

  @Column({ name: 'ip_address', length: 45, nullable: true, comment: '使用IP' })
  ipAddress: string;

  @Column({ name: 'user_agent', length: 255, nullable: true, comment: '浏览器标识' })
  userAgent: string;

  @CreateDateColumn({ name: 'created_at', comment: '使用时间' })
  createdAt: Date;
}
