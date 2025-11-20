import React, { useEffect, useState } from "react";
import {
  X,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  Bell,
} from "lucide-react";
import wsService from "../../services/websocket";
import {
  notificationsApi,
  type Notification,
} from "../../services/notifications.api";

/**
 * 通用通知Toast组件
 * 用于显示系统通知（提示词审核、系统消息等）
 */
const NotificationToast: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [closedIds, setClosedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // 订阅WebSocket通知
    const unsubscribe = wsService.on("notification:new", handleNewNotification);

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * 处理新通知
   */
  const handleNewNotification = (notification: Notification) => {
    console.log("🔔 收到系统通知:", notification);

    // 检查是否已关闭
    if (closedIds.has(notification.id)) {
      console.log("⚠️ 通知已关闭，忽略:", notification.id);
      return;
    }

    // 检查是否已存在
    const exists = notifications.some((n) => n.id === notification.id);
    if (!exists) {
      console.log("✅ 添加新通知:", notification.id);
      // 添加到顶部
      setNotifications((prev) => [notification, ...prev]);
    } else {
      console.log("⚠️ 通知已存在，忽略:", notification.id);
    }
  };

  /**
   * 关闭通知
   */
  const handleClose = async (notification: Notification) => {
    console.log("❌ 关闭通知:", notification.id);

    // 标记为已读（调用后端API）
    try {
      await markNotificationAsRead(notification.id);
    } catch (error) {
      console.error("标记通知已读失败:", error);
    }

    // 从UI中移除
    setClosedIds((prev) => new Set(prev).add(notification.id));
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
  };

  /**
   * 标记通知为已读
   */
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      console.log("✅ 通知已标记为已读:", notificationId);
    } catch (error) {
      console.error("标记通知已读失败:", error);
      throw error;
    }
  };

  /**
   * 点击操作按钮（自动标记为已读）
   */
  const handleAction = async (
    action: { text: string; url: string },
    notification: Notification
  ) => {
    console.log("🔗 点击操作按钮:", action.text, action.url);

    // 标记为已读
    try {
      await markNotificationAsRead(notification.id);
      console.log("✅ 通知已标记为已读:", notification.id);
    } catch (error) {
      console.error("标记通知已读失败:", error);
    }

    // 跳转链接
    window.location.href = action.url;
  };

  /**
   * 批量关闭所有通知
   */
  const handleCloseAll = async () => {
    if (notifications.length === 0) return;

    console.log("🗑️ 批量关闭所有通知:", notifications.length);

    // 批量标记为已读
    try {
      const notificationIds = notifications.map((n) => n.id);
      await notificationsApi.deleteNotifications(notificationIds);
      console.log("✅ 批量标记通知已读成功");
    } catch (error) {
      console.error("批量标记通知已读失败:", error);
    }

    // 清空UI
    setNotifications([]);
    notifications.forEach((n) => {
      setClosedIds((prev) => new Set(prev).add(n.id));
    });
  };

  /**
   * 获取级别图标
   */
  const getLevelIcon = (level?: string) => {
    switch (level) {
      case "info":
        return <Info className="w-5 h-5" />;
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  /**
   * 获取级别颜色
   */
  const getLevelColor = (level?: string) => {
    switch (level) {
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-900";
      case "success":
        return "bg-green-50 border-green-200 text-green-900";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "error":
        return "bg-red-50 border-red-200 text-red-900";
      default:
        return "bg-gray-50 border-gray-200 text-gray-900";
    }
  };

  /**
   * 获取图标颜色
   */
  const getLevelIconColor = (level?: string) => {
    switch (level) {
      case "info":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  /**
   * 获取自动关闭时间
   */
  const getAutoDismissTime = (category: string, level?: string): number => {
    // 审核拒绝和错误消息不自动关闭
    if (level === "error" || category === "prompt-rejection") {
      return 0;
    }
    // 成功消息8秒后关闭
    if (level === "success") {
      return 8000;
    }
    // 其他消息6秒后关闭（减少显示时间）
    return 6000;
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9998] space-y-3 max-w-md w-full pointer-events-none">
      {/* 批量操作按钮 */}
      {notifications.length > 1 && (
        <div className="pointer-events-auto mb-2">
          <button
            onClick={handleCloseAll}
            className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
          >
            全部关闭 ({notifications.length})
          </button>
        </div>
      )}
      {notifications.map((notification, index) => {
        const autoDismissTime = getAutoDismissTime(
          notification.category,
          notification.level
        );

        return (
          <NotificationItem
            key={notification.id}
            notification={notification}
            index={index}
            autoDismissTime={autoDismissTime}
            onClose={() => handleClose(notification)}
            onAction={(action) => handleAction(action, notification)}
            getLevelIcon={getLevelIcon}
            getLevelColor={getLevelColor}
            getLevelIconColor={getLevelIconColor}
          />
        );
      })}
    </div>
  );
};

/**
 * 单个通知项组件
 */
interface NotificationItemProps {
  notification: Notification;
  index: number;
  autoDismissTime: number;
  onClose: () => void;
  onAction: (action: { text: string; url: string }) => void;
  getLevelIcon: (level?: string) => React.ReactNode;
  getLevelColor: (level?: string) => string;
  getLevelIconColor: (level?: string) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  index,
  autoDismissTime,
  onClose,
  onAction,
  getLevelIcon,
  getLevelColor,
  getLevelIconColor,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (autoDismissTime > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / autoDismissTime) * 100);
        setProgress(remaining);

        if (remaining === 0) {
          clearInterval(interval);
          onClose();
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [autoDismissTime, onClose]);

  return (
    <div
      className={`pointer-events-auto transform transition-all duration-300 ease-out ${
        index === 0 ? "animate-slide-in-right" : ""
      }`}
      style={{
        animation: index === 0 ? "slideInRight 0.3s ease-out" : "none",
      }}
    >
      <div
        className={`rounded-xl shadow-2xl border-2 overflow-hidden ${getLevelColor(
          notification.level
        )}`}
      >
        {/* 头部 */}
        <div className="px-4 py-3">
          <div className="flex items-start space-x-3">
            <div
              className={`flex-shrink-0 mt-0.5 ${getLevelIconColor(
                notification.level
              )}`}
            >
              {getLevelIcon(notification.level)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors ml-2"
                  aria-label="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm opacity-90 mb-2">{notification.content}</p>

              {/* 额外信息（如审核备注） */}
              {notification.extra?.reviewNote && (
                <div className="text-xs opacity-75 mb-2 p-2 bg-black/5 rounded">
                  <strong>备注：</strong>
                  {notification.extra.reviewNote}
                </div>
              )}

              {/* 操作按钮 */}
              {notification.action && (
                <button
                  onClick={() => onAction(notification.action!)}
                  className="inline-flex items-center space-x-1 text-xs font-medium hover:underline mt-1 px-3 py-1.5 bg-black/10 rounded-lg hover:bg-black/20 transition-colors"
                >
                  <span>{notification.action.text}</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 进度条（自动关闭） */}
        {autoDismissTime > 0 && (
          <div className="h-1 bg-black/10">
            <div
              className="h-full bg-current opacity-30 transition-all duration-50 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

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
      `}</style>
    </div>
  );
};

export default NotificationToast;
