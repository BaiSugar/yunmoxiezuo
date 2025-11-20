import React from "react";
import { Menu, List, Bot, Save } from "lucide-react";
import type { EditorSettings } from "../../../types/editor-settings";
import {
  getEditorBackgroundStyle,
  getDefaultBackgroundClass,
} from "../../../utils/editorBackground";

interface MobileToolbarProps {
  onOpenChapters: () => void;
  onOpenAI: () => void;
  onOpenMore: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  editorSettings?: EditorSettings | null;
}

export const MobileToolbar: React.FC<MobileToolbarProps> = ({
  onOpenChapters,
  onOpenAI,
  onOpenMore,
  onSave,
  isSaving,
  editorSettings,
}) => {
  return (
    <div
      className={`lg:hidden fixed bottom-0 left-0 right-0 ${getDefaultBackgroundClass(
        editorSettings,
        "bg-white"
      )} border-t border-gray-200 shadow-lg z-40 safe-area-inset-bottom`}
      style={getEditorBackgroundStyle(editorSettings, "top")}
    >
      <div className="flex items-center justify-around py-1 px-2">
        {/* 章节列表 */}
        <button
          onClick={onOpenChapters}
          className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 hover:text-blue-500 transition-colors"
        >
          <List className="w-5 h-5 mb-0.5" />
          <span className="text-xs">章节</span>
        </button>

        {/* 保存按钮 */}
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 hover:text-green-500 transition-colors disabled:opacity-50"
          >
            <Save
              className={`w-5 h-5 mb-0.5 ${isSaving ? "animate-pulse" : ""}`}
            />
            <span className="text-xs">{isSaving ? "保存中" : "保存"}</span>
          </button>
        )}

        {/* AI助手 */}
        <button
          onClick={onOpenAI}
          className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 hover:text-purple-500 transition-colors"
        >
          <Bot className="w-5 h-5 mb-0.5" />
          <span className="text-xs">AI助手</span>
        </button>

        {/* 更多菜单 */}
        <button
          onClick={onOpenMore}
          className="flex flex-col items-center justify-center px-3 py-1 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-xs">更多</span>
        </button>
      </div>
    </div>
  );
};
