import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ToolUsageLog } from './tool-usage-log.entity';


@Entity('tools')
export class Tool {
  @PrimaryGeneratedColumn({ comment: '工具ID' })
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true, comment: '工具唯一标识' })
  name: string;

  @Column({ type: 'varchar', length: 100, comment: '工具标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '工具描述' })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'Wrench', comment: '图标名称' })
  icon: string;

  @Column({ type: 'varchar', length: 100, comment: '前端路由路径' })
  route: string;

  @Column({ type: 'varchar', length: 50, default: 'utility', comment: '工具分类' })
  category: string;

  @Column({ type: 'tinyint', default: 1, comment: '是否启用' })
  isEnabled: boolean;

  @Column({ type: 'tinyint', default: 1, comment: '是否需要会员' })
  requiresMembership: boolean;

  @Column({ type: 'json', nullable: true, comment: '允许的会员等级' })
  allowedMembershipLevels: string[];

  @Column({ type: 'int', default: 0, comment: '排序序号' })
  orderNum: number;

  @Column({ type: 'json', nullable: true, comment: '工具配置' })
  config: Record<string, any>;

  @Column({ type: 'int', default: 0, comment: '总使用次数' })
  usageCount: number;

  @CreateDateColumn({ comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => ToolUsageLog, (log) => log.tool)
  usageLogs: ToolUsageLog[];
}
