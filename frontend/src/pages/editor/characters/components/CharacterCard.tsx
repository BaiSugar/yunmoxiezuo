import React from 'react';
import { Edit2, Trash2, User } from 'lucide-react';
import type { Character } from '../../../../types/character';

interface CharacterCardProps {
  character: Character;
  onEdit: (character: Character) => void;
  onDelete: (character: Character) => void;
}

/**
 * 人物卡卡片组件
 */
export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onEdit,
  onDelete,
}) => {
  // 获取主要字段用于预览
  const mainFields = character.fields ? Object.entries(character.fields).slice(0, 3) : [];

  return (
    <>
      {/* PC端卡片 */}
      <div className="hidden lg:block bg-white rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group hover:-translate-y-1 hover:border-blue-200 relative overflow-hidden">
        {/* 装饰性背景 */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-0"></div>
        
        {/* 头部 */}
        <div className="flex items-start justify-between mb-3 relative z-10">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30 group-hover:shadow-xl group-hover:shadow-blue-500/40 transition-all duration-300">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 truncate text-base">{character.name}</h3>
              {character.category && (
                <p className="text-xs text-blue-600 font-medium">{character.category}</p>
              )}
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <button
              onClick={() => onEdit(character)}
              className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors"
              title="编辑"
            >
              <Edit2 className="w-4 h-4 text-blue-600" />
            </button>
            <button
              onClick={() => onDelete(character)}
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
            {Object.keys(character.fields || {}).length > 3 && (
              <p className="text-xs text-gray-400 mt-2">
                +{Object.keys(character.fields || {}).length - 3} 个字段...
              </p>
            )}
          </div>
        )}
      </div>

      {/* 移动端卡片 */}
      <div className="lg:hidden bg-white rounded-lg p-3 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors">
        <div className="flex items-start gap-3">
          {/* 头像 */}
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-white" />
          </div>
          
          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-900 text-sm truncate">{character.name}</h3>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(character);
                  }}
                  className="p-1.5 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-blue-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(character);
                  }}
                  className="p-1.5 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
            
            {character.category && (
              <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full mb-2">
                {character.category}
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
                {Object.keys(character.fields || {}).length > 2 && (
                  <p className="text-xs text-gray-400">
                    +{Object.keys(character.fields || {}).length - 2} 个字段
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
