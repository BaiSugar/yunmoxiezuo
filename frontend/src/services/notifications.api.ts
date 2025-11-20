/**
 * 通知系统 API 服务
 */

import { apiService } from "./api";

/**
 * 通知数据结构
 */
export interface Notification {
  id: string;
  title: string;
  content: string;
  category: string;
  level?: "info" | "success" | "warning" | "error";
  action?: {
    text: string;
    url: string;
  };
  extra?: Record<string, any>;
  createdAt: Date;
}

/**
 * 查询通知参数
 */
export interface QueryNotificationDto {
  page?: number;
  limit?: number;
  isRead?: boolean;
  category?: string;
}

/**
 * 通知列表响应（后端直接返回的分页数据）
 */
export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 未读数量响应（后端直接返回的数据）
 */
export interface UnreadCountResponse {
  count: number;
}

/**
 * 通知API
 */
export const notificationsApi = {
  /**
   * 获取用户通知列表
   */
  async getNotifications(
    query: QueryNotificationDto = {}
  ): Promise<NotificationListResponse> {
    const response = await apiService.get<NotificationListResponse>(
      "/notifications",
      { params: query }
    );
    return response.data.data;
  },

  /**
   * 获取未读通知数量
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    const response = await apiService.get<UnreadCountResponse>(
      "/notifications/unread-count"
    );
    return response.data.data;
  },

  /**
   * 标记通知为已读
   */
  async markAsRead(notificationId: string): Promise<void> {
    await apiService.post(`/notifications/${notificationId}/read`);
  },

  /**
   * 全部标记为已读
   */
  async markAllAsRead(): Promise<void> {
    await apiService.post("/notifications/mark-all-read");
  },

  /**
   * 删除通知
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiService.delete(`/notifications/${notificationId}`);
  },

  /**
   * 批量删除通知
   */
  async deleteNotifications(notificationIds: string[]): Promise<void> {
    await apiService.post("/notifications/batch-delete", {
      ids: notificationIds,
    });
  },

  /**
   * 清空所有已读通知
   */
  async clearReadNotifications(): Promise<void> {
    await apiService.delete("/notifications/clear-read");
  },
};
