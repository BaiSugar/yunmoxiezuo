import React from "react";
import {
  ArrowLeft,
  Check,
  Loader2,
  Save,
  History,
  User,
  Globe,
  StickyNote,
  Settings,
} from "lucide-react";
import { usePermission } from "../../../hooks/usePermission";
import { PERMISSIONS } from "../../../utils/permission";
import type { EditorSettings } from "../../../types/editor-settings";
import {
  getEditorBackgroundStyle,
  getDefaultBackgroundClass,
} from "../../../utils/editorBackground";

interface EditorHeaderProps {
  novelName: string;
  totalWordCount: number;
  currentChapterWordCount: number; // 当前章节字数
  autoSaving: boolean;
  lastSaveTime: Date | null;
  onBack: () => void;
  onManualSave?: () => void; // 手动保存
  onViewHistory?: () => void; // 查看历史版本
  onViewCharacters?: () => void; // 查看人物卡
  onViewWorldSettings?: () => void; // 查看世界观
  onViewMemos?: () => void; // 查看备忘录
  onViewEditorSettings?: () => void; // 查看编辑器设置
  hasCurrentChapter?: boolean; // 是否有当前章节
  editorSettings?: EditorSettings | null;
}

/**
 * 格式化字数显示（超过1万显示为"X.X万"）
 */
const formatWordCount = (count: number): string => {
  if (count >= 10000) {
    const wan = (count / 10000).toFixed(1);
    return `${wan}万`;
  }
  return count.toLocaleString();
};

/**
 * 编辑器顶部导航栏
 */
export const EditorHeader: React.FC<EditorHeaderProps> = ({
  novelName,
  totalWordCount,
  currentChapterWordCount,
  autoSaving,
  lastSaveTime,
  onBack,
  onManualSave,
  onViewHistory,
  onViewCharacters,
  onViewWorldSettings,
  onViewMemos,
  onViewEditorSettings,
  hasCurrentChapter = false,
  editorSettings,
}) => {
  const { hasPermission } = usePermission();

  return (
    <header className="h-12 lg:h-14 flex items-center px-2 lg:px-3 pt-2 lg:pt-3 pb-0 flex-shrink-0 relative z-10">
      <div
        className={`w-full ${getDefaultBackgroundClass(
          editorSettings,
          "bg-white"
        )} border border-white/50 rounded-xl lg:rounded-2xl px-3 lg:px-4 py-2 lg:py-3 shadow-lg`}
        style={getEditorBackgroundStyle(editorSettings, "top")}
      >
        <div className="flex items-center space-x-2 lg:space-x-4">
          <button
            onClick={onBack}
            className="p-1.5 lg:p-2 hover:bg-white/80 rounded-lg lg:rounded-xl transition-all duration-200"
            title="返回作品列表"
          >
            <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base lg:text-lg font-semibold text-gray-900 truncate">
              {novelName}
            </h1>
            {/* PC端和移动端都显示完整信息，手机端字体更小 */}
            <div className="flex items-center space-x-1.5 lg:space-x-3 text-[10px] lg:text-xs text-gray-500">
              <span>共 {formatWordCount(totalWordCount)} 字</span>
              <span className="text-gray-300">|</span>
              <span>本章 {formatWordCount(currentChapterWordCount)} 字</span>
              <span className="text-gray-300">|</span>
              {autoSaving ? (
                <div className="flex items-center space-x-1">
                  <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                  <span className="text-blue-500">保存中...</span>
                </div>
              ) : (
                <button
                  onClick={onManualSave}
                  disabled={
                    !onManualSave || !hasPermission(PERMISSIONS.NOVEL.UPDATE)
                  }
                  className="flex items-center space-x-1 hover:bg-gray-100 px-2 py-1 rounded transition-colors disabled:cursor-not-allowed"
                  title="点击手动保存"
                >
                  {lastSaveTime ? (
                    <>
                      <Check className="w-3 h-3 text-green-500" />
                      <span className="text-gray-500">
                        已保存 {lastSaveTime.toLocaleTimeString()}
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-500">点击保存</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 右侧按钮区域 */}
          <div className="flex items-center gap-2">
            {/* PC端：人物卡、世界观、备忘录和编辑器设置按钮 */}
            <div className="hidden lg:flex items-center gap-2">
              {/* 人物卡按钮 */}
              {onViewCharacters && (
                <button
                  onClick={onViewCharacters}
                  className="p-1.5 lg:p-2 hover:bg-white/80 rounded-lg lg:rounded-xl transition-all duration-200"
                  title="人物卡"
                >
                  <User className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                </button>
              )}

              {/* 世界观按钮 */}
              {onViewWorldSettings && (
                <button
                  onClick={onViewWorldSettings}
                  className="p-1.5 lg:p-2 hover:bg-white/80 rounded-lg lg:rounded-xl transition-all duration-200"
                  title="世界观"
                >
                  <Globe className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                </button>
              )}

              {/* 备忘录按钮 */}
              {onViewMemos && (
                <button
                  onClick={onViewMemos}
                  className="p-1.5 lg:p-2 hover:bg-white/80 rounded-lg lg:rounded-xl transition-all duration-200"
                  title="备忘录"
                >
                  <StickyNote className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                </button>
              )}

              {/* 编辑器设置按钮 - 最右侧 */}
              {onViewEditorSettings && (
                <button
                  onClick={onViewEditorSettings}
                  className="p-1.5 lg:p-2 hover:bg-white/80 rounded-lg lg:rounded-xl transition-all duration-200"
                  title="编辑器设置"
                >
                  <Settings className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
                </button>
              )}
            </div>

            {/* 历史版本按钮 - PC端和移动端都显示 */}
            {hasCurrentChapter && onViewHistory && (
              <button
                onClick={onViewHistory}
                className="p-1.5 lg:p-2 hover:bg-white/80 rounded-lg lg:rounded-xl transition-all duration-200"
                title="查看章节历史版本"
              >
                <History className="w-4 h-4 lg:w-5 lg:h-5 text-gray-700" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
