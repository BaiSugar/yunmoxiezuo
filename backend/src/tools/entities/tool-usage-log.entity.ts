import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tool } from './tool.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tool_usage_logs')
export class ToolUsageLog {
  @PrimaryGeneratedColumn({ comment: '记录ID' })
  id: number;

  @Column({ type: 'int', comment: '工具ID' })
  toolId: number;

  @Column({ type: 'int', comment: '用户ID' })
  userId: number;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: '使用时的会员等级' })
  membershipLevel: string;

  @Column({ type: 'varchar', length: 20, nullable: true, comment: '搜索类型' })
  searchType: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '搜索内容' })
  searchQuery: string;

  @Column({ type: 'int', default: 0, comment: '返回结果数量' })
  resultCount: number;

  @Column({ type: 'varchar', length: 50, nullable: true, comment: 'IP地址' })
  ipAddress: string;

  @Column({ type: 'varchar', length: 500, nullable: true, comment: '用户代理' })
  userAgent: string;

  @CreateDateColumn({ comment: '使用时间' })
  createdAt: Date;

  @ManyToOne(() => Tool, (tool) => tool.usageLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tool_id' })
  tool: Tool;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
