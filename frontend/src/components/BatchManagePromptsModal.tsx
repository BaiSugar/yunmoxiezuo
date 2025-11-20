import React, { useState, useEffect } from "react";
import { X, Settings, AlertCircle } from "lucide-react";
import { promptsApi, promptCategoriesApi } from "../services/prompts.api";
import type { Prompt, PromptCategory } from "../types/prompt";
import { toast } from "react-hot-toast";

interface BatchManagePromptsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // 成功后的回调，用于刷新父组件数据
}

export const BatchManagePromptsModal: React.FC<
  BatchManagePromptsModalProps
> = ({ isOpen, onClose, onSuccess }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<PromptCategory[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 批量更新选项
  const [batchOptions, setBatchOptions] = useState({
    isPublic: undefined as boolean | undefined,
    isContentPublic: undefined as boolean | undefined,
    requireApplication: undefined as boolean | undefined,
  });

  // 按分类分组
  const [groupedPrompts, setGroupedPrompts] = useState<Map<string, Prompt[]>>(
    new Map()
  );

  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      const data = await promptsApi.getMyPrompts({
        categoryId: selectedCategoryId || undefined,
      });
      setPrompts(data);
    } catch (error: any) {
      toast.error("加载提示词失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      loadPrompts();
    } else {
      // 关闭时重置状态
      setSelectedIds([]);
      setSelectedCategoryId(null);
      setBatchOptions({
        isPublic: undefined,
        isContentPublic: undefined,
        requireApplication: undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 分类改变时重新加载提示词
  useEffect(() => {
    if (isOpen) {
      loadPrompts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, isOpen]);

  useEffect(() => {
    // 按分类分组
    const groups = new Map<string, Prompt[]>();
    prompts.forEach((prompt) => {
      const categoryName = prompt.category?.name || "未分类";
      if (!groups.has(categoryName)) {
        groups.set(categoryName, []);
      }
      groups.get(categoryName)!.push(prompt);
    });
    setGroupedPrompts(groups);
  }, [prompts]);

  const loadCategories = async () => {
    try {
      const data = await promptCategoriesApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === prompts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(prompts.map((p) => p.id));
    }
  };

  const handleSelectCategory = (categoryPrompts: Prompt[]) => {
    const categoryIds = categoryPrompts.map((p) => p.id);
    const allSelected = categoryIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      // 取消选择该分类
      setSelectedIds(selectedIds.filter((id) => !categoryIds.includes(id)));
    } else {
      // 选择该分类
      const newSelectedIds = [...new Set([...selectedIds, ...categoryIds])];
      setSelectedIds(newSelectedIds);
    }
  };

  const handleSelectPrompt = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchUpdate = async () => {
    if (selectedIds.length === 0) {
      toast.error("请至少选择一个提示词");
      return;
    }

    // 检查是否至少选择了一个更新选项
    if (
      batchOptions.isPublic === undefined &&
      batchOptions.isContentPublic === undefined &&
      batchOptions.requireApplication === undefined
    ) {
      toast.error("请至少选择一个更新选项");
      return;
    }

    setIsUpdating(true);

    try {
      const result = await promptsApi.batchUpdatePrompts({
        promptIds: selectedIds,
        ...batchOptions,
      });

      toast.success(`成功更新 ${result.success} 个提示词`);

      if (result.failed > 0) {
        toast.error(`${result.failed} 个提示词更新失败`);
      }

      // 重新加载并调用成功回调
      await loadPrompts();
      setSelectedIds([]);
      setBatchOptions({
        isPublic: undefined,
        isContentPublic: undefined,
        requireApplication: undefined,
      });

      // 通知父组件刷新
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "批量更新失败");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              批量管理提示词
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 分类筛选 */}
          <div className="mb-6">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <button
                onClick={() => setSelectedCategoryId(null)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex-shrink-0 ${
                  !selectedCategoryId
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all flex items-center space-x-2 flex-shrink-0 ${
                    selectedCategoryId === category.id
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 批量操作面板 */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                批量设置
              </h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                已选择: {selectedIds.length} 个
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  是否公开
                </label>
                <select
                  value={
                    batchOptions.isPublic === undefined
                      ? ""
                      : String(batchOptions.isPublic)
                  }
                  onChange={(e) =>
                    setBatchOptions({
                      ...batchOptions,
                      isPublic:
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">不修改</option>
                  <option value="true">公开</option>
                  <option value="false">私有</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  内容是否公开
                </label>
                <select
                  value={
                    batchOptions.isContentPublic === undefined
                      ? ""
                      : String(batchOptions.isContentPublic)
                  }
                  onChange={(e) =>
                    setBatchOptions({
                      ...batchOptions,
                      isContentPublic:
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">不修改</option>
                  <option value="true">公开</option>
                  <option value="false">不公开</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  是否需要申请
                </label>
                <select
                  value={
                    batchOptions.requireApplication === undefined
                      ? ""
                      : String(batchOptions.requireApplication)
                  }
                  onChange={(e) =>
                    setBatchOptions({
                      ...batchOptions,
                      requireApplication:
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true",
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">不修改</option>
                  <option value="true">需要申请</option>
                  <option value="false">无需申请</option>
                </select>
              </div>
            </div>
          </div>

          {/* 提示词列表 - 按分类分组 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600 dark:text-gray-400">加载中...</div>
            </div>
          ) : prompts.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-gray-600 dark:text-gray-400">
              暂无提示词
            </div>
          ) : (
            <div className="space-y-4">
              {/* 全选按钮 */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                >
                  {selectedIds.length === prompts.length ? "取消全选" : "全选"}
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  共 {prompts.length} 个提示词
                </span>
              </div>

              {/* 按分类分组显示 */}
              {Array.from(groupedPrompts.entries()).map(
                ([categoryName, categoryPrompts]) => {
                  const allSelected = categoryPrompts.every((p) =>
                    selectedIds.includes(p.id)
                  );
                  const someSelected = categoryPrompts.some((p) =>
                    selectedIds.includes(p.id)
                  );

                  return (
                    <div
                      key={categoryName}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      {/* 分类标题 */}
                      <div className="bg-gray-100 dark:bg-gray-700 p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(el) => {
                              if (el) {
                                el.indeterminate = someSelected && !allSelected;
                              }
                            }}
                            onChange={() =>
                              handleSelectCategory(categoryPrompts)
                            }
                            className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                          />
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {categoryName} ({categoryPrompts.length})
                          </h4>
                        </div>
                      </div>

                      {/* 分类下的提示词 */}
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {categoryPrompts.map((prompt) => (
                          <div
                            key={prompt.id}
                            className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(prompt.id)}
                                onChange={() => handleSelectPrompt(prompt.id)}
                                className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                              />

                              <div className="flex-1 min-w-0">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                                  {prompt.name}
                                </h3>

                                {prompt.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                    {prompt.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-2">
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      prompt.isPublic
                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    {prompt.isPublic ? "公开" : "私有"}
                                  </span>

                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                      prompt.isContentPublic
                                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    内容
                                    {prompt.isContentPublic ? "公开" : "不公开"}
                                  </span>

                                  {prompt.requireApplication && (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                      需要申请
                                    </span>
                                  )}

                                  {(prompt as any).isBanned && (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      已封禁
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* Footer - 操作按钮 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              disabled={isUpdating}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:border-gray-600 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleBatchUpdate}
              disabled={isUpdating || selectedIds.length === 0}
              className="px-8 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isUpdating ? "更新中..." : `批量更新 (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
