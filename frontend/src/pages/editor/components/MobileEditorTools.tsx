import React from 'react';
import { Wand2, User, Globe, StickyNote, Settings } from 'lucide-react';

interface MobileEditorToolsProps {
  onAutoFormat: () => void;
  onViewCharacters?: () => void;
  onViewWorldSettings?: () => void;
  onViewMemos?: () => void;
  onViewEditorSettings?: () => void;
  disabled?: boolean;
}

/**
 * 移动端编辑器工具
 */
export const MobileEditorTools: React.FC<MobileEditorToolsProps> = ({
  onAutoFormat,
  onViewCharacters,
  onViewWorldSettings,
  onViewMemos,
  onViewEditorSettings,
  disabled = false,
}) => {
  return (
    <div className="p-4 space-y-3">
      {/* 内容管理 */}
      {(onViewCharacters || onViewWorldSettings || onViewMemos) && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">内容管理</h3>
          <div className="grid grid-cols-3 gap-3">
            {/* 人物卡 */}
            {onViewCharacters && (
              <button
                onClick={onViewCharacters}
                className="aspect-square flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="font-medium text-xs">人物卡</div>
              </button>
            )}

            {/* 世界观 */}
            {onViewWorldSettings && (
              <button
                onClick={onViewWorldSettings}
                className="aspect-square flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="font-medium text-xs">世界观</div>
              </button>
            )}

            {/* 备忘录 */}
            {onViewMemos && (
              <button
                onClick={onViewMemos}
                className="aspect-square flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-50 to-orange-100 hover:from-amber-100 hover:to-orange-200 text-amber-700 rounded-xl transition-all shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mb-2">
                  <StickyNote className="w-5 h-5 text-white" />
                </div>
                <div className="font-medium text-xs">备忘录</div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 编辑工具 */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">编辑工具</h3>
        <div className="grid grid-cols-3 gap-3">
          {/* 自动排版 */}
          <button
            onClick={onAutoFormat}
            disabled={disabled}
            className="aspect-square flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 text-purple-700 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center mb-2">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div className="font-medium text-xs">自动排版</div>
          </button>

          {/* 编辑器设置 */}
          {onViewEditorSettings && (
            <button
              onClick={onViewEditorSettings}
              className="aspect-square flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center mb-2">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div className="font-medium text-xs">编辑器设置</div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
