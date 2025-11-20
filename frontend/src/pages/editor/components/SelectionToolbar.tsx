import React from "react";
import type { SelectionToolbarState } from "./types";

interface SelectionToolbarProps {
  toolbar: SelectionToolbarState;
}

/**
 * 文本选中悬浮工具栏
 */
export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  toolbar,
}) => {
  if (!toolbar.show) {
    return null;
  }

  return (
    <div
      className="fixed bg-gray-900 text-white rounded-lg shadow-2xl px-3 py-2 flex items-center space-x-2 z-[100] transform -translate-x-1/2"
      style={{
        left: `${toolbar.x}px`,
        top: `${toolbar.y}px`,
      }}
      onMouseDown={(e) => e.preventDefault()} // 防止点击时失去焦点
    >
      <span className="text-xs text-gray-300 whitespace-nowrap">
        已选中 {toolbar.selectedText.length} 字
      </span>
      <div className="h-4 w-px bg-gray-700" />
      <button
        className="px-3 py-1 text-sm hover:bg-gray-800 rounded transition-colors whitespace-nowrap"
        onClick={() => console.log('AI续写:', toolbar.selectedText)}
      >
        AI续写
      </button>
      <button
        className="px-3 py-1 text-sm hover:bg-gray-800 rounded transition-colors whitespace-nowrap"
        onClick={() => console.log('AI改写:', toolbar.selectedText)}
      >
        AI改写
      </button>
      <button
        className="px-3 py-1 text-sm hover:bg-gray-800 rounded transition-colors whitespace-nowrap"
        onClick={() => console.log('AI扩写:', toolbar.selectedText)}
      >
        AI扩写
      </button>
    </div>
  );
};
