export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: number;
    username: string;
    email: string;
    nickname: string;
    avatar: string;
    roles: string[];
  };
}

export interface RefreshResponse {
  accessToken: string;
  expiresIn: number;
}

