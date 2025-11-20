import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AiModel } from '../../ai-models/entities/ai-model.entity';

/**
 * 消耗来源枚举
 */
export enum ConsumptionSource {
  CHAT = 'chat',
  GENERATION = 'generation',
  AGENT = 'agent',
  BOOK_CREATION = 'book_creation',
}

/**
 * 字数消耗记录实体
 */
@Entity('token_consumption_records')
@Index(['userId', 'createdAt'])
export class TokenConsumptionRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', comment: '用户ID' })
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'model_id', comment: '模型ID' })
  modelId: number;

  @ManyToOne(() => AiModel)
  @JoinColumn({ name: 'model_id' })
  model: AiModel;

  @Column({ type: 'int', name: 'input_chars', comment: '输入字符数' })
  inputChars: number;

  @Column({ type: 'int', name: 'output_chars', comment: '输出字符数' })
  outputChars: number;

  @Column({ 
    type: 'decimal', 
    precision: 8, 
    scale: 2,
    name: 'input_ratio',
    comment: '使用的输入倍率' 
  })
  inputRatio: number;

  @Column({ 
    type: 'decimal', 
    precision: 8, 
    scale: 2,
    name: 'output_ratio',
    comment: '使用的输出倍率' 
  })
  outputRatio: number;

  @Column({ 
    type: 'int',
    name: 'calculated_input_cost',
    comment: '计算的输入消耗' 
  })
  calculatedInputCost: number;

  @Column({ 
    type: 'int',
    name: 'calculated_output_cost',
    comment: '计算的输出消耗' 
  })
  calculatedOutputCost: number;

  @Column({ type: 'int', name: 'total_cost', comment: '总消耗' })
  totalCost: number;

  @Column({ 
    type: 'int', 
    default: 0,
    name: 'used_daily_free',
    comment: '使用的每日免费额度' 
  })
  usedDailyFree: number;

  @Column({ 
    type: 'int', 
    default: 0,
    name: 'used_paid',
    comment: '使用的付费额度' 
  })
  usedPaid: number;

  @Column({ 
    type: 'boolean', 
    default: false,
    name: 'is_member',
    comment: '是否会员' 
  })
  isMember: boolean;

  @Column({ 
    type: 'int', 
    default: 0,
    name: 'member_free_input',
    comment: '会员免费输入字符数' 
  })
  memberFreeInput: number;

  @Column({
    type: 'enum',
    enum: ConsumptionSource,
    comment: '来源',
  })
  @Index()
  source: ConsumptionSource;

  @Column({ 
    type: 'int', 
    nullable: true,
    name: 'related_id',
    comment: '关联ID' 
  })
  relatedId: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  @Index()
  createdAt: Date;
}
