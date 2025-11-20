import React, { useState, useEffect } from "react";
import { Check, X, AlertTriangle, Info } from "lucide-react";
import { promptReportsApi } from "../api/prompts";
import type { PromptReport } from "../api/prompts";

const REASON_MAP: Record<string, string> = {
  spam: "垃圾信息",
  inappropriate: "不当内容",
  violence: "暴力内容",
  hate_speech: "仇恨言论",
  pornography: "色情内容",
  copyright: "版权侵犯",
  fraud: "欺诈内容",
  other: "其他",
};

export const ReportManagement: React.FC = () => {
  const [reports, setReports] = useState<PromptReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadReports();
  }, [page, statusFilter]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const response = await promptReportsApi.getAllReports({
        page,
        pageSize,
        status: statusFilter as any,
      });
      // request拦截器已经返回了data，所以response就是实际的数据
      if (response && response.data) {
        setReports(response.data);
        setTotal(response.pagination?.total || 0);
      } else {
        setReports([]);
        setTotal(0);
      }
    } catch (error: any) {
      console.error("加载失败:", error);
      setReports([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (
    reportId: number,
    status: "approved" | "rejected"
  ) => {
    const reviewNote = prompt(
      status === "approved" ? "批准原因（选填）：" : "驳回原因（选填）："
    );

    try {
      await promptReportsApi.reviewReport(reportId, {
        status,
        reviewNote: reviewNote || undefined,
      });
      alert(status === "approved" ? "已批准举报" : "已驳回举报");
      loadReports();
    } catch (error: any) {
      alert(error.response?.data?.message || "审核失败");
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">举报审核</h1>
        <p className="text-gray-600">审核用户举报的提示词</p>
      </div>

      {/* 筛选 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setStatusFilter("pending");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === "pending"
                ? "bg-yellow-100 text-yellow-800 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            待审核
          </button>
          <button
            onClick={() => {
              setStatusFilter("approved");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === "approved"
                ? "bg-green-100 text-green-800 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            已批准
          </button>
          <button
            onClick={() => {
              setStatusFilter("rejected");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === "rejected"
                ? "bg-red-100 text-red-800 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            已驳回
          </button>
          <button
            onClick={() => {
              setStatusFilter("");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg ${
              statusFilter === ""
                ? "bg-blue-100 text-blue-800 font-medium"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            全部
          </button>
        </div>
      </div>

      {/* 举报列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-8 text-center text-gray-600">暂无举报记录</div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    被举报提示词
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    举报人
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    举报原因
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    时间
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <React.Fragment key={report.id}>
                    <tr>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {report.prompt.name}
                            </div>
                            {report.prompt.isBanned && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mt-1">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                已封禁
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.reporter.nickname || report.reporter.username}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium">
                          {REASON_MAP[report.reason] || report.reason}
                        </div>
                        {report.description && (
                          <div className="text-sm text-gray-500 mt-1 max-w-xs line-clamp-2">
                            {report.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            report.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : report.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {report.status === "pending"
                            ? "待审核"
                            : report.status === "approved"
                            ? "已批准"
                            : "已驳回"}
                        </span>
                        {report.reviewNote && (
                          <div className="text-xs text-gray-500 mt-1">
                            {report.reviewNote}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === report.id ? null : report.id
                              )
                            }
                            className="text-blue-600 hover:text-blue-900"
                            title={
                              expandedId === report.id ? "收起详情" : "查看详情"
                            }
                          >
                            <Info className="w-5 h-5" />
                          </button>
                          {report.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleReview(report.id, "approved")
                                }
                                className="text-green-600 hover:text-green-900"
                                title="批准"
                              >
                                <Check className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleReview(report.id, "rejected")
                                }
                                className="text-red-600 hover:text-red-900"
                                title="驳回"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {/* 展开的详细信息 */}
                    {expandedId === report.id && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  举报ID：
                                </span>
                                <span className="text-sm text-gray-900">
                                  {report.id}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  提示词ID：
                                </span>
                                <span className="text-sm text-gray-900">
                                  {report.promptId}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  举报人ID：
                                </span>
                                <span className="text-sm text-gray-900">
                                  {report.reporter.id}
                                </span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-700">
                                  举报时间：
                                </span>
                                <span className="text-sm text-gray-900">
                                  {new Date(report.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {report.description && (
                              <div>
                                <div className="text-sm font-medium text-gray-700 mb-1">
                                  详细描述：
                                </div>
                                <div className="text-sm text-gray-900 bg-white p-3 rounded border">
                                  {report.description}
                                </div>
                              </div>
                            )}
                            {report.status !== "pending" && report.reviewer && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <div className="text-sm font-medium text-blue-900 mb-1">
                                  审核信息
                                </div>
                                <div className="text-sm text-blue-700">
                                  <div>审核人：{report.reviewer.username}</div>
                                  {report.reviewNote && (
                                    <div>备注：{report.reviewNote}</div>
                                  )}
                                  {report.reviewedAt && (
                                    <div>
                                      时间：
                                      {new Date(
                                        report.reviewedAt
                                      ).toLocaleString()}
                                    </div>
                                  )}
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
          </>
        )}
      </div>
    </div>
  );
};
