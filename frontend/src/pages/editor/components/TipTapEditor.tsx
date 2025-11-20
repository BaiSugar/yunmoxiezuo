import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Wand2, ArrowDown, ArrowUp } from "lucide-react";
import { autoFormat, removeFormat } from "../../../utils/textFormatter";
import { useToast } from "../../../contexts/ToastContext";
import type { EditorSettings } from "../../../types/editor-settings";

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  editorSettings?: EditorSettings | null;
}

export interface TipTapEditorRef {
  autoFormat: () => void;
  removeFormat: () => void;
  insertText: (text: string) => void;
}

export const TipTapEditor = React.forwardRef<
  TipTapEditorRef,
  TipTapEditorProps
>(({ content, onChange, editable = true, editorSettings }, ref) => {
  // 处理内容格式：如果是纯文本，转换为HTML
  const processContent = React.useCallback((rawContent: string): string => {
    if (!rawContent || rawContent.trim() === "") {
      return "<p></p>";
    }

    // 如果已经是HTML格式，直接返回
    if (
      rawContent.includes("<p>") ||
      rawContent.includes("<div>") ||
      rawContent.includes("<br>")
    ) {
      return rawContent;
    }

    // 否则，将纯文本转换为段落HTML（保留换行）
    const paragraphs = rawContent
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p);
    if (paragraphs.length === 0) {
      return "<p></p>";
    }
    return paragraphs.map((p) => `<p>${p}</p>`).join("");
  }, []);

  const lastContentRef = React.useRef<string>("");
  const editorContentRef = React.useRef<HTMLDivElement>(null);
  const lastScrollTop = React.useRef<number>(0);
  const [showScrollButton, setShowScrollButton] = React.useState(false);
  const [scrollingDown, setScrollingDown] = React.useState(false);
  const { success, info } = useToast();

  // 根据背景颜色获取文字颜色（自动判断深色/浅色）
  const getEditorColors = React.useCallback(() => {
    // 如果有自定义背景颜色，根据亮度自动判断文字颜色
    if (editorSettings?.backgroundColor) {
      // 简单的亮度判断：将颜色转换为灰度值
      const hex = editorSettings.backgroundColor.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;

      // 亮度>128使用深色文字，否则使用浅色文字
      return {
        textColor: brightness > 128 ? "#111827" : "#f3f4f6",
        backgroundColor: editorSettings.backgroundColor,
      };
    }

    // 没有背景颜色，使用默认白底黑字
    return {
      textColor: "#111827",
      backgroundColor: "#ffffff",
    };
  }, [editorSettings?.backgroundColor]);

  const editorColors = getEditorColors();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
    ],
    content: content || "<p></p>",
    editable,
    onUpdate: ({ editor }) => {
      // 获取HTML内容并清理 editor-paragraph 类
      let html = editor.getHTML();
      // 移除 TipTap 自动添加的 editor-paragraph 类
      html = html.replace(/ class="editor-paragraph"/g, "");
      // 只在内容真正变化时才触发onChange，避免循环
      if (html !== lastContentRef.current) {
        lastContentRef.current = html;
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none w-full px-6 py-4 editor-content",
        style: `font-size: ${editorSettings?.fontSize || 16}px; line-height: ${
          editorSettings?.lineHeight || 1.8
        }; font-family: ${
          editorSettings?.fontFamily || "system-ui, -apple-system, sans-serif"
        }; color: ${editorColors.textColor}; background-color: ${
          editorColors.backgroundColor
        }; white-space: pre-wrap;`,
      },
    },
  });

  // 初始化和监听外部content变化（切换章节时）
  React.useEffect(() => {
    if (editor && content !== lastContentRef.current) {
      const processed = processContent(content);
      const currentHtml = editor.getHTML();
      // 只在内容真正不同时才更新
      if (processed !== currentHtml) {
        lastContentRef.current = processed;
        editor.commands.setContent(processed);
      }
    }
  }, [content, editor, processContent]);

  // 监听编辑器设置变化，动态更新编辑器样式
  React.useEffect(() => {
    if (!editor) return;

    const editorElement = editor.view.dom;
    if (!editorElement) return;

    // 构建基础样式
    let newStyle = `font-size: ${
      editorSettings?.fontSize || 16
    }px; line-height: ${editorSettings?.lineHeight || 1.8}; font-family: ${
      editorSettings?.fontFamily || "system-ui, -apple-system, sans-serif"
    }; color: ${editorColors.textColor}; white-space: pre-wrap;`;

    // 背景图优先，否则使用背景颜色
    if (editorSettings?.backgroundImage) {
      newStyle += ` background-image: url(/uploads/${editorSettings.backgroundImage}); background-size: cover; background-position: center; background-attachment: fixed;`;
    } else {
      newStyle += ` background-color: ${editorColors.backgroundColor};`;
    }

    editorElement.setAttribute("style", newStyle);
  }, [editor, editorSettings, editorColors]);

  // 滚动监听（仅移动端）
  React.useEffect(() => {
    const editorContent = editorContentRef.current;
    if (!editorContent) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = editorContent;
      const isContentLong = scrollHeight > clientHeight * 1.5; // 内容超过1.5屏才显示
      const nearTop = scrollTop < 100; // 接近顶部（100px内）

      // 检测滚动方向
      const isScrollingDown = scrollTop > lastScrollTop.current;
      lastScrollTop.current = scrollTop;

      // 内容太短或在顶部附近，隐藏按钮
      if (!isContentLong || nearTop) {
        setShowScrollButton(false);
      } else {
        setShowScrollButton(true);
        setScrollingDown(isScrollingDown);
      }
    };

    editorContent.addEventListener("scroll", handleScroll);
    // 初始检查
    handleScroll();

    return () => editorContent.removeEventListener("scroll", handleScroll);
  }, []);

  // 滚动到顶部/底部
  const handleScrollTo = () => {
    const editorContent = editorContentRef.current;
    if (!editorContent) return;

    // 向下滑动时显示到底部按钮，点击到底部
    // 向上滑动时显示到顶部按钮，点击到顶部
    editorContent.scrollTo({
      top: scrollingDown ? editorContent.scrollHeight : 0,
      behavior: "smooth",
    });
  };

  // 自动排版
  const handleAutoFormat = () => {
    if (!editor) return;

    // 从HTML中提取段落文本
    const html = editor.getHTML();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // 获取所有段落
    const paragraphs = Array.from(tempDiv.querySelectorAll("p")).map(
      (p) => p.textContent || ""
    );

    // 合并所有段落为一个文本，保留换行
    const fullText = paragraphs.join("\n");

    // 应用格式化
    const formatted = autoFormat(fullText);

    // 检测格式化前后是否有变化
    if (fullText === formatted) {
      // 格式已经正确，无需再次排版
      info("格式已规范", "内容格式已经符合规范，无需重复排版");
      return;
    }

    // 从编辑器设置中获取段首缩进和段间空行配置
    const indentCount = editorSettings?.paragraphIndent ?? 2;
    const spacingCount = editorSettings?.paragraphSpacing ?? 1;

    // 生成段首缩进字符串（全角空格）
    const indent = "　".repeat(indentCount);

    // 转换回段落HTML，添加缩进和段间空行
    const formattedParagraphs = formatted.split("\n");
    const newHtml = formattedParagraphs
      .map((p, index) => {
        const trimmed = p.trim();
        if (!trimmed) {
          // 空行保持为空段落（TipTap会自动添加br）
          return "<p></p>";
        }
        // 为每个段落添加首行缩进
        const paragraphHtml = `<p>${indent}${trimmed}</p>`;

        // 添加段间空行（除了最后一个段落）
        if (index < formattedParagraphs.length - 1 && spacingCount > 0) {
          const emptyParagraphs = "<p></p>".repeat(spacingCount);
          return paragraphHtml + emptyParagraphs;
        }

        return paragraphHtml;
      })
      .join("");

    editor.commands.setContent(newHtml || "<p></p>");

    // 提示用户排版完成
    success(
      "自动排版完成",
      `已应用标点规范、自动换行、${indentCount}字符首行缩进和段间空行`
    );
  };

  // 移除格式
  const handleRemoveFormat = () => {
    if (!editor) return;

    // 从HTML中提取段落文本（移除所有格式）
    const html = editor.getHTML();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // 获取所有段落的纯文本
    const paragraphs = Array.from(tempDiv.querySelectorAll("p")).map(
      (p) => p.textContent || ""
    );
    const fullText = paragraphs.join("\n");

    // 清理格式
    const cleaned = removeFormat(fullText);

    // 转换为简单段落HTML（不带缩进）
    const cleanedParagraphs = cleaned.split("\n").filter((p) => p.trim());
    const newHtml = cleanedParagraphs.map((p) => `<p>${p}</p>`).join("");

    editor.commands.setContent(newHtml || "<p></p>");
  };

  // 插入或替换文本（支持Markdown基础格式转换）
  const handleInsertText = React.useCallback(
    (text: string) => {
      if (!editor) return;

      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;

      // 简单的Markdown到HTML转换 - 确保所有内容都被保留
      const convertMarkdownToHtml = (mdText: string): string => {
        if (!mdText || mdText.length === 0) {
          return "<p></p>";
        }

        // 处理内联格式（粗体、斜体、代码）
        const processInlineFormats = (text: string): string => {
          let result = text;
          // `代码` - 先处理，避免代码中的星号被误处理
          result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
          // **粗体** - 必须先于单星号处理
          result = result.replace(/\*\*([^*]+)\*\*/g, "___BOLD___$1___BOLD___");
          // *斜体*
          result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");
          // 恢复粗体标记
          result = result.replace(
            /___BOLD___([^_]+)___BOLD___/g,
            "<strong>$1</strong>"
          );
          return result;
        };

        // 按段落分隔（双换行或更多）分割
        const paragraphs = mdText.split(/\n\s*\n+/);
        const blocks: string[] = [];

        paragraphs.forEach((para) => {
          const trimmed = para.trim();
          if (!trimmed) {
            // 空段落：保留为换行（通过空段落）
            blocks.push("<p><br></p>");
            return;
          }

          const lines = trimmed.split("\n");
          const nonEmptyLines = lines.filter((line) => line.trim());

          if (nonEmptyLines.length === 0) {
            blocks.push("<p><br></p>");
            return;
          }

          // 检查是否是列表（无序或有序）
          const isUnorderedList =
            nonEmptyLines.length >= 1 &&
            nonEmptyLines.every((line) => /^\s*[-*]\s/.test(line));
          const isOrderedList =
            nonEmptyLines.length >= 1 &&
            nonEmptyLines.every((line) => /^\s*\d+\.\s/.test(line));

          if (isUnorderedList) {
            // 无序列表
            const items = nonEmptyLines
              .map((line) => {
                const content = processInlineFormats(
                  line.replace(/^\s*[-*]\s/, "").trim()
                );
                return content ? `<li>${content}</li>` : "";
              })
              .filter(Boolean)
              .join("");
            if (items) {
              blocks.push(`<ul>${items}</ul>`);
            }
          } else if (isOrderedList) {
            // 有序列表
            const items = nonEmptyLines
              .map((line) => {
                const content = processInlineFormats(
                  line.replace(/^\s*\d+\.\s/, "").trim()
                );
                return content ? `<li>${content}</li>` : "";
              })
              .filter(Boolean)
              .join("");
            if (items) {
              blocks.push(`<ol>${items}</ol>`);
            }
          } else {
            // 普通段落处理
            // 检查是否是标题（仅检查第一行）
            const firstLine = trimmed.split("\n")[0].trim();
            const headingMatch = firstLine.match(/^(#{1,3})\s+(.+)$/);

            if (headingMatch && nonEmptyLines.length === 1) {
              // 单行标题
              const level = headingMatch[1].length;
              const content = processInlineFormats(headingMatch[2]);
              blocks.push(`<h${level}>${content}</h${level}>`);
            } else {
              // 处理普通段落：每行作为一个段落（保留所有内容）
              nonEmptyLines.forEach((line) => {
                const processed = processInlineFormats(line.trim());
                if (processed) {
                  blocks.push(`<p>${processed}</p>`);
                }
              });
            }
          }
        });

        const result = blocks.join("");
        // 确保至少有一个段落（即使是空的）
        return result || `<p>${processInlineFormats(mdText.trim())}</p>`;
      };

      // 添加调试日志（开发环境）
      if (import.meta.env.DEV) {
        console.log("插入文本 - 原始长度:", text.length);
        const htmlContent = convertMarkdownToHtml(text) || `<p>${text}</p>`;
        console.log("插入文本 - HTML长度:", htmlContent.length);
      }

      const htmlContent = convertMarkdownToHtml(text) || `<p>${text}</p>`;

      if (hasSelection) {
        // 有选中内容：替换选中的文本
        editor
          .chain()
          .focus()
          .deleteSelection()
          .insertContent(htmlContent)
          .run();
      } else {
        // 无选中内容：在光标位置插入
        editor.chain().focus().insertContent(htmlContent).run();
      }
    },
    [editor]
  );

  // 暴露方法给父组件
  React.useImperativeHandle(ref, () => ({
    autoFormat: handleAutoFormat,
    removeFormat: handleRemoveFormat,
    insertText: handleInsertText,
  }));

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 段落样式 */}
      <style>{`
        .tiptap-editor-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .tiptap-editor-content {
          flex: 1;
          overflow-y: auto !important;
          overflow-x: hidden;
          min-height: 0;
          max-height: 100%;
        }
        .tiptap-editor-content .ProseMirror {
          outline: none;
          padding-bottom: 50vh;
          min-height: 100%;
          height: auto;
        }
        .tiptap-editor-content .ProseMirror p {
          margin-bottom: 0.5em;
        }
        .tiptap-editor-content .ProseMirror p:empty {
          min-height: 1.5em;
        }
        
        /* 滚动按钮渐入动画 */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      {/* 工具栏 - 只在PC端显示 */}
      <div className="hidden lg:flex border-b border-white/30 bg-white/30 items-center px-4 py-2 gap-2 flex-shrink-0">
        {/* 排版工具 */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleAutoFormat}
            className="inline-flex items-center justify-center p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
            title="自动排版"
          >
            <Wand2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 编辑器内容 */}
      <div className="tiptap-editor-content" ref={editorContentRef}>
        <EditorContent editor={editor} />

        {/* 移动端滚动按钮 */}
        {showScrollButton && (
          <button
            onClick={handleScrollTo}
            className="lg:hidden fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-110 active:scale-95 animate-fade-in backdrop-blur-sm border border-white/10"
            style={{
              boxShadow:
                "0 8px 32px rgba(59, 130, 246, 0.4), 0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
            title={scrollingDown ? "滑到底部" : "回到顶部"}
          >
            {scrollingDown ? (
              <ArrowDown className="w-6 h-6 drop-shadow-lg" />
            ) : (
              <ArrowUp className="w-6 h-6 drop-shadow-lg" />
            )}
          </button>
        )}
      </div>
    </div>
  );
});
