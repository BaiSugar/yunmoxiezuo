// 角色相关类型定义

import type { Permission } from './permission';

export interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  level: number;
  isSystem: boolean;
  status: 'active' | 'inactive';
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleDto {
  name: string;
  code: string;
  description?: string;
  level?: number;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  level?: number;
  status?: 'active' | 'inactive';
}

export interface AssignPermissionsDto {
  permissionIds: number[];
}

