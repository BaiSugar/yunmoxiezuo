import React, { useState, useEffect } from "react";
import { Mail, Send, CheckCircle } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import {
  sendVerificationCode,
  verifyEmailCode,
} from "../../services/email.api";

interface EmailVerificationModalProps {
  email: string;
  onClose?: () => void;
  onVerified: () => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  email,
  onVerified,
}) => {
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { success, error: showError } = useToast();

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    setIsSending(true);
    try {
      await sendVerificationCode({
        email,
        type: "verify_email",
      });
      success("发送成功", "验证码已发送到您的邮箱");
      setCountdown(60);
    } catch (error: any) {
      showError("发送失败", error.message || "验证码发送失败，请稍后重试");
    } finally {
      setIsSending(false);
    }
  };

  // 验证邮箱
  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      showError("验证失败", "请输入6位验证码");
      return;
    }

    setIsVerifying(true);
    try {
      await verifyEmailCode({
        email,
        code,
        type: "verify_email",
      });
      success("验证成功", "您的邮箱已验证");
      onVerified();
    } catch (error: any) {
      showError("验证失败", error.message || "验证码错误或已过期");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
        {/* 重要提示标识 */}
        <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white text-xs font-bold">!</span>
        </div>

        {/* 图标 */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900">
          请验证您的邮箱
        </h2>
        <p className="text-gray-600 text-center mb-2">
          为了保障您的账户安全，请先验证邮箱地址
        </p>
        <p className="text-sm text-red-600 text-center mb-6 font-semibold">
          验证后才能使用完整功能
        </p>

        {/* 邮箱显示 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-500 mb-1">验证码将发送至</p>
          <p className="text-lg font-semibold text-gray-900">{email}</p>
        </div>

        {/* 验证码输入 */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            验证码
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              maxLength={6}
              placeholder="请输入6位验证码"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendCode}
              disabled={isSending || countdown > 0}
              className="px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                  <span>发送中</span>
                </>
              ) : countdown > 0 ? (
                <span>{countdown}秒</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>获取</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 验证按钮 */}
        <button
          onClick={handleVerify}
          disabled={isVerifying || !code || code.length !== 6}
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>验证中...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>验证邮箱</span>
            </>
          )}
        </button>

        {/* 提示信息 */}
        <p className="mt-4 text-xs text-gray-500 text-center">
          没有收到验证码？请检查垃圾邮件箱或稍后重试
        </p>
      </div>
    </div>
  );
};
