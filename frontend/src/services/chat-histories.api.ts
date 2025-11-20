import { apiService as api } from "./api";

/**
 * 聊天场景类型（与后端 GenerationMode 枚举保持一致）
 */
export const ChatScenarioType = {
  WRITING: "writing",      // AI写作模式
  ROLEPLAY: "roleplay",    // 角色扮演模式
} as const;

export type ChatScenarioType = (typeof ChatScenarioType)[keyof typeof ChatScenarioType];

/**
 * 聊天历史消息相关的类型定义
 */

export interface ChatHistoryMessage {
  name: string;
  is_user: boolean;
  mes: string;
  send_date: number;
  extra?: {
    promptName?: string;
    promptId?: number;
    parameters?: Record<string, string>;
    characterNames?: string[];
    worldSettingNames?: string[];
    mentionedCharacters?: string[];
    mentionedWorlds?: string[];
    mentionedMemos?: string[];
  };
}

export interface ChatHistory {
  id: number;
  userId: number;
  novelId?: number;           // 写作助手场景：关联的小说ID
  chatName: string;
  characterCardId?: number;   // 角色扮演场景：关联的角色卡ID
  messageCount: number;
  lastMessageDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChatHistoryDto {
  chatName: string;
  novelId?: number;           // 写作助手场景：传入novelId
  characterCardId?: number;   // 角色扮演场景：传入characterCardId
  categoryId?: number;        // 创意工坊场景：传入提示词分类ID
  chatMetadata?: {
    scenarioType?: ChatScenarioType;  // 场景类型
    [key: string]: any;
  };
}

export interface UpdateChatHistoryDto {
  chatName?: string;
  characterCardId?: number;
  chatMetadata?: Record<string, any>;
}

export interface CreateMessageDto {
  chatId: number;
  name: string;
  isUser: boolean;
  mes: string;
  sendDate?: number;
  extra?: Record<string, any>;
}

export interface ChatHistoryListResponse {
  data: ChatHistory[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 聊天历史记录API
 */
export const chatHistoriesApi = {
  /**
   * 创建聊天历史
   */
  create: (data: CreateChatHistoryDto) => {
    return api.post<ChatHistory>("/chat-histories", data);
  },

  /**
   * 获取聊天历史列表
   */
  getList: (params?: {
    page?: number;
    limit?: number;             // 后端使用limit，不是pageSize
    novelId?: number;           // 按小说筛选（写作助手）
    characterCardId?: number;   // 按角色卡筛选（角色扮演）
    categoryId?: number;        // 按提示词分类筛选（创意工坊）
    search?: string;
  }) => {
    return api.get<ChatHistoryListResponse>("/chat-histories", {
      params,
    });
  },

  /**
   * 获取聊天历史详情（包含消息）
   */
  getDetail: (id: number) => {
    return api.get<ChatHistory & { messages: ChatHistoryMessage[] }>(
      `/chat-histories/${id}`
    );
  },

  /**
   * 更新聊天历史
   */
  update: (id: number, data: UpdateChatHistoryDto) => {
    return api.put<ChatHistory>(`/chat-histories/${id}`, data);
  },

  /**
   * 删除聊天历史
   */
  delete: (id: number) => {
    return api.delete(`/chat-histories/${id}`);
  },

  /**
   * 批量删除聊天历史
   */
  batchDelete: (ids: number[]) => {
    return api.post("/chat-histories/batch-delete", { ids });
  },

  /**
   * 获取统计信息
   */
  getStats: () => {
    return api.get<{
      totalChats: number;
      totalMessages: number;
      recentChats: number;
    }>("/chat-histories/stats/summary");
  },
};

/**
 * 消息API
 */
export const messagesApi = {
  /**
   * 创建消息
   */
  create: (data: CreateMessageDto) => {
    return api.post("/messages", data);
  },

  /**
   * 获取聊天的消息列表
   */
  getList: (chatId: number, params?: { page?: number; limit?: number }) => {
    return api.get<{
      data: ChatHistoryMessage[];
      total: number;
      page: number;
      limit: number;
    }>(`/messages/chat/${chatId}`, { params });
  },

  /**
   * 批量创建消息
   */
  batchCreate: (chatId: number, messages: Omit<CreateMessageDto, "chatId">[]) => {
    return api.post(`/messages/batch`, {
      chatId,
      messages,
    });
  },
};
