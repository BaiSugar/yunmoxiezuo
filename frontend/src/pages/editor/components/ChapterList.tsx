import React from "react";
import {
  Plus,
  FileText,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Book,
  GripVertical,
  FolderPlus,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import type { Chapter, Volume, DragState } from "./types";
import { DropdownMenu } from "./DropdownMenu";
import { usePermission } from "../../../hooks/usePermission";
import { PERMISSIONS } from "../../../utils/permission";
import type { EditorSettings } from "../../../types/editor-settings";
import {
  getEditorBackgroundStyle,
  getDefaultBackgroundClass,
} from "../../../utils/editorBackground";

interface ChapterListProps {
  width: number;
  volumes: Volume[];
  standaloneChapters: Chapter[];
  currentChapter: Chapter | null;
  dragState: DragState;
  onVolumeToggle: (volumeId: number) => void;
  onChapterClick: (chapter: Chapter) => void;
  onDragStart: (type: "volume" | "chapter", id: number) => void;
  onDragEnd: () => void;
  onDragOver: (
    e: React.DragEvent,
    type: "volume" | "chapter" | "standalone",
    id: number,
    position: "before" | "after"
  ) => void;
  onCreateVolume: () => void;
  onCreateChapter: () => void;
  onAddChapterToVolume: (volumeId: number) => void;
  onDeleteVolume: (volumeId: number) => void;
  onDeleteChapter: (chapterId: number) => void;
  onSmartSort?: (order: "asc" | "desc") => void;
  onOpenMobileSort?: () => void;
  editorSettings?: EditorSettings | null;
  onQuickCreateChapter?: (afterChapter: Chapter) => void;
  onQuickCreateChapterInVolume?: (
    volumeId: number,
    afterLastChapter?: Chapter
  ) => void;
}

/**
 * 章节列表侧边栏 - 支持独立章节和分卷混合排序
 */
export const ChapterList: React.FC<ChapterListProps> = ({
  width,
  volumes,
  standaloneChapters,
  currentChapter,
  dragState,
  onVolumeToggle,
  onChapterClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onCreateVolume,
  onCreateChapter,
  onAddChapterToVolume,
  onDeleteVolume,
  onDeleteChapter,
  onSmartSort,
  onOpenMobileSort,
  editorSettings,
  onQuickCreateChapter,
  onQuickCreateChapterInVolume,
}) => {
  const { hasPermission } = usePermission();
  // 检测是否为移动端（屏幕宽度 < 1024px）
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;
  // 记录最后一次排序的方向（仅用于按钮显示）
  const [lastSortOrder, setLastSortOrder] = React.useState<"asc" | "desc">(
    "desc"
  );

  // 处理排序按钮点击 - 只触发一次排序，不持续影响列表
  const handleSortClick = () => {
    const newOrder = lastSortOrder === "asc" ? "desc" : "asc";
    setLastSortOrder(newOrder);
    onSmartSort?.(newOrder);
  };
  // 统一的拖拽处理 - 根据鼠标位置自动判断 before/after
  // 注意：列表是倒序显示的（globalOrder 大的在上），需要反转 before/after
  const handleDragOver = (
    e: React.DragEvent,
    type: "volume" | "chapter" | "standalone",
    id: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    // 倒序显示时，视觉上的 before 对应逻辑上的 after（需要更大的 globalOrder）
    // 倒序显示时，视觉上的 after 对应逻辑上的 before（需要更小的 globalOrder）
    const visualPosition = e.clientY < midpoint ? "before" : "after";
    const logicalPosition = visualPosition === "before" ? "after" : "before";

    onDragOver(e, type, id, logicalPosition);
  };

  // 创建混合列表：独立章节和分卷按 globalOrder 排序
  type MixedItem =
    | { type: "chapter"; data: Chapter; order: number }
    | { type: "volume"; data: Volume; order: number };

  // 创建混合列表：按照后端返回的 globalOrder 倒序排序
  // 新章节的 globalOrder 数值更大，倒序显示可以让新章节在上面
  const mixedList: MixedItem[] = [
    ...standaloneChapters.map((c) => ({
      type: "chapter" as const,
      data: c,
      order: c.globalOrder ?? 0,
    })),
    ...volumes.map((v) => ({
      type: "volume" as const,
      data: v,
      order: v.globalOrder,
    })),
  ].sort((a, b) => b.order - a.order); // 始终按照 globalOrder 倒序排列（新章节在上）

  return (
    <div
      className={`flex flex-col ${
        width > 0 ? "mx-3 mt-6" : ""
      } mb-0 pb-0 lg:pb-0`}
      style={{
        width: width > 0 ? `${width}px` : "100%",
        height: width > 0 ? "calc(100% - 24px)" : "100%", // 减去mt-6的高度
      }}
    >
      <div
        className={`flex-1 flex flex-col ${getDefaultBackgroundClass(
          editorSettings,
          "bg-white"
        )} border-0 lg:border lg:border-white/50 shadow-none lg:shadow-lg rounded-none lg:rounded-2xl overflow-hidden mb-12 lg:mb-0 min-h-0`}
        style={getEditorBackgroundStyle(editorSettings, "left")}
      >
        {/* 顶部标题和按钮 */}
        <div className="px-3 py-3 border-b border-white/30 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-900">章节</h2>
          <div className="flex items-center space-x-1">
            {/* PC端：智能排序按钮 */}
            {onSmartSort && !isMobile && (
              <button
                onClick={handleSortClick}
                className="p-1.5 hover:bg-white/80 rounded-lg transition-all duration-200"
                title={
                  lastSortOrder === "asc"
                    ? "点击切换为倒序排列"
                    : "点击切换为正序排列"
                }
              >
                <ArrowUpDown
                  className={`w-4 h-4 transition-colors ${
                    lastSortOrder === "asc"
                      ? "text-green-500"
                      : "text-orange-500"
                  }`}
                />
              </button>
            )}
            {/* 移动端：手动排序按钮 */}
            {onOpenMobileSort && isMobile && (
              <button
                onClick={onOpenMobileSort}
                className="p-1.5 hover:bg-white/80 rounded-lg transition-all duration-200"
                title="手动排序"
              >
                <ArrowUpDown className="w-4 h-4 text-blue-500" />
              </button>
            )}
            {hasPermission(PERMISSIONS.NOVEL.CREATE) && (
              <button
                onClick={onCreateVolume}
                className="p-1.5 hover:bg-white/80 rounded-lg transition-all duration-200"
                title="新建分卷"
              >
                <FolderPlus className="w-4 h-4 text-blue-500" />
              </button>
            )}
            {hasPermission(PERMISSIONS.NOVEL.CREATE) && (
              <button
                onClick={onCreateChapter}
                className="p-1.5 hover:bg-white/80 rounded-lg transition-all duration-200"
                title="新建章节"
              >
                <Plus className="w-4 h-4 text-blue-500" />
              </button>
            )}
          </div>
        </div>

        {/* 混合渲染：独立章节和分卷 */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ minHeight: 0, height: 0 }}
        >
          <div className="p-2 space-y-1">
            {mixedList.map((item) =>
              item.type === "chapter" ? (
                // 渲染独立章节
                <div
                  key={`chapter-${item.data.id}`}
                  draggable={!isMobile}
                  onDragStart={() => onDragStart("chapter", item.data.id)}
                  onDragEnd={onDragEnd}
                  onDragOver={(e) =>
                    handleDragOver(e, "standalone", item.data.id)
                  }
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest("button")) {
                      onChapterClick(item.data);
                    }
                  }}
                  className={`flex items-center px-2 py-1.5 rounded ${
                    isMobile
                      ? "cursor-pointer"
                      : "cursor-grab active:cursor-grabbing"
                  } group select-none relative ${
                    currentChapter?.id === item.data.id
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {/* 插入线条指示器（倒序显示时，before显示在下方，after显示在上方）*/}
                  {dragState.dropTarget?.type === "standalone" &&
                    dragState.dropTarget.id === item.data.id &&
                    dragState.dropTarget.position === "before" && (
                      <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-500" />
                    )}
                  {dragState.dropTarget?.type === "standalone" &&
                    dragState.dropTarget.id === item.data.id &&
                    dragState.dropTarget.position === "after" && (
                      <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-500" />
                    )}

                  <GripVertical className="w-3 h-3 text-gray-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity mr-1 pointer-events-none" />
                  <FileText className="w-3 h-3 text-gray-400 mr-1.5 pointer-events-none" />
                  <span className="text-sm text-gray-900 flex-1 truncate pointer-events-none">
                    {item.data.title}
                  </span>
                  <span className="text-xs text-gray-400 mr-1 pointer-events-none">
                    {item.data.wordCount.toLocaleString()}
                  </span>
                  {/* 快速创建按钮 */}
                  {hasPermission(PERMISSIONS.NOVEL.CREATE) &&
                    onQuickCreateChapter && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickCreateChapter(item.data);
                        }}
                        className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-0.5 hover:bg-blue-100 rounded transition-all"
                        title="在此章节后快速创建新章节"
                        draggable="false"
                      >
                        <Plus className="w-3 h-3 text-blue-500" />
                      </button>
                    )}
                  {hasPermission(PERMISSIONS.NOVEL.DELETE) && (
                    <div
                      className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 pointer-events-auto"
                      draggable="false"
                    >
                      <DropdownMenu
                        items={[
                          {
                            label: "删除章节",
                            icon: <Trash2 className="w-4 h-4" />,
                            onClick: () => onDeleteChapter(item.data.id),
                            danger: true,
                          },
                        ]}
                        trigger={
                          <button className="p-0.5 hover:bg-gray-200 rounded">
                            <MoreVertical className="w-3 h-3 text-gray-400" />
                          </button>
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                // 渲染分卷
                <div key={`volume-${item.data.id}`}>
                  {/* 分卷标题行 */}
                  <div
                    draggable={!isMobile}
                    onDragStart={() => onDragStart("volume", item.data.id)}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) =>
                      handleDragOver(e, "volume", item.data.id)
                    }
                    className={`flex items-center px-2 py-1.5 rounded group hover:bg-gray-50 ${
                      isMobile
                        ? "cursor-pointer"
                        : "cursor-grab active:cursor-grabbing"
                    } select-none relative`}
                  >
                    {/* 插入线条指示器（倒序显示时，before显示在下方，after显示在上方）*/}
                    {dragState.dropTarget?.type === "volume" &&
                      dragState.dropTarget.id === item.data.id &&
                      dragState.dropTarget.position === "before" && (
                        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-500" />
                      )}
                    {dragState.dropTarget?.type === "volume" &&
                      dragState.dropTarget.id === item.data.id &&
                      dragState.dropTarget.position === "after" && (
                        <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-500" />
                      )}

                    <GripVertical className="w-3 h-3 text-gray-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity mr-1 pointer-events-none" />
                    <button
                      className="flex items-center flex-1 pointer-events-auto"
                      onClick={() => onVolumeToggle(item.data.id)}
                      draggable="false"
                    >
                      {item.data.isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                      )}
                      <Book className="w-3.5 h-3.5 text-gray-500 mx-1" />
                      <span className="text-sm font-medium text-gray-700">
                        {item.data.name}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {item.data.chapters.length}章
                      </span>
                    </button>
                    {/* 分卷快速创建按钮 */}
                    {hasPermission(PERMISSIONS.NOVEL.CREATE) &&
                      onQuickCreateChapterInVolume && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const lastChapter =
                              item.data.chapters.length > 0
                                ? item.data.chapters[
                                    item.data.chapters.length - 1
                                  ]
                                : undefined;
                            onQuickCreateChapterInVolume(
                              item.data.id,
                              lastChapter
                            );
                          }}
                          className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-0.5 hover:bg-blue-100 rounded transition-all pointer-events-auto"
                          title="在此分卷中快速创建新章节"
                          draggable="false"
                        >
                          <Plus className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                      )}
                    <div
                      className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 pointer-events-auto"
                      draggable="false"
                    >
                      <DropdownMenu
                        items={[
                          ...(hasPermission(PERMISSIONS.NOVEL.CREATE)
                            ? [
                                {
                                  label: "添加章节",
                                  icon: <Plus className="w-4 h-4" />,
                                  onClick: () =>
                                    onAddChapterToVolume(item.data.id),
                                },
                              ]
                            : []),
                          ...(hasPermission(PERMISSIONS.NOVEL.DELETE)
                            ? [
                                {
                                  label: "删除分卷",
                                  icon: <Trash2 className="w-4 h-4" />,
                                  onClick: () => onDeleteVolume(item.data.id),
                                  danger: true,
                                },
                              ]
                            : []),
                        ]}
                        trigger={
                          <button className="p-0.5 hover:bg-gray-200 rounded">
                            <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                        }
                      />
                    </div>
                  </div>

                  {/* 分卷内章节 */}
                  {!item.data.isCollapsed && (
                    <div className="ml-4 mt-0.5">
                      <div className="space-y-0.5">
                        {item.data.chapters.map((chapter) => (
                          <div
                            key={chapter.id}
                            draggable={!isMobile}
                            onDragStart={() =>
                              onDragStart("chapter", chapter.id)
                            }
                            onDragEnd={onDragEnd}
                            onDragOver={(e) =>
                              handleDragOver(e, "chapter", chapter.id)
                            }
                            onClick={(e) => {
                              if (
                                !(e.target as HTMLElement).closest("button")
                              ) {
                                onChapterClick(chapter);
                              }
                            }}
                            className={`flex items-center px-2 py-1.5 rounded ${
                              isMobile
                                ? "cursor-pointer"
                                : "cursor-grab active:cursor-grabbing"
                            } group select-none relative ${
                              currentChapter?.id === chapter.id
                                ? "bg-blue-50 border border-blue-200"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {/* 插入线条指示器（倒序显示时，before显示在下方，after显示在上方）*/}
                            {dragState.dropTarget?.type === "chapter" &&
                              dragState.dropTarget.id === chapter.id &&
                              dragState.dropTarget.position === "before" && (
                                <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-blue-500" />
                              )}
                            {dragState.dropTarget?.type === "chapter" &&
                              dragState.dropTarget.id === chapter.id &&
                              dragState.dropTarget.position === "after" && (
                                <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-blue-500" />
                              )}

                            <GripVertical className="w-3 h-3 text-gray-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity mr-1 pointer-events-none" />
                            <FileText className="w-3 h-3 text-gray-400 mr-1.5 pointer-events-none" />
                            <span className="text-sm text-gray-900 flex-1 truncate pointer-events-none">
                              {chapter.title}
                            </span>
                            <span className="text-xs text-gray-400 mr-1 pointer-events-none">
                              {chapter.wordCount.toLocaleString()}
                            </span>
                            {/* 分卷内章节快速创建按钮 */}
                            {hasPermission(PERMISSIONS.NOVEL.CREATE) &&
                              onQuickCreateChapter && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickCreateChapter(chapter);
                                  }}
                                  className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-0.5 hover:bg-blue-100 rounded transition-all pointer-events-auto"
                                  title="在此章节后快速创建新章节"
                                  draggable="false"
                                >
                                  <Plus className="w-3 h-3 text-blue-500" />
                                </button>
                              )}
                            {hasPermission(PERMISSIONS.NOVEL.DELETE) && (
                              <div
                                className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 pointer-events-auto"
                                draggable="false"
                              >
                                <DropdownMenu
                                  items={[
                                    {
                                      label: "删除章节",
                                      icon: <Trash2 className="w-4 h-4" />,
                                      onClick: () =>
                                        onDeleteChapter(chapter.id),
                                      danger: true,
                                    },
                                  ]}
                                  trigger={
                                    <button className="p-0.5 hover:bg-gray-200 rounded">
                                      <MoreVertical className="w-3 h-3 text-gray-400" />
                                    </button>
                                  }
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* 分卷底部拖拽区域 - 拖到这里成为独立章节（显示在分卷后） */}
                      {dragState.draggedItem?.type === "chapter" && (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onDragOver(e, "volume", item.data.id, "after");
                          }}
                          className={`mt-0.5 h-6 rounded transition-colors ${
                            dragState.dropTarget?.type === "volume" &&
                            dragState.dropTarget.id === item.data.id &&
                            dragState.dropTarget.position === "after"
                              ? "bg-blue-50 border border-dashed border-blue-400"
                              : "hover:bg-gray-50 border border-dashed border-transparent hover:border-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
