import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import type { Novel, NovelGenre, NovelStatus, NovelForm } from "./NovelCard";
import CoverUpload from "./CoverUpload";

interface EditNovelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  novel: Novel;
}

/**
 * 编辑作品模态框
 */
const EditNovelModal: React.FC<EditNovelModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  novel,
}) => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    synopsis: string;
    genres: NovelGenre[];
    form: NovelForm;
    status: NovelStatus;
    targetWordsPerChapter: number;
    coverImage: string | File;
  }>({
    name: novel.name,
    synopsis: novel.synopsis || "",
    genres: novel.genres,
    form: novel.form,
    status: novel.status,
    targetWordsPerChapter: novel.targetWordsPerChapter || 2000,
    coverImage: novel.coverImage || "",
  });

  const [errors, setErrors] = useState<{
    name?: string;
    synopsis?: string;
  }>({});

  // 当novel变化时更新表单数据
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: novel.name,
        synopsis: novel.synopsis || "",
        genres: novel.genres,
        form: novel.form,
        status: novel.status,
        targetWordsPerChapter: novel.targetWordsPerChapter || 2000,
        coverImage: novel.coverImage || "",
      });
      setErrors({});
    }
  }, [isOpen, novel]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 验证
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) {
      newErrors.name = "作品名称不能为空";
    }
    if (formData.name.length > 200) {
      newErrors.name = "作品名称不能超过200个字符";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const { novelsApi } = await import("../../services/novels.api");
      
      // 如果coverImage是File对象，先上传文件
      let coverImageUrl = formData.coverImage;
      if (formData.coverImage instanceof File) {
        const uploadResult = await novelsApi.uploadCover(formData.coverImage);
        coverImageUrl = uploadResult.url;
      }

      // 更新作品
      await novelsApi.updateNovel(novel.id, {
        ...formData,
        coverImage: typeof coverImageUrl === 'string' ? coverImageUrl : '',
      });

      // 显示成功提示
      success("更新成功", `作品《${formData.name}》已更新`);

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("更新作品失败:", error);
      const errorMessage =
        error.response?.data?.message || "更新失败，请稍后重试";
      showError("更新失败", errorMessage);
      setErrors({
        name: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* 头部 - 固定 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200/50 flex-shrink-0">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">编辑作品</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 表单 - 可滚动 */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <form id="edit-novel-form" onSubmit={handleSubmit} className="space-y-4">
          {/* 作品名称 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              作品名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              placeholder="请输入作品名称"
              disabled={loading}
              maxLength={200}
            />
            {errors.name && (
              <p className="mt-2 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 作品简介 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              作品简介
            </label>
            <textarea
              value={formData.synopsis}
              onChange={(e) =>
                setFormData({ ...formData, synopsis: e.target.value })
              }
              className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="请输入作品简介（可选）"
              rows={4}
              disabled={loading}
            />
          </div>

          {/* 封面上传 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              作品封面
            </label>
            <CoverUpload
              value={formData.coverImage}
              onChange={(url) => setFormData({ ...formData, coverImage: url })}
              disabled={loading}
            />
          </div>

          {/* 作品形式 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              作品形式 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.form}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  form: e.target.value as NovelForm,
                })
              }
              className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              disabled={loading}
            >
              <option value="novel">长篇</option>
              <option value="short_story">短篇</option>
              <option value="script">剧本</option>
              <option value="other">其他</option>
            </select>
          </div>

          {/* 作品类型（多选） */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              作品类型（可多选）
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-white/50 border border-gray-200/50 rounded-xl max-h-48 overflow-y-auto">
              {[
                { value: "fantasy", label: "玄幻" },
                { value: "traditional_fantasy", label: "传统玄幻" },
                { value: "urban", label: "都市" },
                { value: "history", label: "历史" },
                { value: "fictional", label: "架空" },
                { value: "mystery", label: "悬疑" },
                { value: "scifi", label: "科幻" },
                { value: "sports", label: "体育" },
                { value: "wuxia", label: "武侠" },
                { value: "apocalypse", label: "末日" },
                { value: "fanfiction", label: "动漫衍生" },
                { value: "film_tv", label: "影视" },
                { value: "espionage", label: "谍战" },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center space-x-2 cursor-pointer hover:bg-white/50 p-2 rounded-lg transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.genres.includes(option.value as NovelGenre)}
                    onChange={(e) => {
                      const genre = option.value as NovelGenre;
                      setFormData({
                        ...formData,
                        genres: e.target.checked
                          ? [...formData.genres, genre]
                          : formData.genres.filter((g) => g !== genre),
                      });
                    }}
                    disabled={loading}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500/50 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 作品状态 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              作品状态
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as NovelStatus,
                })
              }
              className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              disabled={loading}
            >
              <option value="ongoing">连载中</option>
              <option value="completed">已完结</option>
              <option value="archived">已归档</option>
              <option value="paused">已暂停</option>
            </select>
          </div>

          {/* 每章目标字数 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              每章目标字数
            </label>
            <input
              type="number"
              value={formData.targetWordsPerChapter || ""}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({
                  ...formData,
                  targetWordsPerChapter: value === "" ? 0 : parseInt(value),
                });
              }}
              onBlur={(e) => {
                // 失去焦点时，如果为空或小于100，设置为默认值2000
                const value = parseInt(e.target.value);
                if (!value || value < 100) {
                  setFormData({
                    ...formData,
                    targetWordsPerChapter: 2000,
                  });
                }
              }}
              className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
              min={100}
              max={50000}
              disabled={loading}
              placeholder="2000"
            />
            <p className="mt-1 text-xs text-gray-500">
              建议设置为2000-5000字，默认2000字
            </p>
          </div>
          </form>
        </div>

        {/* 按钮组 - 固定底部 */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3 p-4 sm:p-6 border-t border-gray-200/50 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50 text-sm sm:text-base"
          >
            取消
          </button>
          <button
            type="submit"
            form="edit-novel-form"
            disabled={loading}
            className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              "保存修改"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditNovelModal;
