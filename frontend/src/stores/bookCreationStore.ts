import { create } from 'zustand';
import type { BookCreationTask, TaskProgress, OutlineNode, BookCreationProgressEvent } from '../types/book-creation';

interface BookCreationState {
  // 当前任务
  currentTask: BookCreationTask | null;
  
  // 任务进度
  progress: TaskProgress | null;
  
  // 大纲树
  outlineTree: OutlineNode[];
  
  // 加载状态
  loading: boolean;
  
  // WebSocket连接状态
  wsConnected: boolean;
  
  // 实时进度事件
  progressEvent: BookCreationProgressEvent | null;

  // Actions
  setCurrentTask: (task: BookCreationTask | null) => void;
  setProgress: (progress: TaskProgress | null) => void;
  setOutlineTree: (tree: OutlineNode[]) => void;
  setLoading: (loading: boolean) => void;
  setWsConnected: (connected: boolean) => void;
  setProgressEvent: (event: BookCreationProgressEvent | null) => void;
  reset: () => void;
}

export const useBookCreationStore = create<BookCreationState>((set) => ({
  currentTask: null,
  progress: null,
  outlineTree: [],
  loading: false,
  wsConnected: false,
  progressEvent: null,

  setCurrentTask: (task) => set({ currentTask: task }),
  setProgress: (progress) => set({ progress }),
  setOutlineTree: (tree) => set({ outlineTree: tree }),
  setLoading: (loading) => set({ loading }),
  setWsConnected: (connected) => set({ wsConnected: connected }),
  setProgressEvent: (event) => set({ progressEvent: event }),
  reset: () =>
    set({
      currentTask: null,
      progress: null,
      outlineTree: [],
      loading: false,
      wsConnected: false,
      progressEvent: null,
    }),
}));

