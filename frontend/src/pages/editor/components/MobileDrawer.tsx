import React, { useEffect } from "react";
import { X } from "lucide-react";
import type { EditorSettings } from "../../../types/editor-settings";
import {
  getEditorBackgroundStyle,
  getDefaultBackgroundClass,
} from "../../../utils/editorBackground";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  side?: "left" | "right";
  editorSettings?: EditorSettings | null;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  side = "left",
  editorSettings,
}) => {
  // 阻止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 抽屉内容 - 移除背景色，让内部组件控制背景 */}
      <div
        className={`absolute top-0 ${
          side === "left" ? "left-0" : "right-0"
        } h-full w-[85%] max-w-sm shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen
            ? "translate-x-0"
            : side === "left"
            ? "-translate-x-full"
            : "translate-x-full"
        }`}
      >
        {/* 头部 - 应用背景设置 */}
        <div
          className={`flex items-center justify-between p-4 border-b border-gray-200 ${getDefaultBackgroundClass(
            editorSettings,
            "bg-white"
          )} flex-shrink-0`}
          style={getEditorBackgroundStyle(editorSettings, "top")}
        >
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 - 无背景，让内部组件控制 */}
        <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
};
