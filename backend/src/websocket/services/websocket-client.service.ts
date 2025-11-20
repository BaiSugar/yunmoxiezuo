import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { WsClient, WsMessage } from '../interfaces/websocket-message.interface';

/**
 * WebSocket 客户端管理服务
 * 
 * 功能：
 * 1. 管理所有在线连接
 * 2. 支持按用户ID、角色查找客户端
 * 3. 广播消息到指定客户端
 * 4. 自动清理断开的连接
 */
@Injectable()
export class WebSocketClientService {
  private readonly logger = new Logger(WebSocketClientService.name);
  
  // Socket ID -> Socket 映射
  private readonly clients = new Map<string, Socket>();
  
  // User ID -> Socket IDs 映射（一个用户可能有多个连接）
  private readonly userSockets = new Map<number, Set<string>>();
  
  // Socket ID -> WsClient 信息映射
  private readonly clientInfo = new Map<string, WsClient>();

  /**
   * 添加客户端连接
   */
  addClient(socket: Socket): void {
    const userId = socket.data.user?.id;
    const username = socket.data.user?.username;
    const roles = socket.data.user?.roles || [];
    
    if (!userId) {
      this.logger.warn(`Socket ${socket.id} 没有用户信息，无法添加`);
      return;
    }
    
    // 保存socket
    this.clients.set(socket.id, socket);
    
    // 保存用户映射
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);
    
    // 保存客户端信息
    this.clientInfo.set(socket.id, {
      id: socket.id,
      userId,
      username,
      roles,
      connectedAt: new Date(),
      lastHeartbeat: new Date(),
    });
    
    this.logger.log(`客户端连接: ${username} (${userId}) - Socket: ${socket.id}`);
    this.logger.debug(`当前在线: ${this.clients.size} 个连接, ${this.userSockets.size} 个用户`);
  }

  /**
   * 移除客户端连接
   */
  removeClient(socket: Socket): void {
    const userId = socket.data.user?.id;
    const socketId = socket.id;
    
    // 移除socket
    this.clients.delete(socketId);
    this.clientInfo.delete(socketId);
    
    // 移除用户映射
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
        }
      }
    }
    
    this.logger.log(`客户端断开: Socket ${socketId}`);
    this.logger.debug(`当前在线: ${this.clients.size} 个连接, ${this.userSockets.size} 个用户`);
  }

  /**
   * 更新心跳时间
   */
  updateHeartbeat(socketId: string): void {
    const info = this.clientInfo.get(socketId);
    if (info) {
      info.lastHeartbeat = new Date();
    }
  }

  /**
   * 获取所有在线客户端
   */
  getAllClients(): WsClient[] {
    return Array.from(this.clientInfo.values());
  }

  /**
   * 获取在线用户数量
   */
  getOnlineUserCount(): number {
    return this.userSockets.size;
  }

  /**
   * 获取在线连接数量
   */
  getOnlineConnectionCount(): number {
    return this.clients.size;
  }

  /**
   * 根据用户ID获取所有连接
   */
  getClientsByUserId(userId: number): Socket[] {
    const socketIds = this.userSockets.get(userId);
    if (!socketIds) {
      return [];
    }
    
    return Array.from(socketIds)
      .map(id => this.clients.get(id))
      .filter((socket): socket is Socket => socket !== undefined);
  }

  /**
   * 根据角色获取所有连接
   */
  getClientsByRole(roleName: string): Socket[] {
    const sockets: Socket[] = [];
    
    for (const info of this.clientInfo.values()) {
      if (info.roles.includes(roleName)) {
        const socket = this.clients.get(info.id);
        if (socket) {
          sockets.push(socket);
        }
      }
    }
    
    return sockets;
  }

  /**
   * 广播消息给所有在线用户
   */
  broadcastToAll(message: WsMessage): void {
    const count = this.clients.size;
    for (const socket of this.clients.values()) {
      socket.emit('message', message);
    }
    this.logger.debug(`广播消息到所有用户: ${count} 个连接`);
  }

  /**
   * 发送消息给指定用户（所有连接）
   */
  sendToUser(userId: number, message: WsMessage): void {
    const sockets = this.getClientsByUserId(userId);
    for (const socket of sockets) {
      socket.emit('message', message);
    }
    this.logger.debug(`发送消息给用户 ${userId}: ${sockets.length} 个连接`);
  }

  /**
   * 发送消息给指定角色的用户
   */
  sendToRole(roleName: string, message: WsMessage): void {
    const sockets = this.getClientsByRole(roleName);
    for (const socket of sockets) {
      socket.emit('message', message);
    }
    this.logger.debug(`发送消息给角色 ${roleName}: ${sockets.length} 个连接`);
  }

  /**
   * 批量发送消息给多个用户
   */
  sendToUsers(userIds: number[], message: WsMessage): void {
    let totalSent = 0;
    for (const userId of userIds) {
      const sockets = this.getClientsByUserId(userId);
      for (const socket of sockets) {
        socket.emit('message', message);
        totalSent++;
      }
    }
    this.logger.debug(`批量发送消息: ${userIds.length} 个用户, ${totalSent} 个连接`);
  }

  /**
   * 检查用户是否在线
   */
  isUserOnline(userId: number): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }

  /**
   * 清理超时的连接（超过5分钟没有心跳）
   */
  cleanupInactiveConnections(): void {
    const timeout = 5 * 60 * 1000; // 5分钟
    const now = Date.now();
    let cleaned = 0;
    
    for (const [socketId, info] of this.clientInfo.entries()) {
      if (now - info.lastHeartbeat.getTime() > timeout) {
        const socket = this.clients.get(socketId);
        if (socket) {
          socket.disconnect(true);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      this.logger.warn(`清理了 ${cleaned} 个超时连接`);
    }
  }
}

