import request from '../utils/request';
import type {
  Announcement,
  CreateAnnouncementDto,
  UpdateAnnouncementDto,
  QueryAnnouncementDto,
  AnnouncementStats,
  AnnouncementListResponse,
} from '../types/announcement';

/**
 * 创建公告
 */
export const createAnnouncement = async (data: CreateAnnouncementDto): Promise<Announcement> => {
  return request.post<Announcement>('/announcements', data);
};

/**
 * 查询公告列表（管理端）
 */
export const getAnnouncementList = async (params?: QueryAnnouncementDto): Promise<AnnouncementListResponse> => {
  return request.get<AnnouncementListResponse>('/announcements', { params });
};

/**
 * 获取公告详情
 */
export const getAnnouncementDetail = async (id: number): Promise<Announcement> => {
  return request.get<Announcement>(`/announcements/${id}`);
};

/**
 * 更新公告
 */
export const updateAnnouncement = async (id: number, data: UpdateAnnouncementDto): Promise<Announcement> => {
  return request.put<Announcement>(`/announcements/${id}`, data);
};

/**
 * 删除公告
 */
export const deleteAnnouncement = async (id: number): Promise<{ message: string }> => {
  return request.delete<{ message: string }>(`/announcements/${id}`);
};

/**
 * 发布公告
 */
export const publishAnnouncement = async (id: number): Promise<Announcement> => {
  return request.post<Announcement>(`/announcements/${id}/publish`);
};

/**
 * 立即推送公告
 */
export const pushAnnouncement = async (id: number): Promise<{ message: string }> => {
  return request.post<{ message: string }>(`/announcements/${id}/push`);
};

/**
 * 发布并推送公告（合并操作）
 */
export const publishAndPushAnnouncement = async (id: number): Promise<Announcement> => {
  // 先发布
  const published = await publishAnnouncement(id);
  // 再推送
  await pushAnnouncement(id);
  return published;
};

/**
 * 查看公告统计
 */
export const getAnnouncementStats = async (id: number): Promise<AnnouncementStats> => {
  return request.get<AnnouncementStats>(`/announcements/${id}/stats`);
};
