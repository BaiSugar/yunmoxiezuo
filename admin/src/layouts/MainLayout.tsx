import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { logout, updateUserProfile } from "../store/slices/authSlice";
import { AdminUserMenu } from "../components/common/AdminUserMenu";
import { ProfileFormModal } from "../components/forms/ProfileFormModal";
import { PasswordFormModal } from "../components/forms/PasswordFormModal";
import { Sidebar } from "../components/layout/Sidebar";
import { updateCurrentUser, changePassword } from "../api/users";
import { showToast } from "../components/common/ToastContainer";
import type { UpdateProfileDto, ChangePasswordDto } from "../types/user";

export default function MainLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [sidebarOpen, setSidebarOpen] = useState(true); // 默认展开侧边栏
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // 打开个人资料编辑
  const handleOpenProfile = () => {
    setIsProfileModalOpen(true);
  };

  // 打开密码修改
  const handleOpenPassword = () => {
    setIsPasswordModalOpen(true);
  };

  // 提交个人资料
  const handleSubmitProfile = async (data: UpdateProfileDto) => {
    try {
      const updatedUser = await updateCurrentUser(data);
      dispatch(updateUserProfile(updatedUser));
      showToast("个人资料更新成功", "success");
    } catch (error: any) {
      showToast(error.message || "更新失败", "error");
      throw error;
    }
  };

  // 提交密码修改
  const handleSubmitPassword = async (data: ChangePasswordDto) => {
    try {
      await changePassword(data);
      showToast("密码修改成功，请重新登录", "success");
      // 修改密码成功后自动退出
      setTimeout(() => {
        dispatch(logout());
        navigate("/login");
      }, 1500);
    } catch (error: any) {
      showToast(error.message || "修改失败", "error");
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      {/* 顶部导航栏 - 毛玻璃效果 */}
      <nav className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-white/20 fixed w-full top-0 z-30">
        <div className="mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 sm:h-16">
            <div className="flex items-center">
              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all"
                aria-label="打开菜单"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* 桌面端菜单按钮 */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="hidden sm:block p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 transition-all"
                aria-label="切换侧边栏"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Logo */}
              <div className="ml-2 sm:ml-4 flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="ml-2 sm:ml-3 text-sm sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden xs:block">
                  AI 写作平台
                </span>
              </div>
            </div>

            {/* 右侧用户菜单 */}
            <AdminUserMenu
              onLogout={handleLogout}
              onOpenProfile={handleOpenProfile}
              onOpenPassword={handleOpenPassword}
            />
          </div>
        </div>
      </nav>

      {/* 移动端侧边栏遮罩 */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 sm:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* 主体内容 */}
      <div className="flex pt-14 sm:pt-16">
        {/* 桌面端侧边栏 - 毛玻璃效果 */}
        <aside
          className={`hidden sm:block fixed left-0 top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-white/80 backdrop-blur-xl shadow-lg border-r border-white/20 transition-all duration-300 z-20 ${
            sidebarOpen ? "w-64" : "w-20"
          }`}
        >
          <Sidebar user={user} isOpen={sidebarOpen} isMobile={false} />
        </aside>

        {/* 移动端侧边栏 - 毛玻璃效果 */}
        <aside
          className={`sm:hidden fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/20 transition-transform duration-300 z-30 w-64 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar
            user={user}
            isOpen={true}
            isMobile={true}
            onClose={() => setMobileMenuOpen(false)}
          />
        </aside>

        {/* 主内容区 */}
        <main
          className={`flex-1 transition-all duration-300 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] ${
            sidebarOpen ? "sm:ml-64" : "sm:ml-20"
          }`}
        >
          <div className="p-3 sm:p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* 个人资料编辑模态框 */}
      <ProfileFormModal
        isOpen={isProfileModalOpen}
        user={user}
        onClose={() => setIsProfileModalOpen(false)}
        onSubmit={handleSubmitProfile}
      />

      {/* 密码修改模态框 */}
      <PasswordFormModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleSubmitPassword}
      />
    </div>
  );
}
