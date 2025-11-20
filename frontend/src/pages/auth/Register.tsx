import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  UserCircle,
  AlertCircle,
  Gift,
  CheckCircle,
  XCircle,
  Send,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { sendVerificationCode } from "../../services/email.api";

const schema = yup.object({
  email: yup.string().email("请输入有效的邮箱地址").required("请输入邮箱"),
  verificationCode: yup
    .string()
    .required("请输入验证码")
    .length(6, "验证码为6位数字"),
  username: yup
    .string()
    .min(3, "用户名至少3个字符")
    .max(20, "用户名最多20个字符")
    .matches(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线")
    .required("请输入用户名"),
  nickname: yup.string().max(50, "显示名称最多50个字符"),
  password: yup
    .string()
    .min(8, "密码至少8个字符")
    .max(32, "密码最多32个字符")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "密码必须包含大小写字母和数字")
    .required("请输入密码"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "两次输入的密码不一致")
    .required("请确认密码"),
  inviteCode: yup.string(),
});

const Register: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { register: registerUser, isLoading } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // 监听用户名、密码和邮箱输入
  const username = watch("username", "");
  const password = watch("password", "");
  const email = watch("email", "");

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 用户名规则检查
  const usernameRules = [
    { label: "至少3个字符", valid: username.length >= 3 },
    { label: "最多20个字符", valid: username.length <= 20 },
    {
      label: "只能包含字母、数字和下划线",
      valid: /^[a-zA-Z0-9_]*$/.test(username),
    },
  ];

  // 密码规则检查
  const passwordRules = [
    { label: "至少8个字符", valid: password.length >= 8 },
    {
      label: "最多32个字符",
      valid: password.length <= 32 || password.length === 0,
    },
    { label: "包含小写字母", valid: /[a-z]/.test(password) },
    { label: "包含大写字母", valid: /[A-Z]/.test(password) },
    { label: "包含数字", valid: /\d/.test(password) },
  ];

  // 从URL参数中读取邀请码
  useEffect(() => {
    const inviteCodeFromUrl = searchParams.get("inviteCode");
    if (inviteCodeFromUrl) {
      setValue("inviteCode", inviteCodeFromUrl);
    }
  }, [searchParams, setValue]);

  // 发送验证码
  const handleSendCode = async () => {
    // 验证邮箱格式
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError("发送失败", "请输入有效的邮箱地址");
      return;
    }

    setIsSendingCode(true);
    try {
      await sendVerificationCode({
        email,
        type: "register",
      });
      success("发送成功", "验证码已发送到您的邮箱");
      setCountdown(60); // 60秒倒计时
    } catch (error: any) {
      showError("发送失败", error.message || "验证码发送失败，请稍后重试");
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      // 清理空字符串，避免后端验证失败
      const cleanData = {
        ...data,
        nickname: data.nickname?.trim() || undefined,
        inviteCode: data.inviteCode?.trim() || undefined,
      };

      await registerUser(cleanData);
      success("注册成功", "欢迎加入AI写作平台！");
      navigate("/");
    } catch (error: any) {
      showError("注册失败", error.message);
    }
  };

  return (
    <div className="h-screen relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-rose-400/20 to-orange-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-violet-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative flex items-center justify-center h-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* 毛玻璃卡片 */}
          <div className="backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* 头部 */}
            <div className="text-center">
              <div className="mx-auto mb-4">
                <img
                  src="/logo.svg"
                  alt="Logo"
                  className="w-12 h-12 mx-auto drop-shadow-md"
                  style={{
                    filter: "drop-shadow(0 4px 6px rgba(59, 130, 246, 0.3))",
                  }}
                />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                创建账户
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                已有账户？{" "}
                <Link
                  to="/login"
                  className="font-semibold text-purple-600 hover:text-purple-500 transition-colors"
                >
                  立即登录
                </Link>
              </p>
            </div>

            {/* 表单 */}
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    邮箱地址 *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register("email")}
                      type="email"
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="请输入邮箱地址"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.email.message}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500 flex items-start gap-1">
                    <svg
                      className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>
                      仅支持常用邮箱注册，如
                      Gmail、QQ邮箱、163邮箱、126邮箱、Outlook、网易邮箱等
                    </span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    邮箱验证码 *
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        {...register("verificationCode")}
                        type="text"
                        maxLength={6}
                        className="w-full px-4 py-3 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                        placeholder="请输入6位验证码"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={isSendingCode || countdown > 0}
                      className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2"
                    >
                      {isSendingCode ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>发送中</span>
                        </>
                      ) : countdown > 0 ? (
                        <span>{countdown}秒后重试</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>获取验证码</span>
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

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    用户名 *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register("username")}
                      type="text"
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="请输入用户名"
                    />
                  </div>
                  {/* 用户名规则提示 */}
                  {username && (
                    <div className="mt-2 space-y-1.5 p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl">
                      {usernameRules.map((rule, index) => (
                        <div key={index} className="flex items-center text-xs">
                          {rule.valid ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
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
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.username.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    显示名称
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register("nickname")}
                      type="text"
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="请输入显示名称（可选）"
                    />
                  </div>
                  {errors.nickname && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.nickname.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    密码 *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      className="w-full pl-12 pr-12 py-3 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="请输入密码"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100/50 rounded-r-2xl transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {/* 密码规则提示 */}
                  {password && (
                    <div className="mt-2 space-y-1.5 p-3 bg-gray-50/80 backdrop-blur-sm rounded-xl">
                      {passwordRules.map((rule, index) => (
                        <div key={index} className="flex items-center text-xs">
                          {rule.valid ? (
                            <CheckCircle className="w-3.5 h-3.5 text-green-500 mr-2 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-gray-400 mr-2 flex-shrink-0" />
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
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    确认密码 *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full pl-12 pr-12 py-3 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="请再次输入密码"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100/50 rounded-r-2xl transition-colors"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    邀请码（可选）
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Gift className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register("inviteCode")}
                      type="text"
                      className="w-full pl-12 pr-4 py-3 bg-white/50 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                      placeholder="输入邀请码可获得额外奖励"
                    />
                  </div>
                  <p className="mt-2 text-xs text-green-600 flex items-center">
                    <Gift className="w-3 h-3 mr-1" />
                    使用邀请码注册可额外获得 80,000 字奖励！
                  </p>
                  {errors.inviteCode && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.inviteCode.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mt-1"
                />
                <label
                  htmlFor="agree-terms"
                  className="ml-3 text-sm text-gray-700"
                >
                  我同意{" "}
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-purple-600 hover:text-purple-500 font-semibold"
                  >
                    服务条款
                  </Link>{" "}
                  和{" "}
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="text-purple-600 hover:text-purple-500 font-semibold"
                  >
                    隐私政策
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    注册中...
                  </div>
                ) : (
                  "创建账户"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
