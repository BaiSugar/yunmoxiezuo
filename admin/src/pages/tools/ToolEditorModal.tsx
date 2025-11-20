import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { updateTool, type Tool } from '../../services/tools.api';
import { getMembershipPlans } from '../../api/memberships';
import type { MembershipPlan } from '../../types/membership';

// 简单的Toast提示函数
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  // TODO: 替换为实际的Toast组件
  if (type === 'success') {
    console.log('✓', message);
  } else {
    console.error('✗', message);
  }
};

interface ToolEditorModalProps {
  tool: Tool;
  onClose: () => void;
  onSuccess: () => void;
}

const ToolEditorModal: React.FC<ToolEditorModalProps> = ({ tool, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: tool.title,
    description: tool.description,
    route: tool.route,
    category: tool.category,
    requiresMembership: tool.requiresMembership,
    allowedMembershipLevels: tool.allowedMembershipLevels || [],
    config: tool.config || {},
  });
  const [configJsonString, setConfigJsonString] = useState(
    JSON.stringify(tool.config || {}, null, 2)
  );
  const [configError, setConfigError] = useState('');
  const [saving, setSaving] = useState(false);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // 加载会员套餐列表
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await getMembershipPlans();
        setMembershipPlans(plans.filter(p => p.isActive)); // 只显示活跃的套餐
      } catch (error) {
        console.error('加载会员套餐失败:', error);
        showToast('加载会员套餐失败', 'error');
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证config JSON
    try {
      const parsedConfig = JSON.parse(configJsonString);
      setConfigError('');
      
      setSaving(true);
      const response = await updateTool(tool.id, {
        ...formData,
        config: parsedConfig
      });
      
      if (response.code === 'success') {
        showToast('保存成功', 'success');
        onSuccess();
      }
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        setConfigError('JSON 格式错误：' + error.message);
        showToast('JSON 格式错误', 'error');
      } else {
        console.error('保存失败:', error);
        showToast('保存失败', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLevelChange = (level: string) => {
    const levels = [...formData.allowedMembershipLevels];
    const index = levels.indexOf(level);
    
    if (index > -1) {
      levels.splice(index, 1);
    } else {
      levels.push(level);
    }
    
    setFormData({ ...formData, allowedMembershipLevels: levels });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">编辑工具配置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 工具名称（只读） */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工具名称
            </label>
            <input
              type="text"
              value={tool.name}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>

          {/* 显示标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              显示标题
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工具描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 路由路径 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              路由路径
              <span className="text-xs text-gray-500 ml-2">
                （前端路由，如 /tools/novel-search）
              </span>
            </label>
            <input
              type="text"
              value={formData.route}
              onChange={(e) => setFormData({ ...formData, route: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="/tools/your-tool-name"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              注意：路由会自动添加 /dashboard 前缀
            </p>
          </div>

          {/* 工具分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工具分类
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="search">搜索工具</option>
              <option value="writing">写作工具</option>
              <option value="utility">实用工具</option>
              <option value="analysis">分析工具</option>
              <option value="other">其他</option>
            </select>
          </div>

          {/* 会员要求 */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.requiresMembership}
                onChange={(e) => setFormData({ ...formData, requiresMembership: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">需要会员才能使用</span>
            </label>
          </div>

          {/* 允许的会员等级 */}
          {formData.requiresMembership && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                允许的会员等级
              </label>
              {loadingPlans ? (
                <div className="text-sm text-gray-500">加载中...</div>
              ) : membershipPlans.length === 0 ? (
                <div className="text-sm text-gray-500">暂无可用的会员套餐</div>
              ) : (
                <div className="space-y-2">
                  {membershipPlans.map((plan) => (
                    <label key={plan.type} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.allowedMembershipLevels.includes(plan.type)}
                        onChange={() => handleLevelChange(plan.type)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {plan.name} <span className="text-xs text-gray-500">(等级 {plan.level})</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 工具配置 (JSON) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              工具配置 (JSON 格式)
              <span className="text-xs text-gray-500 ml-2">
                （API地址、超时设置等）
              </span>
            </label>
            <textarea
              value={configJsonString}
              onChange={(e) => {
                setConfigJsonString(e.target.value);
                setConfigError('');
              }}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder='{
  "apiBaseUrl": "http://example.com/api",
  "timeout": 30000,
  "enabledSearchTypes": ["title", "url"]
}'
            />
            {configError && (
              <p className="mt-1 text-sm text-red-600">{configError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              请确保输入的是合法的 JSON 格式
            </p>
          </div>

          {/* 按钮组 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ToolEditorModal;
