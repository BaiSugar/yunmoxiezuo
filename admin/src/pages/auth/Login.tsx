import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  loginAsync,
  getProfileAsync,
  logout,
} from "../../store/slices/authSlice";
import { Toast } from "../../components/common/Toast";
import { showToast } from "../../components/common/ToastContainer";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await dispatch(
        loginAsync({ credential, password })
      ).unwrap();

      console.log("✅ 登录成功", result);

      // 显示成功提示
      setSuccessMessage(
        `欢迎回来，${result.user.nickname || result.user.username}！`
      );
      setShowSuccessToast(true);

      // 立即获取完整的用户信息（包含完整的角色对象）
      await dispatch(getProfileAsync()).unwrap();
      console.log("✅ 已获取完整用户信息");

      // 检查用户是否有管理员权限
      const profileResult = await dispatch(getProfileAsync()).unwrap();
      const userRoles = profileResult.roles;

      // 检查是否是管理员角色
      const isAdmin = userRoles.some((role: any) =>
        typeof role === "string"
          ? ["super_admin", "admin"].includes(role)
          : ["super_admin", "admin"].includes(role.code)
      );

      if (!isAdmin) {
        showToast("您没有访问后台管理系统的权限", "error");
        dispatch(logout());
        return;
      }

      // 延迟跳转，让用户看到提示
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      console.error("❌ 登录失败:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* 成功提示 Toast */}
      {showSuccessToast && (
        <Toast
          message={successMessage}
          type="success"
          duration={3000}
          onClose={() => setShowSuccessToast(false)}
        />
      )}

      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Logo 和标题 */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-full mb-3 sm:mb-4">
              <svg
                className="w-7 h-7 sm:w-8 sm:h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              AI 写作平台
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">
              管理后台登录
            </p>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg">
              <div className="flex items-center">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm sm:text-base">{error}</span>
              </div>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* 邮箱/用户名输入 */}
            <div>
              <label
                htmlFor="credential"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                邮箱或用户名
              </label>
              <input
                id="credential"
                type="text"
                required
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                placeholder="请输入邮箱或用户名"
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                密码
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 outline-none"
                placeholder="请输入密码"
              />
            </div>

            {/* 记住我 */}
            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">记住我</span>
              </label>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
                忘记密码？
              </a>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  登录中...
                </>
              ) : (
                "登录"
              )}
            </button>
          </form>
        </div>

        {/* 版权信息 */}
        <p className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-gray-500">
          © 2024 AI 写作平台. All rights reserved.
        </p>
      </div>
    </div>
  );
}
