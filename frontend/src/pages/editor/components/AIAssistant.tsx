import React from "react";
import { AIAssistantPanel } from "./ai-assistant";
import type { Chapter, Volume } from "./types";
import type { EditorSettings } from "../../../types/editor-settings";

interface AIAssistantProps {
  width: number;
  novelId?: number;
  onApplyToEditor?: (content: string) => void;
  onClose?: () => void; // 移动端关闭回调
  chapters?: Chapter[];
  volumes?: Volume[];
  editorSettings?: EditorSettings | null;
}

/**
 * AI助手侧边栏
 */
export const AIAssistant: React.FC<AIAssistantProps> = ({
  width,
  novelId,
  onApplyToEditor,
  onClose,
  chapters,
  volumes,
  editorSettings,
}) => {
  return (
    <AIAssistantPanel
      width={width}
      novelId={novelId}
      onApplyToEditor={onApplyToEditor}
      onClose={onClose}
      chapters={chapters}
      volumes={volumes}
      editorSettings={editorSettings}
    />
  );
};
