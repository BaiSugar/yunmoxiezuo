import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { FontLoader } from "../../../utils/fontLoader";
import type { Font } from "../../../types/font";

interface FontSelectProps {
  fonts: Font[];
  value: string; // 完整的 font-family 字符串
  onChange: (fontFamily: string) => void;
  loading?: boolean;
}

/**
 * 自定义字体选择下拉框
 */
export const FontSelect: React.FC<FontSelectProps> = ({
  fonts,
  value,
  onChange,
  loading = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 找到当前选中的字体
  const currentFont = fonts.find(
    (f) =>
      FontLoader.getFontFamily(f) === value ||
      f.name === value ||
      value?.includes(f.name)
  );

  // 获取当前显示的文本
  const displayText = currentFont
    ? `${currentFont.displayName}${
        currentFont.format !== "system"
          ? ` (${(currentFont.fileSize / 1024).toFixed(0)}KB)`
          : ""
      }`
    : value || "请选择字体";

  // 按分类分组字体 - 动态提取所有分类
  const categories = Array.from(
    new Set(fonts.map((f) => f.category).filter(Boolean))
  );
  // 按固定顺序排序，确保"我的字体"在最后
  const sortedCategories = ["推荐", "中文", "英文", "特殊"].concat(
    categories.filter((c) => !["推荐", "中文", "英文", "特殊"].includes(c))
  );
  const groupedFonts = sortedCategories.map((category) => ({
    category,
    fonts: fonts.filter((f) => f.category === category),
  }));

  // 过滤字体（基于搜索）
  const filteredGroups = groupedFonts
    .map((group) => ({
      ...group,
      fonts: group.fonts.filter(
        (f) =>
          f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.fonts.length > 0);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // 聚焦搜索框
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
        return;
      }

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const allFonts: Font[] = [];
        filteredGroups.forEach((group) => {
          allFonts.push(...group.fonts);
        });

        if (e.key === "ArrowDown") {
          setHighlightedIndex((prev) =>
            prev < allFonts.length - 1 ? prev + 1 : prev
          );
        } else {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        }
      }

      if (e.key === "Enter" && highlightedIndex >= 0) {
        const allFonts: Font[] = [];
        filteredGroups.forEach((group) => {
          allFonts.push(...group.fonts);
        });
        if (allFonts[highlightedIndex]) {
          handleSelect(allFonts[highlightedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, highlightedIndex, filteredGroups]);

  // 滚动到高亮项
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll("[data-font-index]");
      const item = items[highlightedIndex] as HTMLElement;
      if (item) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [highlightedIndex]);

  const handleSelect = (font: Font) => {
    const fontFamily = FontLoader.getFontFamily(font);
    onChange(fontFamily);
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchQuery("");
      setHighlightedIndex(-1);
    }
  };

  // 获取所有字体（用于键盘导航）
  const getAllFonts = () => {
    const allFonts: Font[] = [];
    filteredGroups.forEach((group) => {
      allFonts.push(...group.fonts);
    });
    return allFonts;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* 触发器按钮 */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span
          className="flex-1 text-left truncate"
          style={{
            fontFamily: currentFont
              ? FontLoader.getFontFamily(currentFont)
              : undefined,
          }}
        >
          {displayText}
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-2 text-gray-400 transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-hidden flex flex-col"
        >
          {/* 搜索框 */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(-1);
                }}
                placeholder="搜索字体..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 字体列表 */}
          <div className="overflow-y-auto flex-1">
            {filteredGroups.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                {searchQuery ? "未找到匹配的字体" : "暂无可用字体"}
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div key={group.category} className="py-1">
                  {/* 分类标题 */}
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-900/50 sticky top-0">
                    {group.category}
                  </div>
                  {/* 分类下的字体 */}
                  {group.fonts.map((font) => {
                    const fontIndex = getAllFonts().indexOf(font);
                    const isSelected =
                      FontLoader.getFontFamily(font) === value ||
                      font.name === value ||
                      value?.includes(font.name);
                    const isHighlighted = fontIndex === highlightedIndex;

                    return (
                      <button
                        key={font.id}
                        type="button"
                        data-font-index={fontIndex}
                        onClick={() => handleSelect(font)}
                        style={{
                          fontFamily: FontLoader.getFontFamily(font),
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between transition-colors ${
                          isHighlighted
                            ? "bg-blue-50 dark:bg-blue-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        } ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "text-gray-900 dark:text-gray-100"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {font.displayName}
                          </div>
                          {font.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                              {font.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            {font.format !== "system"
                              ? `${(font.fileSize / 1024).toFixed(
                                  0
                                )}KB · ${font.format.toUpperCase()}`
                              : "系统字体"}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-500 dark:text-blue-400 ml-2 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
