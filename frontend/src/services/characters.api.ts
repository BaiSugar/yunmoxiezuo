import { apiService } from './api';
import type {
  Character,
  CreateCharacterDto,
  UpdateCharacterDto,
  WorldSetting,
  CreateWorldSettingDto,
  UpdateWorldSettingDto,
  Memo,
  CreateMemoDto,
  UpdateMemoDto,
} from '../types/character';

/**
 * 人物卡 API 服务
 */
export const charactersApi = {
  /**
   * 获取作品的人物卡列表
   */
  async getCharacters(novelId: number): Promise<Character[]> {
    const response = await apiService.get<Character[]>(`/characters?novelId=${novelId}`);
    return response.data.data;
  },

  /**
   * 获取人物卡详情
   */
  async getCharacter(id: number): Promise<Character> {
    const response = await apiService.get<Character>(`/characters/${id}`);
    return response.data.data;
  },

  /**
   * 创建人物卡
   */
  async createCharacter(novelId: number, data: CreateCharacterDto): Promise<Character> {
    const response = await apiService.post<Character>(`/characters?novelId=${novelId}`, data);
    return response.data.data;
  },

  /**
   * 更新人物卡
   */
  async updateCharacter(id: number, data: UpdateCharacterDto): Promise<Character> {
    const response = await apiService.patch<Character>(`/characters/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除人物卡
   */
  async deleteCharacter(id: number): Promise<void> {
    await apiService.delete(`/characters/${id}`);
  },
};

/**
 * 世界观设定 API 服务
 */
export const worldSettingsApi = {
  /**
   * 获取作品的世界观设定列表
   */
  async getWorldSettings(novelId: number): Promise<WorldSetting[]> {
    const response = await apiService.get<WorldSetting[]>(`/world-settings?novelId=${novelId}`);
    return response.data.data;
  },

  /**
   * 获取世界观设定详情
   */
  async getWorldSetting(id: number): Promise<WorldSetting> {
    const response = await apiService.get<WorldSetting>(`/world-settings/${id}`);
    return response.data.data;
  },

  /**
   * 创建世界观设定
   */
  async createWorldSetting(novelId: number, data: CreateWorldSettingDto): Promise<WorldSetting> {
    const response = await apiService.post<WorldSetting>(`/world-settings?novelId=${novelId}`, data);
    return response.data.data;
  },

  /**
   * 更新世界观设定
   */
  async updateWorldSetting(id: number, data: UpdateWorldSettingDto): Promise<WorldSetting> {
    const response = await apiService.patch<WorldSetting>(`/world-settings/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除世界观设定
   */
  async deleteWorldSetting(id: number): Promise<void> {
    await apiService.delete(`/world-settings/${id}`);
  },
};

/**
 * 备忘录 API 服务
 */
export const memosApi = {
  /**
   * 获取作品的备忘录列表
   */
  async getMemos(novelId: number): Promise<Memo[]> {
    const response = await apiService.get<Memo[]>(`/memos?novelId=${novelId}`);
    return response.data.data;
  },

  /**
   * 获取备忘录详情
   */
  async getMemo(id: number): Promise<Memo> {
    const response = await apiService.get<Memo>(`/memos/${id}`);
    return response.data.data;
  },

  /**
   * 创建备忘录
   */
  async createMemo(novelId: number, data: CreateMemoDto): Promise<Memo> {
    const response = await apiService.post<Memo>(`/memos?novelId=${novelId}`, data);
    return response.data.data;
  },

  /**
   * 更新备忘录
   */
  async updateMemo(id: number, data: UpdateMemoDto): Promise<Memo> {
    const response = await apiService.patch<Memo>(`/memos/${id}`, data);
    return response.data.data;
  },

  /**
   * 删除备忘录
   */
  async deleteMemo(id: number): Promise<void> {
    await apiService.delete(`/memos/${id}`);
  },
};
