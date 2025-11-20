import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import PromptCard from '../../components/prompts/PromptCard';
import { useToast } from '../../contexts/ToastContext';
import type { Prompt } from '../../types/prompt';

/**
 * 我的收藏页面
 */
const MyFavorites: React.FC = () => {
  const navigate = useNavigate();
  const { error: showError } = useToast();
  
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      // TODO: 实现获取收藏列表接口
      // const data = await promptsApi.getMyFavorites();
      // setPrompts(data);
      
      // 临时：使用空数组，等待后端接口实现
      setPrompts([]);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to load favorites:', err);
      setError(err.response?.data?.message || '加载收藏失败');
      showError('加载收藏失败');
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: Prompt) => {
    navigate(`/dashboard/prompts/${prompt.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 返回按钮 - 移动端 */}
      <button
        onClick={() => navigate('/dashboard/prompts?tab=my')}
        className="md:hidden flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>返回</span>
      </button>

      {/* 头部 */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Bookmark className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">我的收藏</h1>
        </div>
        <p className="text-sm sm:text-base text-gray-600">
          共收藏 {prompts.length} 个提示词
        </p>
      </div>

      {/* 收藏列表 */}
      {prompts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-gray-500">
          <Bookmark className="w-16 h-16 sm:w-20 sm:h-20 mb-4 text-gray-300" />
          <p className="text-base sm:text-lg">还没有收藏任何提示词</p>
          <p className="text-xs sm:text-sm mt-2 text-center px-4">
            在提示词详情页点击收藏按钮即可添加
          </p>
          <button
            onClick={() => navigate('/dashboard/prompts')}
            className="mt-6 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            去逛逛
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {prompts.map((prompt) => (
            <PromptCard
              key={prompt.id}
              prompt={prompt}
              onClick={handlePromptClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyFavorites;
