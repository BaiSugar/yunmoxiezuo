import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Clock, TrendingUp, Calendar, MoreVertical, Edit, Trash2, Download, Check, X, Plus, Loader2 } from "lucide-react";
import { novelsApi } from "../../services/novels.api";

/**
 * 作品状态
 */
export type NovelStatus = "ongoing" | "completed" | "archived" | "paused";

/**
 * 作品类型
 */
export type NovelGenre =
  | "fantasy" // 玄幻
  | "traditional_fantasy" // 传统玄幻
  | "urban" // 都市
  | "history" // 历史
  | "fictional" // 架空
  | "mystery" // 悬疑
  | "scifi" // 科幻
  | "sports" // 体育
  | "wuxia" // 武侠
  | "apocalypse" // 末日
  | "fanfiction" // 动漫衍生
  | "film_tv" // 影视
  | "espionage"; // 谍战

/**
 * 作品形式
 */
export type NovelForm =
  | "novel" // 长篇
  | "short_story" // 短篇
  | "script" // 剧本
  | "other"; // 其他

/**
 * 章节数据接口
 */
export interface Chapter {
  id: number;
  title: string;
  content: string;
  wordCount: number;
  order: number;
}

/**
 * 作品数据接口
 */
export interface Novel {
  id: number;
  name: string;
  synopsis?: string; // 作品简介
  coverImage?: string;
  status: NovelStatus;
  genres: NovelGenre[]; // 改为数组，支持多选
  form: NovelForm; // 作品形式
  totalWordCount: number;
  targetWordsPerChapter?: number; // 每章目标字数
  createdAt: string;
  updatedAt: string;
}

interface NovelCardProps {
  novel: Novel;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewMode?: "grid" | "list";
}

/**
 * 格式化字数显示
 */
const formatWordCount = (count: number | undefined): string => {
  if (count === undefined || count === null) {
    return '暂无数据';
  }
  if (count === 0) {
    return '0字';
  }
  if (count >= 10000) {
    return `${(count / 10000).toFixed(1)}万字`;
  }
  return `${count}字`;
};

/**
 * 格式化时间显示
 */
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) {
    return '暂无数据';
  }
  
  const date = new Date(dateString);
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '无效日期';
  }
  
  // 使用本地时区的日期，只比较年月日
  const now = new Date();
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowOnly.getTime() - dateOnly.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return "今天";
  } else if (days === 1) {
    return "昨天";
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }
};

/**
 * 获取状态配置
 */
const getStatusConfig = (status: NovelStatus) => {
  const configs = {
    ongoing: { label: "连载中", color: "bg-green-500" },
    completed: { label: "已完结", color: "bg-blue-500" },
    archived: { label: "已归档", color: "bg-gray-500" },
    paused: { label: "已暂停", color: "bg-yellow-500" },
  };
  return configs[status];
};

/**
 * 获取类型标签
 */
const getGenreLabel = (genre: NovelGenre): string => {
  const labels: Record<NovelGenre, string> = {
    fantasy: "玄幻",
    traditional_fantasy: "传统玄幻",
    urban: "都市",
    history: "历史",
    fictional: "架空",
    mystery: "悬疑",
    scifi: "科幻",
    sports: "体育",
    wuxia: "武侠",
    apocalypse: "末日",
    fanfiction: "动漫衍生",
    film_tv: "影视",
    espionage: "谍战",
  };
  return labels[genre];
};

/**
 * 获取作品形式标签
 */
const getFormLabel = (form: NovelForm): string => {
  const labels: Record<NovelForm, string> = {
    novel: "长篇",
    short_story: "短篇",
    script: "剧本",
    other: "其他",
  };
  return labels[form];
};

/**
 * 导出模态框组件
 */
interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  novel: Novel;
  chapters: Chapter[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, novel, chapters }) => {
  const [selectedChapters, setSelectedChapters] = useState<Set<number>>(new Set());
  const [displayedChapters, setDisplayedChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (isOpen && chapters.length > 0) {
      // 初始显示前10章
      setDisplayedChapters(chapters.slice(0, Math.min(10, chapters.length)));
      // 默认全选
      const initialSelected = new Set(chapters.slice(0, Math.min(10, chapters.length)).map(c => c.id));
      setSelectedChapters(initialSelected);
    }
  }, [isOpen, chapters]);

  if (!isOpen) return null;

  // 全选
  const handleSelectAll = () => {
    const allIds = new Set(displayedChapters.map(c => c.id));
    setSelectedChapters(allIds);
  };

  // 反选
  const handleInvertSelection = () => {
    const newSelected = new Set<number>();
    displayedChapters.forEach(chapter => {
      if (!selectedChapters.has(chapter.id)) {
        newSelected.add(chapter.id);
      }
    });
    setSelectedChapters(newSelected);
  };

  // 追加章节
  const handleAppendChapters = (count: number) => {
    const currentCount = displayedChapters.length;
    const newCount = Math.min(currentCount + count, chapters.length);
    const newChapters = chapters.slice(0, newCount);
    setDisplayedChapters(newChapters);
  };

  // 切换章节选中状态
  const toggleChapter = (chapterId: number) => {
    const newSelected = new Set(selectedChapters);
    if (newSelected.has(chapterId)) {
      newSelected.delete(chapterId);
    } else {
      newSelected.add(chapterId);
    }
    setSelectedChapters(newSelected);
  };

  // 将 HTML 内容转换为纯文本
  const htmlToPlainText = (html: string): string => {
    // 创建临时 div 元素
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // 获取纯文本内容
    let text = temp.textContent || temp.innerText || '';
    
    // 处理多余的空白字符
    text = text.replace(/\s+/g, ' ').trim();
    
    // 将 HTML 段落标签转换为换行
    let formattedText = html
      .replace(/<\/p>/gi, '\n')  // </p> 转换为换行
      .replace(/<br\s*\/?>/gi, '\n')  // <br> 转换为换行
      .replace(/<p[^>]*>/gi, '')  // 移除 <p> 开始标签
      .replace(/<[^>]+>/g, '');  // 移除其他 HTML 标签
    
    // 解码 HTML 实体
    const textarea = document.createElement('textarea');
    textarea.innerHTML = formattedText;
    formattedText = textarea.value;
    
    // 清理多余的空行（保留单个空行）
    formattedText = formattedText.replace(/\n{3,}/g, '\n\n');
    
    return formattedText.trim();
  };

  // 导出为txt文件
  const handleExport = () => {
    const selectedChaptersList = displayedChapters.filter(c => selectedChapters.has(c.id));
    
    if (selectedChaptersList.length === 0) {
      alert('请至少选择一章');
      return;
    }

    // 构建导出内容
    let content = `《${novel.name}》\n\n`;
    
    if (novel.synopsis) {
      content += `作品简介：${novel.synopsis}\n\n`;
    } else {
      content += `作品简介：\n\n`;
    }

    // 按顺序添加章节
    selectedChaptersList.forEach((chapter, index) => {
      if (index > 0) {
        content += '\n'; // 章节之间空一行
      }
      content += `${chapter.title}\n`;
      // 将 HTML 内容转换为纯文本
      const plainContent = htmlToPlainText(chapter.content);
      content += `${plainContent}\n`;
    });

    // 创建Blob并下载
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${novel.name}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onClose();
  };

  // 使用 Portal 渲染到 body，避免被父容器限制
  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部 - 标题和操作按钮 */}
        <div className="border-b border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">导出作品</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="text-lg font-semibold text-gray-700">
            《{novel.name}》
          </div>

          {/* 操作按钮组 */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSelectAll}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              全选
            </button>
            <button
              onClick={handleInvertSelection}
              className="px-4 py-2 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              反选
            </button>
            <button
              onClick={() => handleAppendChapters(1)}
              disabled={displayedChapters.length >= chapters.length}
              className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              追加1章
            </button>
            <button
              onClick={() => handleAppendChapters(5)}
              disabled={displayedChapters.length >= chapters.length}
              className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              追加5章
            </button>
            <button
              onClick={() => handleAppendChapters(10)}
              disabled={displayedChapters.length >= chapters.length}
              className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              追加10章
            </button>
          </div>

          <div className="text-sm text-gray-500">
            显示 {displayedChapters.length} / {chapters.length} 章
          </div>
        </div>

        {/* 中间 - 章节列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {displayedChapters.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              暂无章节
            </div>
          ) : (
            <div className="space-y-2">
              {displayedChapters.map((chapter) => (
                <label
                  key={chapter.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedChapters.has(chapter.id)}
                    onChange={() => toggleChapter(chapter.id)}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{chapter.title}</div>
                    <div className="text-sm text-gray-500">{chapter.wordCount} 字</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 底部 - 操作按钮 */}
        <div className="border-t border-gray-200 p-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={selectedChapters.size === 0}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            确认导出（{selectedChapters.size}章）
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

/**
 * 作品卡片组件
 */
