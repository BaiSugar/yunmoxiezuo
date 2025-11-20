import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { promptCategoriesApi } from "../../services/prompts.api";
import { useToast } from "../../contexts/ToastContext";
import type { PromptCategory } from "../../types/prompt";

/**
 * 创意工坊页面 - 功能卡片列表（Dashboard）
 */
const CreativeWorkshopPage: React.FC = () => {
  const navigate = useNavigate();
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
  const getCategoryIcon = (_categoryName: string) => {
    // 统一使用Sparkles图标
    return <Sparkles className="w-6 h-6 text-blue-500" />;
  };

  // 渲染创意工坊主界面
  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 头部 */}
      <div className="px-6 py-5 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">创意工坊</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              选择功能模块，快速开始创作
            </p>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30">
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
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">暂无可用功能模块</p>
              <p className="text-gray-400 text-sm">
                管理员尚未配置启用的提示词分类
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => navigate(`/dashboard/workshop/${category.id}`)}
                className="group relative p-6 bg-white rounded-2xl border-2 border-gray-200/60 
                         hover:border-blue-400 hover:shadow-xl transition-all duration-300 
                         text-left overflow-hidden hover:-translate-y-1 active:translate-y-0"
              >
                {/* 背景装饰 */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

                {/* 图标 */}
                <div className="relative z-10 mb-4 flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl group-hover:from-blue-100 group-hover:to-purple-100 transition-colors">
                  {getCategoryIcon(category.name)}
                </div>

                {/* 标题 */}
                <div className="relative z-10">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {category.name}生成器
                  </h3>

                  {/* 描述 */}
                  {category.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {category.description}
                    </p>
                  )}

                  {/* 统计标签 */}
                  <div className="flex items-center gap-2 text-xs mt-auto pt-2 flex-wrap">
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

                {/* 右上角箭头 */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativeWorkshopPage;
