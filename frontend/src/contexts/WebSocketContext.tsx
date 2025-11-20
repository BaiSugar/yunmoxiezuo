import React, { createContext, useContext, useEffect } from 'react';
import wsService from '../services/websocket';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  isConnected: boolean;
  send: (type: string, data: any) => void;
  on: (type: string, handler: (data: any) => void) => () => void;
  off: (type: string, handler: (data: any) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

/**
 * WebSocket Provider
 * 管理全局WebSocket连接
 */
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    // 用户登录后连接WebSocket
    if (user) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log('[WebSocketProvider] 开始连接 WebSocket, 用户:', user.id);
        wsService.connect(token);
      } else {
        console.warn('[WebSocketProvider] 不存在 accessToken, 无法连接 WebSocket');
      }
    } else {
      console.log('[WebSocketProvider] 用户未登录, 断开 WebSocket');
      wsService.disconnect();
    }

    // 组件卸载时断开连接
    return () => {
      wsService.disconnect();
    };
  }, [user]);

  const contextValue: WebSocketContextType = {
    isConnected: wsService.isConnected,
    send: wsService.send.bind(wsService),
    on: wsService.on.bind(wsService),
    off: wsService.off.bind(wsService),
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * 使用WebSocket Hook
 */
export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
