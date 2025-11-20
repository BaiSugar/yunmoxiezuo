import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { User, Globe, FileText } from "lucide-react";
import type {
  Character,
  WorldSetting,
  Memo,
} from "../../../../types/character";
import {
  ChapterSelectionModal,
  type SelectedChapter,
} from "./ChapterSelectionModal";
import { CharacterSelectionModal } from "./CharacterSelectionModal";
import { WorldSettingSelectionModal } from "./WorldSettingSelectionModal";
import { MemoSelectionModal } from "./MemoSelectionModal";

// 使用与ChatTab一致的Chapter类型
interface Chapter {
  id: number;
  title: string;
  wordCount?: number;
  summary?: string;
  volumeId: number | null;
}

interface Volume {
  id: number;
  name: string;
  chapters: Chapter[];
}

interface ParameterInputProps {
  paramName: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  description?: string;
  // 可用的数据
  characters?: Character[];
  worldSettings?: WorldSetting[];
  memos?: Memo[];
  chapters?: Chapter[];
  volumes?: Volume[];
}

/**
 * 支持@功能的参数输入框
 */
export const ParameterInput: React.FC<ParameterInputProps> = ({
  paramName,
  value,
  onChange,
  placeholder,
  required,
  description,
  characters = [],
  worldSettings = [],
  memos = [],
  chapters = [],
  volumes = [],
}) => {
  const [showAtMenu, setShowAtMenu] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [showWorldModal, setShowWorldModal] = useState(false);
  const [showMemoModal, setShowMemoModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [textareaHeight, setTextareaHeight] = useState("auto");

  // 从value中解析出已选择的章节（用于ChapterSelectionModal）
  const getSelectedChaptersFromValue = (): SelectedChapter[] => {
    const regex = /\{\{@::章节::(\d+)::(full|summary)\}\}/g;
    const matches = Array.from(value.matchAll(regex));
    return matches.map((m) => ({
      id: parseInt(m[1], 10),
      title: chapters.find((c) => c.id === parseInt(m[1], 10))?.title || "",
      useSummary: m[2] === "summary",
    }));
  };

  // 解析@引用标记并返回高亮片段
  const parseReferences = (text: string) => {
    // 如果没有内容，返回空数组（让 placeholder 显示）
    if (!text || text.trim() === "") {
      return [];
    }

    // 只匹配新格式: {{@::类型::ID}} 或 {{@::章节::ID::type}}
    const newFormatRegex =
      /\{\{@::(人物卡|世界观|备忘录|章节)::(\d+)(?:::(full|summary))?\}\}/g;

    const parts: Array<{
      text: string;
      isRef: boolean;
      type?: string;
    }> = [];

    // 收集所有匹配及其位置
    const allMatches: Array<{
      index: number;
      length: number;
      text: string;
      type?: string;
    }> = [];

    // 收集新格式引用
    let match;
    while ((match = newFormatRegex.exec(text)) !== null) {
      const [, type, idStr, chapterType] = match;
      const id = parseInt(idStr, 10);
      let displayText = "";

      if (type === "章节") {
        const chapter = chapters.find((c) => c.id === id);
        displayText = chapter
          ? `章节(${chapter.title})[${
              chapterType === "summary" ? "梗概" : "全文"
            }]`
          : `章节#${id}`;
      } else if (type === "人物卡") {
        const character = characters.find((c) => c.id === id);
        displayText = character ? `人物卡(${character.name})` : `人物卡#${id}`;
      } else if (type === "世界观") {
        const worldSetting = worldSettings.find((w) => w.id === id);
        displayText = worldSetting
          ? `世界观(${worldSetting.name})`
          : `世界观#${id}`;
      } else if (type === "备忘录") {
        const memo = memos.find((m) => m.id === id);
        displayText = memo ? `备忘录(${memo.title})` : `备忘录#${id}`;
      }

      allMatches.push({
        index: match.index,
        length: match[0].length,
        text: displayText,
        type,
      });
    }

    // 如果没有匹配到任何引用，直接返回整个文本作为普通文本
    if (allMatches.length === 0) {
      return [{ text, isRef: false }];
    }

    // 按位置排序
    allMatches.sort((a, b) => a.index - b.index);

    // 构建parts
    let lastIndex = 0;
    for (const m of allMatches) {
      // 添加引用前的普通文本
      if (m.index > lastIndex) {
        parts.push({
          text: text.substring(lastIndex, m.index),
          isRef: false,
        });
      }
      // 添加引用
      parts.push({
        text: m.text,
        isRef: true,
        type: m.type,
      });
      lastIndex = m.index + m.length;
    }

    // 添加剩余的普通文本
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), isRef: false });
    }

    return parts;
  };

  // 初始化和更新textarea高度
  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [value]);

  // 计算菜单位置
  useEffect(() => {
    const updatePosition = () => {
      if (textareaRef.current) {
        const rect = textareaRef.current.getBoundingClientRect();
        setMenuPosition({
          top: rect.top - 8, // 在输入框上方，留8px间距
          left: rect.left,
        });
      }
    };

    if (showAtMenu) {
      updatePosition();

      // 监听滚动和窗口大小变化
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);

      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [showAtMenu]);

  // 检查光标是否在引用标记内部
  const isInsideReference = (
    text: string,
    cursorPos: number
  ): { inside: boolean; refStart?: number; refEnd?: number } => {
    // 匹配新格式引用
    const newFormatRegex =
      /\{\{@::(人物卡|世界观|备忘录|章节)::(\d+)(?:::(full|summary))?\}\}/g;
    // 匹配旧格式引用
    const oldFormatRegex = /@(人物卡|世界观|备忘录|章节|章节梗概):([^\s@\n]+)/g;

    let match;

    // 检查新格式
    while ((match = newFormatRegex.exec(text)) !== null) {
      const refStart = match.index;
      const refEnd = match.index + match[0].length;
      if (cursorPos > refStart && cursorPos < refEnd) {
        return { inside: true, refStart, refEnd };
      }
    }

    // 检查旧格式
    while ((match = oldFormatRegex.exec(text)) !== null) {
      const refStart = match.index;
      const refEnd = match.index + match[0].length;
      if (cursorPos > refStart && cursorPos < refEnd) {
        return { inside: true, refStart, refEnd };
      }
    }

    return { inside: false };
  };

  // 自动调整textarea高度
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    // 重置高度以获取正确的scrollHeight
    textarea.style.height = "auto";
    // 设置新高度（最小两行48px，最大8行约240px）
    const newHeight = Math.max(Math.min(textarea.scrollHeight, 240), 48);
    setTextareaHeight(`${newHeight}px`);
  };

  // 处理输入变化 - 检测 @
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;

    onChange(newValue);
    setCursorPosition(newCursorPos);
    
    // 调整高度
    adjustTextareaHeight(e.target);

    // 检测是否刚输入了 @
    if (newValue[newCursorPos - 1] === "@" && newValue.length > value.length) {
      setShowAtMenu(true);
    } else if (showAtMenu) {
      // 如果已经显示菜单，检查是否删除了@
      const textBeforeCursor = newValue.substring(0, newCursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      // 如果光标前没有@或者@后面已经有内容了，关闭菜单
      if (lastAtIndex === -1 || newCursorPos - lastAtIndex > 1) {
        setShowAtMenu(false);
      } else {
        // 更新位置
        const rect = textareaRef.current?.getBoundingClientRect();
        if (rect) {
          setMenuPosition({
            top: rect.top - 8,
            left: rect.left,
          });
        }
      }
    }
  };

  // 处理光标移动 - 防止光标进入引用内部
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const cursorPos = target.selectionStart;
    const checkResult = isInsideReference(value, cursorPos);

    if (
      checkResult.inside &&
      checkResult.refStart !== undefined &&
      checkResult.refEnd !== undefined
    ) {
      // 光标在引用内部，需要移动到引用边界
      // 判断光标靠近哪一端
      const distanceToStart = cursorPos - checkResult.refStart;
      const distanceToEnd = checkResult.refEnd - cursorPos;

      const newPos =
        distanceToStart < distanceToEnd
          ? checkResult.refStart
          : checkResult.refEnd;

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newPos, newPos);
          setCursorPosition(newPos);
        }
      }, 0);
    } else {
      setCursorPosition(cursorPos);
    }
  };

  // 处理键盘事件 - 支持整体删除@引用和箭头键跳过
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const cursorPos = textareaRef.current?.selectionStart || 0;

    if (e.key === "Backspace") {
      const textBeforeCursor = value.substring(0, cursorPos);

      // 检查光标前是否紧跟着引用（只支持新格式）
      const newFormatRegex =
        /\{\{@::(人物卡|世界观|备忘录|章节)::(\d+)(?:::(full|summary))?\}\}$/;
      const match = textBeforeCursor.match(newFormatRegex);

      if (match) {
        // 找到了完整的引用，删除整个引用
        e.preventDefault();
        const newValue =
          value.substring(0, cursorPos - match[0].length) +
          value.substring(cursorPos);
        onChange(newValue);

        // 更新光标位置
        setTimeout(() => {
          if (textareaRef.current) {
            const newPos = cursorPos - match[0].length;
            textareaRef.current.setSelectionRange(newPos, newPos);
          }
        }, 0);
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      // 处理左右箭头键，避免光标进入引用内部
      const checkResult = isInsideReference(value, cursorPos);

      if (
        checkResult.inside &&
        checkResult.refStart !== undefined &&
        checkResult.refEnd !== undefined
      ) {
        e.preventDefault();
        // 如果按左箭头，跳到引用开始；如果按右箭头，跳到引用结束
        const newPos =
          e.key === "ArrowLeft" ? checkResult.refStart : checkResult.refEnd;

        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.setSelectionRange(newPos, newPos);
            setCursorPosition(newPos);
          }
        }, 0);
      }
    }
  };

  // 选择@类型
  const handleSelectMentionType = (
    type: "character" | "world" | "memo" | "chapter"
  ) => {
    // 移除最后一个 @
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      onChange(
        value.substring(0, lastAtIndex) + value.substring(lastAtIndex + 1)
      );
      // 更新光标位置
      setCursorPosition(lastAtIndex);
    }

    setShowAtMenu(false);

    // 打开对应的模态窗
    if (type === "character") {
      setShowCharacterModal(true);
    } else if (type === "world") {
      setShowWorldModal(true);
    } else if (type === "memo") {
      setShowMemoModal(true);
    } else if (type === "chapter") {
      setShowChapterModal(true);
    }
  };

  // 处理人物卡选择确认（支持多选）
  const handleCharacterConfirm = (selectedIds: number[]) => {
    if (selectedIds.length === 0) return;

    // 先过滤确保引用的人物卡存在，再构建引用文本
    const insertTexts = selectedIds
      .filter((id) => characters.some((c) => c.id === id))
      .map((id) => `{{@::人物卡::${id}}}`);

    if (insertTexts.length === 0) return;

    const insertText = insertTexts.join(" ");
    const newValue =
      value.substring(0, cursorPosition) +
      insertText +
      value.substring(cursorPosition);
    onChange(newValue);

    // 聚焦回输入框并更新光标位置
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = cursorPosition + insertText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 100);
  };

  // 处理世界观选择确认（支持多选）
  const handleWorldConfirm = (selectedIds: number[]) => {
    if (selectedIds.length === 0) return;

    // 先过滤确保引用的世界观存在，再构建引用文本
    const insertTexts = selectedIds
      .filter((id) => worldSettings.some((w) => w.id === id))
      .map((id) => `{{@::世界观::${id}}}`);

    if (insertTexts.length === 0) return;

    const insertText = insertTexts.join(" ");
    const newValue =
      value.substring(0, cursorPosition) +
      insertText +
      value.substring(cursorPosition);
    onChange(newValue);

    // 聚焦回输入框并更新光标位置
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = cursorPosition + insertText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 100);
  };

  // 处理备忘录选择确认（支持多选）
  const handleMemoConfirm = (selectedIds: number[]) => {
    if (selectedIds.length === 0) return;

    // 先过滤确保引用的备忘录存在，再构建引用文本
    const insertTexts = selectedIds
      .filter((id) => memos.some((m) => m.id === id))
      .map((id) => `{{@::备忘录::${id}}}`);

    if (insertTexts.length === 0) return;

    const insertText = insertTexts.join(" ");
    const newValue =
      value.substring(0, cursorPosition) +
      insertText +
      value.substring(cursorPosition);
    onChange(newValue);

    // 聚焦回输入框并更新光标位置
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = cursorPosition + insertText.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        setCursorPosition(newCursorPos);
      }
    }, 100);
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs text-gray-700 font-medium flex items-center gap-1.5 mb-1.5">
        {paramName}
        {required && <span className="text-red-500 font-bold">*</span>}
        {description && (
          <span className="text-gray-400 font-normal">· {description}</span>
        )}
      </label>

      <div className="relative">
        {/* 高亮显示层 - 显示带颜色的@引用（在输入框上方） */}
        {value && value.trim() !== "" && (
          <div
            className="absolute inset-0 px-3 py-2 text-sm pointer-events-none overflow-hidden rounded-lg whitespace-pre-wrap break-words z-20"
            style={{
              backgroundColor: "transparent",
              lineHeight: "1.5rem",
              wordBreak: "break-word",
            }}
          >
            {parseReferences(value).map((part, idx) => {
              // 如果是普通文本且只包含空格，显示为不可折叠的空格
              if (
                !part.isRef &&
                part.text.trim() === "" &&
                part.text.length > 0
              ) {
                return (
                  <span
                    key={idx}
                    className="text-gray-900"
                    style={{
                      color: "#111827",
                      whiteSpace: "pre",
                    }}
                  >
                    {part.text}
                  </span>
                );
              }

              return (
                <span
                  key={idx}
                  className={
                    part.isRef
                      ? "inline-block align-baseline bg-blue-500 text-white px-2 py-0.5 rounded-md font-medium text-xs"
                      : "text-gray-900"
                  }
                  style={{
                    color: part.isRef ? "white" : "#111827",
                    verticalAlign: "baseline",
                  }}
                >
                  {part.text}
                </span>
              );
            })}
          </div>
        )}

        {/* 实际的输入框 - 文字透明但光标可见 */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onClick={handleSelect}
          placeholder={
            placeholder || `请输入${paramName}，使用@可以关联人物卡、世界观等`
          }
          style={{
            color: "transparent",
            caretColor: "black",
            lineHeight: "1.5rem",
            wordBreak: "break-word",
            height: textareaHeight,
            minHeight: "48px",
            maxHeight: "240px",
            overflowY: "auto",
          }}
          className="relative w-full px-3 py-2 text-sm bg-white border-2 border-gray-200/60 rounded-lg 
                   focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 
                   resize-none transition-all shadow-sm placeholder:text-gray-400
                   selection:bg-blue-200/50 z-10 whitespace-pre-wrap break-words"
        />

        {/* @ 菜单浮窗 - 使用 Portal 渲染到 body */}
        {showAtMenu &&
          createPortal(
            <>
              {/* 背景遮罩 */}
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => setShowAtMenu(false)}
              />

              {/* 菜单 - 使用 fixed 定位 */}
              <div
                className="fixed z-[9999] bg-white rounded-xl shadow-2xl border-2 border-blue-200 py-2 min-w-[160px] animate-in fade-in zoom-in-95 duration-150"
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                  transform: "translateY(-100%)",
                  marginBottom: "8px",
                }}
              >
                <div className="px-3 pb-2 border-b border-gray-100">
                  <div className="text-xs font-semibold text-gray-600">
                    选择关联类型
                  </div>
                </div>
                {characters.length > 0 && (
                  <button
                    onClick={() => handleSelectMentionType("character")}
                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors flex items-center gap-2.5"
                  >
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <span className="font-medium text-gray-700">人物卡</span>
                  </button>
                )}
                {worldSettings.length > 0 && (
                  <button
                    onClick={() => handleSelectMentionType("world")}
                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-indigo-50 transition-colors flex items-center gap-2.5"
                  >
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <span className="font-medium text-gray-700">世界观</span>
                  </button>
                )}
                {memos.length > 0 && (
                  <button
                    onClick={() => handleSelectMentionType("memo")}
                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-purple-50 transition-colors flex items-center gap-2.5"
                  >
                    <div className="p-1.5 bg-purple-100 rounded-lg text-base">
                      📝
                    </div>
                    <span className="font-medium text-gray-700">备忘录</span>
                  </button>
                )}
                {chapters.length > 0 && (
                  <button
                    onClick={() => handleSelectMentionType("chapter")}
                    className="w-full px-3 py-2.5 text-sm text-left hover:bg-green-50 transition-colors flex items-center gap-2.5"
                  >
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <FileText className="w-3.5 h-3.5 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700">章节</span>
                  </button>
                )}
              </div>
            </>,
            document.body
          )}
      </div>

      {/* 人物卡选择模态窗 */}
      <CharacterSelectionModal
        isOpen={showCharacterModal}
        onClose={() => setShowCharacterModal(false)}
        characters={characters}
        selectedIds={[]}
        onConfirm={handleCharacterConfirm}
        title="选择人物卡"
        allowMultiple={true}
      />

      {/* 世界观选择模态窗 */}
      <WorldSettingSelectionModal
        isOpen={showWorldModal}
        onClose={() => setShowWorldModal(false)}
        worldSettings={worldSettings}
        selectedIds={[]}
        onConfirm={handleWorldConfirm}
        title="选择世界观"
        allowMultiple={true}
      />

      {/* 备忘录选择模态窗 */}
      <MemoSelectionModal
        isOpen={showMemoModal}
        onClose={() => setShowMemoModal(false)}
        memos={memos}
        selectedIds={[]}
        onConfirm={handleMemoConfirm}
        title="选择备忘录"
        allowMultiple={true}
      />

      {/* 章节选择模态框 */}
      <ChapterSelectionModal
        isOpen={showChapterModal}
        onClose={() => setShowChapterModal(false)}
        chapters={chapters}
        volumes={volumes}
        selectedChapters={getSelectedChaptersFromValue()}
        onConfirm={(selectedChapters) => {
          // 构建所有章节的引用文本
          const insertTexts = selectedChapters.map((chapter) => {
            const chapterType = chapter.useSummary ? "summary" : "full";
            return `{{@::章节::${chapter.id}::${chapterType}}}`;
          });

          // 用空格连接多个章节引用
          const insertText = insertTexts.join(" ");

          // 插入到光标位置
          const newValue =
            value.substring(0, cursorPosition) +
            insertText +
            value.substring(cursorPosition);
          onChange(newValue);

          setShowChapterModal(false);

          // 聚焦回输入框并更新光标位置
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
              const newCursorPos = cursorPosition + insertText.length;
              textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
              setCursorPosition(newCursorPos);
            }
          }, 100);
        }}
      />
    </div>
  );
};
