import React from "react";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
} from "lucide-react";

interface ReviewIssue {
  type: "logic" | "character" | "continuity" | "style";
  severity: "high" | "medium" | "low";
  description: string;
  location: string;
}

interface ReviewReport {
  chapterId: number;
  score: number;
  issues: ReviewIssue[];
  suggestions: string[];
  strengths: string[];
}

interface ReviewReportCardProps {
  reviewReport: ReviewReport;
  chapterTitle: string;
  chapterOrder: number;
}

const issueTypeLabels: Record<string, string> = {
  logic: "逻辑",
  character: "角色",
  continuity: "连贯性",
  style: "风格",
};

const issueTypeColors: Record<string, string> = {
  logic: "text-red-600",
  character: "text-orange-600",
  continuity: "text-yellow-600",
  style: "text-blue-600",
};

/**
 * 审稿报告卡片组件
 */
const ReviewReportCard: React.FC<ReviewReportCardProps> = ({
  reviewReport,
  chapterTitle,
  chapterOrder,
}) => {
  const { score, issues, suggestions, strengths } = reviewReport;

  // 根据评分确定颜色
  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 bg-green-50";
    if (score >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 85) return "border-green-500";
    if (score >= 70) return "border-yellow-500";
    return "border-red-500";
  };

  return (
    <div
      className={`bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border-2 ${getScoreBorderColor(
        score
      )}`}
    >
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            第 {chapterOrder} 章审稿报告
          </h3>
          <p className="text-gray-600 mt-1">{chapterTitle}</p>
        </div>
        <div
          className={`px-6 py-3 rounded-xl ${getScoreColor(
            score
          )} border-2 ${getScoreBorderColor(score)}`}
        >
          <div className="text-sm">综合评分</div>
          <div className="text-3xl font-bold">{score}</div>
        </div>
      </div>

      {/* 问题列表 */}
      {issues.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h4 className="font-semibold text-gray-900">
              发现问题 ({issues.length})
            </h4>
          </div>
          <div className="space-y-3">
            {issues.map((issue, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl ${
                  issue.severity === "high"
                    ? "bg-red-50 border border-red-200"
                    : issue.severity === "medium"
                    ? "bg-orange-50 border border-orange-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {issue.severity === "high" ? (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    ) : issue.severity === "medium" ? (
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                    ) : (
                      <Info className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          issue.severity === "high"
                            ? "bg-red-200 text-red-800"
                            : issue.severity === "medium"
                            ? "bg-orange-200 text-orange-800"
                            : "bg-yellow-200 text-yellow-800"
                        }`}
                      >
                        {issue.severity === "high"
                          ? "高"
                          : issue.severity === "medium"
                          ? "中"
                          : "低"}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          issueTypeColors[issue.type]
                        }`}
                      >
                        [{issueTypeLabels[issue.type]}]
                      </span>
                      <span className="text-xs text-gray-500">
                        {issue.location}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{issue.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 改进建议 */}
      {suggestions.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">改进建议</h4>
          </div>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="text-blue-500 flex-shrink-0 mt-1">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 优点 */}
      {strengths.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">优点</h4>
          </div>
          <ul className="space-y-2">
            {strengths.map((strength, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="text-green-500 flex-shrink-0 mt-1">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReviewReportCard;
