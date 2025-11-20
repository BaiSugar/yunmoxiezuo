import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import type { Memo } from "../../../../types/character";

interface MemoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  memos: Memo[];
  selectedIds: number[];
  onConfirm: (selectedIds: number[]) => void;
  title?: string;
  allowMultiple?: boolean; // 是否允许多选，默认true
}

/**
 * 备忘录选择模态窗组件
 * 与ChatTab中的模态窗保持一致的设计风格
 */
export const MemoSelectionModal: React.FC<MemoSelectionModalProps> = ({
  isOpen,
  onClose,
  memos,
  selectedIds,
  onConfirm,
  title = "选择备忘录",
  allowMultiple = true,
}) => {
  // 临时选中状态（用于多选模式）
  const [tempSelectedIds, setTempSelectedIds] = useState<number[]>(selectedIds);

  // 打开时初始化临时选中状态
  React.useEffect(() => {
    if (isOpen) {
      setTempSelectedIds(selectedIds);
    }
  }, [isOpen, selectedIds]);

  if (!isOpen) return null;

  const handleToggle = (id: number) => {
    if (allowMultiple) {
      if (tempSelectedIds.includes(id)) {
        setTempSelectedIds(
          tempSelectedIds.filter((selectedId) => selectedId !== id)
        );
      } else {
        setTempSelectedIds([...tempSelectedIds, id]);
      }
    } else {
      // 单选模式：直接设置选中，并确认
      setTempSelectedIds([id]);
      onConfirm([id]);
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm(tempSelectedIds);
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full h-full sm:h-auto sm:max-h-[80vh] sm:rounded-2xl shadow-2xl sm:max-w-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-xl">
                📝
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-xs text-purple-100 mt-0.5">
                  共 {memos.length} 个备忘录
                  {allowMultiple && ` · 已选 ${tempSelectedIds.length} 个`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-50/50 to-purple-50/30">
          {memos.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="text-5xl opacity-50">📝</span>
              <p className="text-sm mt-3">暂无备忘录</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {memos.map((memo) => {
                const isSelected = tempSelectedIds.includes(memo.id);
                return (
                  <button
                    key={memo.id}
                    onClick={() => handleToggle(memo.id)}
                    className={`group w-full p-3.5 rounded-xl border-2 transition-all text-left shadow-sm hover:shadow-md ${
                      isSelected
                        ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md"
                        : "border-gray-200/60 bg-white hover:border-purple-300 hover:bg-purple-50/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      {allowMultiple && (
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-purple-500 bg-purple-500"
                              : "border-gray-300 bg-white group-hover:border-purple-400"
                          }`}
                        >
                          {isSelected && (
                            <Check
                              className="w-3.5 h-3.5 text-white"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium truncate ${
                            isSelected ? "text-purple-900" : "text-gray-900"
                          }`}
                        >
                          {memo.title}
                        </div>
                        {memo.content && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {memo.content}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        {allowMultiple && (
          <div className="p-4 border-t border-gray-200 bg-white flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
            >
              确定（已选 {tempSelectedIds.length} 个）
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
