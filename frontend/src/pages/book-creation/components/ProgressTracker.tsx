import React from "react";
import { CheckCircle, Circle, Loader } from "lucide-react";
import type {
  BookCreationTask,
  StageType,
  BookCreationProgressEvent,
} from "../../../types/book-creation";

interface Props {
  task: BookCreationTask;
  progressEvent?: BookCreationProgressEvent | null;
  viewingStage?: string; // 当前查看的阶段
  onStageClick?: (stageType: StageType) => void; // 阶段点击回调
  hasStageData?: (stageType: string) => boolean; // 检查阶段是否有数据
}

/**
 * 进度追踪器组件
 */
const ProgressTracker: React.FC<Props> = ({
  task,
  progressEvent,
  viewingStage,
  onStageClick,
  hasStageData,
}) => {
  const stages: { type: StageType; name: string }[] = [
    { type: "stage_1_idea", name: "想法扩展" },
    { type: "stage_2_title", name: "书名简介" },
    { type: "stage_3_outline", name: "大纲生成" },
    { type: "stage_4_content", name: "正文生成" },
    { type: "stage_5_review", name: "审稿优化" },
  ];

  const getStageStatus = (stageType: StageType) => {
    const stageIndex = stages.findIndex((s) => s.type === stageType);
    const currentStageIndex = stages.findIndex(
      (s) => s.type === task.currentStage
    );

    if (stageIndex < currentStageIndex) {
      return "completed";
    } else if (stageIndex === currentStageIndex) {
      return task.status.includes("ing") ? "processing" : "current";
    } else {
      return "pending";
    }
  };

  const getStageIcon = (stageType: StageType) => {
    const status = getStageStatus(stageType);

    if (status === "completed") {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    } else if (status === "processing") {
      return <Loader className="w-6 h-6 text-blue-500 animate-spin" />;
    } else {
      return <Circle className="w-6 h-6 text-gray-300" />;
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between relative">
        {/* 连接线 */}
        <div className="absolute top-3 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
        <div
          className="absolute top-3 left-0 h-0.5 bg-blue-500 -z-10 transition-all duration-500"
          style={{
            width: `${
              (stages.findIndex((s) => s.type === task.currentStage) /
                (stages.length - 1)) *
              100
            }%`,
          }}
        ></div>

        {/* 阶段节点 */}
        {stages.map((stage) => {
          const status = getStageStatus(stage.type);
          const isViewing = viewingStage === stage.type;
          const canClick = hasStageData ? hasStageData(stage.type) : false;
          const isClickable = canClick && onStageClick;

          return (
            <div key={stage.type} className="flex flex-col items-center flex-1">
              <div
                onClick={() => {
                  if (isClickable) {
                    onStageClick(stage.type);
                  }
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  status === "completed"
                    ? "bg-green-100 shadow-md"
                    : status === "processing"
                    ? "bg-blue-100 shadow-lg"
                    : "bg-white border-2 border-gray-200"
                } ${isViewing ? "ring-4 ring-purple-400 ring-offset-2" : ""} ${
                  isClickable
                    ? "cursor-pointer hover:scale-110 hover:shadow-xl"
                    : "cursor-default"
                }`}
                title={
                  canClick
                    ? `点击查看${stage.name}`
                    : status === "pending"
                    ? "该阶段尚未完成"
                    : ""
                }
              >
                {getStageIcon(stage.type)}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-sm font-medium ${
                    isViewing
                      ? "text-purple-600 font-bold"
                      : status === "completed"
                      ? "text-green-600"
                      : status === "processing"
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                >
                  {stage.name}
                  {isViewing && " 👁️"}
                </div>
                {status === "processing" &&
                  progressEvent?.stage === stage.type &&
                  progressEvent.data.percentage && (
                    <div className="text-xs text-blue-500 mt-1">
                      {Math.round(progressEvent.data.percentage)}%
                    </div>
                  )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 实时消息 */}
      {progressEvent && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            📡 {progressEvent.data.message || "处理中..."}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
