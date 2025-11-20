import { apiService } from "./api";

/**
 * AI生成相关的类型定义
 */

export interface WritingGenerationRequest {
  novelId?: number;  // 作品ID（用于支持参数中的@引用）
  promptId?: number;
  parameters?: Record<string, string>;  // 参数值支持@引用，如: @人物卡:张三
  userInput?: string;
  modelId?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  historyMessageLimit?: number;  // 历史消息数量限制（保留最近N条消息，0表示不限制）
  history?: Array<{ 
    role: 'user' | 'assistant'; 
    content: string;
    promptId?: number;  // 该消息使用的提示词ID（用于后端重建 system 消息）
    parameters?: Record<string, string>;  // 该消息使用的参数（用于后端重建）
    characterIds?: number[];  // 该消息使用的人物卡ID（用于后端重建）
    worldSettingIds?: number[];  // 该消息使用的世界观ID（用于后端重建）
  }>;
  characterIds?: number[];  // 用户选择的人物卡ID列表（填充提示词插槽）
  worldSettingIds?: number[];  // 用户选择的世界观ID列表（填充提示词插槽）
  mentionedCharacterIds?: number[];  // @符号引用的人物卡ID列表
  mentionedWorldSettingIds?: number[];  // @符号引用的世界观ID列表
  mentionedMemoIds?: number[];  // @符号引用的备忘录ID列表
  mentionedChapters?: Array<{  // @符号引用的章节列表（包含ID和类型）
    chapterId: number;
    type: 'full' | 'summary';  // full: 全文, summary: 梗概
  }>;
}

export interface GenerationResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * AI生成API
 */
export const generationApi = {
  /**
   * AI写作生成（非流式）
   */
  generateWriting: (data: WritingGenerationRequest) => {
    return apiService.post<GenerationResponse>("/generation/writing", data);
  },

  /**
   * AI写作生成（流式，使用 SSE）
   */
  generateWritingStream: async (
    data: WritingGenerationRequest,
    onMessage: (content: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<() => void> => {
    return apiService.stream<{ content?: string }>(
      '/generation/writing/stream',
      data,
      (chunk) => {
        if (chunk.content) {
          onMessage(chunk.content);
        }
      },
      onComplete,
      onError,
      600000 // 10分钟超时（AI生成可能比较慢）
    );
  },

};
