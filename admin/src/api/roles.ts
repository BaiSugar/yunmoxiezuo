import request from '../utils/request';
import type {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
} from '../types/role';
import type { Permission } from '../types/permission';

/**
 * 获取角色列表
 */
export const getRoleList = async (): Promise<Role[]> => {
  return request.get<Role[]>('/roles');
};

/**
 * 获取角色详情
 */
export const getRoleById = async (id: number): Promise<Role> => {
  return request.get<Role>(`/roles/${id}`);
};

/**
 * 创建角色
 */
export const createRole = async (data: CreateRoleDto): Promise<Role> => {
  return request.post<Role>('/roles', data);
};

/**
 * 更新角色
 */
export const updateRole = async (id: number, data: UpdateRoleDto): Promise<Role> => {
  return request.patch<Role>(`/roles/${id}`, data);
};

/**
 * 删除角色
 */
export const deleteRole = async (id: number): Promise<{ message: string }> => {
  return request.delete<{ message: string }>(`/roles/${id}`);
};

/**
 * 为角色分配权限
 */
export const assignPermissions = async (id: number, data: AssignPermissionsDto): Promise<Role> => {
  return request.put<Role>(`/roles/${id}/permissions`, data);
};

/**
 * 获取角色权限列表
 */
export const getRolePermissions = async (id: number): Promise<Permission[]> => {
  return request.get<Permission[]>(`/roles/${id}/permissions`);
};

