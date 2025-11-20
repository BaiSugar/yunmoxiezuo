import React, { useState, useEffect } from 'react';
import { X, Plus, FileText } from 'lucide-react';
import { useToast } from '../../../contexts/ToastContext';
import { apiService } from '../../../services/api';

interface Work {
  id: number;
  name: string;
  coverImage?: string;
  chapterCount?: number;
}

interface Chapter {
  id: number;
  title: string;
  order: number;
  content?: string;  // 章节内容（追加模式时需要）
}

interface CopyToWorkModalProps {
  content: string;
  title: string;
  onClose: () => void;
}

type CopyMode = 'replace' | 'append' | 'new';

const CopyToWorkModal: React.FC<CopyToWorkModalProps> = ({ content, title, onClose }) => {
  const { success: showSuccess, error: showError } = useToast();
  const [works, setWorks] = useState<Work[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedWork, setSelectedWork] = useState<number | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [copyMode, setCopyMode] = useState<CopyMode>('new');
  const [newChapterTitle, setNewChapterTitle] = useState(title || '');
  const [loading, setLoading] = useState(false);
  const [loadingWorks, setLoadingWorks] = useState(true);

  // 加载用户作品列表
  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const response = await apiService.get('/novels', {
          params: { page: 1, pageSize: 100 }
        });
        setWorks(response.data.data.data || []);
      } catch (error) {
        console.error('获取作品列表失败:', error);
        showError('获取作品列表失败');
      } finally {
        setLoadingWorks(false);
      }
    };

    fetchWorks();
  }, [showError]);

  // 加载选中作品的章节列表
  useEffect(() => {
    const fetchChapters = async () => {
      if (!selectedWork) {
        setChapters([]);
        return;
      }

      try {
        const response = await apiService.get(`/novels/${selectedWork}/chapters`);
        setChapters(response.data.data || []);
      } catch (error) {
        console.error('获取章节列表失败:', error);
        showError('获取章节列表失败');
      }
    };

    fetchChapters();
  }, [selectedWork, showError]);

  const handleCopy = async () => {
    if (!selectedWork) {
      showError('请选择作品');
      return;
    }

    if (copyMode !== 'new' && !selectedChapter) {
      showError('请选择章节');
      return;
    }

    if (copyMode === 'new' && !newChapterTitle.trim()) {
      showError('请输入章节标题');
      return;
    }

    setLoading(true);

    try {
      if (copyMode === 'new') {
        // 创建新章节
        await apiService.post('/chapters', {
          novelId: selectedWork,
          volumeId: null,  // 创建独立章节
          title: newChapterTitle,
          content,
          globalOrder: chapters.length + 1,
        });
        showSuccess('已创建新章节并复制内容');
      } else {
        // 更新现有章节
        let updateData: { content: string };
        
        if (copyMode === 'replace') {
          updateData = { content };
        } else {
          // 追加模式：先获取章节详情
          const chapterResponse = await apiService.get(`/chapters/${selectedChapter}`);
          const currentContent = chapterResponse.data.data.content || '';
          updateData = { content: currentContent + '\n\n' + content };
        }

        await apiService.patch(`/chapters/${selectedChapter}`, updateData);
        showSuccess(copyMode === 'replace' ? '已替换章节内容' : '已追加到章节末尾');
      }

      onClose();
    } catch (error) {
      console.error('复制失败:', error);
      showError('复制失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">复制到作品</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 选择作品 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择作品
            </label>
            {loadingWorks ? (
              <div className="text-center py-4 text-gray-500">加载中...</div>
            ) : works.length === 0 ? (
              <div className="text-center py-4 text-gray-500">暂无作品，请先创建作品</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {works.map((work) => (
                  <button
                    key={work.id}
                    onClick={() => setSelectedWork(work.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedWork === work.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">{work.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 选择模式 */}
          {selectedWork && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                复制模式
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setCopyMode('new')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    copyMode === 'new'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Plus className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium text-center">新建章节</div>
                </button>
                <button
                  onClick={() => setCopyMode('replace')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    copyMode === 'replace'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <FileText className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                  <div className="text-sm font-medium text-center">替换章节</div>
                </button>
                <button
                  onClick={() => setCopyMode('append')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    copyMode === 'append'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Plus className="w-5 h-5 mx-auto mb-1 text-green-600" />
                  <div className="text-sm font-medium text-center">追加内容</div>
                </button>
              </div>
            </div>
          )}

          {/* 新建章节标题 */}
          {selectedWork && copyMode === 'new' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                章节标题
              </label>
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入章节标题"
              />
            </div>
          )}

          {/* 选择章节 */}
          {selectedWork && copyMode !== 'new' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择章节
              </label>
              {chapters.length === 0 ? (
                <div className="text-center py-4 text-gray-500">该作品暂无章节</div>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() => setSelectedChapter(chapter.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        selectedChapter === chapter.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{chapter.title}</div>
                      <div className="text-sm text-gray-500 mt-1">第 {chapter.order} 章</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 按钮栏 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCopy}
            disabled={loading || !selectedWork || (copyMode !== 'new' && !selectedChapter)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? '复制中...' : '确认复制'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CopyToWorkModal;
