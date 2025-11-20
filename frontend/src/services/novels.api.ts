import { apiService } from "./api";
import type { Novel } from "../components/novels/NovelCard";

/**
 * 作品API服务
 */
export const novelsApi = {
  /**
   * 获取我的作品列表（支持分页）
   */
  async getMyNovels(params?: {
    page?: number;
    pageSize?: number;
  }): Promise<Novel[] | { data: Novel[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }> {
    const queryParams = new URLSearchParams();
    if (params?.page) {
      queryParams.append('page', String(params.page));
    }
    if (params?.pageSize) {
      queryParams.append('pageSize', String(params.pageSize));
    }
    
    const url = `/novels${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiService.get<any>(url);
    return response.data.data;
  },

  /**
   * 获取作品详情
   */
  async getNovel(id: number): Promise<Novel> {
    const response = await apiService.get<Novel>(`/novels/${id}`);
    return response.data.data;
  },

  /**
   * 创建作品
   */
  async createNovel(data: {
    name: string;
    synopsis?: string;
    genre?: string;
    status?: string;
    targetWordsPerChapter?: number;
    coverImage?: string;
  }): Promise<Novel> {
    const response = await apiService.post<Novel>("/novels", data);
    return response.data.data;
  },

  /**
   * 更新作品
   */
  async updateNovel(
    id: number,
    data: {
      name?: string;
      synopsis?: string;
      genre?: string;
      status?: string;
      targetWordsPerChapter?: number;
      coverImage?: string;
    }
  ): Promise<Novel> {
    const response = await apiService.patch<Novel>(`/novels/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除作品
   */
  async deleteNovel(id: number): Promise<void> {
    await apiService.delete(`/novels/${id}`);
  },

  /**
   * 获取作品的分卷列表
   */
  async getVolumes(novelId: number): Promise<any[]> {
    const response = await apiService.get<any[]>(`/novels/${novelId}/volumes`);
    return response.data.data;
  },

  /**
   * 创建分卷
   */
  async createVolume(novelId: number, data: {
    name: string;
    description?: string;
    order?: number;
    globalOrder?: number;
  }): Promise<any> {
    const response = await apiService.post<any>(`/volumes?novelId=${novelId}`, data);
    return response.data.data;
  },

  /**
   * 获取作品的所有章节（包括独立章节）
   */
  async getChapters(novelId: number): Promise<any[]> {
    const response = await apiService.get<any[]>(`/novels/${novelId}/chapters`);
    return response.data.data;
  },

  /**
   * 创建章节
   */
  async createChapter(data: {
    novelId: number;
    title: string;
    volumeId?: number | null;
    content?: string;
    order?: number;
    globalOrder?: number | null;
  }): Promise<any> {
    const response = await apiService.post<any>('/chapters', data);
    return response.data.data;
  },

  /**
   * 获取章节详情
   */
  async getChapter(chapterId: number): Promise<any> {
    const response = await apiService.get<any>(`/chapters/${chapterId}`);
    return response.data.data;
  },

  /**
   * 更新章节
   */
  async updateChapter(
    chapterId: number,
    data: {
      title?: string;
      content?: string;
      order?: number;
      globalOrder?: number;
      volumeId?: number | null;
    }
  ): Promise<any> {
    const response = await apiService.patch<any>(`/chapters/${chapterId}`, data);
    return response.data.data;
  },

  /**
   * 更新章节标题
   */
  async updateChapterTitle(chapterId: number, title: string): Promise<any> {
    const response = await apiService.patch<any>(`/chapters/${chapterId}`, { title });
    return response.data.data;
  },

  /**
   * 更新章节内容
   */
  async updateChapterContent(chapterId: number, content: string): Promise<any> {
    const response = await apiService.patch<any>(`/chapters/${chapterId}`, { content });
    return response.data.data;
  },

  /**
   * 更新章节梗概
   */
  async updateChapterSummary(chapterId: number, summary: string): Promise<any> {
    const response = await apiService.patch<any>(`/chapters/${chapterId}`, { summary });
    return response.data.data;
  },

  /**
   * 删除章节
   */
  async deleteChapter(chapterId: number): Promise<void> {
    await apiService.delete(`/chapters/${chapterId}`);
  },

  /**
   * 更新分卷
   */
  async updateVolume(
    volumeId: number,
    data: {
      name?: string;
      description?: string;
      order?: number;
      globalOrder?: number;
    }
  ): Promise<any> {
    const response = await apiService.patch<any>(`/volumes/${volumeId}`, data);
    return response.data.data;
  },

  /**
   * 删除分卷
   */
  async deleteVolume(volumeId: number): Promise<void> {
    await apiService.delete(`/volumes/${volumeId}`);
  },

  /**
   * 批量更新章节顺序
   */
  async batchUpdateChapters(chapters: Array<{
    id: number;
    order?: number;
    globalOrder?: number;
    volumeId?: number | null;
  }>): Promise<void> {
    await apiService.post('/chapters/batch-update', { chapters });
  },

  /**
   * 批量更新分卷顺序
   */
  async batchUpdateVolumes(volumes: Array<{
    id: number;
    order?: number;
    globalOrder?: number;
  }>): Promise<void> {
    await apiService.post('/volumes/batch-update', { volumes });
  },

  /**
   * 获取章节的历史版本列表
   */
  async getChapterVersions(chapterId: number): Promise<any[]> {
    const response = await apiService.get<any[]>(`/chapters/${chapterId}/versions`);
    return response.data.data;
  },

  /**
   * 获取章节的特定历史版本
   */
  async getChapterVersion(chapterId: number, versionNumber: number): Promise<any> {
    const response = await apiService.get<any>(`/chapters/${chapterId}/versions/${versionNumber}`);
    return response.data.data;
  },

  /**
   * 恢复章节到指定历史版本
   */
  async restoreChapterVersion(chapterId: number, versionNumber: number): Promise<any> {
    const response = await apiService.post<any>(`/chapters/${chapterId}/versions/${versionNumber}/restore`);
    return response.data.data;
  },

  /**
   * 获取Dashboard统计数据
   */
  async getDashboardStats(): Promise<{
    totalNovels: number;
    totalWords: number;
    todayWords: number;
    consecutiveDays: number;
  }> {
    const response = await apiService.get<any>('/novels/stats/dashboard');
    return response.data.data;
  },

  /**
   * 上传作品封面
   */
  async uploadCover(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiService.post<{ url: string }>('/novels/upload/cover', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};
