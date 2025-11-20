import React from "react";

interface ResizeDividerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  title?: string;
}

/**
 * 可拖动的分隔条
 */
export const ResizeDivider: React.FC<ResizeDividerProps> = ({
  onMouseDown,
  title = "拖动调整宽度",
}) => {
  return (
    <div
      className="w-1 h-full bg-transparent hover:bg-blue-500/30 cursor-col-resize transition-all duration-200 flex-shrink-0 group relative"
      onMouseDown={onMouseDown}
      title={title}
    >
      <div className="absolute inset-y-0 -inset-x-1 group-hover:bg-blue-500/10 rounded-full transition-colors" />
    </div>
  );
};
