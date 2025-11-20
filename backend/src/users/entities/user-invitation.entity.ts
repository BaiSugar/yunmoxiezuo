import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

/**
 * 用户邀请记录实体
 * 记录所有邀请关系和奖励发放情况
 */
@Entity('user_invitations')
@Index(['inviterId'])
@Index(['inviteeId'])
@Index(['inviteCode'])
export class UserInvitation {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'inviter_id', type: 'int', comment: '邀请人ID' })
  inviterId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'inviter_id' })
  inviter: User;

  @Column({ name: 'invitee_id', type: 'int', comment: '被邀请人ID' })
  inviteeId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitee_id' })
  invitee: User;

  @Column({ name: 'invite_code', length: 20, comment: '使用的邀请码' })
  inviteCode: string;

  @Column({ name: 'inviter_reward', type: 'int', default: 8000, comment: '邀请人获得的奖励字数' })
  inviterReward: number;

  @Column({ name: 'invitee_reward', type: 'int', default: 80000, comment: '被邀请人获得的奖励字数' })
  inviteeReward: number;

  @Column({ name: 'inviter_rewarded', type: 'boolean', default: false, comment: '邀请人奖励是否已发放' })
  inviterRewarded: boolean;

  @Column({ name: 'invitee_rewarded', type: 'boolean', default: false, comment: '被邀请人奖励是否已发放' })
  inviteeRewarded: boolean;

  @CreateDateColumn({ name: 'created_at', comment: '邀请时间' })
  createdAt: Date;
}

