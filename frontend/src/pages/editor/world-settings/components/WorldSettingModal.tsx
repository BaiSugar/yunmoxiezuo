import React, { useState } from 'react';
import { X, Plus, Trash2, Loader2, ChevronDown, Folder } from 'lucide-react';
import { worldSettingsApi } from '../../../../services/characters.api';
import { useToast } from '../../../../contexts/ToastContext';
import type { WorldSetting } from '../../../../types/character';

interface WorldSettingModalProps {
  novelId: number;
  setting: WorldSetting | null;
  onClose: () => void;
  onSave: () => void;
  existingCategories?: string[];
}

/**
 * 世界观设定创建/编辑对话框
 */
export const WorldSettingModal: React.FC<WorldSettingModalProps> = ({
  novelId,
  setting,
  onClose,
  onSave,
  existingCategories = [],
}) => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState(setting?.name || '');
  const [category, setCategory] = useState(setting?.category || '');
  const [fields, setFields] = useState<Record<string, string>>(
    setting?.fields || {}
  );

  // 新字段的输入
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // 添加字段
  const handleAddField = () => {
    if (!newFieldKey.trim()) {
      showError('字段名不能为空', '请输入字段名称');
      return;
    }
    
    if (fields[newFieldKey]) {
      showError('字段已存在', '该字段名已被使用');
      return;
    }

    setFields({ ...fields, [newFieldKey]: newFieldValue });
    setNewFieldKey('');
    setNewFieldValue('');
  };

  // 删除字段
  const handleRemoveField = (key: string) => {
    const newFields = { ...fields };
    delete newFields[key];
    setFields(newFields);
  };

  // 更新字段值
  const handleUpdateField = (key: string, value: string) => {
    setFields({ ...fields, [key]: value });
  };

  // 保存
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showError('名称不能为空', '请输入世界观设定名称');
      return;
    }

    setLoading(true);
    try {
      if (setting) {
        // 更新
        await worldSettingsApi.updateWorldSetting(setting.id, {
          name: name.trim(),
          category: category.trim() || undefined,
          fields,
        });
        success('更新成功', `世界观设定"${name}"已更新`);
      } else {
        // 创建
        await worldSettingsApi.createWorldSetting(novelId, {
          name: name.trim(),
          category: category.trim() || undefined,
          fields,
        });
        success('创建成功', `世界观设定"${name}"已创建`);
      }
      onSave();
    } catch (err: any) {
      console.error('保存世界观设定失败:', err);
      showError('保存失败', err.response?.data?.message || '无法保存世界观设定');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {setting ? '编辑世界观设定' : '新建世界观设定'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 基本信息 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">基本信息</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  词条名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例如：光明顶、九阳神功"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类/分组
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    onFocus={() => setShowCategoryDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                    placeholder="选择或输入分类（如：地理、武功、势力）"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  
                  {/* 自定义下拉列表 */}
                  {showCategoryDropdown && existingCategories.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border-2 border-green-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {existingCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCategory(cat);
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-green-50 transition-colors flex items-center gap-2 text-sm"
                        >
                          <Folder className="w-4 h-4 text-green-500" />
                          <span>{cat}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 自定义字段 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">自定义字段</h3>
              <span className="text-xs text-gray-500">{Object.keys(fields).length} 个字段</span>
            </div>

            {/* 已有字段列表 - 卡片式布局 */}
            {Object.keys(fields).length > 0 && (
              <div className="space-y-2 mb-4">
                {Object.entries(fields).map(([key, value]) => (
                  <div key={key} className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-3 border border-green-100">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">{key}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveField(key)}
                            className="p-1 hover:bg-red-100 rounded transition-colors group"
                            title="删除字段"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" />
                          </button>
                        </div>
                        <textarea
                          value={value}
                          onChange={(e) => handleUpdateField(key, e.target.value)}
                          placeholder="输入内容..."
                          rows={Math.min(6, Math.max(2, (value.match(/\n/g) || []).length + 1))}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none overflow-y-auto max-h-[144px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 添加新字段 - 简洁布局 */}
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-green-400 transition-colors">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  placeholder="字段名（如：类型、位置、特点）"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
                <textarea
                  value={newFieldValue}
                  onChange={(e) => setNewFieldValue(e.target.value)}
                  placeholder="字段值（可输入详细内容）"
                  rows={Math.min(6, Math.max(2, (newFieldValue.match(/\n/g) || []).length + 1))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none overflow-y-auto max-h-[144px]"
                />
                <button
                  type="button"
                  onClick={handleAddField}
                  className="w-full py-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>添加字段</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{loading ? '保存中...' : '保存'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
