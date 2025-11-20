import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Edit, Trash2, Eye, Loader2,
  AlertCircle, Users, FileText, Settings
} from 'lucide-react';
import { promptsApi } from '../../services/prompts.api';
import { useToast } from '../../contexts/ToastContext';
import type { Prompt, PromptStatus } from '../../types/prompt';

/**
 * 我的提示词管理页面
 */
const MyPrompts: React.FC = () => {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<PromptStatus | 'all'>('all');
  const [selectedPrompts, setSelectedPrompts] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadPrompts();
  }, []);
  
  // 当页面获得焦点时重新加载（处理从编辑页返回的情况）
  useEffect(() => {
    const handleFocus = () => {
      loadPrompts();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await promptsApi.getMyPrompts();
      console.log('📝 我的提示词数据:', data);
      if (data.length > 0) {
        console.log('第一个提示词的待审核数量:', data[0].pendingApplicationsCount);
      }
      setPrompts(data);
    } catch (err: any) {
      console.error('Failed to load prompts:', err);
      setError(err.response?.data?.message || '加载提示词失败');
      showError('加载提示词失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个提示词吗？')) {
      return;
    }

    try {
      await promptsApi.deletePrompt(id);
      showSuccess('删除成功');
      loadPrompts();
    } catch (err: any) {
      showError(err.response?.data?.message || '删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedPrompts.size === 0) {
      showError('请先选择要删除的提示词');
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${selectedPrompts.size} 个提示词吗？`)) {
      return;
    }

    try {
      await Promise.all(
        Array.from(selectedPrompts).map(id => promptsApi.deletePrompt(id))
      );
      showSuccess('批量删除成功');
      setSelectedPrompts(new Set());
      loadPrompts();
    } catch (err: any) {
      showError(err.response?.data?.message || '批量删除失败');
    }
  };

  const handleSelectAll = () => {
    if (selectedPrompts.size === filteredPrompts.length) {
      setSelectedPrompts(new Set());
    } else {
      setSelectedPrompts(new Set(filteredPrompts.map(p => p.id)));
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedPrompts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPrompts(newSelected);
  };

  const filteredPrompts = filterStatus === 'all'
    ? prompts
    : prompts.filter(p => p.status === filterStatus);

  const statusCounts = {
    all: prompts.length,
    draft: prompts.filter(p => p.status === 'draft').length,
    published: prompts.filter(p => p.status === 'published').length,
    archived: prompts.filter(p => p.status === 'archived').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">我的提示词</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/prompts/batch-manager')}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-lg
                       transition-colors flex items-center space-x-2 text-sm font-medium"
              title="批量管理"
            >
              <Settings className="w-4 h-4" />
              <span>批量管理</span>
            </button>
            <button
              onClick={() => navigate('/dashboard/prompts/create')}
              className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg
                       transition-colors flex items-center space-x-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>创建提示词</span>
            </button>
          </div>
        </div>

        {/* 状态筛选 */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-5">
          <div className="flex items-center space-x-2">
            {[
              { key: 'all', label: '全部', count: statusCounts.all },
              { key: 'draft', label: '草稿', count: statusCounts.draft },
              { key: 'published', label: '已发布', count: statusCounts.published },
              { key: 'archived', label: '已归档', count: statusCounts.archived },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key as typeof filterStatus)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  filterStatus === key
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* 批量操作 */}
        {selectedPrompts.size > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-5">
            <div className="flex items-center justify-between">
              <span className="text-gray-700 text-sm">
                已选择 {selectedPrompts.size} 个提示词
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedPrompts(new Set())}
                  className="px-3 py-1.5 text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  取消选择
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 
                           transition-colors flex items-center space-x-1.5 text-sm"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>批量删除</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p>{error}</p>
          </div>
        )}

        {/* 空状态 */}
        {!error && filteredPrompts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <FileText className="w-12 h-12 mb-3 text-gray-300" />
            <p className="mb-2">
              {filterStatus === 'all' ? '暂无提示词' : `暂无${filterStatus === 'draft' ? '草稿' : filterStatus === 'published' ? '已发布' : '已归档'}的提示词`}
            </p>
            <button
              onClick={() => navigate('/dashboard/prompts/create')}
              className="mt-4 px-5 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
            >
              创建第一个提示词
            </button>
          </div>
        )}

        {/* 提示词表格 */}
        {!error && filteredPrompts.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPrompts.size === filteredPrompts.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">名称</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600">分类</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">状态</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">待审核</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">浏览</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">使用</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">点赞</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">热度</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">创建时间</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPrompts.map((prompt) => (
                  <tr
                    key={prompt.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPrompts.has(prompt.id)}
                        onChange={() => toggleSelect(prompt.id)}
                        className="w-4 h-4 rounded"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {prompt.category?.icon && (
                          <span className="text-base">{prompt.category.icon}</span>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">{prompt.name}</div>
                          {prompt.description && (
                            <div className="text-xs text-gray-500 line-clamp-1">
                              {prompt.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {prompt.category?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          prompt.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : prompt.status === 'draft'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {prompt.status === 'published'
                          ? '已发布'
                          : prompt.status === 'draft'
                          ? '草稿'
                          : '已归档'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {prompt.pendingApplicationsCount !== undefined && prompt.pendingApplicationsCount > 0 ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-red-50 text-red-700">
                          {prompt.pendingApplicationsCount}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {prompt.viewCount}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {prompt.useCount}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {prompt.likeCount}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-gray-900">
                        {prompt.hotValue}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-600">
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => navigate(`/dashboard/prompts/${prompt.id}`)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="查看"
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/prompts/${prompt.id}/edit`)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            console.log('🔍 点击权限管理按钮，提示词ID:', prompt.id);
                            console.log('🔍 待审核数量:', prompt.pendingApplicationsCount);
                            console.log('🔍 数据类型:', typeof prompt.pendingApplicationsCount);
                            navigate(`/dashboard/prompts/${prompt.id}/permissions`);
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors relative"
                          title={`权限管理${prompt.pendingApplicationsCount ? ` (${prompt.pendingApplicationsCount}个待审核)` : ''}`}
                        >
                          <Users className="w-3.5 h-3.5 text-gray-600" />
                          {(prompt.pendingApplicationsCount ?? 0) > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-red-500 text-white text-[9px] font-semibold rounded-full flex items-center justify-center">
                              {prompt.pendingApplicationsCount! > 9 ? '9+' : prompt.pendingApplicationsCount}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(prompt.id)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPrompts;
