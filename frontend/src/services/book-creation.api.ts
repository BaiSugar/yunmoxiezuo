import { apiService } from './api';
import type {
  BookCreationTask,
  TaskProgress,
  OutlineNode,
  TaskStatus,
  CreateBookTaskDto,
  UpdatePromptConfigDto,
} from '../types/book-creation';

/**
 * 一键成书 API 服务
 */
export const bookCreationApi = {
  /**
   * 创建成书任务
   */
  async createTask(data: CreateBookTaskDto): Promise<BookCreationTask> {
    const response = await apiService.post<BookCreationTask>(
      '/book-creation/tasks',
      data,
    );
    return response.data.data;
  },

  /**
   * 更新提示词配置
   */
  async updatePromptConfig(
    taskId: number,
    data: UpdatePromptConfigDto,
  ): Promise<BookCreationTask> {
    const response = await apiService.patch<BookCreationTask>(
      `/book-creation/tasks/${taskId}/prompt-config`,
      data,
    );
    return response.data.data;
  },

  /**
   * 更新书名和简介
   */
  async updateTitleSynopsis(
    taskId: number,
    title: string,
    synopsis?: string,
  ): Promise<BookCreationTask> {
    const response = await apiService.patch<BookCreationTask>(
      `/book-creation/tasks/${taskId}/title-synopsis`,
      { title, synopsis },
    );
    return response.data.data;
  },

  /**
   * 获取任务详情
   */
  async getTask(taskId: number): Promise<BookCreationTask> {
    const response = await apiService.get<BookCreationTask>(
      `/book-creation/tasks/${taskId}`,
    );
    return response.data.data;
  },

  /**
   * 获取任务列表
   */
  async getTasks(params?: {
    status?: TaskStatus;
    page?: number;
    limit?: number;
  }): Promise<{
    data: BookCreationTask[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));

    const url = `/book-creation/tasks${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;
    const response = await apiService.get(url);
    return response.data.data;
  },

  /**
   * 执行阶段（非流式）
   */
  async executeStage(taskId: number, stageType?: string): Promise<any> {
    const response = await apiService.post(
      `/book-creation/tasks/${taskId}/execute-stage`,
      { stageType },
    );
    return response.data.data;
  },

  /**
   * 执行阶段（流式）
   */
  async executeStageStream(
    taskId: number,
    stageType: string | undefined,
    onMessage: (content: string) => void,
    onComplete: (metadata?: { inputChars?: number; outputChars?: number; modelId?: number | null }) => void,
    onError: (error: Error) => void,
  ): Promise<() => void> {
    console.log(`[前端] executeStageStream - taskId: ${taskId}, stageType: ${stageType}`);
    
    let metadata: any = null;
    
    return apiService.stream<{ content?: string; type?: string; inputChars?: number; outputChars?: number; modelId?: number | null }>(
      `/book-creation/tasks/${taskId}/execute-stage/stream`,
      { stageType },
      (chunk) => {
        // 处理普通的内容chunk
        if (chunk.content && !chunk.type) {
          console.log('[前端] 收到内容chunk，长度:', chunk.content.length);
          onMessage(chunk.content);
        }
        // 捕获元数据
        if (chunk.type === 'metadata') {
          console.log('[前端] 收到元数据:', chunk);
          metadata = {
            inputChars: chunk.inputChars || 0,
            outputChars: chunk.outputChars || 0,
            modelId: chunk.modelId || null,
          };
        }
      },
      () => {
        console.log('[前端] 流式执行完成，元数据:', metadata);
        onComplete(metadata);
      },
      onError,
      600000 // 10分钟超时
    );
  },

  /**
   * 暂停任务
   */
  async pauseTask(taskId: number): Promise<void> {
    await apiService.post(`/book-creation/tasks/${taskId}/pause`);
  },

  /**
   * 恢复任务
   */
  async resumeTask(taskId: number): Promise<void> {
    await apiService.post(`/book-creation/tasks/${taskId}/resume`);
  },

  /**
   * 取消任务
   */
  async cancelTask(taskId: number): Promise<void> {
    await apiService.delete(`/book-creation/tasks/${taskId}`);
  },

  /**
   * 优化阶段产出（非流式）
   */
  async optimizeStage(
    taskId: number,
    stageType: string,
    userFeedback: string,
  ): Promise<any> {
    // 验证 taskId
    const safeTaskId = Number(taskId);
    if (isNaN(safeTaskId) || !isFinite(safeTaskId) || safeTaskId <= 0) {
      console.error('Invalid taskId in optimizeStage:', taskId, typeof taskId);
      throw new Error(`无效的任务ID: ${taskId}`);
    }
    
    console.log(`[前端] optimizeStage - taskId: ${safeTaskId}, stageType: ${stageType}`);
    
    const response = await apiService.post(
      `/book-creation/tasks/${safeTaskId}/stages/${stageType}/optimize`,
      { userFeedback },
    );
    return response.data.data;
  },

  /**
   * 优化阶段产出（流式）
   */
  async optimizeStageStream(
    taskId: number,
    stageType: string,
    userFeedback: string,
    onMessage: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
  ): Promise<() => void> {
    // 验证 taskId
    const safeTaskId = Number(taskId);
    if (isNaN(safeTaskId) || !isFinite(safeTaskId) || safeTaskId <= 0) {
      console.error('Invalid taskId in optimizeStageStream:', taskId, typeof taskId);
      throw new Error(`无效的任务ID: ${taskId}`);
    }
    
    console.log(`[前端] optimizeStageStream - taskId: ${safeTaskId}, stageType: ${stageType}`);
    
    return apiService.stream<{ content?: string; type?: string }>(
      `/book-creation/tasks/${safeTaskId}/stages/${stageType}/optimize/stream`,
      { userFeedback },
      (chunk) => {
        // 只处理普通的内容chunk，忽略元数据
        if (chunk.content && !chunk.type) {
          onMessage(chunk.content);
        }
        // 元数据会在后端处理，这里不需要显示
      },
      onComplete,
      onError,
      600000 // 10分钟超时
    );
  },

  /**
   * 获取大纲树
   */
  async getOutline(taskId: number): Promise<OutlineNode[]> {
    const response = await apiService.get<{ nodes: OutlineNode[] }>(
      `/book-creation/tasks/${taskId}/outline`,
    );
    return response.data.data.nodes;
  },

  /**
   * 编辑大纲节点
   */
  async updateOutlineNode(
    taskId: number,
    nodeId: number,
    data: { title?: string; content?: string; status?: string },
  ): Promise<void> {
    await apiService.patch(
      `/book-creation/tasks/${taskId}/outline-nodes/${nodeId}`,
      data,
    );
  },

  /**
   * 同步大纲到作品
   */
  async syncOutlineToNovel(taskId: number): Promise<void> {
    await apiService.post(
      `/book-creation/tasks/${taskId}/outline/sync-to-novel`,
    );
  },

  /**
   * 批量生成章节
   */
  async generateChapters(
    taskId: number,
    data: { chapterIds?: number[]; generateAll?: boolean },
  ): Promise<any> {
    const response = await apiService.post(
      `/book-creation/tasks/${taskId}/generate-chapters`,
      data,
    );
    return response.data.data;
  },

  /**
   * 重新生成章节
   */
  async regenerateChapter(
    taskId: number,
    chapterId: number,
    userFeedback?: string,
  ): Promise<any> {
    const response = await apiService.post(
      `/book-creation/tasks/${taskId}/chapters/${chapterId}/regenerate`,
      { userFeedback },
    );
    return response.data.data;
  },

  /**
   * 审稿章节
   */
  async reviewChapter(taskId: number, chapterId: number): Promise<any> {
    const response = await apiService.post(
      `/book-creation/tasks/${taskId}/chapters/${chapterId}/review`,
    );
    return response.data.data;
  },

  /**
   * 优化章节
   */
  async optimizeChapter(
    taskId: number,
    chapterId: number,
    reviewReport?: any,
  ): Promise<any> {
    const response = await apiService.post(
      `/book-creation/tasks/${taskId}/chapters/${chapterId}/optimize`,
      { reviewReport },
    );
    return response.data.data;
  },

  /**
   * 获取任务进度
   */
  async getTaskProgress(taskId: number): Promise<TaskProgress> {
    const response = await apiService.get<TaskProgress>(
      `/book-creation/tasks/${taskId}/progress`,
    );
    return response.data.data;
  },

  /**
   * 🆕 步进式生成下一章（人工干预模式）
   */
  async generateNextChapter(
    taskId: number,
    chapterOrder?: number,
  ): Promise<{
    success: boolean;
    chapter: {
      id: number;
      order: number;
      title: string;
      content: string;
      summary: string;
      wordCount: number;
    };
    reviewReport: {
      chapterId: number;
      score: number;
      issues: Array<{
        type: 'logic' | 'character' | 'continuity' | 'style';
        severity: 'high' | 'medium' | 'low';
        description: string;
        location: string;
      }>;
      suggestions: string[];
      strengths: string[];
    };
    nextChapterOrder: number | null;
    charactersConsumed: number;
    message: string;
  }> {
    const response = await apiService.post<any>(
      `/book-creation/tasks/${taskId}/generate-next-chapter`,
      { chapterOrder },
    );
    return response.data.data;
  },

  /**
   * 🆕 继续下一章（人工确认后调用）
   */
  async continueNextChapter(taskId: number): Promise<{
    success: boolean;
    chapter: {
      id: number;
      order: number;
      title: string;
      content: string;
      summary: string;
      wordCount: number;
    };
    reviewReport: {
      chapterId: number;
      score: number;
      issues: Array<{
        type: 'logic' | 'character' | 'continuity' | 'style';
        severity: 'high' | 'medium' | 'low';
        description: string;
        location: string;
      }>;
      suggestions: string[];
      strengths: string[];
    };
    nextChapterOrder: number | null;
    charactersConsumed: number;
    message: string;
  }> {
    const response = await apiService.post<any>(
      `/book-creation/tasks/${taskId}/continue-next-chapter`,
    );
    return response.data.data;
  },
};

