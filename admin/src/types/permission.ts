// 权限相关类型定义

export interface Permission {
  id: number;
  name: string;
  code: string;
  type: 'menu' | 'api' | 'button';
  resource?: string;
  method?: string;
  description?: string;
  parentId?: number;
  sortOrder: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface PermissionTreeNode extends Permission {
  children?: PermissionTreeNode[];
}

export interface CreatePermissionDto {
  name: string;
  code: string;
  type: 'menu' | 'api' | 'button';
  resource?: string;
  method?: string;
  description?: string;
  parentId?: number;
  sortOrder?: number;
}

export interface UpdatePermissionDto {
  name?: string;
  description?: string;
  resource?: string;
  method?: string;
  parentId?: number;
  sortOrder?: number;
  status?: 'active' | 'inactive';
}

