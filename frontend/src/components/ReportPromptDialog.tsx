import React, { useState } from "react";
import { X } from "lucide-react";
import { promptReportsApi } from "../services/prompts.api";
import { useToast } from "../contexts/ToastContext";

interface ReportPromptDialogProps {
  promptId: number;
  promptName: string;
  isOpen: boolean;
  onClose: () => void;
}

const REPORT_REASONS = [
  { value: "spam", label: "垃圾信息" },
  { value: "inappropriate", label: "不当内容" },
  { value: "violence", label: "暴力内容" },
  { value: "hate_speech", label: "仇恨言论" },
  { value: "pornography", label: "色情内容" },
  { value: "copyright", label: "版权侵犯" },
  { value: "fraud", label: "欺诈内容" },
  { value: "other", label: "其他" },
] as const;

export const ReportPromptDialog: React.FC<ReportPromptDialogProps> = ({
  promptId,
  promptName,
  isOpen,
  onClose,
}) => {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  const handleReset = () => {
    setReason("");
    setDescription("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      showError("请选择举报原因");
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("[ReportPromptDialog] 提交举报:", {
        promptId,
        reason,
        description,
      });
      const result = await promptReportsApi.reportPrompt(promptId, {
        reason: reason as any,
        description,
      });
      console.log("[ReportPromptDialog] 举报成功:", result);
      showSuccess("举报已提交，我们会尽快处理");
      handleReset();
      onClose();
    } catch (error: any) {
      console.error("[ReportPromptDialog] 举报失败:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "举报失败，请稍后重试";
      console.error("[ReportPromptDialog] 错误详情:", {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            举报提示词
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              提示词名称
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-2 rounded">
              {promptName}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              举报原因 <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="">请选择举报原因</option>
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              详细描述（选填）
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="请详细描述您举报的原因..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description.length}/1000
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "提交中..." : "提交举报"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
