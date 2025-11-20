import React, { useState, useRef, useEffect } from "react";
import { Upload, X, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";

interface CoverUploadProps {
  value?: string | File;  // 支持URL字符串或File对象
  onChange: (value: string | File) => void;
  disabled?: boolean;
}

/**
 * 封面上传组件
 * 选择文件后只预览，不立即上传，在表单提交时才上传
 */
const CoverUpload: React.FC<CoverUploadProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { error: showError } = useToast();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlValue, setUrlValue] = useState("");
  const [imageError, setImageError] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 根据value生成预览URL
  useEffect(() => {
    if (value instanceof File) {
      // 如果是File对象，创建预览URL
      const objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (typeof value === 'string' && value) {
      // 如果是URL字符串，直接使用
      setPreviewUrl(value);
    } else {
      setPreviewUrl("");
    }
  }, [value]);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        showError("选择失败", "只能选择图片文件");
        return;
      }

      // 验证文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        showError("选择失败", "图片大小不能超过5MB");
        return;
      }

      setImageError(false);
      // 将File对象传递给父组件，等表单提交时上传
      onChange(file);
    }
  };

  // 处理拖拽上传
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        showError("选择失败", "只能选择图片文件");
        return;
      }

      // 验证文件大小（5MB）
      if (file.size > 5 * 1024 * 1024) {
        showError("选择失败", "图片大小不能超过5MB");
        return;
      }

      setImageError(false);
      onChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 处理URL提交
  const handleUrlSubmit = () => {
    if (!urlValue.trim()) return;

    setImageError(false);
    onChange(urlValue.trim());
    setUrlValue("");
    setShowUrlInput(false);
  };

  // 清除封面
  const handleClear = () => {
    setImageError(false);
    setPreviewUrl("");
    onChange("");
  };

  // 图片加载错误处理
  const handleImageError = () => {
    setImageError(true);
  };

  // 图片加载成功处理
  const handleImageLoad = () => {
    setImageError(false);
  };

  return (
    <div className="space-y-3">
      {/* 封面预览/上传区域 */}
      <div
        className="relative w-full h-48 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {previewUrl && !imageError ? (
          // 显示封面预览
          <div className="relative w-full h-full group">
            <img
              src={previewUrl}
              alt="封面预览"
              className="w-full h-full object-cover"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
            {/* 删除按钮 */}
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {/* 遮罩提示 */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-sm">点击更换封面</p>
            </div>
            {/* 点击区域 */}
            {!disabled && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 w-full h-full cursor-pointer"
              />
            )}
          </div>
        ) : (
          // 显示上传区域
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
            {imageError ? (
              <>
                <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm text-red-500 mb-1">图片加载失败</p>
                <p className="text-xs text-gray-400 mb-3">URL可能无效或无法访问</p>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-blue-500 hover:text-blue-600"
                >
                  移除封面
                </button>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 mb-1">
                  拖拽图片到此处，或点击选择
                </p>
                <p className="text-xs text-gray-400">
                  支持 JPG、PNG、WebP，最大 5MB
                </p>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                  >
                    选择文件
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {!disabled && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg transition-colors"
          >
            <LinkIcon className="w-4 h-4" />
            {showUrlInput ? "取消" : "使用URL"}
          </button>
        </div>
      )}

      {/* URL输入框 */}
      {showUrlInput && (
        <div className="flex gap-2">
          <input
            type="text"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
            placeholder="请输入图片URL"
            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            disabled={!urlValue.trim()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确定
          </button>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

export default CoverUpload;
