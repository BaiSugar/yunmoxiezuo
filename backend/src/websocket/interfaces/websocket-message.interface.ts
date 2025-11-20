/**
 * WebSocket 消息接口定义
 */

/**
 * WebSocket 消息类型
 */
export enum WsMessageType {
  // 系统消息
  PING = 'ping',
  PONG = 'pong',
  ERROR = 'error',
  
  // 公告相关
  ANNOUNCEMENT_NEW = 'announcement:new',
  ANNOUNCEMENT_UPDATE = 'announcement:update',
  ANNOUNCEMENT_DELETE = 'announcement:delete',
  
  // 通知相关
  NOTIFICATION_NEW = 'notification:new',
  
  // 聊天相关
  CHAT_MESSAGE = 'chat:message',
  
  // 用户相关
  USERS_ONLINE = 'users:online',
  
  // 会员相关
  MEMBERSHIP_EXPIRED = 'membership:expired',
  MEMBERSHIP_EXPIRING_SOON = 'membership:expiring_soon',
}

/**
 * WebSocket 消息格式
 */
export interface WsMessage<T = any> {
  type: WsMessageType | string;
  data: T;
  timestamp?: number;
}

/**
 * WebSocket 客户端信息
 */
export interface WsClient {
  id: string;
  userId: number;
  username: string;
  roles: string[];
  connectedAt: Date;
  lastHeartbeat: Date;
}

/**
 * WebSocket 认证负载
 */
export interface WsAuthPayload {
  sub: number;
  username: string;
  roles?: string[];
}

