import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, ChevronRight, ChevronDown, Check, FileText } from "lucide-react";
import { useToast } from "../../../../contexts/ToastContext";

interface Chapter {
  id: number;
  title: string;
  volumeId: number | null;
  wordCount?: number;
  summary?: string;
}

interface Volume {
  id: number;
  name: string;
  chapters: Chapter[];
}

export interface SelectedChapter {
  id: number;
  title: string;
  useSummary: boolean; // true: 使用梗概, false: 使用全文
}

interface ChapterSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  volumes?: Volume[];
  selectedChapters: SelectedChapter[];
  onConfirm: (selections: SelectedChapter[]) => void;
}

/**
 * 章节选择模态窗（支持分卷一键全选和全文/梗概切换）
 */
export const ChapterSelectionModal: React.FC<ChapterSelectionModalProps> = ({
  isOpen,
  onClose,
  chapters,
  volumes = [],
  selectedChapters,
  onConfirm,
}) => {
  const toast = useToast();
  const [selections, setSelections] = useState<Map<number, SelectedChapter>>(
    new Map(selectedChapters.map((s) => [s.id, s]))
  );
  const [expandedVolumes, setExpandedVolumes] = useState<Set<number>>(
    new Set(volumes.map((v) => v.id))
  );

  // 按分卷组织章节
  const groupedChapters = useMemo(() => {
    const volumeMap = new Map<number | null, Chapter[]>();

    chapters.forEach((chapter) => {
      const volumeId = chapter.volumeId;
      if (!volumeMap.has(volumeId)) {
        volumeMap.set(volumeId, []);
      }
      volumeMap.get(volumeId)!.push(chapter);
    });

    return volumeMap;
  }, [chapters]);

  // 切换分卷展开/折叠
  const toggleVolume = (volumeId: number) => {
    const newExpanded = new Set(expandedVolumes);
    if (newExpanded.has(volumeId)) {
      newExpanded.delete(volumeId);
    } else {
      newExpanded.add(volumeId);
    }
    setExpandedVolumes(newExpanded);
  };

  // 一键全选/取消分卷下的所有章节
  const toggleVolumeChapters = (volumeId: number) => {
    const volumeChapters = groupedChapters.get(volumeId) || [];
    const newSelections = new Map(selections);

    // 检查是否全部选中
    const allSelected = volumeChapters.every((ch) => newSelections.has(ch.id));

    if (allSelected) {
      // 全部取消选中
      volumeChapters.forEach((ch) => newSelections.delete(ch.id));
    } else {
      // 全部选中（默认使用全文）
      volumeChapters.forEach((ch) => {
        if (!newSelections.has(ch.id)) {
          newSelections.set(ch.id, {
            id: ch.id,
            title: ch.title,
            useSummary: false, // 默认使用全文
          });
        }
      });
    }

    setSelections(newSelections);
  };

  // 切换章节选中状态
  const toggleChapter = (chapter: Chapter) => {
    const newSelections = new Map(selections);

    if (newSelections.has(chapter.id)) {
      newSelections.delete(chapter.id);
    } else {
      newSelections.set(chapter.id, {
        id: chapter.id,
        title: chapter.title,
        useSummary: false, // 默认使用全文
      });
    }

    setSelections(newSelections);
  };

  // 切换全文/梗概
  const toggleUseSummary = (chapterId: number, useSummary: boolean) => {
    const selection = selections.get(chapterId);
    if (selection) {
      const newSelections = new Map(selections);
      newSelections.set(chapterId, { ...selection, useSummary });
      setSelections(newSelections);
    }
  };

  // 确认选择
  const handleConfirm = () => {
    // 创建章节映射，方便查找章节信息
    const chapterMap = new Map(chapters.map((ch) => [ch.id, ch]));

    // 记录需要修正的章节
    const correctedChapters: string[] = [];

    // 验证并修正选择：如果选择了梗概但没有梗概，自动改为全文
    const validSelections = Array.from(selections.values()).map((selection) => {
      const chapter = chapterMap.get(selection.id);
      const hasSummary = !!(chapter?.summary && chapter.summary.trim());

      // 如果选择了梗概但实际没有梗概，改为使用全文
      if (selection.useSummary && !hasSummary) {
        correctedChapters.push(chapter?.title || `章节 #${selection.id}`);
        return {
          ...selection,
          useSummary: false,
        };
      }

      return selection;
    });

    // 如果有修正，显示提示
    if (correctedChapters.length > 0) {
      const chapterList =
        correctedChapters.length <= 3
          ? correctedChapters.join("、")
          : `${correctedChapters.slice(0, 3).join("、")} 等 ${
              correctedChapters.length
            } 个章节`;

      toast.warning(
        "部分章节已自动切换为全文",
        `以下章节无梗概，已自动切换为使用全文：${chapterList}`
      );
    }

    onConfirm(validSelections);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        className="bg-white w-full h-full sm:h-auto sm:max-h-[85vh] sm:rounded-2xl shadow-2xl sm:max-w-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white">选择章节</h3>
                <p className="text-xs text-green-100">
                  已选 {selections.size} 个章节
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* 快捷操作按钮 */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 正文选择区 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // 追加1个章节（第一个未选中的）
                  const unselectedChapter = chapters.find(
                    (ch) => !selections.has(ch.id)
                  );
                  if (unselectedChapter) {
                    const newSelections = new Map(selections);
                    newSelections.set(unselectedChapter.id, {
                      id: unselectedChapter.id,
                      title: unselectedChapter.title,
                      useSummary: false,
                    });
                    setSelections(newSelections);
                  }
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors backdrop-blur-sm border border-white/30"
              >
                + 追加1个
              </button>
              <button
                onClick={() => {
                  // 追加5个章节
                  const unselectedChapters = chapters
                    .filter((ch) => !selections.has(ch.id))
                    .slice(0, 5);
                  const newSelections = new Map(selections);
                  unselectedChapters.forEach((ch) => {
                    newSelections.set(ch.id, {
                      id: ch.id,
                      title: ch.title,
                      useSummary: false,
                    });
                  });
                  setSelections(newSelections);
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors backdrop-blur-sm border border-white/30"
              >
                + 追加5个
              </button>
              <button
                onClick={() => {
                  // 追加10个章节
                  const unselectedChapters = chapters
                    .filter((ch) => !selections.has(ch.id))
                    .slice(0, 10);
                  const newSelections = new Map(selections);
                  unselectedChapters.forEach((ch) => {
                    newSelections.set(ch.id, {
                      id: ch.id,
                      title: ch.title,
                      useSummary: false,
                    });
                  });
                  setSelections(newSelections);
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors backdrop-blur-sm border border-white/30"
              >
                + 追加10个
              </button>
              <button
                onClick={() => {
                  // 全选正文（所有章节，使用全文）
                  const newSelections = new Map<number, SelectedChapter>();
                  chapters.forEach((ch) => {
                    newSelections.set(ch.id, {
                      id: ch.id,
                      title: ch.title,
                      useSummary: false,
                    });
                  });
                  setSelections(newSelections);
                }}
                className="px-3 py-1.5 bg-blue-500/30 hover:bg-blue-500/50 text-white text-xs font-medium rounded-lg transition-colors backdrop-blur-sm border border-blue-400/50"
              >
                全选正文
              </button>
              <button
                onClick={() => {
                  // 清空全部
                  setSelections(new Map());
                }}
                className="px-3 py-1.5 bg-red-500/30 hover:bg-red-500/50 text-white text-xs font-medium rounded-lg transition-colors backdrop-blur-sm border border-red-400/50"
              >
                清空全部
              </button>
            </div>

            {/* 分隔符 */}
            <div className="w-px h-5 bg-white/30"></div>

            {/* 切换区 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // 切换为正文（所有已选中的改为全文）
                  const newSelections = new Map(selections);
                  newSelections.forEach((selection) => {
                    newSelections.set(selection.id, {
                      ...selection,
                      useSummary: false,
                    });
                  });
                  setSelections(newSelections);
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors backdrop-blur-sm border border-white/30 flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                切换正文
              </button>
              <button
                onClick={() => {
                  // 切换为概要（所有已选中且有梗概的改为梗概）
                  const newSelections = new Map(selections);
                  newSelections.forEach((selection) => {
                    const chapter = chapters.find(
                      (ch) => ch.id === selection.id
                    );
                    if (chapter?.summary) {
                      newSelections.set(selection.id, {
                        ...selection,
                        useSummary: true,
                      });
                    }
                  });
                  setSelections(newSelections);
                }}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors backdrop-blur-sm border border-white/30 flex items-center gap-1"
              >
                <FileText className="w-3 h-3" />
                切换概要
              </button>
            </div>
          </div>
        </div>

        {/* 状态栏 */}
        <div className="px-5 py-2.5 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-600">
              <span className="font-medium">正文选择：</span>
              已选择：
              <span className="text-green-600 font-semibold mx-1">
                正文{" "}
                {
                  Array.from(selections.values()).filter((s) => !s.useSummary)
                    .length
                }{" "}
                项
              </span>
              <span className="text-blue-600 font-semibold mx-1">
                概要{" "}
                {
                  Array.from(selections.values()).filter((s) => s.useSummary)
                    .length
                }{" "}
                项
              </span>
              <span className="text-gray-500">（共 {selections.size} 项）</span>
            </div>
            <button
              onClick={() => {
                const newExpanded = new Set<number>();
                if (expandedVolumes.size < volumes.length) {
                  // 全部展开
                  volumes.forEach((v) => newExpanded.add(v.id));
                }
                setExpandedVolumes(newExpanded);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              {expandedVolumes.size === volumes.length
                ? "全部折叠"
                : "全部展开"}
            </button>
          </div>
        </div>

        {/* 列表区域 */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-br from-gray-50/50 to-green-50/30">
          {chapters.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">暂无章节</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 遍历所有分卷 */}
              {volumes.map((volume) => {
                const volumeChapters = groupedChapters.get(volume.id) || [];
                const isExpanded = expandedVolumes.has(volume.id);
                const allSelected =
                  volumeChapters.length > 0 &&
                  volumeChapters.every((ch) => selections.has(ch.id));
                const someSelected =
                  volumeChapters.some((ch) => selections.has(ch.id)) &&
                  !allSelected;

                return (
                  <div key={`volume-${volume.id}`} className="space-y-2">
                    {/* 分卷标题 */}
                    <div className="flex items-center gap-2 bg-gradient-to-r from-green-100/80 to-emerald-100/60 backdrop-blur-sm px-3 py-2 rounded-xl border border-green-200/50">
                      {/* 展开/折叠按钮 */}
                      <button
                        onClick={() => toggleVolume(volume.id)}
                        className="p-1 hover:bg-white/60 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-green-700" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-green-700" />
                        )}
                      </button>

                      {/* 一键全选分卷 */}
                      <button
                        onClick={() => toggleVolumeChapters(volume.id)}
                        className={`flex-1 flex items-center gap-2 text-left group`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            allSelected
                              ? "border-green-600 bg-green-600"
                              : someSelected
                              ? "border-green-600 bg-green-600"
                              : "border-gray-300 bg-white group-hover:border-green-500"
                          }`}
                        >
                          {allSelected && (
                            <Check
                              className="w-3.5 h-3.5 text-white"
                              strokeWidth={3}
                            />
                          )}
                          {someSelected && (
                            <div className="w-2 h-0.5 bg-white rounded"></div>
                          )}
                        </div>
                        <span className="font-bold text-green-900 text-sm">
                          {volume.name}
                        </span>
                        <span className="text-xs text-green-600">
                          ({volumeChapters.length}章)
                        </span>
                      </button>
                    </div>

                    {/* 分卷下的章节列表 */}
                    {isExpanded && volumeChapters.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {volumeChapters.map((chapter) => {
                          const isSelected = selections.has(chapter.id);
                          const selection = selections.get(chapter.id);
                          const hasSummary = !!(
                            chapter.summary && chapter.summary.trim()
                          );

                          return (
                            <div
                              key={chapter.id}
                              onClick={() => toggleChapter(chapter)}
                              className={`group p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm"
                                  : "border-gray-200/60 bg-white hover:border-green-300 hover:bg-green-50/30"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Checkbox */}
                                <div
                                  className="flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                      isSelected
                                        ? "border-green-600 bg-green-600"
                                        : "border-gray-300 bg-white group-hover:border-green-500"
                                    }`}
                                  >
                                    {isSelected && (
                                      <Check
                                        className="w-3.5 h-3.5 text-white"
                                        strokeWidth={3}
                                      />
                                    )}
                                  </div>
                                </div>

                                {/* 章节信息 */}
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 text-sm truncate">
                                    {chapter.title}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {chapter.wordCount || 0} 字
                                    {!hasSummary && (
                                      <span className="text-orange-500 ml-2">
                                        · 无梗概
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 全文/梗概切换（只有选中时显示） */}
                                {isSelected && (
                                  <div
                                    className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200 flex-shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() =>
                                        toggleUseSummary(chapter.id, false)
                                      }
                                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                        !selection?.useSummary
                                          ? "bg-green-600 text-white shadow-sm"
                                          : "text-gray-600 hover:bg-gray-100"
                                      }`}
                                      title="使用章节全文"
                                    >
                                      全文
                                    </button>
                                    <button
                                      onClick={() =>
                                        toggleUseSummary(chapter.id, true)
                                      }
                                      disabled={!hasSummary}
                                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                        selection?.useSummary
                                          ? "bg-blue-600 text-white shadow-sm"
                                          : hasSummary
                                          ? "text-gray-600 hover:bg-gray-100"
                                          : "text-gray-300 cursor-not-allowed"
                                      }`}
                                      title={
                                        hasSummary
                                          ? "使用章节梗概"
                                          : "该章节无梗概"
                                      }
                                    >
                                      梗概
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 独立章节（不属于任何分卷） */}
              {groupedChapters.has(null) &&
                groupedChapters.get(null)!.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                      <span className="font-bold text-gray-700 text-sm">
                        独立章节
                      </span>
                      <span className="text-xs text-gray-600">
                        ({groupedChapters.get(null)!.length}章)
                      </span>
                    </div>

                    <div className="space-y-2">
                      {groupedChapters.get(null)!.map((chapter) => {
                        const isSelected = selections.has(chapter.id);
                        const selection = selections.get(chapter.id);
                        const hasSummary = !!(
                          chapter.summary && chapter.summary.trim()
                        );

                        return (
                          <div
                            key={chapter.id}
                            className={`group p-3 rounded-xl border-2 transition-all ${
                              isSelected
                                ? "border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm"
                                : "border-gray-200/60 bg-white hover:border-green-300 hover:bg-green-50/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Checkbox */}
                              <button
                                onClick={() => toggleChapter(chapter)}
                                className="flex-shrink-0"
                              >
                                <div
                                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                    isSelected
                                      ? "border-green-600 bg-green-600"
                                      : "border-gray-300 bg-white group-hover:border-green-500"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check
                                      className="w-3.5 h-3.5 text-white"
                                      strokeWidth={3}
                                    />
                                  )}
                                </div>
                              </button>

                              {/* 章节信息 */}
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 text-sm truncate">
                                  {chapter.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {chapter.wordCount || 0} 字
                                  {!hasSummary && (
                                    <span className="text-orange-500 ml-2">
                                      · 无梗概
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 全文/梗概切换（只有选中时显示） */}
                              {isSelected && (
                                <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200 flex-shrink-0">
                                  <button
                                    onClick={() =>
                                      toggleUseSummary(chapter.id, false)
                                    }
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                      !selection?.useSummary
                                        ? "bg-green-600 text-white shadow-sm"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                  >
                                    全文
                                  </button>
                                  <button
                                    onClick={() =>
                                      toggleUseSummary(chapter.id, true)
                                    }
                                    disabled={!hasSummary}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                                      selection?.useSummary
                                        ? "bg-blue-600 text-white shadow-sm"
                                        : hasSummary
                                        ? "text-gray-600 hover:bg-gray-100"
                                        : "text-gray-300 cursor-not-allowed"
                                    }`}
                                    title={
                                      hasSummary
                                        ? "使用章节梗概"
                                        : "该章节无梗概"
                                    }
                                  >
                                    梗概
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* 底部操作按钮 */}
        <div className="px-4 py-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 
                       hover:from-green-600 hover:to-emerald-700 text-white rounded-xl 
                       font-semibold shadow-lg shadow-green-500/30 hover:shadow-xl 
                       hover:shadow-green-500/40 transition-all duration-200"
            >
              完成（已选 {selections.size} 个）
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 
                       rounded-xl font-medium transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
