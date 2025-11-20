import React, { useState } from "react";
import { createPortal } from "react-dom";
import { User, X, Check } from "lucide-react";
import type { Character } from "../../../../types/character";

interface CharacterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  selectedIds: number[];
  onConfirm: (selectedIds: number[]) => void;
  title?: string;
  allowMultiple?: boolean; // 是否允许多选，默认true
}

/**
 * 人物卡选择模态窗组件
 * 与ChatTab中的模态窗保持一致的设计风格
 */
export const CharacterSelectionModal: React.FC<
  CharacterSelectionModalProps
> = ({
  isOpen,
  onClose,
  characters,
  selectedIds,
  onConfirm,
  title = "选择人物卡",
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

  // 按分类分组
  const grouped = characters.reduce((acc, char) => {
    const category = char.category || "未分类";
    if (!acc[category]) acc[category] = [];
    acc[category].push(char);
    return acc;
  }, {} as Record<string, Character[]>);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white w-full h-full sm:h-auto sm:max-h-[80vh] sm:rounded-2xl shadow-2xl sm:max-w-lg flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 - 渐变背景 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
                <p className="text-xs text-blue-100 mt-0.5">
                  共 {characters.length} 个人物卡
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

        {/* 列表 - 按分类分组 */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-50/50 to-blue-50/30">
          {characters.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">暂无人物卡</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([category, chars]) => (
                <div key={category}>
                  {/* 分类标题 */}
                  <div className="flex items-center gap-2 mb-2.5 sticky top-0 bg-gradient-to-r from-blue-100/80 to-indigo-100/60 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                    <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <span className="text-xs font-bold text-blue-900">
                      {category}
                    </span>
                    <span className="text-xs text-blue-600">
                      ({chars.length})
                    </span>
                  </div>

                  {/* 分类下的人物卡列表 */}
                  <div className="space-y-2">
                    {chars.map((character) => {
                      const isSelected = tempSelectedIds.includes(character.id);
                      return (
                        <button
                          key={character.id}
                          onClick={() => handleToggle(character.id)}
                          className={`group w-full p-3.5 rounded-xl border-2 transition-all text-left shadow-sm hover:shadow-md ${
                            isSelected
                              ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md"
                              : "border-gray-200/60 bg-white hover:border-blue-300 hover:bg-blue-50/30"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Checkbox */}
                            {allowMultiple && (
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300 bg-white group-hover:border-blue-400"
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
                                className={`font-medium ${
                                  isSelected ? "text-blue-900" : "text-gray-900"
                                }`}
                              >
                                {character.name}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        {allowMultiple && (
          <div className="p-4 border-t border-gray-200 bg-white">
            <button
              onClick={handleConfirm}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
            >
              完成（已选 {tempSelectedIds.length} 个）
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
