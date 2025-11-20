import { apiService } from './api';
import type { Tool, NovelSearchRequest, NovelSearchResponse, ToolCheckResponse } from '../types/tool';

/**
 * 检查工具可用性
 */
export const checkToolAccess = async (): Promise<ToolCheckResponse> => {
  const response = await apiService.get('/tools/novel-search/check');
  return response.data.data as unknown as ToolCheckResponse;
};

/**
 * 执行短文搜索
 */
export const searchNovel = async (data: NovelSearchRequest): Promise<NovelSearchResponse> => {
  const response = await apiService.post('/tools/novel-search/search', data);
  // 后端返回的是双层嵌套结构: { data: { code: 'success', data: [...] } }
  // 我们需要返回内层的 data
  return response.data.data as unknown as NovelSearchResponse;
};

/**
 * 获取搜索历史
 */
export const getSearchHistory = async () => {
  const response = await apiService.get('/tools/novel-search/history');
  return response.data;
};

/**
 * 获取启用的工具列表（用户端）
 */
export const getEnabledTools = async (): Promise<{ code: string; data: Tool[] }> => {
  const response = await apiService.get('/tools');
  // 响应结构：response.data = { success, code: 200, data: { code: 'success', data: Tool[] } }
  // 我们需要的是 response.data.data = { code: 'success', data: Tool[] }
  return response.data.data as any;
};

/**
 * 获取书籍详情
 */
export const getNovelDetail = async (bookId: string, platform: string) => {
  const response = await apiService.get('/tools/novel-search/detail', {
    params: { bookId, platform },
  });
  // 后端返回的是双层嵌套结构
  return response.data.data as unknown as {
    code: string;
    data: {
      title: string;
      content: string[];
      totalParagraphs: number;
    };
    message: string;
  };
};
