import { Character } from '../../novels/entities/character.entity';
import { WorldSetting } from '../../novels/entities/world-setting.entity';
import { Memo } from '../../novels/entities/memo.entity';

/**
 * 生成上下文接口
 * 用于章节正文生成时提供必要的上下文信息
 */
export interface GenerationContext {
  /** 章节梗概 */
  chapterOutline: string;

  /** 人物卡列表 */
  characters: Character[];

  /** 世界观列表 */
  worldSettings: WorldSetting[];

  /** 备忘录列表（通常只包含置顶的） */
  memos: Memo[];

  /** 前面章节的梗概列表 */
  previousChaptersSummaries: string[];

  /** 当前章节标题 */
  chapterTitle?: string;

  /** 当前卷信息 */
  volumeInfo?: {
    title: string;
    description: string;
  };
}

