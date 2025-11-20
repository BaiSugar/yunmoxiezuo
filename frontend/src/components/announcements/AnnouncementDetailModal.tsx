import React from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink } from "lucide-react";
import type { Announcement } from "../../types/announcement";

interface AnnouncementDetailModalProps {
  announcement: Announcement;
  onClose: () => void;
  onRead?: () => void;
}

/**
 * 公告详情弹窗组件
 * 完整显示单个公告内容，适合详细说明
 */
const AnnouncementDetailModal: React.FC<AnnouncementDetailModalProps> = ({
  announcement,
  onClose,
  onRead,
}) => {
  const handleClose = () => {
    if (onRead) {
      onRead();
    }
    onClose();
  };

  const handleLinkClick = () => {
    if (announcement.hasLink && announcement.linkUrl) {
      if (announcement.linkTarget === "_blank") {
        window.open(announcement.linkUrl, "_blank");
      } else {
        window.location.href = announcement.linkUrl;
      }
    }
  };

  const getLevelColor = () => {
    switch (announcement.level) {
      case "info":
        return "from-blue-500 to-blue-600";
      case "success":
        return "from-green-500 to-green-600";
      case "warning":
        return "from-yellow-500 to-yellow-600";
      case "error":
        return "from-red-500 to-red-600";
      default:
        return "from-blue-500 to-blue-600";
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 渐变头部 */}
        <div className={`bg-gradient-to-r ${getLevelColor()} p-6 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{announcement.title}</h2>
              {announcement.summary && (
                <p className="text-blue-100 text-sm">{announcement.summary}</p>
              )}
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-2 hover:bg-white/20 rounded-lg transition-colors ml-4"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 公告内容 */}
          <div
            className="prose prose-sm max-w-none text-gray-800"
            dangerouslySetInnerHTML={{ __html: announcement.content }}
          />

          {/* linkPosition = "content" 时，如果内容中没有链接，则在内容后显示 */}
          {announcement.hasLink &&
            announcement.linkUrl &&
            announcement.linkPosition === "content" &&
            !announcement.content.includes(announcement.linkUrl) && (
              <div className="mt-4">
                <a
                  href={announcement.linkUrl}
                  target={
                    announcement.linkTarget === "_blank" ? "_blank" : "_self"
                  }
                  rel={
                    announcement.linkTarget === "_blank"
                      ? "noopener noreferrer"
                      : undefined
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick();
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-all"
                >
                  <span>{announcement.linkText || "查看详情"}</span>
                  {announcement.linkTarget === "_blank" && (
                    <ExternalLink className="w-4 h-4 ml-2" />
                  )}
                </a>
              </div>
            )}

          {/* linkPosition = "button" 或 "both" 时显示底部按钮 */}
          {announcement.hasLink &&
            announcement.linkUrl &&
            (announcement.linkPosition === "button" ||
              announcement.linkPosition === "both") && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href={announcement.linkUrl}
                  target={
                    announcement.linkTarget === "_blank" ? "_blank" : "_self"
                  }
                  rel={
                    announcement.linkTarget === "_blank"
                      ? "noopener noreferrer"
                      : undefined
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick();
                  }}
                  className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-all whitespace-nowrap"
                >
                  <span>{announcement.linkText || "查看详情"}</span>
                  {announcement.linkTarget === "_blank" && (
                    <ExternalLink className="w-4 h-4 ml-2" />
                  )}
                </a>
              </div>
            )}
        </div>

        {/* 底部按钮 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {announcement.needRead ? "我已阅读" : "关闭"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AnnouncementDetailModal;