const NovelCard: React.FC<NovelCardProps> = ({ 
  novel, 
  onClick,
  onEdit,
  onDelete,
  viewMode = "grid"
}) => {
  const statusConfig = getStatusConfig(novel.status);
  const [showMenu, setShowMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);

  // 获取章节数据
  const handleOpenExportModal = async () => {
    setShowMenu(false);
    setIsLoadingChapters(true);
    try {
      const chaptersData = await novelsApi.getChapters(novel.id);
      // 将后端数据转换为 Chapter 类型
      const formattedChapters: Chapter[] = chaptersData.map((ch: any) => ({
        id: ch.id,
        title: ch.title,
        content: ch.content || '',
        wordCount: ch.wordCount || 0,
        order: ch.order || ch.globalOrder || 0
      }));
      setChapters(formattedChapters);
      setShowExportModal(true);
    } catch (error) {
      console.error('获取章节失败:', error);
      alert('获取章节信息失败，请稍后重试');
    } finally {
      setIsLoadingChapters(false);
    }
  };

  // 列表视图布局
  if (viewMode === "list") {
    return (
      <>
        <div
          className="group bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
          onClick={onClick}
        >
        <div className="flex items-stretch">
          {/* 左侧信息区域 */}
          <div className="flex-1 p-6">
            {/* 标题和标签 */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {novel.name}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`${statusConfig.color} text-white text-xs font-medium px-3 py-1 rounded-full`}
                  >
                    {statusConfig.label}
                  </span>
                  <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">
                    {getFormLabel(novel.form)}
                  </span>
                  {novel.genres.map((genre) => (
                    <span key={genre} className="bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                      {getGenreLabel(genre)}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* 更多操作按钮 */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
                
                {/* 下拉菜单 */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-xl z-50">
                    <div className="py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onEdit?.();
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 transition-colors text-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="text-sm">编辑作品</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenExportModal();
                        }}
                        disabled={isLoadingChapters}
                        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoadingChapters ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="text-sm">{isLoadingChapters ? '加载中...' : '导出作品'}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMenu(false);
                          onDelete?.();
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-red-50 transition-colors text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">删除作品</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 统计信息 - 横向排列 */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
              {/* 总字数 */}
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
                <span>{formatWordCount(novel.totalWordCount)}</span>
              </div>

              {/* 创建时间 */}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                <span>创建于 {formatDate(novel.createdAt)}</span>
              </div>

              {/* 更新时间 */}
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-green-500" />
                <span>更新于 {formatDate(novel.updatedAt)}</span>
              </div>
            </div>
          </div>

          {/* 右侧封面区域 */}
          <div className="relative w-40 aspect-[3/4] bg-gray-200 overflow-hidden flex-shrink-0">
            {novel.coverImage ? (
              <img
                src={novel.coverImage}
                alt={novel.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                  }
                }}
              />
            ) : null}
            <div
              className="w-full h-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300"
              style={{ display: novel.coverImage ? 'none' : 'flex' }}
            >
              <div className="text-center">
                <div className="text-4xl mb-1">📖</div>
                <p className="text-xs text-gray-500">暂无封面</p>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* 导出模态框 */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          novel={novel}
          chapters={chapters}
        />
      </>
    );
  }

  // 网格视图布局（默认）
  return (
    <div
      className="group bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* 封面图片区域 */}
      <div className="relative aspect-[3/4] bg-gray-200 overflow-hidden">
        {novel.coverImage ? (
          <img
            src={novel.coverImage}
            alt={novel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextElementSibling) {
                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className="w-full h-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300"
          style={{ display: novel.coverImage ? 'none' : 'flex' }}
        >
          <div className="text-center">
            <div className="text-6xl mb-2">📖</div>
            <p className="text-sm text-gray-500">暂无封面</p>
          </div>
        </div>

        {/* 状态标签 */}
        <div className="absolute top-3 left-3">
          <span
            className={`${statusConfig.color} text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg`}
          >
            {statusConfig.label}
          </span>
        </div>

        {/* 作品形式标签 */}
        <div className="absolute top-3 right-3">
          <span className="bg-purple-500/80 backdrop-blur-sm text-white text-xs font-medium px-3 py-1 rounded-full">
            {getFormLabel(novel.form)}
          </span>
        </div>
      </div>

      {/* 信息区域 */}
      <div className="p-4">
        {/* 作品标题和操作按钮 */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 flex-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {novel.name}
          </h3>
          {/* 更多操作按钮 */}
          <div className="relative ml-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-1 hover:bg-white/50 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-500" />
            </button>
            
            {/* 下拉菜单 */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-xl shadow-xl z-50">
                <div className="py-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit?.();
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 transition-colors text-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm">编辑作品</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenExportModal();
                    }}
                    disabled={isLoadingChapters}
                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-100 transition-colors text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingChapters ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="text-sm">{isLoadingChapters ? '加载中...' : '导出作品'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete?.();
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-red-50 transition-colors text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">删除作品</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 统计信息 */}
        <div className="space-y-2">
          {/* 总字数 */}
          <div className="flex items-center text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />
            <span>{formatWordCount(novel.totalWordCount)}</span>
          </div>

          {/* 创建时间 */}
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2 text-purple-500" />
            <span>创建于 {formatDate(novel.createdAt)}</span>
          </div>

          {/* 更新时间 */}
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2 text-green-500" />
            <span>更新于 {formatDate(novel.updatedAt)}</span>
          </div>

          {/* 类型标签 */}
          {novel.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {novel.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded"
                >
                  {getGenreLabel(genre)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 导出模态框 */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        novel={novel}
        chapters={chapters}
      />
    </div>
  );
};

export default NovelCard;
