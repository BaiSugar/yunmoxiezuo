import type { EditorSettings } from "../types/editor-settings";

/**
 * 背景位置类型
 * - "full": 完整背景（主容器使用，固定不动）
 * - "top": 顶部区域（顶部导航栏）
 * - "left": 左侧区域（章节列表）
 * - "center": 中心区域（内容编辑器）
 * - "right": 右侧区域（AI助手）
 */
export type BackgroundPosition = "full" | "top" | "left" | "center" | "right";

/**
 * 获取编辑器背景样式
 * @param editorSettings 编辑器设置
 * @param position 背景位置（用于分区显示背景图）
 * @returns 背景样式对象
 * 
 * @example
 * // 主容器 - 完整背景
 * getEditorBackgroundStyle(settings, "full")
 * 
 * // 章节列表 - 显示图片左侧
 * getEditorBackgroundStyle(settings, "left")
 */
export const getEditorBackgroundStyle = (
  editorSettings?: EditorSettings | null,
  position: BackgroundPosition = "center"
): React.CSSProperties => {
  if (editorSettings?.backgroundImage) {
    const baseStyle: React.CSSProperties = {
      backgroundImage: `url(/uploads/${editorSettings.backgroundImage})`,
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
    };

    // 根据位置设置不同的显示区域
    switch (position) {
      case "full":
        // 主容器：固定背景，不随滚动移动
        return {
          ...baseStyle,
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
        };
      case "top":
        // 顶部栏：显示图片顶部，固定背景
        return {
          ...baseStyle,
          backgroundPosition: "center top",
          backgroundAttachment: "fixed",
        };
      case "left":
        // 左侧列表：显示图片左侧，固定背景
        return {
          ...baseStyle,
          backgroundPosition: "left center",
          backgroundAttachment: "fixed",
        };
      case "center":
        // 中心编辑器：显示图片中心，固定背景
        return {
          ...baseStyle,
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
        };
      case "right":
        // 右侧AI助手：显示图片右侧，固定背景
        return {
          ...baseStyle,
          backgroundPosition: "right center",
          backgroundAttachment: "fixed",
        };
      default:
        return {
          ...baseStyle,
          backgroundPosition: "center center",
          backgroundAttachment: "fixed",
        };
    }
  }

  if (editorSettings?.backgroundColor) {
    return {
      backgroundColor: editorSettings.backgroundColor,
    };
  }

  return {};
};

/**
 * 检查是否有自定义背景
 */
export const hasCustomBackground = (
  editorSettings?: EditorSettings | null
): boolean => {
  return !!(
    editorSettings?.backgroundColor || editorSettings?.backgroundImage
  );
};

/**
 * 获取默认背景类名（考虑移动端和桌面端）
 * @param editorSettings 编辑器设置
 * @param defaultClass 默认背景类
 *   - 移动端建议使用不透明背景（如 "bg-white"）
 *   - 桌面端建议使用半透明背景（如 "lg:bg-white/70"）
 * @returns 如果有自定义背景返回空字符串，否则返回默认类名
 * 
 * @example
 * // 无自定义背景 - 移动端不透明，桌面端半透明
 * getDefaultBackgroundClass(null) // "bg-white lg:bg-white/70"
 * 
 * // 无自定义背景 - 移动端半透明（特殊情况）
 * getDefaultBackgroundClass(null, "bg-white/90 backdrop-blur-md") 
 * 
 * // 有自定义背景 - 返回空
 * getDefaultBackgroundClass(settings) // ""
 */
export const getDefaultBackgroundClass = (
  editorSettings?: EditorSettings | null,
  defaultClass: string = "bg-white lg:bg-white/70"
): string => {
  const hasBackground = hasCustomBackground(editorSettings);
  // 如果有自定义背景，不使用默认背景类
  if (hasBackground) {
    return "";
  }
  // 否则返回默认背景类
  return defaultClass;
};

