import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Zap } from "lucide-react";
import { promptCategoriesApi } from "../../../../services/prompts.api";
import { useToast } from "../../../../contexts/ToastContext";
import type { PromptCategory } from "../../../../types/prompt";

interface CreativeWorkshopProps {
  onSelectCategory: (category: PromptCategory) => void; // 选择分类回调
}

/**
 * 创意工坊 - 根据提示词分类生成功能模块
 */
export const CreativeWorkshop: React.FC<CreativeWorkshopProps> = ({
  onSelectCategory,
}) => {
  const { error: showError } = useToast();
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载提示词分类
  useEffect(() => {
    const loadCategories = async () => {
      setLoading(true);
      try {
        const data = await promptCategoriesApi.getCategories();
        // 后端已返回启用的分类，直接使用
        setCategories(data);
      } catch (error) {
        console.error("加载提示词分类失败:", error);
        showError("加载分类失败");
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [showError]);

  // 图标映射（根据分类名称返回合适的图标）
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      书名: "📚",
      人物: "👤",
      情节: "📖",
      对话: "💬",
      场景: "🏞️",
      开篇: "✨",
      结尾: "🎬",
      大纲: "📝",
      世界观: "🌍",
      剧情: "🎭",
    };

    // 模糊匹配
    for (const [key, icon] of Object.entries(iconMap)) {
      if (categoryName.includes(key)) {
        return <span className="text-xl sm:text-2xl">{icon}</span>;
      }
    }

    // 默认图标
    return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />;
  };

  // 渲染创意工坊主界面
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30">
      {/* 头部 */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg sm:rounded-xl shadow-lg">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900">
              创意工坊
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              选择功能模块，快速开始创作
            </p>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg mb-2">暂无可用功能模块</p>
              <p className="text-gray-400 text-sm">
                管理员尚未配置启用的提示词分类
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category)}
                className="group relative w-full p-4 bg-white rounded-xl border-2 border-gray-200/60 
                         hover:border-blue-400 hover:shadow-lg transition-all duration-300 
                         text-left overflow-hidden hover:-translate-y-0.5 active:translate-y-0"
              >
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

                <div className="relative z-10 flex items-center gap-4">
                  {/* 图标 */}
                  <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl group-hover:from-blue-100 group-hover:to-purple-100 transition-colors">
                    {getCategoryIcon(category.name)}
                  </div>

                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {category.name}生成器
                    </h3>

                    {/* 描述 */}
                    {category.description && (
                      <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                        {category.description}
                      </p>
                    )}

                    {/* 统计标签 */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                        <TrendingUp className="w-3 h-3" />
                        <span>热门</span>
                      </span>
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg">
                        <Zap className="w-3 h-3" />
                        <span>快速</span>
                      </span>
                    </div>
                  </div>

                  {/* 右侧箭头 */}
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
