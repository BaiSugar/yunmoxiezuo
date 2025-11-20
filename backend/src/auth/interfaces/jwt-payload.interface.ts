export interface JwtPayload {
  sub: number; // 用户ID
  email: string;
  username: string;
  roles: string[]; // 角色代码数组
}

export interface JwtRefreshPayload {
  sub: number; // 用户ID
  email: string;
}

