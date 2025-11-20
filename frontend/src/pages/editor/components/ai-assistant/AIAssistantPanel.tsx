import React, { useRef, useState } from "react";
import { Plus, History, HelpCircle, X, Wand2 } from "lucide-react";
import { ChatTab } from "./ChatTab";
import type { ChatTabRef } from "./ChatTab";
import { ChatHistoryModal } from "./ChatHistoryModal";
import { HelpModal } from "./HelpModal";
import { CreativeWorkshop } from "./CreativeWorkshop";
import { GeneratorInterface } from "./GeneratorInterface";
import type { GeneratorInterfaceRef } from "./GeneratorInterface";
import type { Chapter } from "../types";
import type { PromptCategory } from "../../../../types/prompt";
import type { EditorSettings } from "../../../../types/editor-settings";
import {
  getEditorBackgroundStyle,
  getDefaultBackgroundClass,
} from "../../../../utils/editorBackground";

interface Volume {
  id: number;
  name: string;
  chapters: Chapter[];
}

interface AIAssistantPanelProps {
  width: number;
  novelId?: number;
  onApplyToEditor?: (content: string) => void;
  onClose?: () => void; // 移动端关闭回调
  chapters?: Chapter[];
  volumes?: Volume[];
  editorSettings?: EditorSettings | null;
}

/**
 * AI助手完整面板
 */
type ViewMode = "chat" | "workshop" | "generator";

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  width,
  novelId,
  onApplyToEditor,
  onClose,
  chapters,
  volumes,
  editorSettings,
}) => {
  const chatTabRef = useRef<ChatTabRef>(null);
  const generatorRef = useRef<GeneratorInterfaceRef>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [selectedCategory, setSelectedCategory] =
    useState<PromptCategory | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // 统一的历史记录处理函数
  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };
  const handleSendMessage = (
    message: string,
    mentions: string[],
    files: File[],
    config?: {
      promptId?: number;
      parameters?: Record<string, string>;
      characterIds?: number[];
      worldSettingIds?: number[];
      modelId?: number;
      temperature?: number;
    }
  ) => {
    console.log("发送消息:", { message, mentions, files, config });
    // TODO: 调用AI对话API
  };

  const handleApplyToEditor = (content: string) => {
    if (onApplyToEditor) {
      onApplyToEditor(content);
    } else {
      console.log("应用到编辑器:", content);
    }
  };

  const handleNewChat = () => {
    if (chatTabRef.current) {
      chatTabRef.current.clearChat();
    }
  };

  const handleSelectHistory = (historyId: number) => {
    // 根据当前模式选择对应的ref
    if (viewMode === "generator" && generatorRef.current) {
      // 创意工坊生成器模式
      generatorRef.current.loadHistory(historyId);
    } else if (chatTabRef.current) {
      // 对话模式
      chatTabRef.current.loadHistory(historyId);
    }
  };

  const handleDeleteHistory = (historyId: number) => {
    // 删除历史记录（已在模态框中调用API）
    // 通知对应组件检查是否需要创建新聊天
    if (viewMode === "generator" && generatorRef.current) {
      // 创意工坊生成器模式
      generatorRef.current.handleDeleteHistory(historyId);
    } else if (chatTabRef.current) {
      // 对话模式
      chatTabRef.current.handleDeleteHistory(historyId);
    }
  };

  return (
    <div
      className="flex flex-col m-0 lg:mx-1.5 lg:mt-6 lg:mb-0 pb-0 lg:pb-0"
      style={{
        width: width > 0 ? `${width}px` : "100%",
        height: width > 0 ? "calc(100% - 24px)" : "100%", // 桌面端减去mt-6，移动端100%
      }}
    >
      <div
        className={`flex-1 flex flex-col ${getDefaultBackgroundClass(
          editorSettings,
          "bg-white"
        )} border-0 lg:border lg:border-white/50 shadow-none lg:shadow-lg rounded-none lg:rounded-2xl overflow-hidden mb-0 lg:mb-0 min-h-0`}
        style={getEditorBackgroundStyle(editorSettings, "right")}
      >
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between border-b border-gray-200/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">AI助手</h3>
            {/* 移动端关闭按钮 */}
            {onClose && (
              <button
                onClick={onClose}
                className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="关闭"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHelpModal(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="使用说明"
            >
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </button>
            {/* 工坊按钮 */}
            <button
              onClick={() => {
                if (viewMode === "workshop" || viewMode === "generator") {
                  setViewMode("chat");
                  setSelectedCategory(null);
                } else {
                  setViewMode("workshop");
                }
              }}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "workshop" || viewMode === "generator"
                  ? "bg-purple-100 text-purple-600"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
              title={
                viewMode === "workshop" || viewMode === "generator"
                  ? "返回对话"
                  : "创意工坊"
              }
            >
              <Wand2 className="w-4 h-4" />
            </button>
            {/* 对话模式专属按钮 */}
            {viewMode === "chat" && (
              <>
                <button
                  onClick={handleNewChat}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="新建对话"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
                <button
                  onClick={handleShowHistory}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="历史记录"
                >
                  <History className="w-4 h-4 text-gray-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 内容区 - 根据viewMode显示不同内容 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === "chat" ? (
            <ChatTab
              ref={chatTabRef}
              onSendMessage={handleSendMessage}
              onApplyToEditor={handleApplyToEditor}
              novelId={novelId}
              chapters={chapters}
              volumes={volumes}
            />
          ) : viewMode === "workshop" ? (
            <CreativeWorkshop
              onSelectCategory={(category) => {
                setSelectedCategory(category);
                setViewMode("generator");
              }}
            />
          ) : viewMode === "generator" && selectedCategory ? (
            <GeneratorInterface
              ref={generatorRef}
              category={selectedCategory}
              novelId={novelId}
              onApplyToEditor={onApplyToEditor}
              onBack={() => {
                setViewMode("workshop");
                setSelectedCategory(null);
              }}
              onShowHistory={handleShowHistory}
              onRequestNovel={() => {
                // 编辑器内没有作品选择器，只能提示用户
                console.log("需要作品但编辑器内已固定作品");
              }}
              chapters={chapters}
              volumes={volumes}
              editorSettings={editorSettings}
            />
          ) : null}
        </div>
      </div>

      {/* 历史记录模态框 - 统一在最外层 */}
      <ChatHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
        novelId={novelId}
        categoryId={viewMode === "generator" ? selectedCategory?.id : undefined}
        categoryName={
          viewMode === "generator" ? selectedCategory?.name : undefined
        }
      />

      {/* 帮助说明模态框 */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
};
