import React from "react";
import { X } from "lucide-react";
import type { NovelGenre, NovelStatus, NovelForm } from "./NovelCard";

interface FilterOptions {
  genres: NovelGenre[];
  statuses: NovelStatus[];
  forms: NovelForm[];
}

interface NovelFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

/**
 * 作品筛选面板
 */
const NovelFilterPanel: React.FC<NovelFilterPanelProps> = ({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onReset,
}) => {
  if (!isOpen) return null;

  const genreOptions = [
    { value: "fantasy", label: "玄幻" },
    { value: "traditional_fantasy", label: "传统玄幻" },
    { value: "urban", label: "都市" },
    { value: "history", label: "历史" },
    { value: "fictional", label: "架空" },
    { value: "mystery", label: "悬疑" },
    { value: "scifi", label: "科幻" },
    { value: "sports", label: "体育" },
    { value: "wuxia", label: "武侠" },
    { value: "apocalypse", label: "末日" },
    { value: "fanfiction", label: "动漫衍生" },
    { value: "film_tv", label: "影视" },
    { value: "espionage", label: "谍战" },
  ];

  const statusOptions = [
    { value: "ongoing", label: "连载中" },
    { value: "completed", label: "已完结" },
    { value: "archived", label: "已归档" },
    { value: "paused", label: "已暂停" },
  ];

  const formOptions = [
    { value: "novel", label: "长篇" },
    { value: "short_story", label: "短篇" },
    { value: "script", label: "剧本" },
    { value: "other", label: "其他" },
  ];

  const toggleGenre = (genre: NovelGenre) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];
    onFiltersChange({ ...filters, genres: newGenres });
  };

  const toggleStatus = (status: NovelStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const toggleForm = (form: NovelForm) => {
    const newForms = filters.forms.includes(form)
      ? filters.forms.filter((f) => f !== form)
      : [...filters.forms, form];
    onFiltersChange({ ...filters, forms: newForms });
  };

  const hasActiveFilters = filters.genres.length > 0 || filters.statuses.length > 0 || filters.forms.length > 0;

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="space-y-4">
          {/* 头部 */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200/50">
            <h3 className="text-lg font-bold text-gray-900">筛选条件</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* 筛选项 - 横向布局 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 作品类型 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">作品类型</h4>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/50 cursor-pointer transition-colors border border-gray-200/50"
                  >
                    <input
                      type="checkbox"
                      checked={filters.genres.includes(option.value as NovelGenre)}
                      onChange={() => toggleGenre(option.value as NovelGenre)}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500/50 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 作品形式 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">作品形式</h4>
              <div className="flex flex-wrap gap-2">
                {formOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/50 cursor-pointer transition-colors border border-gray-200/50"
                  >
                    <input
                      type="checkbox"
                      checked={filters.forms.includes(option.value as NovelForm)}
                      onChange={() => toggleForm(option.value as NovelForm)}
                      className="w-4 h-4 text-purple-500 rounded focus:ring-2 focus:ring-purple-500/50 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 作品状态 */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">作品状态</h4>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl hover:bg-white/50 cursor-pointer transition-colors border border-gray-200/50"
                  >
                    <input
                      type="checkbox"
                      checked={filters.statuses.includes(option.value as NovelStatus)}
                      onChange={() => toggleStatus(option.value as NovelStatus)}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500/50 border-gray-300"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200/50">
            <button
              onClick={onReset}
              disabled={!hasActiveFilters}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              重置
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors"
            >
              完成
            </button>
          </div>
      </div>
    </div>
  );
};

export default NovelFilterPanel;
