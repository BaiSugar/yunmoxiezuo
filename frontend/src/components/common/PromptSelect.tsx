import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import type { Prompt } from "../../types/prompt";

interface PromptSelectProps {
  value: number;
  options: Prompt[];
  onChange: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * 自定义提示词选择组件
 * 支持搜索、过滤功能
 */
const PromptSelect: React.FC<PromptSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = "请选择...",
  disabled = false,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // 获取选中的提示词
  const selectedPrompt = options.find((p) => p.id === value);

  // 过滤选项
  const filteredOptions = options.filter((prompt) =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (promptId: number) => {
    onChange(promptId);
    setIsOpen(false);
    setSearchTerm("");
    setHighlightedIndex(-1);
  };

  // 键盘导航处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || loading) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].id);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm("");
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* 触发器 */}
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled || loading}
        className={`
          w-full px-3 py-2 text-left border border-gray-200 rounded-lg 
          focus:ring-2 focus:ring-purple-500 focus:border-transparent
          transition-all flex items-center justify-between
          ${
            disabled || loading
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer hover:border-purple-300"
          }
          ${isOpen ? "border-purple-500 ring-2 ring-purple-500" : ""}
        `}
      >
        <span
          className={`flex-1 truncate ${
            selectedPrompt ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {loading
            ? "加载中..."
            : selectedPrompt
            ? selectedPrompt.name
            : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && !disabled && !loading && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-hidden">
          {/* 搜索框 */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    searchInputRef.current?.blur();
                    setHighlightedIndex(
                      e.key === "ArrowDown" ? 0 : filteredOptions.length - 1
                    );
                  } else if (e.key === "Escape") {
                    setIsOpen(false);
                    setSearchTerm("");
                    setHighlightedIndex(-1);
                  }
                }}
                placeholder="搜索提示词..."
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* 选项列表 */}
          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                {searchTerm ? "未找到匹配的提示词" : "暂无提示词"}
              </div>
            ) : (
              filteredOptions.map((prompt, index) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => handleSelect(prompt.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`
                    w-full px-3 py-2 text-left hover:bg-purple-50 transition-colors
                    flex items-center justify-between
                    ${value === prompt.id ? "bg-purple-50" : ""}
                    ${highlightedIndex === index ? "bg-purple-50" : ""}
                  `}
                >
                  <span className="flex-1 truncate text-sm text-gray-900">
                    {prompt.name}
                  </span>
                  {value === prompt.id && (
                    <Check className="w-4 h-4 text-purple-500 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptSelect;
