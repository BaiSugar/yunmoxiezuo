import React, { useState } from "react";
import { X, Edit3, Check } from "lucide-react";

interface TitleSelectorModalProps {
  titles: string[];
  synopsis: string;
  selectedTitle: string;
  onConfirm: (title: string, synopsis: string) => void;
  onCancel: () => void;
}

/**
 * 书名选择器组件
 * 允许用户选择AI生成的书名或自定义
 */
const TitleSelectorModal: React.FC<TitleSelectorModalProps> = ({
  titles,
  synopsis,
  selectedTitle,
  onConfirm,
  onCancel,
}) => {
  const [selected, setSelected] = useState(selectedTitle);
  const [editedSynopsis, setEditedSynopsis] = useState(synopsis);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [customTitle, setCustomTitle] = useState("");

  const handleConfirm = () => {
    const finalTitle = isEditingTitle ? customTitle : selected;
    if (!finalTitle.trim()) {
      alert("请输入书名");
      return;
    }
    onConfirm(finalTitle, editedSynopsis);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                📖 选择书名和简介
              </h2>
              <p className="text-gray-600 mt-1">
                AI已生成多个书名供您选择，也可以自定义
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/50 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI生成的书名选项 */}
          {!isEditingTitle && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                AI生成的书名
              </h3>
              <div className="space-y-2">
                {titles.map((title, index) => (
                  <button
                    key={index}
                    onClick={() => setSelected(title)}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                      selected === title
                        ? "border-purple-500 bg-purple-50"
                        : "border-gray-200 hover:border-purple-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{title}</span>
                      {selected === title && (
                        <Check className="w-5 h-5 text-purple-500" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsEditingTitle(true);
                  setCustomTitle(selected);
                }}
                className="mt-3 w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                自定义书名
              </button>
            </div>
          )}

          {/* 自定义书名 */}
          {isEditingTitle && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  自定义书名
                </h3>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  返回选择
                </button>
              </div>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="请输入书名"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
          )}

          {/* 简介编辑 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              作品简介
            </h3>
            <textarea
              value={editedSynopsis}
              onChange={(e) => setEditedSynopsis(e.target.value)}
              rows={6}
              placeholder="请输入或编辑简介"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              提示：好的简介能帮助AI更好地生成后续内容
            </p>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 transition-all"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              确认并继续
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TitleSelectorModal;

