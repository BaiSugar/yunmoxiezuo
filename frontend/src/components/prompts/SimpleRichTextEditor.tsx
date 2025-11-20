import React, { useRef } from "react";
import {
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  Link,
} from "lucide-react";

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * 简单的富文本编辑器组件
 * 支持基本的Markdown格式
 */
const SimpleRichTextEditor: React.FC<SimpleRichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "输入内容...",
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // 插入格式
  const insertFormat = (before: string, after: string = "") => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || "文本";
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // 恢复焦点和选区
    setTimeout(() => {
      textarea.focus();
      const newCursorPos =
        start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 插入标题
  const insertHeading = (level: number) => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const prefix = "#".repeat(level) + " ";

    const newText =
      value.substring(0, lineStart) + prefix + value.substring(lineStart);
    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        lineStart + prefix.length,
        lineStart + prefix.length
      );
    }, 0);
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* 工具栏 */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => insertHeading(1)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="一级标题"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertHeading(2)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="二级标题"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertHeading(3)}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="三级标题"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => insertFormat("**", "**")}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="粗体"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormat("*", "*")}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="斜体"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => insertFormat("`", "`")}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="代码"
        >
          <Code className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            const textarea = editorRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selectedText = value.substring(start, end) || "链接文本";

            // 如果有选中的文本，使用它作为链接文本，否则使用默认文本
            const linkText =
              selectedText !== "链接文本" ? selectedText : "链接文本";
            const url = "https://example.com";

            // 插入链接格式：[文本](URL)
            const newText =
              value.substring(0, start) +
              `[${linkText}](${url})` +
              value.substring(end);

            onChange(newText);

            setTimeout(() => {
              textarea.focus();
              // 将光标定位到 URL 部分，方便用户直接修改
              const cursorPos = start + linkText.length + 3; // [文本](
              const urlEndPos = cursorPos + url.length;
              textarea.setSelectionRange(cursorPos, urlEndPos);
            }, 0);
          }}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="插入链接"
        >
          <Link className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => insertFormat("\n- ")}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="列表"
        >
          <List className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => {
            const textarea = editorRef.current;
            if (!textarea) return;

            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newText =
              value.substring(0, start) + "{{}}" + value.substring(end);

            onChange(newText);

            setTimeout(() => {
              textarea.focus();
              const cursorPos = start + 2;
              textarea.setSelectionRange(cursorPos, cursorPos);
            }, 0);
          }}
          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs 
                     font-mono rounded transition-colors"
          title="插入参数占位符"
        >
          {"{{}}"}
        </button>
      </div>

      {/* 编辑区 */}
      <textarea
        ref={editorRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 focus:outline-none resize-none font-mono text-sm"
        rows={15}
      />

      {/* 提示 */}
      <div className="bg-gray-50 border-t border-gray-300 px-3 py-2">
        <p className="text-xs text-gray-500">
          💡 支持 Markdown 格式：**粗体** *斜体* `代码` # 标题 [链接](URL)
        </p>
      </div>
    </div>
  );
};

export default SimpleRichTextEditor;
