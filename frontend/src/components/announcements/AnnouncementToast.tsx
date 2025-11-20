import React, { useEffect, useState } from "react";
import {
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  ExternalLink,
} from "lucide-react";
import type { Announcement } from "../../types/announcement";
import { announcementsApi } from "../../services/announcements.api";
import wsService from "../../services/websocket";
import AnnouncementDetailModal from "./AnnouncementDetailModal";

/**
 * 公告Toast组件
 * 在右上角弹出显示公告，适合简短提醒
 * 支持WebSocket实时推送
 */
const AnnouncementToast: React.FC = () => {
  const [toasts, setToasts] = useState<Announcement[]>([]);
  const [closedToasts, setClosedToasts] = useState<Set<number>>(new Set());
  const [modalAnnouncement, setModalAnnouncement] =
    useState<Announcement | null>(null);

  useEffect(() => {
    // 初始加载
    loadPopupAnnouncements();

    // 订阅WebSocket推送
    const unsubscribeNew = wsService.on(
      "announcement:new",
      handleNewAnnouncement
    );
    const unsubscribeUpdate = wsService.on(
      "announcement:update",
      handleAnnouncementUpdate
    );
    const unsubscribeDelete = wsService.on(
      "announcement:delete",
      handleAnnouncementDelete
    );

    return () => {
      unsubscribeNew();
      unsubscribeUpdate();
      unsubscribeDelete();
    };
  }, []);

  const loadPopupAnnouncements = async () => {
    try {
      const data = await announcementsApi.getPopupAnnouncements();
      console.log("📋 加载弹窗公告:", data);

      // 过滤掉已读和已关闭的公告
      const activeToasts = data.filter(
        (announcement) =>
          !announcement.isRead && !closedToasts.has(announcement.id)
      );

      setToasts(activeToasts);
    } catch (error) {
      console.error("Failed to load popup announcements:", error);
    }
  };

  /**
   * 处理WebSocket推送的新公告
   */
  const handleNewAnnouncement = (announcement: Announcement) => {
    console.log("📢 收到新公告推送:", announcement);

    // 检查是否已关闭
    if (closedToasts.has(announcement.id)) {
      console.log("⚠️ 公告已关闭，忽略:", announcement.id);
      return;
    }

    // 如果是弹窗公告，显示完整内容的Modal
    if (announcement.isPopup) {
      console.log("✅ 显示弹窗公告:", announcement.id);
      setModalAnnouncement(announcement);
    } else {
      // Toast提醒
      const exists = toasts.some((t) => t.id === announcement.id);
      if (!exists) {
        console.log("✅ 添加Toast公告:", announcement.id);
        setToasts((prev) => [announcement, ...prev]);
      }
    }
  };

  /**
   * 处理WebSocket推送的公告更新
   */
  const handleAnnouncementUpdate = (announcement: Announcement) => {
    console.log("📝 公告已更新:", announcement);

    // 检查是否已关闭
    if (closedToasts.has(announcement.id)) {
      return;
    }

    // 更新已显示的公告
    setToasts((prev) => {
      const exists = prev.some((t) => t.id === announcement.id);
      if (exists) {
        // 更新现有公告
        return prev.map((t) => (t.id === announcement.id ? announcement : t));
      } else if (announcement.isPopup) {
        // 如果是新的弹窗公告，添加到顶部
        return [announcement, ...prev];
      }
      return prev;
    });
  };

  /**
   * 处理WebSocket推送的公告删除
   */
  const handleAnnouncementDelete = (data: { id: number; title?: string }) => {
    console.log("🗑️ 公告已删除:", data);

    // 从列表中移除
    setToasts((prev) => prev.filter((t) => t.id !== data.id));

    // 标记为已关闭
    setClosedToasts((prev) => new Set(prev).add(data.id));
  };

  const handleClose = async (announcement: Announcement) => {
    // 标记为已读（后端记录）
    try {
      await announcementsApi.markAsRead(announcement.id);
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }

    // 从列表中移除（当前会话记录，防止重复显示）
    setClosedToasts((prev) => new Set(prev).add(announcement.id));
    setToasts((prev) => prev.filter((t) => t.id !== announcement.id));
  };

  const handleLinkClick = async (announcement: Announcement) => {
    if (announcement.hasLink && announcement.linkUrl) {
      try {
        await announcementsApi.markAsRead(announcement.id, { needClick: true });

        if (announcement.linkTarget === "_blank") {
          window.open(announcement.linkUrl, "_blank");
        } else {
          window.location.href = announcement.linkUrl;
        }
      } catch (error) {
        console.error("Failed to track link click:", error);
      }
    }
  };

  const getLevelIcon = (level: Announcement["level"]) => {
    switch (level) {
      case "info":
        return <Info className="w-5 h-5" />;
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getLevelColor = (level: Announcement["level"]) => {
    switch (level) {
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-900";
      case "success":
        return "bg-green-50 border-green-200 text-green-900";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "error":
        return "bg-red-50 border-red-200 text-red-900";
    }
  };

  const getLevelIconColor = (level: Announcement["level"]) => {
    switch (level) {
      case "info":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
    }
  };

  return (
    <>
      {/* Toast 提醒（右上角） */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
          {toasts.map((toast, index) => (
            <div
              key={toast.id}
              className={`pointer-events-auto transform transition-all duration-300 ease-out ${
                index === 0 ? "animate-slide-in-right" : ""
              }`}
              style={{
                animation: index === 0 ? "slideInRight 0.3s ease-out" : "none",
              }}
            >
              <div
                className={`rounded-xl shadow-2xl border-2 overflow-hidden ${getLevelColor(
                  toast.level
                )}`}
                style={toast.styleConfig}
              >
                {/* 头部 */}
                <div className="px-4 py-3 flex items-start space-x-3">
                  <div
                    className={`flex-shrink-0 ${getLevelIconColor(
                      toast.level
                    )}`}
                  >
                    {getLevelIcon(toast.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-sm line-clamp-2">
                        {toast.title}
                      </h4>
                      <button
                        onClick={() => handleClose(toast)}
                        className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors ml-2"
                        aria-label="关闭"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {toast.summary && (
                      <p className="text-sm opacity-90 line-clamp-2 mb-2">
                        {toast.summary}
                      </p>
                    )}
                    {toast.hasLink && toast.linkUrl && (
                      <a
                        href={toast.linkUrl}
                        target={
                          toast.linkTarget === "_blank" ? "_blank" : "_self"
                        }
                        rel={
                          toast.linkTarget === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick(toast);
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 hover:border-blue-300 transition-all"
                      >
                        <span>{toast.linkText || "查看详情"}</span>
                        {toast.linkTarget === "_blank" && (
                          <ExternalLink className="w-3 h-3 ml-1" />
                        )}
                      </a>
                    )}
                  </div>
                </div>

                {/* 进度条（自动关闭） */}
                {!toast.needRead && (
                  <div className="h-1 bg-black/10">
                    <div
                      className="h-full bg-current opacity-30"
                      style={{
                        animation: "shrink 5s linear forwards",
                      }}
                      onAnimationEnd={() => handleClose(toast)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
        </div>
      )}

      {/* 弹窗公告（居中显示完整内容） */}
      {modalAnnouncement && (
        <AnnouncementDetailModal
          announcement={modalAnnouncement}
          onClose={() => setModalAnnouncement(null)}
          onRead={async () => {
            if (modalAnnouncement.needRead) {
              try {
                await announcementsApi.markAsRead(modalAnnouncement.id);
              } catch (error) {
                console.error("Failed to mark as read:", error);
              }
            }
            setClosedToasts((prev) => new Set(prev).add(modalAnnouncement.id));
          }}
        />
      )}
    </>
  );
};

export default AnnouncementToast;
