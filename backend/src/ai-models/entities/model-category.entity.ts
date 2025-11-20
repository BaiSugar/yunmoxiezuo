import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AiModel } from './ai-model.entity';

/**
 * AI 模型分类实体
 */
@Entity('model_categories')
@Index(['order'])
export class ModelCategory {
  @PrimaryGeneratedColumn()
  id: number;

  /** 分类名称 */
  @Column({ length: 50, comment: '分类名称（如：文本生成、对话、图像识别）' })
  name: string;

  /** 图标 */
  @Column({ length: 100, nullable: true, comment: '图标' })
  icon: string;

  /** 分类描述 */
  @Column({ type: 'varchar', length: 255, nullable: true, comment: '分类描述' })
  description: string;

  /** 排序顺序 */
  @Column({ type: 'int', default: 0, comment: '排序顺序' })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /** 关联的模型 */
  @OneToMany(() => AiModel, (model) => model.category)
  models: AiModel[];
}

