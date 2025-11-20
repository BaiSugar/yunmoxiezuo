import React, { useState, useEffect } from "react";
import { Clock, Check, Loader2, FileText, AlertCircle, X } from "lucide-react";
import { promptsApi } from "../../api/prompts";
import type { Prompt } from "../../types/prompt";

/**
 * 提示词审核页面
 * 功能：管理员审核需要审核的提示词
 */
const PromptReview: React.FC = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [autoPublish, setAutoPublish] = useState(false);
  const [reviewNote, setReviewNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    loadPrompts();
  }, [page]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      // 获取所有提示词，然后筛选需要审核的
      const response = await promptsApi.getAllPromptsForAdmin({
        page: 1,
        pageSize: 200, // 获取更多，然后客户端筛选（可能需要分页）
      });

      // 筛选出已提交审核的提示词（不包括刚被举报还未修改提交的）
      const needsReviewPrompts = response.data.filter(
        (p) => p.needsReview && p.reviewSubmittedAt
      );

      console.log("已提交审核的提示词:", needsReviewPrompts);

      setPrompts(needsReviewPrompts);
      setTotal(needsReviewPrompts.length);
      setTotalPages(Math.ceil(needsReviewPrompts.length / pageSize));
    } catch (err: any) {
      console.error("加载提示词失败:", err);
      setError(err.message || "加载提示词失败");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReviewModal = (
    prompt: Prompt,
    action: "approve" | "reject" = "approve"
  ) => {
    setSelectedPrompt(prompt);
    setReviewAction(action);
    setAutoPublish(false);
    setReviewNote("");
    setRejectReason("");
    setShowReviewModal(true);
  };

  const handleApprove = async () => {
    if (!selectedPrompt) return;

    try {
      setSubmitting(true);
      await promptsApi.approvePrompt(selectedPrompt.id, {
        autoPublish,
        reviewNote,
      });

      alert(
        `提示词 "${selectedPrompt.name}" 已审核通过${
          autoPublish ? "并发布" : ""
        }`
      );
      setShowReviewModal(false);
      setSelectedPrompt(null);
      loadPrompts();
    } catch (err: any) {
      console.error("审核失败:", err);
      alert(err.message || "审核失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPrompt) return;

    try {
      setSubmitting(true);
      await promptsApi.rejectPromptReview(selectedPrompt.id, {
        rejectReason,
      });

      alert(
        `提示词 "${selectedPrompt.name}" 审核已拒绝，作者可以修改后重新提交`
      );
      setShowReviewModal(false);
      setSelectedPrompt(null);
      loadPrompts();
    } catch (err: any) {
      console.error("拒绝失败:", err);
      alert(err.message || "拒绝失败");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-900">加载失败</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">提示词审核</h1>
        <p className="text-sm text-gray-600 mt-2">
          审核因违规被举报下架的提示词，决定是否允许其重新发布
        </p>
      </div>

      {prompts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            暂无需要审核的提示词
          </h3>
          <p className="text-sm text-gray-600">所有提示词都已审核完成</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提示词名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作者
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    创建时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {prompts.map((prompt) => (
                  <tr key={prompt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {prompt.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {prompt.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {prompt.author?.nickname ||
                        prompt.author?.username ||
                        "未知"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3 mr-1" />
                        待审核
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(prompt.createdAt).toLocaleString("zh-CN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() =>
                            handleOpenReviewModal(prompt, "approve")
                          }
                          className="text-green-600 hover:text-green-900"
                        >
                          通过
                        </button>
                        <button
                          onClick={() =>
                            handleOpenReviewModal(prompt, "reject")
                          }
                          className="text-red-600 hover:text-red-900"
                        >
                          拒绝
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                共 {total} 条记录，第 {page} / {totalPages} 页
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 
                           hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 
                           hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 审核模态框 */}
      {showReviewModal && selectedPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {reviewAction === "approve"
                  ? "审核通过提示词"
                  : "拒绝提示词审核"}
              </h3>
            </div>

            <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  提示词名称
                </label>
                {selectedPrompt.reviewSnapshot &&
                selectedPrompt.reviewSnapshot.name !== selectedPrompt.name ? (
                  <div className="space-y-1">
                    <p className="text-sm text-red-600 line-through">
                      原：{selectedPrompt.reviewSnapshot.name}
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      改：{selectedPrompt.name}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-900">{selectedPrompt.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  作者
                </label>
                <p className="text-sm text-gray-900">
                  {selectedPrompt.author?.nickname ||
                    selectedPrompt.author?.username ||
                    "未知"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                {selectedPrompt.reviewSnapshot &&
                selectedPrompt.reviewSnapshot.description !==
                  selectedPrompt.description ? (
                  <div className="space-y-1">
                    <p className="text-sm text-red-600 line-through">
                      原：{selectedPrompt.reviewSnapshot.description || "无"}
                    </p>
                    <p className="text-sm text-green-600 font-medium">
                      改：{selectedPrompt.description || "无"}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    {selectedPrompt.description || "无描述"}
                  </p>
                )}
              </div>

              {selectedPrompt.reviewSnapshot && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📊 内容详细对比
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-3 max-h-64 overflow-y-auto">
                    <div className="text-xs space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-300">
                        <span className="font-semibold text-gray-700">
                          统计信息
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-red-600 font-medium">
                            修改前：
                          </span>
                          <span className="ml-1">
                            {selectedPrompt.reviewSnapshot.contents?.length ||
                              0}{" "}
                            个内容块
                          </span>
                        </div>
                        <div>
                          <span className="text-green-600 font-medium">
                            修改后：
                          </span>
                          <span className="ml-1">
                            {selectedPrompt.contents?.length || 0} 个内容块
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 具体内容对比 */}
                    <div className="text-xs space-y-2">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-300">
                        <span className="font-semibold text-gray-700">
                          内容块对比
                        </span>
                      </div>
                      {selectedPrompt.reviewSnapshot.contents?.map(
                        (oldContent: any, index: number) => {
                          const newContent = selectedPrompt.contents?.[index];
                          const hasChanged =
                            newContent &&
                            (oldContent.name !== newContent.name ||
                              oldContent.content !== newContent.content ||
                              oldContent.role !== newContent.role);

                          return (
                            <div
                              key={index}
                              className={`p-2 rounded ${
                                hasChanged
                                  ? "bg-yellow-50 border border-yellow-200"
                                  : "bg-white border border-gray-200"
                              }`}
                            >
                              <div className="font-medium text-gray-700 mb-1">
                                内容块 #{index + 1}
                                {hasChanged && (
                                  <span className="ml-2 text-yellow-600">
                                    已修改
                                  </span>
                                )}
                              </div>

                              {/* 名称对比 */}
                              {oldContent.name !== newContent?.name && (
                                <div className="mb-1">
                                  <div className="text-red-600">
                                    名称：{oldContent.name}
                                  </div>
                                  <div className="text-green-600">
                                    改为：{newContent?.name || "已删除"}
                                  </div>
                                </div>
                              )}

                              {/* 角色对比 */}
                              {oldContent.role !== newContent?.role && (
                                <div className="mb-1">
                                  <div className="text-red-600">
                                    角色：{oldContent.role}
                                  </div>
                                  <div className="text-green-600">
                                    改为：{newContent?.role || "已删除"}
                                  </div>
                                </div>
                              )}

                              {/* 内容对比 */}
                              {oldContent.content !== newContent?.content && (
                                <div>
                                  <div className="text-red-600 truncate">
                                    内容：{oldContent.content?.substring(0, 50)}
                                    ...
                                  </div>
                                  <div className="text-green-600 truncate">
                                    改为：
                                    {newContent?.content?.substring(0, 50) ||
                                      "已删除"}
                                    ...
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}

                      {/* 新增的内容块 */}
                      {selectedPrompt.contents &&
                        selectedPrompt.contents.length >
                          (selectedPrompt.reviewSnapshot.contents?.length ||
                            0) && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded">
                            <div className="font-medium text-green-700">
                              ➕ 新增了{" "}
                              {selectedPrompt.contents.length -
                                (selectedPrompt.reviewSnapshot.contents
                                  ?.length || 0)}{" "}
                              个内容块
                            </div>
                          </div>
                        )}
                    </div>

                    <p className="text-gray-600 text-xs pt-2 border-t border-gray-300">
                      💡 提示：请仔细检查修改内容是否符合规范
                    </p>
                  </div>
                </div>
              )}

              {reviewAction === "approve" ? (
                // 审核通过表单
                <>
                  <div className="pt-4 border-t border-gray-200">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={autoPublish}
                        onChange={(e) => setAutoPublish(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        自动发布（审核通过后立即发布到广场）
                      </span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      审核备注（可选）
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                               focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="输入审核备注..."
                    />
                  </div>
                </>
              ) : (
                // 拒绝审核表单
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    拒绝原因（必填）
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none 
                             focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="请详细说明拒绝原因，帮助作者改进..."
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedPrompt(null);
                }}
                disabled={submitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 
                         hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>

              {reviewAction === "approve" ? (
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium 
                           hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>处理中...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>审核通过</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleReject}
                  disabled={submitting || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium 
                           hover:bg-red-600 disabled:opacity-50 flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>处理中...</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>拒绝审核</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptReview;
