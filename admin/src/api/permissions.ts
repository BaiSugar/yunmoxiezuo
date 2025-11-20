import request from '../utils/request';
import type {
  Permission,
  PermissionTreeNode,
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../types/permission';

/**
 * 获取权限列表（平铺）
 */
export const getPermissionList = async (): Promise<Permission[]> => {
  return request.get<Permission[]>('/permissions');
};

/**
 * 获取权限树
 */
export const getPermissionTree = async (): Promise<PermissionTreeNode[]> => {
  return request.get<PermissionTreeNode[]>('/permissions/tree');
};

/**
 * 获取权限详情
 */
export const getPermissionById = async (id: number): Promise<Permission> => {
  return request.get<Permission>(`/permissions/${id}`);
};

/**
 * 创建权限
 */
export const createPermission = async (data: CreatePermissionDto): Promise<Permission> => {
  return request.post<Permission>('/permissions', data);
};

/**
 * 更新权限
 */
export const updatePermission = async (id: number, data: UpdatePermissionDto): Promise<Permission> => {
  return request.patch<Permission>(`/permissions/${id}`, data);
};

/**
 * 删除权限
 */
export const deletePermission = async (id: number): Promise<{ message: string }> => {
  return request.delete<{ message: string }>(`/permissions/${id}`);
};

