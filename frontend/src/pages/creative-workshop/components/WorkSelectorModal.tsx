import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, BookOpen, Check } from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { novelsApi } from "../../../services/novels.api";

interface Work {
  id: number;
  name: string;
  coverImage?: string;
  chapterCount?: number;
}

interface WorkSelectorModalProps {
  isOpen: boolean;
  selectedWorkId?: number;
  onSelect: (workId: number, workName: string) => void;
  onClose: () => void;
}

/**
 * 作品选择器 - 用于关联作品（启用@功能）
 */
const WorkSelectorModal: React.FC<WorkSelectorModalProps> = ({
  isOpen,
  selectedWorkId,
  onSelect,
  onClose,
}) => {
  const { error: showError } = useToast();
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [tempSelected, setTempSelected] = useState<number | undefined>(
    selectedWorkId
  );

  // 加载用户作品列表
  useEffect(() => {
    if (!isOpen) return;

    const fetchWorks = async () => {
      setLoading(true);
      try {
        const result = await novelsApi.getMyNovels({
          page: 1,
          pageSize: 100,
        });
        // 处理返回格式（可能是数组或分页对象）
        const worksData = Array.isArray(result) ? result : result.data;
        setWorks(worksData || []);
      } catch (error) {
        console.error("获取作品列表失败:", error);
        showError("获取作品列表失败");
      } finally {
        setLoading(false);
      }
    };

    fetchWorks();
  }, [isOpen, showError]);

  // 重置临时选择
  useEffect(() => {
    if (isOpen) {
      setTempSelected(selectedWorkId);
    }
  }, [isOpen, selectedWorkId]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (tempSelected) {
      const work = works.find((w) => w.id === tempSelected);
      if (work) {
        onSelect(tempSelected, work.name);
        onClose();
      }
    } else {
      // 清除关联
      onSelect(0, "");
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">关联作品</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                关联作品后可使用@功能引用人物卡、世界观等
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-3"></div>
                <p className="text-gray-500">加载中...</p>
              </div>
            </div>
          ) : works.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">暂无作品</p>
              <p className="text-gray-400 text-sm">
                请先创建作品后再使用关联功能
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 不关联选项 */}
              <button
                onClick={() => setTempSelected(undefined)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  tempSelected === undefined
                    ? "border-gray-400 bg-gray-50 shadow-md"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                      <X className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        不关联作品
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        无法使用@功能，但可以使用通用提示词
                      </div>
                    </div>
                  </div>
                  {tempSelected === undefined && (
                    <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>

              {/* 作品列表 */}
              {works.map((work) => (
                <button
                  key={work.id}
                  onClick={() => setTempSelected(work.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    tempSelected === work.id
                      ? "border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-md"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {work.name}
                        </div>
                      </div>
                    </div>
                    {tempSelected === work.id && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-medium"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-8 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WorkSelectorModal;
