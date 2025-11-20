import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, Clock } from "lucide-react";
import type { Announcement } from "../../types/announcement";
import { announcementsApi } from "../../services/announcements.api";

interface AnnouncementListModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 公告列表弹窗组件
 * 用户主动查看所有公告
 */
const AnnouncementListModal: React.FC<AnnouncementListModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    if (isOpen) {
      loadAnnouncements();
    } else {
      // 关闭时清除所有状态
      setSelectedAnnouncement(null);
    }
  }, [isOpen]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await announcementsApi.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error("Failed to load announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnnouncementClick = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);

    // 标记为已读
    if (!announcement.isRead && announcement.needRead) {
      try {
        await announcementsApi.markAsRead(announcement.id);
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    }
  };

  const getLevelColor = (level: Announcement["level"]) => {
    switch (level) {
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeText = (type: Announcement["type"]) => {
    switch (type) {
      case "system":
        return "系统公告";
      case "activity":
        return "活动公告";
      case "maintenance":
        return "维护公告";
      case "feature":
        return "新功能";
      case "notice":
        return "通知";
      default:
        return "公告";
    }
  };

  // 根据类型筛选公告，并保持置顶排序
  const filteredAnnouncements = (
    selectedType === "all"
      ? announcements
      : announcements.filter((a) => a.type === selectedType)
  ).sort((a, b) => {
    // 1. 置顶优先
    if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
    // 2. 优先级降序
    if (a.priority !== b.priority) return b.priority - a.priority;
    // 3. 发布时间降序
    const aTime = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const bTime = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return bTime - aTime;
  });

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-white">系统公告</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          {/* 左侧列表 - 移动端折叠 */}
          {selectedAnnouncement ? (
            <div className="lg:hidden border-b border-gray-200 bg-gray-50 px-4 py-2 flex items-center justify-between">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
                <span>返回公告列表</span>
              </button>
              <h3 className="font-semibold text-gray-900 truncate max-w-xs">
                {selectedAnnouncement.title}
              </h3>
            </div>
          ) : (
            <div className="lg:hidden">
              <h3 className="px-4 py-3 font-semibold text-gray-900 border-b border-gray-200">
                公告列表
              </h3>
            </div>
          )}

          <div
            className={`${
              selectedAnnouncement ? "hidden" : "block"
            } lg:block w-full lg:w-80 lg:border-r border-gray-200 overflow-y-auto flex-shrink-0 flex flex-col`}
          >
            {/* 分类Tab */}
            <div className="border-b border-gray-200 bg-gray-50 p-2 flex-shrink-0">
              <div className="flex flex-wrap gap-1">
                {[
                  { value: "all", label: "全部" },
                  { value: "system", label: "系统" },
                  { value: "activity", label: "活动" },
                  { value: "maintenance", label: "维护" },
                  { value: "feature", label: "新功能" },
                  { value: "notice", label: "通知" },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setSelectedType(tab.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      selectedType === tab.value
                        ? "bg-blue-500 text-white shadow-sm"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 公告列表 */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500">加载中...</div>
              ) : filteredAnnouncements.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  {selectedType === "all"
                    ? "暂无公告"
                    : `暂无${getTypeText(
                        selectedType as Announcement["type"]
                      )}`}
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredAnnouncements.map((announcement) => (
                    <button
                      key={announcement.id}
                      onClick={() => handleAnnouncementClick(announcement)}
                      className={`w-full text-left p-3 sm:p-4 rounded-lg border-2 transition-all ${
                        selectedAnnouncement?.id === announcement.id
                          ? "border-blue-500 bg-blue-50"
                          : announcement.isTop
                          ? "border-orange-300 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-2 flex items-center gap-2">
                            {announcement.isTop && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white flex-shrink-0">
                                置顶
                              </span>
                            )}
                            {announcement.title}
                          </h3>
                          {announcement.summary && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-1">
                              {announcement.summary}
                            </p>
                          )}
                        </div>
                        {!announcement.isRead && (
                          <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded border ${getLevelColor(
                            announcement.level
                          )}`}
                        >
                          {getTypeText(announcement.type)}
                        </span>
                        {announcement.startTime && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(
                              announcement.startTime
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右侧详情 */}
          <div className="flex-1 overflow-y-auto">
            {selectedAnnouncement ? (
              <div className="p-4 sm:p-6">
                <div className="mb-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    {selectedAnnouncement.title}
                  </h3>
                  {selectedAnnouncement.summary && (
                    <p className="text-sm sm:text-base text-gray-600 mb-4">
                      {selectedAnnouncement.summary}
                    </p>
                  )}
                  <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                    {selectedAnnouncement.startTime && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="whitespace-nowrap">
                          {new Date(
                            selectedAnnouncement.startTime
                          ).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="prose prose-sm max-w-none text-gray-800 mb-6"
                  dangerouslySetInnerHTML={{
                    __html: selectedAnnouncement.content,
                  }}
                />

                {/* linkPosition = "content" 时，如果内容中没有链接，则在内容后显示链接 */}
                {selectedAnnouncement.hasLink &&
                  selectedAnnouncement.linkUrl &&
                  selectedAnnouncement.linkPosition === "content" &&
                  !selectedAnnouncement.content.includes(
                    selectedAnnouncement.linkUrl
                  ) && (
                    <div className="mt-4">
                      <a
                        href={selectedAnnouncement.linkUrl}
                        target={selectedAnnouncement.linkTarget || "_blank"}
                        rel={
                          selectedAnnouncement.linkTarget === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                      >
                        {selectedAnnouncement.linkText || "查看详情"}
                        {selectedAnnouncement.linkTarget === "_blank" && (
                          <ExternalLink className="w-4 h-4" />
                        )}
                      </a>
                    </div>
                  )}

                {/* 底部按钮：button 和 both 都显示 */}
                {selectedAnnouncement.hasLink &&
                  selectedAnnouncement.linkUrl &&
                  (selectedAnnouncement.linkPosition === "button" ||
                    selectedAnnouncement.linkPosition === "both") && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <a
                        href={selectedAnnouncement.linkUrl}
                        target={
                          selectedAnnouncement.linkTarget === "_blank"
                            ? "_blank"
                            : "_self"
                        }
                        rel={
                          selectedAnnouncement.linkTarget === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-all whitespace-nowrap"
                      >
                        <span>
                          {selectedAnnouncement.linkText || "查看详情"}
                        </span>
                        {selectedAnnouncement.linkTarget === "_blank" && (
                          <ExternalLink className="w-4 h-4 ml-2" />
                        )}
                      </a>
                    </div>
                  )}

                {/* linkPosition = "both" 时，在内容末尾自动插入链接 */}
                {selectedAnnouncement.hasLink &&
                  selectedAnnouncement.linkUrl &&
                  selectedAnnouncement.linkPosition === "both" &&
                  !selectedAnnouncement.content.includes(
                    selectedAnnouncement.linkUrl
                  ) && (
                    <div className="mt-4">
                      <a
                        href={selectedAnnouncement.linkUrl}
                        target={selectedAnnouncement.linkTarget || "_blank"}
                        rel={
                          selectedAnnouncement.linkTarget === "_blank"
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                      >
                        {selectedAnnouncement.linkText || "查看详情"}
                        {selectedAnnouncement.linkTarget === "_blank" && (
                          <ExternalLink className="w-4 h-4" />
                        )}
                      </a>
                    </div>
                  )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                请选择左侧公告查看详情
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AnnouncementListModal;
