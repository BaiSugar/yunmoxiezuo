import { useEffect } from "react";
import { useWebSocket } from "../../contexts/WebSocketContext";
import { useToast } from "../../contexts/ToastContext";

/**
 * 提示词封禁WebSocket监听器
 * 全局监听提示词封禁/解封消息并显示提示
 */
export const PromptBanNotificationListener = () => {
  const { on } = useWebSocket();
  const { error, success } = useToast();

  useEffect(() => {
    console.log("[PromptBanNotificationListener] 开始监听提示词封禁通知");

    // 监听封禁通知
    const unsubscribeBan = on("prompt:banned", (data: any) => {
      console.log("[PromptBanNotificationListener] 收到封禁通知:", data);
      error(
        "提示词已被封禁",
        `您的提示词「${data.promptName}」已被封禁。原因：${
          data.reason || "违反社区规范"
        }`
      );
    });

    // 监听解封通知
    const unsubscribeUnban = on("prompt:unbanned", (data: any) => {
      console.log("[PromptBanNotificationListener] 收到解封通知:", data);
      success("提示词已解封", `您的提示词「${data.promptName}」已解封`);
    });

    return () => {
      console.log("[PromptBanNotificationListener] 取消监听提示词封禁通知");
      unsubscribeBan();
      unsubscribeUnban();
    };
  }, [on, error, success]);

  return null; // 该组件不渲染任何内容
};

export default PromptBanNotificationListener;
