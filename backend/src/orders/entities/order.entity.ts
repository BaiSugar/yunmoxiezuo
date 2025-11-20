import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderType } from '../enums/order-type.enum';
import { OrderStatus } from '../enums/order-status.enum';

/**
 * 订单实体
 */
@Entity('orders')
@Index(['userId', 'status'])
@Index(['createdAt'])
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 32, unique: true, comment: '订单号' })
  @Index()
  orderNo: string;

  @Column({ comment: '用户ID' })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: OrderType,
    comment: '订单类型',
  })
  type: OrderType;

  @Column({ comment: '产品ID（套餐ID或字数包ID）' })
  productId: number;

  @Column({ length: 100, comment: '产品名称（冗余）' })
  productName: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '订单金额' })
  amount: number;

  @Column({ length: 50, nullable: true, comment: '支付方式' })
  paymentMethod: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
    comment: '状态',
  })
  status: OrderStatus;

  @Column({ type: 'timestamp', nullable: true, comment: '支付时间' })
  paidAt: Date;

  @Column({ type: 'timestamp', nullable: true, comment: '退款时间' })
  refundedAt: Date;

  @Column({ length: 100, nullable: true, comment: '第三方交易号' })
  transactionId: string;

  @Column({ length: 255, nullable: true, comment: '备注' })
  remark: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
