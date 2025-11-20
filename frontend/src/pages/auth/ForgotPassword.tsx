import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Mail,
  Lock,
  AlertCircle,
  Send,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { sendVerificationCode } from "../../services/email.api";
import { apiService } from "../../services/api";

const schema = yup.object({
  email: yup.string().email("请输入有效的邮箱地址").required("请输入邮箱"),
  verificationCode: yup
    .string()
    .required("请输入验证码")
    .length(6, "验证码为6位数字"),
  newPassword: yup
    .string()
    .min(8, "密码至少8个字符")
    .max(32, "密码最多32个字符")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "密码必须包含大小写字母和数字")
    .required("请输入新密码"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "两次输入的密码不一致")
    .required("请确认密码"),
});

const ForgotPassword: React.FC = () => {
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const email = watch("email", "");
  const newPassword = watch("newPassword", "");

  // 密码规则检查
  const passwordRules = [
    { label: "至少8个字符", valid: newPassword.length >= 8 },
    {
      label: "最多32个字符",
      valid: newPassword.length <= 32 || newPassword.length === 0,
    },
    { label: "包含小写字母", valid: /[a-z]/.test(newPassword) },
    { label: "包含大写字母", valid: /[A-Z]/.test(newPassword) },
    { label: "包含数字", valid: /\d/.test(newPassword) },
  ];

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 发送验证码
  const handleSendCode = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("发送失败", "请输入有效的邮箱地址");
      return;
    }

    setIsSendingCode(true);
    try {
      await sendVerificationCode({
        email,
        type: "reset_password",
      });
      success("发送成功", "验证码已发送到您的邮箱");
      setCountdown(60);
    } catch (error: any) {
      showError("发送失败", error.message || "验证码发送失败，请稍后重试");
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await apiService.post("/auth/reset-password", {
        email: data.email,
        verificationCode: data.verificationCode,
        newPassword: data.newPassword,
      });
      success("重置成功", "密码已重置，请使用新密码登录");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      showError("重置失败", error.message || "密码重置失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex items-center justify-center h-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* 毛玻璃卡片 */}
          <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-8 space-y-8">
            {/* 返回按钮 */}
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">返回登录</span>
            </Link>

            {/* 头部 */}
            <div className="text-center">
              <div className="mx-auto mb-6">
                <img
                  src="/logo.svg"
                  alt="Logo"
                  className="w-16 h-16 mx-auto drop-shadow-md"
                  style={{
                    filter: "drop-shadow(0 4px 6px rgba(99, 102, 241, 0.3))",
                  }}
                />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                重置密码
              </h2>
              <p className="mt-2 text-gray-600">
                通过邮箱验证码重置您的密码
              </p>
            </div>

            {/* 表单 */}
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                {/* 邮箱输入 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    邮箱地址
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="请输入邮箱地址"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* 验证码输入 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    邮箱验证码
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        {...register("verificationCode")}
                        type="text"
                        maxLength={6}
                        className="w-full px-4 py-4 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                        placeholder="请输入6位验证码"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={isSendingCode || countdown > 0}
                      className="px-4 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                    >
                      {isSendingCode ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:inline">发送中</span>
                        </>
                      ) : countdown > 0 ? (
                        <span>{countdown}秒</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span className="hidden sm:inline">获取验证码</span>
                        </>
                      )}
                    </button>
                  </div>
                  {errors.verificationCode && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.verificationCode.message}
                    </p>
                  )}
                </div>

                {/* 新密码 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    新密码
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register("newPassword")}
                      type="password"
                      className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="请输入新密码"
                    />
                  </div>
                  {/* 密码规则提示 */}
                  {newPassword && (
                    <div className="mt-2 space-y-1.5 p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl">
                      {passwordRules.map((rule, index) => (
                        <div key={index} className="flex items-center text-xs">
                          {rule.valid ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 border-2 border-gray-400 rounded-full mr-2 flex-shrink-0"></div>
                          )}
                          <span
                            className={
                              rule.valid ? "text-green-600" : "text-gray-500"
                            }
                          >
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {errors.newPassword && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* 确认密码 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    确认密码
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register("confirmPassword")}
                      type="password"
                      className="w-full pl-12 pr-4 py-4 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="请再次输入新密码"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    重置中...
                  </div>
                ) : (
                  "重置密码"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

