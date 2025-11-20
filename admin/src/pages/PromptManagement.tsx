import React, { useState, useEffect } from "react";
import { Ban, Unlock, AlertCircle, Info, Search } from "lucide-react";
import { promptsApi } from "../api/prompts";
import type { Prompt } from "../api/prompts";

export const PromptManagement: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [bannedFilter, setBannedFilter] = useState<string>("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadPrompts();
  }, [page, statusFilter, bannedFilter]);

  const loadPrompts = async () => {
    try {
      setIsLoading(true);
      const response = await promptsApi.getAllPromptsForAdmin({
        page,
        pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
      });
      console.log("📝 API响应:", response);
      // request拦截器已经返回了data，所以response就是实际的数据
      if (response && response.data) {
        setPrompts(response.data);
        setTotal(response.pagination?.total || 0);
      } else {
        setPrompts([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error("加载失败:", error);
      setPrompts([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadPrompts();
  };

  const handleBan = async (promptId: number, promptName: string) => {
    const reason = prompt(`请输入封禁「${promptName}」的原因：`);
    if (!reason) return;

    try {
      await promptsApi.banPrompt(promptId, reason);
      alert("封禁成功");
      loadPrompts();
    } catch (error: any) {
      alert(error.response?.data?.message || "封禁失败");
    }
  };

  const handleUnban = async (promptId: number, promptName: string) => {
    if (!confirm(`确定要解封「${promptName}」吗？`)) return;

    try {
      await promptsApi.unbanPrompt(promptId);
      alert("解封成功");
      loadPrompts();
    } catch (error: any) {
      alert(error.response?.data?.message || "解封失败");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">加载中...</div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">提示词管理</h1>
        <p className="text-gray-600">管理所有用户的提示词</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索提示词..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
          </div>

          <div>
            <select
              value={bannedFilter}
              onChange={(e) => {
                setBannedFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="banned">已封禁</option>
              <option value="normal">正常</option>
            </select>
          </div>
        </div>
      </div>

      {/* 提示词列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                提示词
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                作者
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                统计
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {prompts.map((prompt) => (
              <React.Fragment key={prompt.id}>
                <tr className={prompt.isBanned ? "bg-red-50" : ""}>
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          {prompt.name}
                          {prompt.isBanned && (
                            <AlertCircle className="w-4 h-4 ml-2 text-red-500" />
                          )}
                        </div>
                        {prompt.description && (
                          <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {prompt.description}
                          </div>
                        )}
                        {prompt.isBanned && prompt.bannedReason && (
                          <div className="text-xs text-red-600 mt-1">
                            封禁原因：{prompt.bannedReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {prompt.author?.nickname || prompt.author?.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {prompt.authorId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          prompt.isBanned
                            ? "bg-red-100 text-red-800"
                            : prompt.status === "published"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {prompt.isBanned
                          ? "已封禁"
                          : prompt.status === "published"
                          ? "已发布"
                          : prompt.status === "draft"
                          ? "草稿"
                          : "已归档"}
                      </span>
                      {prompt.isPublic && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          公开
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-500">
                      <div>浏览: {prompt.viewCount}</div>
                      <div>使用: {prompt.useCount}</div>
                      <div>点赞: {prompt.likeCount}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() =>
                          setExpandedId(
                            expandedId === prompt.id ? null : prompt.id
                          )
                        }
                        className="text-blue-600 hover:text-blue-900"
                        title={
                          expandedId === prompt.id ? "收起详情" : "查看详情"
                        }
                      >
                        <Info className="w-5 h-5" />
                      </button>
                      {prompt.isBanned ? (
                        <button
                          onClick={() => handleUnban(prompt.id, prompt.name)}
                          className="text-green-600 hover:text-green-900"
                          title="解封"
                        >
                          <Unlock className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBan(prompt.id, prompt.name)}
                          className="text-red-600 hover:text-red-900"
                          title="封禁"
                        >
                          <Ban className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {/* 展开的详细信息 */}
                {expandedId === prompt.id && (
                  <tr className={prompt.isBanned ? "bg-red-50" : "bg-gray-50"}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              提示词ID：
                            </span>
                            <span className="text-sm text-gray-900">
                              {prompt.id}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              创建时间：
                            </span>
                            <span className="text-sm text-gray-900">
                              {new Date(prompt.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              是否公开：
                            </span>
                            <span className="text-sm text-gray-900">
                              {prompt.isPublic ? "是" : "否"}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              内容公开：
                            </span>
                            <span className="text-sm text-gray-900">
                              {prompt.isContentPublic ? "是" : "否"}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              需要申请：
                            </span>
                            <span className="text-sm text-gray-900">
                              {prompt.requireApplication ? "是" : "否"}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-700">
                              热度值：
                            </span>
                            <span className="text-sm text-gray-900">
                              {prompt.hotValue}
                            </span>
                          </div>
                        </div>
                        {prompt.isBanned && (
                          <div className="bg-red-100 border border-red-300 rounded p-3">
                            <div className="text-sm font-medium text-red-900 mb-1">
                              封禁信息
                            </div>
                            <div className="text-sm text-red-700">
                              <div>原因：{prompt.bannedReason}</div>
                              <div>
                                时间：
                                {prompt.bannedAt
                                  ? new Date(prompt.bannedAt).toLocaleString()
                                  : "-"}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* 分页 */}
        {total > pageSize && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              显示第 {(page - 1) * pageSize + 1} 到{" "}
              {Math.min(page * pageSize, total)} 条，共 {total} 条
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= total}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
