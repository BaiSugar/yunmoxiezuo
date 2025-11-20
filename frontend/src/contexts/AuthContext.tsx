import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { User, LoginRequest, RegisterRequest } from "../types";
import { authService } from "../services/authService";

// AuthContext with user refresh support

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "CLEAR_ERROR" };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 初始化时检查本地存储的token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const user = await authService.getProfile();
          dispatch({ type: "AUTH_SUCCESS", payload: user });
        } catch (error) {
          // Token无效，清除本地存储
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          dispatch({ type: "AUTH_FAILURE", payload: "Token已过期" });
        }
      } else {
        dispatch({ type: "AUTH_FAILURE", payload: "" });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    dispatch({ type: "AUTH_START" });
    try {
      const response = await authService.login(credentials);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);

      // 登录成功后，获取完整的用户信息（包含权限）
      const user = await authService.getProfile();
      dispatch({
        type: "AUTH_SUCCESS",
        payload: user,
      });
    } catch (error: any) {
      dispatch({ type: "AUTH_FAILURE", payload: error.message || "登录失败" });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    dispatch({ type: "AUTH_START" });
    try {
      const response = await authService.register(userData);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);

      // 注册成功后，获取完整的用户信息（包含权限）
      const user = await authService.getProfile();
      dispatch({
        type: "AUTH_SUCCESS",
        payload: user,
      });
    } catch (error: any) {
      dispatch({ type: "AUTH_FAILURE", payload: error.message || "注册失败" });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // 即使登出失败也要清除本地状态
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      dispatch({ type: "AUTH_LOGOUT" });
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem("refreshToken");
      if (!refreshTokenValue) {
        throw new Error("No refresh token");
      }

      const response = await authService.refreshToken(refreshTokenValue);
      localStorage.setItem("accessToken", response.accessToken);
    } catch (error) {
      // 刷新失败，清除本地存储并登出
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      dispatch({ type: "AUTH_LOGOUT" });
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const user = await authService.getProfile();
      dispatch({ type: "AUTH_SUCCESS", payload: user });
    } catch (error) {
      console.error("刷新用户信息失败:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshToken,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
