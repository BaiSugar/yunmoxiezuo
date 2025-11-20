/**
 * 编辑器相关类型定义
 */

export interface Chapter {
  id: number;
  title: string;
  volumeId: number | null; // null表示独立章节，不属于任何分卷
  content: string;
  summary?: string; // 章节梗概/大纲
  wordCount: number;
  order: number;
  globalOrder?: number; // 独立章节的全局顺序（可选，仅用于独立章节和分卷混合排序）
}

export interface Volume {
  id: number;
  name: string;
  order: number;
  globalOrder: number; // 在整个列表中的全局顺序
  isCollapsed: boolean;
  chapters: Chapter[];
}

export interface SelectionToolbarState {
  show: boolean;
  x: number;
  y: number;
  selectedText: string;
}

export interface DragState {
  draggedItem: { type: 'volume' | 'chapter'; id: number } | null;
  dropTarget: { 
    type: 'volume' | 'chapter' | 'standalone'; 
    id: number; 
    position: 'before' | 'after' | 'inside' 
  } | null;
}
