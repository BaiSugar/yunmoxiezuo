import React, { useState, useEffect } from "react";
import { Edit2, Trash2, Star, Eye, EyeOff, Plus, Loader2 } from "lucide-react";
import {
  getAllFonts,
  updateFont,
  deleteFont,
  setDefaultFont,
} from "../../api/fonts";
import type { Font } from "../../api/fonts";
import { FontUploadModal } from "./FontUploadModal";
import { FontEditModal } from "./FontEditModal";

/**
 * 字体管理页面
 */
export const FontManagement: React.FC = () => {
  const [fonts, setFonts] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingFont, setEditingFont] = useState<Font | null>(null);

  useEffect(() => {
    loadFonts();
  }, []);

  const loadFonts = async () => {
    setLoading(true);
    try {
      const fonts = await getAllFonts();
      // 响应拦截器已经提取了 data.data，所以这里直接使用返回的数组
      setFonts(Array.isArray(fonts) ? fonts : []);
    } catch (error: any) {
      console.error("加载字体列表失败:", error);
      alert(
        error.response?.data?.message || error.message || "加载字体列表失败"
      );
      setFonts([]); // 出错时设置为空数组
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (font: Font) => {
    try {
      await updateFont(font.id, { isEnabled: !font.isEnabled });
      await loadFonts();
    } catch (error: any) {
      alert(error.response?.data?.message || "操作失败");
    }
  };

  const handleSetDefault = async (font: Font) => {
    if (!confirm(`确定将"${font.displayName}"设为默认字体吗？`)) return;

    try {
      await setDefaultFont(font.id);
      await loadFonts();
    } catch (error: any) {
      alert(error.response?.data?.message || "设置失败");
    }
  };

  const handleDelete = async (font: Font) => {
    if (
      !confirm(
        `确定删除字体"${font.displayName}"吗？${
          font.format !== "system" ? "字体文件也会被删除。" : ""
        }`
      )
    )
      return;

    try {
      await deleteFont(font.id);
      await loadFonts();
    } catch (error: any) {
      alert(error.response?.data?.message || "删除失败");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "-";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">字体管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            上传和管理编辑器可用的字体文件
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          上传字体
        </button>
      </div>

      {/* 提示信息 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          💡 字体系统说明
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • <strong>系统字体</strong>:
            无需上传文件，使用用户操作系统的字体（跨平台兼容）
          </li>
          <li>
            • <strong>Web 字体</strong>:
            上传字体文件到服务器，所有用户都能看到相同效果
          </li>
          <li>
            • <strong>推荐格式</strong>: WOFF2（压缩率高，现代浏览器支持）
          </li>
          <li>
            • <strong>文件大小</strong>: 中文字体通常
            10-20MB，建议使用子集化字体
          </li>
        </ul>
      </div>

      {/* 字体列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  字体名称
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  分类
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  格式
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  大小
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">
                  状态
                </th>
                <th className="text-right p-4 text-sm font-semibold text-gray-700">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {fonts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    暂无字体，请上传字体文件
                  </td>
                </tr>
              ) : (
                fonts.map((font) => (
                  <tr
                    key={font.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {font.isDefault && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <div>
                          <div className="font-medium text-gray-800">
                            {font.displayName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {font.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {font.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-gray-600 font-mono uppercase">
                        {font.format}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatFileSize(font.fileSize)}
                    </td>
                    <td className="p-4">
                      {font.isEnabled ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <Eye className="w-4 h-4" />
                          已启用
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400 text-sm">
                          <EyeOff className="w-4 h-4" />
                          已禁用
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* 启用/禁用 */}
                        <button
                          onClick={() => handleToggleEnabled(font)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title={font.isEnabled ? "禁用" : "启用"}
                        >
                          {font.isEnabled ? (
                            <EyeOff className="w-4 h-4 text-gray-600" />
                          ) : (
                            <Eye className="w-4 h-4 text-gray-600" />
                          )}
                        </button>

                        {/* 设为默认 */}
                        {!font.isDefault && (
                          <button
                            onClick={() => handleSetDefault(font)}
                            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                            title="设为默认字体"
                          >
                            <Star className="w-4 h-4 text-gray-600" />
                          </button>
                        )}

                        {/* 编辑 */}
                        <button
                          onClick={() => setEditingFont(font)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4 text-blue-600" />
                        </button>

                        {/* 删除 */}
                        <button
                          onClick={() => handleDelete(font)}
                          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 上传字体模态框 */}
      {showUploadModal && (
        <FontUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadFonts();
          }}
        />
      )}

      {/* 编辑字体模态框 */}
      {editingFont && (
        <FontEditModal
          font={editingFont}
          onClose={() => setEditingFont(null)}
          onSuccess={() => {
            setEditingFont(null);
            loadFonts();
          }}
        />
      )}
    </div>
  );
};
