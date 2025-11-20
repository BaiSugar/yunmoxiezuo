import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Novel } from './novel.entity';

@Entity('characters')
@Index(['novelId', 'category'])
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'novel_id', type: 'int' })
  novelId: number;

  @Column({ length: 100, comment: '人物名称' })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '分类/分组（类似文件夹）' })
  category: string;

  @Column({ type: 'json', nullable: true, comment: '自定义字段（JSON格式存储各种词条）' })
  fields: Record<string, any>;

  @Column({ type: 'int', default: 0, comment: '排序顺序' })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  // 关联作品
  @ManyToOne(() => Novel, (novel) => novel.characters)
  @JoinColumn({ name: 'novel_id' })
  novel: Novel;
}
