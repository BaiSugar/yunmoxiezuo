// 字数余额相关类型
export * from './token-balance';

// 编辑器设置相关类型
export * from './editor-settings';

// 用户相关类型
export interface User {
  id: number;
  email: string;
  username: string;
  nickname?: string;
  avatar?: string;
  bio?: string;
  status: 'active' | 'inactive' | 'banned';
  balance: number;
  inviteCode?: string;        // 我的邀请码
  invitedByCode?: string;     // 注册时使用的邀请码
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  type: 'menu' | 'button' | 'api';
  parentId?: number;
  children?: Permission[];
}

// 认证相关类型
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    email: string;
    username: string;
    avatar?: string;
    roles: string[];
  };
}

export interface LoginRequest {
  credential: string; // 邮箱或用户名
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  nickname?: string;
  confirmPassword: string;
  inviteCode?: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// Toast相关类型
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// 确认对话框类型
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}
