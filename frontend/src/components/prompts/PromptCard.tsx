import React from "react";
import { Eye, Zap, User, Lock, Heart, Clock } from "lucide-react";
import type { Prompt } from "../../types/prompt";

interface PromptCardProps {
  prompt: Prompt;
  onClick: (prompt: Prompt) => void;
  onApply?: (prompt: Prompt) => void;
  currentUserId?: number; // 当前登录用户ID
}

// 移除markdown标记，获取纯文本
const stripMarkdown = (text: string): string => {
  return text
    .replace(/#{1,6}\s/g, "") // 移除标题标记
    .replace(/\*\*(.+?)\*\*/g, "$1") // 移除加粗
    .replace(/\*(.+?)\*/g, "$1") // 移除斜体
    .replace(/`(.+?)`/g, "$1") // 移除行内代码
    .replace(/\[(.+?)\]\(.+?\)/g, "$1") // 移除链接，保留文本
    .replace(/^>\s/gm, "") // 移除引用标记
    .replace(/^[-*+]\s/gm, "") // 移除列表标记
    .replace(/^\d+\.\s/gm, "") // 移除有序列表标记
    .replace(/\n/g, " ") // 替换换行为空格
    .trim();
};

/**
 * 提示词卡片组件
 */
const PromptCard: React.FC<PromptCardProps> = ({
  prompt,
  onClick,
  onApply,
  currentUserId,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // 如果点击的是按钮，不触发卡片点击
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    onClick(prompt);
  };

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onApply) {
      onApply(prompt);
    } else {
      // 如果没有提供onApply回调，则跳转到详情页
      onClick(prompt);
    }
  };

  const isLiked = (prompt as any).isLiked || false;

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 p-6 
                 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer
                 hover:border-blue-500/30 hover:-translate-y-1"
    >
      {/* 顶部标签 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {prompt.category?.icon && (
            <span className="text-2xl">{prompt.category.icon}</span>
          )}
          <span className="text-sm font-medium text-gray-600">
            {prompt.category?.name}
          </span>
        </div>
        {prompt.requireApplication &&
          currentUserId !== prompt.authorId &&
          !prompt.hasPermission && (
            <div className="flex items-center space-x-1 text-amber-500">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-medium">需申请</span>
            </div>
          )}
      </div>

      {/* 标题 */}
      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
        {prompt.name}
      </h3>

      {/* 描述 */}
      <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
        {prompt.description ? stripMarkdown(prompt.description) : "暂无描述"}
      </p>

      {/* 作者信息 */}
      <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500">
        <User className="w-4 h-4" />
        <span>
          {prompt.author?.nickname || prompt.author?.username || "匿名"}
        </span>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200/50">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Eye className="w-4 h-4" />
            <span>{prompt.viewCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="w-4 h-4" />
            <span>{prompt.useCount}</span>
          </div>
          <div
            className={`flex items-center space-x-1 ${
              isLiked ? "text-red-500" : ""
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
            <span>{prompt.likeCount}</span>
          </div>
        </div>

        {/* 热度值 */}
        <div className="flex items-center space-x-1 text-sm font-semibold text-orange-500">
          <span>🔥</span>
          <span>{prompt.hotValue}</span>
        </div>
      </div>

      {/* 需要申请使用的按钮 */}
      {prompt.requireApplication &&
        currentUserId !== prompt.authorId &&
        !prompt.hasPermission && (
          <div className="mt-4 pt-4 border-t border-gray-200/50">
            {prompt.hasPermission ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(prompt);
                }}
                className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
              >
                <Zap className="w-4 h-4" />
                <span>立即使用</span>
              </button>
            ) : (
              <button
                onClick={handleApplyClick}
                className="w-full py-2 px-4 bg-amber-500 text-white rounded-lg hover:bg-amber-600 
                       transition-colors flex items-center justify-center space-x-2 text-sm font-medium"
              >
                <Lock className="w-4 h-4" />
                <span>申请使用</span>
              </button>
            )}
          </div>
        )}

      {/* 状态标识 */}
      {prompt.needsReview && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-amber-500/90 text-white text-xs rounded-full flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>审核中</span>
        </div>
      )}
      {!prompt.needsReview && prompt.status === "draft" && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-gray-500/90 text-white text-xs rounded-full">
          草稿
        </div>
      )}
      {prompt.status === "archived" && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-gray-400/90 text-white text-xs rounded-full">
          已归档
        </div>
      )}
      {prompt.isBanned && (
        <div className="absolute top-4 right-4 px-2 py-1 bg-red-500/90 text-white text-xs rounded-full">
          已封禁
        </div>
      )}
    </div>
  );
};

export default PromptCard;
