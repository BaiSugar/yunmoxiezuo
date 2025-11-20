import React from "react";
import { createPortal } from "react-dom";
import Toast from "./Toast";
import type { Toast as ToastType } from "../../types";

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
}) => {
  if (typeof window === "undefined") {
    return null;
  }

  // 安全检查，确保 toasts 是数组
  if (!Array.isArray(toasts)) {
    return null;
  }

  return createPortal(
    <div className="fixed top-3 left-2 right-2 sm:left-auto sm:right-4 sm:top-4 z-[90000] space-y-2 max-w-md sm:w-auto pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer;
