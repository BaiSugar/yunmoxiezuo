import React from 'react';
import type { PromptCategory } from '../../types/prompt';

interface CategoryFilterProps {
  categories: PromptCategory[];
  selectedCategoryId: number | null;
  onCategoryChange: (categoryId: number | null) => void;
}

/**
 * 分类筛选组件
 */
const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategoryId,
  onCategoryChange,
}) => {
  const handleCategoryClick = (categoryId: number) => {
    if (selectedCategoryId === categoryId) {
      // 取消选择
      onCategoryChange(null);
    } else {
      // 选择分类
      onCategoryChange(categoryId);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-4">分类筛选</h3>

      {/* 全部分类 */}
      <button
        onClick={() => onCategoryChange(null)}
        className={`w-full text-left px-4 py-2 rounded-lg transition-all mb-2 ${
          !selectedCategoryId
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
            : 'hover:bg-gray-100'
        }`}
      >
        <span className="font-medium">全部</span>
      </button>

      {/* 分类列表 */}
      <div className="space-y-1">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all flex items-center ${
              selectedCategoryId === category.id
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              {category.icon && <span className="text-lg">{category.icon}</span>}
              <span className="font-medium">{category.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
