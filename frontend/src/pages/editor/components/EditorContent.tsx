import React from "react";
import { FileText } from "lucide-react";
import type { Chapter, Volume } from "./types";
import { TipTapEditor } from "./TipTapEditor";
import type { TipTapEditorRef } from "./TipTapEditor";
import { MobileChapterVolume } from "./MobileChapterVolume";
import { ChapterSummaryEditor } from "./ChapterSummaryEditor";
import type { EditorSettings } from "../../../types/editor-settings";
import {
  getEditorBackgroundStyle,
  getDefaultBackgroundClass,
} from "../../../utils/editorBackground";

export interface EditorContentRef {
  autoFormat: () => void;
  removeFormat: () => void;
  insertText: (text: string) => void;
}

interface EditorContentProps {
  currentChapter: Chapter | null;
  chapterContent: string;
  currentVolume: Volume | null;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onChangeVolume?: () => void;
  onCreateChapter?: () => void;
  onSaveSummary?: (chapterId: number, summary: string) => Promise<void>;
  editorSettings?: EditorSettings | null;
}

/**
 * 编辑器内容区域
 */
export const EditorContent = React.forwardRef<
  EditorContentRef,
  EditorContentProps
>(
  (
    {
      currentChapter,
      chapterContent,
      currentVolume,
      onTitleChange,
      onContentChange,
      onCreateChapter,
      onChangeVolume,
      onSaveSummary,
      editorSettings,
    },
    ref
  ) => {
    const editorRef = React.useRef<TipTapEditorRef>(null);
    const [showSummaryEditor, setShowSummaryEditor] = React.useState(false);

    // 暴露方法给父组件
    React.useImperativeHandle(ref, () => ({
      autoFormat: () => {
        if (editorRef.current) {
          editorRef.current.autoFormat();
        }
      },
      removeFormat: () => {
        if (editorRef.current) {
          editorRef.current.removeFormat();
        }
      },
      insertText: (text: string) => {
        if (editorRef.current) {
          editorRef.current.insertText(text);
        }
      },
    }));

    // TipTap 内容变化处理
    const handleEditorChange = (content: string) => {
      // 创建模拟事件对象
      const fakeEvent = {
        target: { value: content },
      } as React.ChangeEvent<HTMLTextAreaElement>;

      onContentChange(fakeEvent);
    };

    return (
      <main className="flex-1 flex flex-col mx-1.5 mt-6 mb-0 pb-0 lg:pb-0 min-h-0">
        <div
          className={`flex-1 flex flex-col ${getDefaultBackgroundClass(
            editorSettings,
            "bg-white"
          )} border border-white/50 shadow-lg rounded-2xl overflow-hidden mb-12 lg:mb-0 min-h-0`}
          style={getEditorBackgroundStyle(editorSettings, "center")}
        >
          {/* 无章节时的提示 */}
          {!currentChapter && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md px-6">
                <div className="w-20 h-20 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    暂无章节
                  </h3>
                  <p className="text-sm text-gray-500">
                    请先在左侧章节列表中创建分卷或章节，开始您的创作之旅
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={onCreateChapter}
                    className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/30"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    创建章节
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 有章节时的编辑器 */}
          {currentChapter && (
            <>
              {/* 章节名 */}
              <div className="px-6 pt-3 border-b border-white/30 relative">
                <div className="flex items-center gap-2">
                  {/* 梗概按钮 */}
                  <button
                    onClick={() => setShowSummaryEditor(!showSummaryEditor)}
                    className={`flex-shrink-0 p-2 rounded-xl transition-all hover:scale-110 ${
                      showSummaryEditor
                        ? "bg-blue-100 text-blue-600"
                        : currentChapter.summary
                        ? "bg-blue-50 text-blue-500 hover:bg-blue-100"
                        : "bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                    }`}
                    title={
                      currentChapter.summary ? "编辑章节梗概" : "添加章节梗概"
                    }
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  {/* 章节标题输入框 */}
                  <input
                    type="text"
                    value={currentChapter.title}
                    onChange={onTitleChange}
                    onBlur={onTitleChange as any}
                    className="flex-1 text-xl font-bold text-gray-900 focus:outline-none border-b-2 border-transparent focus:border-blue-500 bg-transparent"
                    placeholder="章节标题"
                  />
                </div>

                {/* 梗概编辑器悬浮窗 */}
                {onSaveSummary && (
                  <ChapterSummaryEditor
                    isOpen={showSummaryEditor}
                    onClose={() => setShowSummaryEditor(false)}
                    chapterId={currentChapter.id}
                    chapterTitle={currentChapter.title}
                    initialSummary={currentChapter.summary || ""}
                    onSave={async (newSummary) => {
                      await onSaveSummary(currentChapter.id, newSummary);
                      // 更新当前章节的 summary（父组件会处理）
                    }}
                  />
                )}
              </div>

              {/* 移动端：显示当前章节所属分卷（在标题下方，紧挨标题）*/}
              {onChangeVolume && (
                <MobileChapterVolume
                  currentVolume={currentVolume}
                  onClick={onChangeVolume}
                />
              )}

              {/* TipTap 富文本编辑器 */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <TipTapEditor
                  key={currentChapter.id} // 添加 key，切换章节时强制重新渲染
                  ref={editorRef}
                  content={chapterContent}
                  onChange={handleEditorChange}
                  editable={true}
                  editorSettings={editorSettings}
                />
              </div>
            </>
          )}
        </div>
      </main>
    );
  }
);
