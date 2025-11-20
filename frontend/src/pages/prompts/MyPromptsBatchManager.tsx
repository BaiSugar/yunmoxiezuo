import React, { useState, useEffect } from "react";
import { Settings, AlertCircle } from "lucide-react";
import { promptsApi } from "../../services/prompts.api";
import type { Prompt } from "../../types/prompt";
import { toast } from "react-hot-toast";

export const MyPromptsBatchManager: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 批量更新选项
  const [batchOptions, setBatchOptions] = useState({
    isPublic: undefined as boolean | undefined,
    isContentPublic: undefined as boolean | undefined,
    requireApplication: undefined as boolean | undefined,
  });

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      const data = await promptsApi.getMyPrompts();
      setPrompts(data);
    } catch (error: any) {
      toast.error("加载提示词失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === prompts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(prompts.map((p) => p.id));
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

      // 重新加载
      await loadPrompts();
      setSelectedIds([]);
      setBatchOptions({
        isPublic: undefined,
        isContentPublic: undefined,
        requireApplication: undefined,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "批量更新失败");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          提示词批量管理
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          选择多个提示词进行批量设置
        </p>
      </div>

      {/* 批量操作面板 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            批量设置
          </h2>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            已选择: {selectedIds.length} 个
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">不修改</option>
              <option value="true">需要申请</option>
              <option value="false">无需申请</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleBatchUpdate}
            disabled={isUpdating || selectedIds.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? "更新中..." : "批量更新"}
          </button>
        </div>
      </div>

      {/* 提示词列表 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {selectedIds.length === prompts.length ? "取消全选" : "全选"}
          </button>
        </div>

        {prompts.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">
            暂无提示词
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(prompt.id)}
                    onChange={() => handleSelectPrompt(prompt.id)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
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
                        内容{prompt.isContentPublic ? "公开" : "不公开"}
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
        )}
      </div>
    </div>
  );
};
