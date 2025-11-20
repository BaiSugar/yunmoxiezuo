import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';

export enum PermissionType {
  MENU = 'menu',
  BUTTON = 'button',
  API = 'api',
}

export enum PermissionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('permissions')
@Index(['code'], { unique: true })
@Index(['resource', 'method'])
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'parent_id', type: 'int', nullable: true, comment: '父权限ID' })
  parentId: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: PermissionType,
    default: PermissionType.API,
  })
  type: PermissionType;

  @Column({ length: 255, nullable: true, comment: '资源路径' })
  resource: string;

  @Column({ length: 10, nullable: true, comment: 'HTTP方法' })
  method: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'sort_order', type: 'int', default: 0, comment: '排序' })
  sortOrder: number;

  @Column({
    type: 'enum',
    enum: PermissionStatus,
    default: PermissionStatus.ACTIVE,
  })
  status: PermissionStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // 父权限（多对一）
  @ManyToOne(() => Permission, (permission) => permission.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Permission;

  // 子权限（一对多）
  @OneToMany(() => Permission, (permission) => permission.parent)
  children: Permission[];

  // 关联角色（多对多）
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}

