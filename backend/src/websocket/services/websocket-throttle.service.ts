import { Injectable, Logger } from '@nestjs/common';
import { WsMessage } from '../interfaces/websocket-message.interface';

/**
 * 节流配置
 */
interface ThrottleConfig {
  interval: number;  // 节流间隔（毫秒）
  maxBatch: number;  // 最大批量数
}

/**
 * 待发送消息队列
 */
interface MessageQueue {
  messages: WsMessage[];
  timer: NodeJS.Timeout | null;
}

/**
 * WebSocket 消息节流服务
 * 
 * 功能：
 * 1. 消息节流：频繁推送时自动节流
 * 2. 批量推送：将多个消息合并成一次推送
 * 3. 增量更新：支持增量数据推送
 */
@Injectable()
export class WebSocketThrottleService {
  private readonly logger = new Logger(WebSocketThrottleService.name);
  private readonly messageQueues = new Map<string, MessageQueue>();
  
  // 默认配置: 每2秒最多推送10条消息
  private readonly defaultConfig: ThrottleConfig = {
    interval: 2000,
    maxBatch: 10,
  };

  /**
   * 添加消息到节流队列
   * @param key 队列键（如userId、topic等）
   * @param message 消息内容
   * @param callback 发送回调
   * @param config 自定义配置
   */
  addMessage(
    key: string,
    message: WsMessage,
    callback: (messages: WsMessage[]) => void,
    config?: Partial<ThrottleConfig>,
  ): void {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // 获取或创建队列
    let queue = this.messageQueues.get(key);
    if (!queue) {
      queue = {
        messages: [],
        timer: null,
      };
      this.messageQueues.set(key, queue);
    }
    
    // 添加消息到队列
    queue.messages.push(message);
    
    // 如果达到最大批量数，立即发送
    if (queue.messages.length >= finalConfig.maxBatch) {
      this.flush(key, callback);
      return;
    }
    
    // 如果没有定时器，创建一个
    if (!queue.timer) {
      queue.timer = setTimeout(() => {
        this.flush(key, callback);
      }, finalConfig.interval);
    }
  }

  /**
   * 立即发送队列中的所有消息
   */
  private flush(key: string, callback: (messages: WsMessage[]) => void): void {
    const queue = this.messageQueues.get(key);
    if (!queue || queue.messages.length === 0) {
      return;
    }
    
    // 清除定时器
    if (queue.timer) {
      clearTimeout(queue.timer);
      queue.timer = null;
    }
    
    // 发送消息
    const messages = [...queue.messages];
    queue.messages = [];
    
    this.logger.debug(`批量发送 ${messages.length} 条消息到 ${key}`);
    callback(messages);
  }

  /**
   * 清除指定队列
   */
  clear(key: string): void {
    const queue = this.messageQueues.get(key);
    if (queue) {
      if (queue.timer) {
        clearTimeout(queue.timer);
      }
      this.messageQueues.delete(key);
    }
  }

  /**
   * 清除所有队列
   */
  clearAll(): void {
    for (const [key] of this.messageQueues) {
      this.clear(key);
    }
  }

  /**
   * 合并多个相同类型的消息（增量更新）
   * @param messages 消息数组
   * @returns 合并后的消息
   */
  static mergeMessages(messages: WsMessage[]): WsMessage[] {
    const merged = new Map<string, WsMessage>();
    
    for (const message of messages) {
      const key = `${message.type}`;
      const existing = merged.get(key);
      
      if (existing) {
        // 如果是数组数据，合并数组
        if (Array.isArray(existing.data) && Array.isArray(message.data)) {
          existing.data = [...existing.data, ...message.data];
        } else {
          // 否则覆盖
          existing.data = message.data;
        }
        existing.timestamp = message.timestamp;
      } else {
        merged.set(key, { ...message });
      }
    }
    
    return Array.from(merged.values());
  }
}

