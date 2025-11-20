import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  BookOpen,
  TrendingUp,
  PenTool,
  Clock,
  Plus,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import { novelsApi } from "../../services/novels.api";
import { promptsApi } from "../../services/prompts.api";

interface DashboardStats {
  totalNovels: number;
  totalWords: number;
  todayWords: number;
  consecutiveDays: number;
}

interface RecentNovel {
  id: number;
  title: string;
  totalWords: number;
  updatedAt: string;
}

interface LatestPrompt {
  id: number;
  title: string;
  description: string;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  user: {
    nickname: string;
    username: string;
  };
}

/**
 * Dashboard 首页
 */
const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalNovels: 0,
    totalWords: 0,
    todayWords: 0,
    consecutiveDays: 0,
  });
  const [recentNovels, setRecentNovels] = useState<RecentNovel[]>([]);
  const [latestPrompts, setLatestPrompts] = useState<LatestPrompt[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // 并行加载所有数据
      const [statsRes, novelsRes, promptsRes] = await Promise.all([
        novelsApi.getDashboardStats(),
        novelsApi.getMyNovels({ page: 1, pageSize: 5 }),
        promptsApi.getPrompts({ page: 1, pageSize: 6, sortBy: 'createdAt', sortOrder: 'DESC' }),
      ]);

      // 使用后端返回的统计数据
      setStats(statsRes);

      // 处理作品列表
      const novels = Array.isArray(novelsRes) ? novelsRes : (novelsRes.data || []);
      setRecentNovels(novels.slice(0, 5).map((novel: any) => ({
        id: novel.id,
        title: novel.title || novel.name || '未命名作品',
        totalWords: novel.totalWords || novel.wordCount || 0,
        updatedAt: novel.updatedAt,
      })));
      
      // 处理提示词列表
      const prompts = Array.isArray(promptsRes) ? promptsRes : (promptsRes.data || []);
      setLatestPrompts(prompts.slice(0, 6).map((prompt: any) => ({
        id: prompt.id,
        title: prompt.title || prompt.name || '未命名提示词',
        description: prompt.description || prompt.summary || '',
        viewCount: prompt.viewCount || 0,
        likeCount: prompt.likeCount || 0,
        createdAt: prompt.createdAt,
        user: {
          nickname: prompt.user?.nickname || prompt.author?.nickname || '',
          username: prompt.user?.username || prompt.author?.username || '',
        },
      })));
    } catch (error: any) {
      console.error("加载 Dashboard 数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "今天";
    if (days === 1) return "昨天";
    if (days < 7) return `${days}天前`;
    return d.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* 欢迎标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          {user?.nickname || user?.username}
        </h1>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 总作品数 */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">总作品数</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats.totalNovels)}
              </p>
            </div>
            <BookOpen className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* 总字数 */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">总字数</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats.totalWords)}
              </p>
            </div>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* 今日创作 */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">今日创作</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatNumber(stats.todayWords)}
              </p>
            </div>
            <PenTool className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* 连续创作天数 */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">连续创作</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.consecutiveDays}
                <span className="text-base ml-1">天</span>
              </p>
            </div>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h2 className="text-base font-medium text-gray-900 mb-4">快捷操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate("/dashboard/works")}
            className="flex items-center space-x-3 p-4 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-900">新建作品</span>
          </button>

          <button
            onClick={() => navigate("/dashboard/works")}
            className="flex items-center space-x-3 p-4 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
          >
            <FileText className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-900">继续写作</span>
          </button>

          <button
            onClick={() => navigate("/dashboard/prompts")}
            className="flex items-center space-x-3 p-4 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors"
          >
            <Sparkles className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-900">提示词广场</span>
          </button>
        </div>
      </div>

      {/* 最近作品 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-gray-900">最近作品</h2>
          {recentNovels.length > 0 && (
            <button
              onClick={() => navigate("/dashboard/works")}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              查看全部 →
            </button>
          )}
        </div>

        {recentNovels.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">暂无作品</p>
            <button
              onClick={() => navigate("/dashboard/works")}
              className="mt-4 px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
            >
              创建作品
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentNovels.map((novel) => (
              <div
                key={novel.id}
                onClick={() => navigate(`/editor/${novel.id}`)}
                className="p-4 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {novel.title}
                    </h3>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                      <span>{formatNumber(novel.totalWords)} 字</span>
                      <span>·</span>
                      <span>{formatDate(novel.updatedAt)}</span>
                    </div>
                  </div>
                  <PenTool className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 最新提示词 */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-gray-900">最新提示词</h2>
          <button
            onClick={() => navigate("/dashboard/prompts")}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            查看更多 →
          </button>
        </div>

        {latestPrompts.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 text-sm">暂无提示词</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {latestPrompts.map((prompt) => (
              <div
                key={prompt.id}
                onClick={() => navigate(`/dashboard/prompts/${prompt.id}`)}
                className="p-4 border border-gray-200 hover:border-gray-300 rounded-lg transition-colors cursor-pointer"
              >
                <h3 className="text-sm font-medium text-gray-900 line-clamp-1 mb-2">
                  {prompt.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                  {prompt.description}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>@{prompt.user?.nickname || prompt.user?.username}</span>
                  <div className="flex items-center space-x-2">
                    <span>{prompt.viewCount}</span>
                    <span>·</span>
                    <span>{prompt.likeCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
