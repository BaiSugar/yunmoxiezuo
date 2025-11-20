import React, { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { uploadFont } from "../../api/fonts";
import type { UploadFontDto } from "../../api/fonts";

interface FontUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 字体上传模态框
 */
export const FontUploadModal: React.FC<FontUploadModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<UploadFontDto>({
    name: "",
    displayName: "",
    category: "推荐",
    description: "",
    sortOrder: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件格式
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["ttf", "otf", "woff", "woff2"].includes(ext || "")) {
      alert("只支持 TTF, OTF, WOFF, WOFF2 格式的字体文件");
      return;
    }

    // 验证文件大小（限制50MB）
    if (file.size > 50 * 1024 * 1024) {
      alert("字体文件不能超过 50MB");
      return;
    }

    setSelectedFile(file);

    // 自动填充字体名称
    if (!formData.name) {
      const baseName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, "");
      setFormData((prev) => ({
        ...prev,
        name: baseName.replace(/[^a-zA-Z0-9-_]/g, ""),
        displayName: baseName,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      alert("请选择字体文件");
      return;
    }

    if (!formData.name || !formData.displayName) {
      alert("请填写字体名称和显示名称");
      return;
    }

    setUploading(true);
    try {
      await uploadFont(selectedFile, formData);
      alert("字体上传成功");
      onSuccess();
    } catch (error: any) {
      console.error("上传字体失败:", error);
      alert(error.response?.data?.message || "上传字体失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">上传字体</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 文件选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              字体文件 *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <div className="text-sm">
                    <div className="font-medium text-gray-800">
                      {selectedFile.name}
                    </div>
                    <div className="text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">点击选择字体文件</p>
                  <p className="text-xs text-gray-400 mt-1">
                    支持 TTF, OTF, WOFF, WOFF2 格式（推荐 WOFF2）
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* 字体名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              字体名称（font-family）*
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="例如: SourceHanSerif (英文无空格)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              用于 CSS font-family，建议使用英文，不含空格
            </p>
          </div>

          {/* 显示名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              显示名称 *
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
              placeholder="例如: 思源宋体"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              用户在下拉列表中看到的名称
            </p>
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类 *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  category: e.target.value as any,
                }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="推荐">推荐</option>
              <option value="中文">中文</option>
              <option value="英文">英文</option>
              <option value="特殊">特殊</option>
            </select>
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="字体的特点和适用场景"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 排序 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              排序顺序
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sortOrder: parseInt(e.target.value),
                }))
              }
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={uploading}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  上传字体
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
