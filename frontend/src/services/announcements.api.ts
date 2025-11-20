/**
 * 公告系统 API 服务
 */

import { apiService } from './api';
import type { Announcement, UnreadCountResponse, MarkAsReadDto } from '../types/announcement';

/**
 * 公告API
 */
export const announcementsApi = {
  /**
   * 获取当前有效公告
   */
  async getActiveAnnouncements(): Promise<Announcement[]> {
    const response = await apiService.get<Announcement[]>('/announcements/active');
    return response.data.data;
  },

  /**
   * 获取需要弹窗的公告
   */
  async getPopupAnnouncements(): Promise<Announcement[]> {
    const response = await apiService.get<Announcement[]>('/announcements/popup');
    return response.data.data;
  },

  /**
   * 获取所有公告列表（用于公告列表弹窗 - 用户端）
   */
  async getAnnouncements(): Promise<Announcement[]> {
    const response = await apiService.get<Announcement[]>('/announcements/active');
    return response.data.data;
  },

  /**
   * 获取未读数量
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiService.get<UnreadCountResponse>('/announcements/unread-count');
    return response.data.data.count;
  },

  /**
   * 查看公告详情
   */
  async getAnnouncement(id: number): Promise<Announcement> {
    const response = await apiService.get<Announcement>(`/announcements/${id}`);
    return response.data.data;
  },

  /**
   * 标记公告为已读
   */
  async markAsRead(id: number, data: MarkAsReadDto = {}): Promise<void> {
    await apiService.post(`/announcements/${id}/read`, data);
  },
};

export default announcementsApi;
