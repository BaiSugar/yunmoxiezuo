import { useState, useEffect } from "react";
import {
  getAnnouncementList,
  deleteAnnouncement,
  publishAnnouncement,
  pushAnnouncement,
} from "../../api/announcements";
import type {
  Announcement,
  QueryAnnouncementDto,
  AnnouncementType,
  AnnouncementLevel,
} from "../../types/announcement";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { showToast } from "../../components/common/ToastContainer";
import { useAppSelector } from "../../store/hooks";
import { hasButtonPermission, PERMISSIONS } from "../../utils/permission";
import AnnouncementModal from "./AnnouncementModal";

export default function Announcements() {
  const { user } = useAppSelector((state) => state.auth);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // 筛选条件
  const [filters, setFilters] = useState<QueryAnnouncementDto>({});

  // 编辑模态框
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    announcement: Announcement | null;
  }>({ isOpen: false, announcement: null });

  // 确认对话框
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmColor: "blue" as "blue" | "red" | "green" | "yellow",
  });

  // 加载公告列表
  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const params: QueryAnnouncementDto = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await getAnnouncementList(params);
      setAnnouncements(response.data);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (error: any) {
      console.error("加载公告列表失败:", error);
      showToast(error.message || "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  // 搜索
  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    loadAnnouncements();
  };

  // 创建公告
  const handleCreate = () => {
    setEditModal({ isOpen: true, announcement: null });
  };

  // 编辑公告
  const handleEdit = (announcement: Announcement) => {
    setEditModal({ isOpen: true, announcement });
  };

  // 删除公告
  const handleDelete = (announcement: Announcement) => {
    setConfirmDialog({
      isOpen: true,
      title: "删除公告",
      message: `确定要删除公告"${announcement.title}"吗？此操作无法撤销。`,
      confirmColor: "red",
      onConfirm: async () => {
        try {
          await deleteAnnouncement(announcement.id);
          showToast("删除成功", "success");
          loadAnnouncements();
        } catch (error: any) {
          showToast(error.message || "删除失败", "error");
        }
      },
    });
  };

  // 发布公告
  const handlePublish = (announcement: Announcement) => {
    setConfirmDialog({
      isOpen: true,
      title: "发布公告",
      message: `确定要发布公告"${announcement.title}"吗？`,
      confirmColor: "green",
      onConfirm: async () => {
        try {
          await publishAnnouncement(announcement.id);
          showToast("发布成功", "success");
          loadAnnouncements();
        } catch (error: any) {
          showToast(error.message || "发布失败", "error");
        }
      },
    });
  };

  // 获取目标受众描述
  const getTargetDescription = (announcement: Announcement): string => {
    const { targetType, targetIds = [] } = announcement;

    switch (targetType) {
      case "all":
        return "所有在线用户";
      case "user":
        return targetIds.length > 0
          ? `${targetIds.length} 个指定用户`
          : "未选择用户";
      case "role":
        return targetIds.length > 0
          ? `${targetIds.length} 个角色的用户`
          : "未选择角色";
      case "membership":
        return targetIds.length > 0
          ? `${targetIds.length} 个会员等级的用户`
          : "未选择会员等级";
      default:
        return "所有用户";
    }
  };

  // 推送公告（先发布再推送）
  const handlePush = (announcement: Announcement) => {
    const targetDesc = getTargetDescription(announcement);

    // 检查是否选择了目标
    const hasTargets =
      announcement.targetType === "all" ||
      (announcement.targetIds && announcement.targetIds.length > 0);

    if (!hasTargets) {
      showToast("请先选择目标受众", "error");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "推送公告",
      message: `确定要发布并推送公告"${announcement.title}"吗？将立即通过WebSocket推送给【${targetDesc}】。`,
      confirmColor: "blue",
      onConfirm: async () => {
        try {
          // 先发布（如果未发布）
          if (!announcement.isActive) {
            await publishAnnouncement(announcement.id);
          }
          // 再推送
          await pushAnnouncement(announcement.id);
          showToast("发布并推送成功", "success");
          loadAnnouncements();
        } catch (error: any) {
          showToast(error.message || "推送失败", "error");
        }
      },
    });
  };

  // 类型标签样式
  const getTypeBadge = (type: AnnouncementType) => {
    const styles = {
      system: "bg-blue-100 text-blue-800",
      activity: "bg-purple-100 text-purple-800",
      maintenance: "bg-orange-100 text-orange-800",
      feature: "bg-green-100 text-green-800",
      notice: "bg-gray-100 text-gray-800",
    };
    const labels = {
      system: "系统",
      activity: "活动",
      maintenance: "维护",
      feature: "新功能",
      notice: "通知",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[type]}`}
      >
        {labels[type]}
      </span>
    );
  };

  // 级别标签样式
  const getLevelBadge = (level: AnnouncementLevel) => {
    const styles = {
      info: "bg-blue-100 text-blue-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      success: "bg-green-100 text-green-800",
    };
    const labels = {
      info: "信息",
      warning: "警告",
      error: "错误",
      success: "成功",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[level]}`}
      >
        {labels[level]}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            公告管理
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            管理系统公告和通知
          </p>
        </div>
        {hasButtonPermission(user, PERMISSIONS.ANNOUNCEMENT.CREATE) && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            + 创建公告
          </button>
        )}
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <select
            value={filters.type || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                type: (e.target.value as AnnouncementType) || undefined,
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部类型</option>
            <option value="system">系统公告</option>
            <option value="activity">活动公告</option>
            <option value="maintenance">维护公告</option>
            <option value="feature">新功能公告</option>
            <option value="notice">通知公告</option>
          </select>
          <select
            value={filters.level || ""}
            onChange={(e) =>
              setFilters({
                ...filters,
                level: (e.target.value as AnnouncementLevel) || undefined,
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部级别</option>
            <option value="info">信息</option>
            <option value="warning">警告</option>
            <option value="error">错误</option>
            <option value="success">成功</option>
          </select>
          <select
            value={
              filters.isActive !== undefined ? String(filters.isActive) : ""
            }
            onChange={(e) =>
              setFilters({
                ...filters,
                isActive:
                  e.target.value === "" ? undefined : e.target.value === "true",
              })
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">全部状态</option>
            <option value="true">已启用</option>
            <option value="false">已禁用</option>
          </select>
        </div>
        <div className="mt-4">
          <button
            onClick={handleSearch}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 公告列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* 移动端卡片视图 */}
        <div className="block sm:hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : announcements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无数据</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-4">
                  <div className="mb-3">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="flex-1 font-medium text-gray-900">
                        {announcement.title}
                      </h3>
                      {announcement.isTop && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                          置顶
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(announcement.type)}
                      {getLevelBadge(announcement.level)}
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          announcement.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {announcement.isActive ? "已启用" : "已禁用"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {announcement.summary}
                    </p>
                    <div className="text-xs text-gray-400 mt-2">
                      浏览 {announcement.viewCount} · 已读{" "}
                      {announcement.readCount} · 点击 {announcement.clickCount}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {hasButtonPermission(
                      user,
                      PERMISSIONS.ANNOUNCEMENT.UPDATE
                    ) && (
                      <button
                        onClick={() => handleEdit(announcement)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      >
                        编辑
                      </button>
                    )}
                    {hasButtonPermission(
                      user,
                      PERMISSIONS.ANNOUNCEMENT.PUBLISH
                    ) &&
                      !announcement.publishedAt && (
                        <button
                          onClick={() => handlePublish(announcement)}
                          className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition"
                        >
                          发布
                        </button>
                      )}
                    {hasButtonPermission(
                      user,
                      PERMISSIONS.ANNOUNCEMENT.PUSH
                    ) && (
                      <button
                        onClick={() => handlePush(announcement)}
                        className="flex-1 px-3 py-2 text-sm bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition"
                      >
                        推送
                      </button>
                    )}
                    {hasButtonPermission(
                      user,
                      PERMISSIONS.ANNOUNCEMENT.DELETE
                    ) && (
                      <button
                        onClick={() => handleDelete(announcement)}
                        className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 桌面端表格视图 */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型/级别
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  统计
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    加载中...
                  </td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    暂无数据
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {announcement.isTop && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                            置顶
                          </span>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {announcement.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {announcement.summary}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {getTypeBadge(announcement.type)}
                        {getLevelBadge(announcement.level)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          announcement.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {announcement.isActive ? "已启用" : "已禁用"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-500">
                        <div>浏览 {announcement.viewCount}</div>
                        <div>已读 {announcement.readCount}</div>
                        <div>点击 {announcement.clickCount}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(announcement.createdAt).toLocaleDateString(
                        "zh-CN"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {hasButtonPermission(
                        user,
                        PERMISSIONS.ANNOUNCEMENT.UPDATE
                      ) && (
                        <button
                          onClick={() => handleEdit(announcement)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          编辑
                        </button>
                      )}
                      {hasButtonPermission(
                        user,
                        PERMISSIONS.ANNOUNCEMENT.PUBLISH
                      ) &&
                        !announcement.publishedAt && (
                          <button
                            onClick={() => handlePublish(announcement)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            发布
                          </button>
                        )}
                      {hasButtonPermission(
                        user,
                        PERMISSIONS.ANNOUNCEMENT.PUSH
                      ) && (
                        <button
                          onClick={() => handlePush(announcement)}
                          className="text-purple-600 hover:text-purple-900 mr-3"
                        >
                          推送
                        </button>
                      )}
                      {hasButtonPermission(
                        user,
                        PERMISSIONS.ANNOUNCEMENT.DELETE
                      ) && (
                        <button
                          onClick={() => handleDelete(announcement)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {!loading && announcements.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                共 {pagination.total} 条记录，第 {pagination.page} /{" "}
                {pagination.totalPages} 页
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmColor={confirmDialog.confirmColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* 编辑模态框 */}
      {editModal.isOpen && (
        <AnnouncementModal
          announcement={editModal.announcement}
          onClose={() => setEditModal({ ...editModal, isOpen: false })}
          onSuccess={() => {
            setEditModal({ ...editModal, isOpen: false });
            loadAnnouncements();
          }}
        />
      )}
    </div>
  );
}
