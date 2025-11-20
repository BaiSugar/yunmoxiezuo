/**
 * WebSocket 实时通信服务
 * 基于 Socket.IO 客户端
 */

import { io, Socket } from 'socket.io-client';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private socket: Socket | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private heartbeatTimer: number | null = null;
  private heartbeatInterval = 30000; // 30秒心跳
  private _isConnected = false;

  /**
   * 连接WebSocket服务器
   */
  connect(token?: string) {
    if (this.socket?.connected) {
      console.log('✅ Socket.IO已连接，无需重复连接');
      return;
    }

    if (!token) {
      console.warn('⚠️ 缺少Token，无法连接WebSocket');
      return;
    }

    // 如果有旧连接，先断开
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    // 构建Socket.IO连接
    // 开发环境连接到后端服务器，生产环境使用相对路径（通过 Nginx 代理）
    const isDev = import.meta.env.DEV;
    const url = isDev 
      ? 'http://localhost:5000'  // 开发环境：连接到后端 5000 端口
      : ''; // 生产环境：使用相对路径，通过 Nginx 代理到后端

    console.log('🔌 连接Socket.IO:', url || '(当前域名)', '(开发模式:', isDev, ')');
    console.log('🔑 Token长度:', token.length, '字符');

    try {
      this.socket = io(url, {
        path: '/socket.io', // Socket.IO内部路径（自动处理）
        transports: ['websocket', 'polling'],
        query: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        reconnectionDelayMax: 10000,
        autoConnect: true,
      });

      // 连接成功
      this.socket.on('connect', () => {
        console.log('✅ WebSocket 连接成功');
        this._isConnected = true;
        this.startHeartbeat();
      });

      // 接收消息
      this.socket.on('message', (message: any) => {
        this.handleMessage(message);
      });

      // 连接错误
      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket 连接错误:', error);
        this._isConnected = false;
      });

      // 连接断开
      this.socket.on('disconnect', (reason) => {
        console.warn('🔌 WebSocket 断开连接, 原因:', reason);
        this._isConnected = false;
        this.stopHeartbeat();
      });

      // 重连中
      this.socket.on('reconnect_attempt', (attemptNumber) => {
        console.log('🔄 WebSocket 重连中 (尝试 #' + attemptNumber + ')');
      });

      // 重连成功
      this.socket.on('reconnect', (attemptNumber) => {
        console.log('✅ WebSocket 重连成功 (尝试 #' + attemptNumber + ')');
        this._isConnected = true;
      });

      // 重连失败
      this.socket.on('reconnect_failed', () => {
        console.error('❌ WebSocket 重连失败');
        this._isConnected = false;
      });

      // 错误处理
      this.socket.on('error', (error) => {
        console.error('❌ WebSocket 错误:', error);
      });
    } catch (error) {
      console.error('❌ 创建Socket.IO连接失败:', error);
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    this.stopHeartbeat();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this._isConnected = false;
  }

  /**
   * 发送消息
   */
  send(type: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit('message', { type, data });
    } else {
    }
  }

  /**
   * 订阅消息
   */
  on(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
    console.log(`[WebSocketService] 订阅消息类型: ${type}, 当前订阅数: ${this.messageHandlers.get(type)!.size}`);

    // 返回取消订阅函数
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        console.log(`[WebSocketService] 取消订阅消息类型: ${type}, 剩余订阅数: ${handlers.size}`);
      }
    };
  }

  /**
   * 取消订阅
   */
  off(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: { type: string; data: any }) {
    console.log('[WebSocketService] 收到消息:', message.type, message.data);
    
    const handlers = this.messageHandlers.get(message.type);
    if (handlers && handlers.size > 0) {
      console.log(`[WebSocketService] 找到 ${handlers.size} 个处理器处理消息类型: ${message.type}`);
      handlers.forEach((handler) => handler(message.data));
    } else {
      // 系统消息不需要警告（connection:success, pong等）
      const systemMessages = ['connection:success', 'pong', 'error', 'ping'];
      if (!systemMessages.includes(message.type)) {
        console.warn(`[WebSocketService] 没有找到消息类型 "${message.type}" 的处理器`);
      }
    }
  }

  /**
   * 启动心跳
   */
  private startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, this.heartbeatInterval);

  }

  /**
   * 停止心跳
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this._isConnected;
  }
}

// 导出单例
export const wsService = new WebSocketService();
export default wsService;
