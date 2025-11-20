import request from '../utils/request';
import type { PaginatedResponse } from '../types/api';
import type {
  User,
  QueryUserDto,
  CreateUserDto,
  UpdateUserDto,
  UpdateProfileDto,
  ChangePasswordDto,
  AssignRolesDto,
} from '../types/user';
import type { Permission } from '../types/permission';

/**
 * 获取用户列表
 */
export const getUserList = async (params: QueryUserDto): Promise<PaginatedResponse<User>> => {
  return request.get<PaginatedResponse<User>>('/users', { params });
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<User> => {
  return request.get<User>('/users/me');
};

/**
 * 更新当前用户信息
 */
export const updateCurrentUser = async (data: UpdateProfileDto): Promise<User> => {
  return request.patch<User>('/users/me', data);
};

/**
 * 修改密码
 */
export const changePassword = async (data: ChangePasswordDto): Promise<{ message: string }> => {
  return request.post<{ message: string }>('/users/change-password', data);
};

/**
 * 获取用户详情
 */
export const getUserById = async (id: number): Promise<User> => {
  return request.get<User>(`/users/${id}`);
};

/**
 * 创建用户（管理员）
 */
export const createUser = async (data: CreateUserDto): Promise<User> => {
  return request.post<User>('/users', data);
};

/**
 * 更新用户（管理员）
 */
export const updateUser = async (id: number, data: UpdateUserDto): Promise<User> => {
  return request.patch<User>(`/users/${id}`, data);
};

/**
 * 删除用户
 */
export const deleteUser = async (id: number): Promise<{ message: string }> => {
  return request.delete<{ message: string }>(`/users/${id}`);
};

/**
 * 封禁用户
 */
export const banUser = async (id: number): Promise<{ message: string }> => {
  return request.post<{ message: string }>(`/users/${id}/ban`);
};

/**
 * 解封用户
 */
export const unbanUser = async (id: number): Promise<{ message: string }> => {
  return request.post<{ message: string }>(`/users/${id}/unban`);
};

/**
 * 为用户分配角色
 */
export const assignRoles = async (id: number, data: AssignRolesDto): Promise<User> => {
  return request.post<User>(`/users/${id}/roles`, data);
};

/**
 * 获取用户权限列表
 */
export const getUserPermissions = async (id: number): Promise<Permission[]> => {
  return request.get<Permission[]>(`/users/${id}/permissions`);
};

