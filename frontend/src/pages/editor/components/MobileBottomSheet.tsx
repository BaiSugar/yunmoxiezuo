import React, { useEffect } from "react";
import { ChevronDown } from "lucide-react";
import type { EditorSettings } from "../../../types/editor-settings";
import {
  getEditorBackgroundStyle,
  getDefaultBackgroundClass,
} from "../../../utils/editorBackground";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  fullScreen?: boolean; // 是否全屏模式（AI助手使用）
  children: React.ReactNode;
  editorSettings?: EditorSettings | null;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  fullScreen = false,
  children,
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

  return (
    <div
      className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet内容 - 全屏或底部弹出 */}
      <div
        className={`absolute ${getDefaultBackgroundClass(
          editorSettings,
          "bg-white"
        )} shadow-2xl transform transition-transform duration-300 ease-out ${
          fullScreen ? "inset-0" : "bottom-0 left-0 right-0 rounded-t-3xl"
        } ${isOpen ? "translate-y-0" : "translate-y-full"}`}
        style={{
          ...getEditorBackgroundStyle(editorSettings, "center"),
          ...(fullScreen
            ? {
                height: "100vh",
                maxHeight: "100vh",
              }
            : {
                height: "calc(100vh - 60px)",
                maxHeight: "calc(100vh - 60px)",
              }),
        }}
      >
        {fullScreen ? (
          /* 全屏模式 - AI助手（内部组件自己控制标题栏） */
          <div className="h-full overflow-hidden">{children}</div>
        ) : (
          /* 底部Sheet模式 - 其他功能 */
          <>
            {/* 顶部拖动指示器和标题 */}
            <div className="sticky top-0 z-10 rounded-t-3xl">
              {/* 拖动条 */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-12 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* 标题栏 - 仅在有title时显示 */}
              {title && (
                <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h2>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              )}
            </div>

            {/* 内容 */}
            <div
              className={
                title
                  ? "h-[calc(100%-65px)] overflow-y-auto"
                  : "h-[calc(100%-20px)] overflow-y-auto"
              }
            >
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
