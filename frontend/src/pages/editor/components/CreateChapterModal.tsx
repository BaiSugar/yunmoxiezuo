import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Volume } from './types';

interface CreateChapterModalProps {
  isOpen: boolean;
  volumes: Volume[];
  preselectedVolumeId?: number | null;
  onClose: () => void;
  onCreate: (title: string, volumeId: number | null) => Promise<void>;
}

export const CreateChapterModal: React.FC<CreateChapterModalProps> = ({
  isOpen,
  volumes,
  preselectedVolumeId,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [volumeId, setVolumeId] = useState<string>('standalone'); // 'standalone' 或分卷ID
  const [loading, setLoading] = useState(false);

  // 当模态框打开时，设置预选的分卷
  useEffect(() => {
    if (isOpen && preselectedVolumeId) {
      setVolumeId(String(preselectedVolumeId));
    } else if (isOpen && !preselectedVolumeId) {
      setVolumeId('standalone');
    }
  }, [isOpen, preselectedVolumeId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const selectedVolumeId = volumeId === 'standalone' ? null : Number(volumeId);
      await onCreate(title.trim(), selectedVolumeId);
      // 只有创建成功才清空表单和关闭模态框
      setTitle('');
      setVolumeId('standalone');
      onClose();
    } catch (error) {
      console.error('创建章节失败:', error);
      // 不关闭模态框，让用户可以重试或修改
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTitle('');
      setVolumeId('standalone');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 模态框 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">新建章节</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              章节标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：第一章"
              maxLength={200}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所属分卷
            </label>
            <select
              value={volumeId}
              onChange={(e) => setVolumeId(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="standalone">独立章节（不属于任何分卷）</option>
              {volumes.map((volume) => (
                <option key={volume.id} value={volume.id}>
                  {volume.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              独立章节可以与分卷混合排序
            </p>
          </div>

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!title.trim() || loading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
