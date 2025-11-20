import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AiModel } from '../../ai-models/entities/ai-model.entity';

/**
 * 用户模型偏好设置实体
 */
@Entity('user_model_preferences')
@Index(['userId', 'modelId'], { unique: true })
export class UserModelPreference {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'model_id' })
  modelId: number;

  @Column({ 
    type: 'float', 
    default: 0.7,
    transformer: {
      to: (value: number) => value,
      from: (value: any) => typeof value === 'string' ? parseFloat(value) : value
    }
  })
  temperature: number;

  @Column({
    name: 'history_message_limit',
    type: 'int',
    unsigned: true,
    nullable: true,
    comment: '历史消息数量限制（保留最近N条消息，0或不设置表示不限制）',
  })
  historyMessageLimit?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => AiModel)
  @JoinColumn({ name: 'model_id' })
  model: AiModel;
}
