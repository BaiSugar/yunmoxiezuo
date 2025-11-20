import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * 字数包实体
 */
@Entity('token_packages')
@Index(['isActive', 'sort'])
export class TokenPackage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, comment: '套餐名称' })
  name: string;

  @Column({ type: 'bigint', comment: '字数数量（tokens）' })
  tokenAmount: number;

  @Column({ type: 'bigint', default: 0, comment: '赠送字数' })
  bonusTokens: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '价格（元）' })
  price: number;

  @Column({
    type: 'int',
    default: 0,
    comment: '有效期（天数），0表示购买后立即到账且永久有效',
  })
  validDays: number;

  @Column({
    type: 'int',
    default: 0,
    comment: '最低会员等级要求，0表示无限制',
  })
  minMemberLevel: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1.0,
    comment: '折扣（如：0.8表示8折）',
  })
  discount: number;

  @Column({ type: 'boolean', default: true, comment: '是否上架' })
  isActive: boolean;

  @Column({ type: 'int', default: 0, comment: '排序' })
  sort: number;

  @Column({ type: 'text', nullable: true, comment: '描述' })
  description: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '购买地址' })
  purchaseUrl: string;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;
}
