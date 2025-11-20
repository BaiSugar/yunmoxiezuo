import React, { useState, useEffect } from "react";
import { X, MessageSquare, Trash2, Calendar } from "lucide-react";
import { chatHistoriesApi } from "../../../../services/chat-histories.api";
import type { ChatHistory } from "../../../../services/chat-histories.api";

// 简单的相对时间格式化函数
const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return "未知";

  // 转换为 Date 对象
  const dateObj = typeof date === "string" ? new Date(date) : date;

  // 验证日期有效性
  if (isNaN(dateObj.getTime())) return "未知";

  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;
  return `${Math.floor(days / 365)}年前`;
};

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (historyId: number) => void;
  onDelete: (historyId: number) => void;
  novelId?: number;
  categoryId?: number; // 提示词分类ID（用于创意工坊筛选）
  categoryName?: string; // 分类名称（用于标题栏显示）
}

/**
 * 对话历史记录模态框
 */
export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onDelete,
  novelId,
  categoryId,
  categoryName,
}) => {
  const [histories, setHistories] = useState<ChatHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    historyId: number | null;
    historyName: string;
  }>({ show: false, historyId: null, historyName: "" });

  // 从后端加载历史记录
  useEffect(() => {
    if (isOpen) {
      loadHistories();
    }
  }, [isOpen]);

  const loadHistories = async () => {
    setLoading(true);
    try {
      const response = await chatHistoriesApi.getList({
        page: 1,
        limit: 50, // 每页数量
        novelId, // 按小说ID筛选，只获取AI写作助手场景的对话
        categoryId, // 按分类ID筛选（创意工坊模式）
      });
      setHistories(response.data.data.data || []);
    } catch (error) {
      console.error("加载历史记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (
    historyId: number,
    historyName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setDeleteConfirm({ show: true, historyId, historyName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.historyId) return;

    try {
      await chatHistoriesApi.delete(deleteConfirm.historyId);
      setHistories(histories.filter((h) => h.id !== deleteConfirm.historyId));
      onDelete(deleteConfirm.historyId);
      setDeleteConfirm({ show: false, historyId: null, historyName: "" });
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败，请重试");
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ show: false, historyId: null, historyName: "" });
  };

  const handleSelect = (historyId: number) => {
    onSelect(historyId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <div>
              <h2 className="text-sm font-semibold text-gray-900">对话历史</h2>
              {categoryName && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {categoryName}生成器
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* 历史记录列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="text-xs text-gray-500">加载中...</div>
            </div>
          ) : histories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-xs">暂无对话历史</p>
            </div>
          ) : (
            <div className="space-y-2">
              {histories.map((history) => (
                <div
                  key={history.id}
                  onClick={() => handleSelect(history.id)}
                  className="group p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      <h3 className="text-sm font-medium text-gray-900 truncate mb-1">
                        {history.chatName || "未命名对话"}
                      </h3>

                      {/* 预览内容 */}
                      <p className="text-xs text-gray-600 line-clamp-2 mb-1.5">
                        {history.metadata?.preview || "暂无内容"}
                      </p>

                      {/* 元信息 */}
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {history.messageCount} 条
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatRelativeTime(history.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* 删除按钮 - 手机端始终显示，PC端悬停显示 */}
                    <button
                      onClick={(e) =>
                        handleDeleteClick(
                          history.id,
                          history.chatName || "未命名对话",
                          e
                        )
                      }
                      className="lg:opacity-0 lg:group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded transition-all flex-shrink-0"
                      title="删除"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            共 {histories.length} 条对话记录
          </p>
        </div>
      </div>

      {/* 删除确认对话框 */}
      {deleteConfirm.show && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-10">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  确认删除
                </h3>
                <p className="text-sm text-gray-600">
                  确定要删除对话「{deleteConfirm.historyName}」吗？
                </p>
                <p className="text-xs text-gray-500 mt-1">此操作无法撤销</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
