import React, { useEffect, useState } from 'react';
import { Settings, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getToolList, toggleTool, type Tool } from '../../services/tools.api';
import ToolEditorModal from './ToolEditorModal';

// 简单的Toast提示函数
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // TODO: 替换为实际的Toast组件
  if (type === 'success') {
    console.log('✓', message);
  } else {
    console.error('✗', message);
  }
};

const ToolsManagement: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const response = await getToolList();
      if (response.code === 'success') {
        setTools(response.data);
      }
    } catch (error) {
      console.error('加载工具列表失败:', error);
      showToast('加载工具列表失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (toolId: number) => {
    try {
      const response = await toggleTool(toolId);
      if (response.code === 'success') {
        showToast(response.message || '操作成功', 'success');
        loadTools();
      }
    } catch (error) {
      console.error('切换工具状态失败:', error);
      showToast('操作失败', 'error');
    }
  };

  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setShowEditor(true);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setEditingTool(null);
  };

  const handleSaveSuccess = () => {
    loadTools();
    handleCloseEditor();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">工具箱管理</h1>
        <p className="text-gray-600 mt-1">管理系统工具的启用状态和配置</p>
      </div>

      {/* PC端表格视图 */}
      <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                工具名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                会员要求
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                使用次数
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tools.map((tool) => (
              <tr key={tool.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{tool.title}</div>
                    <div className="text-sm text-gray-500">{tool.description}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tool.isEnabled ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      启用
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      禁用
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tool.requiresMembership ? (
                    <span className="text-sm text-yellow-600">需要会员</span>
                  ) : (
                    <span className="text-sm text-gray-500">无要求</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {tool.usageCount.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleToggle(tool.id)}
                    className={`
                      inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium
                      ${tool.isEnabled 
                        ? 'text-red-700 bg-red-50 hover:bg-red-100' 
                        : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }
                    `}
                  >
                    {tool.isEnabled ? '禁用' : '启用'}
                  </button>
                  <button
                    onClick={() => handleEdit(tool)}
                    className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    配置
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 移动端卡片视图 */}
      <div className="sm:hidden space-y-4">
        {tools.map((tool) => (
          <div key={tool.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
              </div>
              {tool.isEnabled ? (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  启用
                </span>
              ) : (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  禁用
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">会员要求:</span>
                <span className="font-medium">
                  {tool.requiresMembership ? '需要会员' : '无要求'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">使用次数:</span>
                <span className="font-medium">{tool.usageCount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleToggle(tool.id)}
                className={`
                  flex-1 py-2 px-4 rounded-md text-sm font-medium
                  ${tool.isEnabled 
                    ? 'text-red-700 bg-red-50' 
                    : 'text-green-700 bg-green-50'
                  }
                `}
              >
                {tool.isEnabled ? '禁用' : '启用'}
              </button>
              <button
                onClick={() => handleEdit(tool)}
                className="flex-1 py-2 px-4 rounded-md text-sm font-medium text-blue-700 bg-blue-50 flex items-center justify-center"
              >
                <Settings className="w-4 h-4 mr-1" />
                配置
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 工具编辑模态框 */}
      {showEditor && editingTool && (
        <ToolEditorModal
          tool={editingTool}
          onClose={handleCloseEditor}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
};

export default ToolsManagement;
