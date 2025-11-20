import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Prompt } from './prompt.entity';

export enum CategoryUsageType {
  WRITING = 'writing',      // AI写作
  ROLEPLAY = 'roleplay',    // 角色扮演
}

@Entity('prompt_categories')
@Index(['usageType'])
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, comment: '分类名称（如：AI写作、角色扮演）' })
  name: string;

  @Column({ length: 100, nullable: true, comment: '图标' })
  icon: string;

  @Column({ type: 'varchar', length: 255, nullable: true, comment: '分类描述' })
  description: string;

  @Column({ type: 'int', default: 0, comment: '排序顺序' })
  order: number;

  @Column({
    name: 'usage_type',
    type: 'enum',
    enum: CategoryUsageType,
    default: CategoryUsageType.WRITING,
    comment: '使用场景：writing=AI写作, roleplay=角色扮演',
  })
  usageType: CategoryUsageType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 关联提示词
  @OneToMany(() => Prompt, (prompt) => prompt.category)
  prompts: Prompt[];
}
