// 用户相关类型定义
import type { Role } from './role';

export const UserStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BANNED: 'banned',
} as const;

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

export interface User {
  id: number;
  email: string;
  username: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  status: UserStatusType;
  balance: number;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
}

export interface LoginRequest {
  credential: string; // 邮箱或用户名
  password: string;
}

// 登录响应中的用户信息（简化版，roles是字符串数组）
export interface LoginUser {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  nickname?: string; // 可选字段，保持与User类型兼容
  bio?: string; // 可选字段，保持与User类型兼容
  roles: string[]; // 后端登录时只返回角色代码数组
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: LoginUser; // 使用简化版的用户类型
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  nickname?: string;
}

export interface QueryUserDto {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: 'active' | 'inactive' | 'banned';
  roleId?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  roleIds?: number[];
}

export interface UpdateUserDto {
  username?: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  email?: string;
}

export interface UpdateProfileDto {
  username?: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
}

export interface AssignRolesDto {
  roleIds: number[];
}

