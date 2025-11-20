import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { Toast as ToastType } from "../../types";

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const { id, type, title, message, duration = 5000 } = toast;
  // 兼容不同字段名：有些调用方可能传 description/msg
  const detailText =
    message ?? (toast as any).description ?? (toast as any).msg ?? "";

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onRemove]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
        );
      case "error":
        return (
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
        );
      case "warning":
        return (
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
        );
      case "info":
        return (
          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
        );
      default:
        return (
          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
        );
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div
      className={`
        ${getBackgroundColor()}
        border rounded-lg p-2.5 sm:p-4 shadow-lg w-full
        animate-in fade-in slide-in-from-top sm:slide-in-from-right-full
        duration-300
      `}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 pt-0.5 sm:pt-0">{getIcon()}</div>
        <div className="flex-1 min-w-0 pr-1 sm:pr-0">
          <h4 className="text-xs sm:text-sm font-medium text-gray-900 break-words leading-tight">
            {title}
          </h4>
          {detailText && (
            <p className="mt-1 text-xs text-gray-600 break-words leading-relaxed">
              {detailText}
            </p>
          )}
        </div>
        <div className="flex-shrink-0 -mr-1 sm:mr-0">
          <button
            onClick={() => onRemove(id)}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md p-1 sm:p-0.5 transition-colors touch-manipulation"
            aria-label="关闭提示"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;
