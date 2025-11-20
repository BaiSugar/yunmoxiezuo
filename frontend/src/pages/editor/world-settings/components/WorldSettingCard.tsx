import React from 'react';
import { Edit2, Trash2, Globe } from 'lucide-react';
import type { WorldSetting } from '../../../../types/character';

interface WorldSettingCardProps {
  setting: WorldSetting;
  onEdit: (setting: WorldSetting) => void;
  onDelete: (setting: WorldSetting) => void;
}

/**
 * 世界观设定卡片组件
 */
export const WorldSettingCard: React.FC<WorldSettingCardProps> = ({
  setting,
  onEdit,
  onDelete,
}) => {
  // 获取主要字段用于预览
  const mainFields = setting.fields ? Object.entries(setting.fields).slice(0, 3) : [];

  return (
    <>
      {/* PC端卡片 */}
      <div className="hidden lg:block bg-white rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1 hover:border-green-200 relative overflow-hidden">
      {/* 装饰性背景 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-50 to-blue-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0"></div>
      
      {/* 头部 */}
      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/30 group-hover:shadow-xl group-hover:shadow-green-500/40 transition-all duration-300">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate text-base">{setting.name}</h3>
            {setting.category && (
              <p className="text-xs text-green-600 font-medium">{setting.category}</p>
            )}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(setting)}
            className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit2 className="w-4 h-4 text-green-600" />
          </button>
          <button
            onClick={() => onDelete(setting)}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
        </div>
      </div>

        {/* 字段预览 */}
      {mainFields.length > 0 && (
        <div className="space-y-2 relative z-10">
          {mainFields.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-sm bg-gray-50 rounded-lg px-2 py-1">
              <span className="text-gray-600 flex-shrink-0 font-medium">{key}:</span>
              <span className="text-gray-900 flex-1 whitespace-pre-line break-words">{String(value)}</span>
            </div>
          ))}
          {Object.keys(setting.fields || {}).length > 3 && (
            <p className="text-xs text-gray-400 mt-2">
              +{Object.keys(setting.fields || {}).length - 3} 个字段...
            </p>
          )}
        </div>
      )}

      {/* 空状态 */}
      {mainFields.length === 0 && (
        <p className="text-sm text-gray-400 italic">暂无详细信息</p>
      )}
    </div>

      {/* 移动端卡片 */}
      <div className="lg:hidden bg-white rounded-lg p-3 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          {/* 头像 */}
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-white" />
          </div>
          
          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{setting.name}</h3>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(setting);
                  }}
                  className="p-1.5 hover:bg-green-50 rounded-md transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-green-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(setting);
                  }}
                  className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            
            {setting.category && (
              <span className="inline-block px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full mb-2">
                {setting.category}
              </span>
            )}
            
            {/* 字段预览 - 只显示前2个 */}
            {mainFields.length > 0 && (
              <div className="space-y-1.5">
                {mainFields.slice(0, 2).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-2 text-xs bg-gray-50 rounded-lg px-2 py-1.5">
                    <span className="text-gray-600 flex-shrink-0 font-medium">{key}:</span>
                    <span className="text-gray-900 flex-1 whitespace-pre-line break-words">{String(value)}</span>
                  </div>
                ))}
                {Object.keys(setting.fields || {}).length > 2 && (
                  <p className="text-xs text-gray-400">
                    +{Object.keys(setting.fields || {}).length - 2} 个字段
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
