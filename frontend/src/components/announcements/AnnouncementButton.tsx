import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { announcementsApi } from "../../services/announcements.api";
import AnnouncementListModal from "./AnnouncementListModal";

/**
 * 公告按钮组件
 * 显示在右上角，带未读数量气泡
 */
const AnnouncementButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();

    // 每5分钟刷新一次未读数量
    const interval = setInterval(loadUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await announcementsApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      // 静默失败，可能用户未登录
      console.log("Failed to load unread count:", error);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // 关闭后重新加载未读数量
    loadUnreadCount();
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="查看公告"
        title="系统公告"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full flex items-center justify-center shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnnouncementListModal isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  );
};

export default AnnouncementButton;
