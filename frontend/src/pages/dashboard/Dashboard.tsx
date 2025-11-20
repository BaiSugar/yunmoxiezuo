import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Home, FileText, Menu, X, Sparkles, Wrench, Wand2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import UserDropdown from "../../components/common/UserDropdown";
import AnnouncementButton from "../../components/announcements/AnnouncementButton";
import PurchaseButton from "../../components/purchase/PurchaseButton";
import { EmailVerificationModal } from "../../components/modals/EmailVerificationModal";
import Footer from "../../components/common/Footer";
import DashboardHome from "./DashboardHome";
import Works from "./Works";
import PromptMarket from "../prompts/PromptMarket";
import PromptDetail from "../prompts/PromptDetail";
import PromptEditor from "../prompts/PromptEditor";
import MyPrompts from "../prompts/MyPrompts";
import MyFavorites from "../prompts/MyFavorites";
import PromptApplications from "../prompts/PromptApplications";
import PromptPermissions from "../prompts/PromptPermissions";
import { MyPromptsBatchManager } from "../prompts/MyPromptsBatchManager";
import MyReports from "../prompts/MyReports";
import ToolsHome from "../tools/ToolsHome";
import NovelSearchTool from "../tools/NovelSearchTool";
import CreativeWorkshopPage from "../creative-workshop/CreativeWorkshopPage";
import WorkshopGeneratorPage from "../creative-workshop/WorkshopGeneratorPage";
import BookCreationPage from "../book-creation/BookCreationPage";
import NewTaskPage from "../book-creation/NewTaskPage";
import TaskDetailPage from "../book-creation/TaskDetailPage";
import PromptGroupsPage from "../book-creation/PromptGroupsPage";
import PromptGroupEditor from "../book-creation/PromptGroupEditor";
import PromptGroupPermissions from "../book-creation/PromptGroupPermissions";
import BookCreationHelpPage from "../book-creation/BookCreationHelpPage";

/**
 * 仪表板页面 - 登录后的首页
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // 获取当前激活的菜单项（基于路径段，更精确）
  const getActiveMenu = (): string => {
    const path = location.pathname;

    // 按优先级顺序检查（更长的路径优先）
    if (path.startsWith("/dashboard/book-creation")) return "book-creation";
    if (path.startsWith("/dashboard/workshop")) return "workshop";
    if (path.startsWith("/dashboard/works")) return "works";
    if (path.startsWith("/dashboard/prompts")) return "prompts";
    if (path.startsWith("/dashboard/tools")) return "tools";
    if (path === "/dashboard" || path === "/dashboard/") return "home";

    return "";
  };

  const activeMenu = getActiveMenu();

  // 检查邮箱是否验证
  useEffect(() => {
    if (user && !user.emailVerified) {
      setShowEmailVerification(true);
    }
  }, [user]);

  return (
    <div className="flex h-screen bg-gray-100 relative overflow-hidden">
      {/* 背景装饰 - 纯色圆形装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl"></div>
      </div>

      {/* 移动端遮罩层 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 左侧边栏 */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-[60] lg:z-10
          w-64 bg-white/70 backdrop-blur-xl border-r border-white/50 flex flex-col shadow-xl
          transform transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Logo区域 */}
        <div className="p-6 border-b border-white/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo.svg" alt="Logo" className="w-12 h-12" />
              <div>
                <span className="block text-xl font-bold text-gray-900">
                  云墨写作
                </span>
                <span className="block text-xs text-gray-500">
                  AI写作辅助创作平台
                </span>
              </div>
            </div>
            {/* 移动端关闭按钮 */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-xl hover:bg-white/50 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {/* 首页 */}
            <button
              onClick={() => {
                navigate("/dashboard");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                activeMenu === "home"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-700 hover:bg-white/50 backdrop-blur-sm"
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">首页</span>
            </button>

            {/* 作品管理 */}
            <button
              onClick={() => {
                navigate("/dashboard/works");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                activeMenu === "works"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-700 hover:bg-white/50 backdrop-blur-sm"
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">作品管理</span>
            </button>

            {/* 创意工坊 */}
            <button
              onClick={() => {
                navigate("/dashboard/workshop");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                activeMenu === "workshop"
                  ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                  : "text-gray-700 hover:bg-white/50 backdrop-blur-sm"
              }`}
            >
              <Wand2 className="w-5 h-5" />
              <span className="font-medium">创意工坊</span>
            </button>

            {/* 提示词广场 */}
            <button
              onClick={() => {
                navigate("/dashboard/prompts");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                activeMenu === "prompts"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-700 hover:bg-white/50 backdrop-blur-sm"
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">提示词广场</span>
            </button>

            {/* 一键成书 */}
            {/* <button
              onClick={() => {
                navigate("/dashboard/book-creation");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                activeMenu === "book-creation"
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-700 hover:bg-white/50 backdrop-blur-sm"
              }`}
            >
              <Wand2 className="w-5 h-5" />
              <span className="font-medium">一键成书</span>
            </button> */}

            {/* 工具箱 */}
            <button
              onClick={() => {
                navigate("/dashboard/tools");
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                activeMenu === "tools"
                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                  : "text-gray-700 hover:bg-white/50 backdrop-blur-sm"
              }`}
            >
              <Wrench className="w-5 h-5" />
              <span className="font-medium">工具箱</span>
            </button>
          </div>
        </nav>

        {/* 页脚 - 联系方式 */}
        <Footer isSidebar={true} />
      </aside>

      {/* 右侧主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* 顶部导航栏 */}
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 sm:px-6 shadow-sm relative z-50">
          {/* 左侧：移动端汉堡菜单 */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>

          {/* 右侧：购买 + 公告 + 用户菜单 */}
          <div className="lg:ml-auto flex items-center space-x-2">
            <PurchaseButton />
            <AnnouncementButton />
            <UserDropdown />
          </div>
        </header>

        {/* 主要内容区域 */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Routes>
            {/* 首页内容 */}
            <Route path="/" element={<DashboardHome />} />

            {/* 作品管理内容 */}
            <Route path="/works" element={<Works />} />

            {/* 提示词相关路由 - 注意：更具体的路由要放在前面 */}
            <Route path="/prompts/create" element={<PromptEditor />} />
            <Route
              path="/prompts/batch-manager"
              element={<MyPromptsBatchManager />}
            />
            {/* @deprecated 废弃的申请管理页面，请使用 dashboard/prompts/:id/permissions */}
            <Route
              path="/prompts/applications"
              element={<PromptApplications />}
            />
            <Route path="/prompts/my-reports" element={<MyReports />} />
            <Route path="/prompts/my" element={<MyPrompts />} />
            <Route path="/prompts/favorites" element={<MyFavorites />} />
            <Route path="/prompts/:id/edit" element={<PromptEditor />} />
            <Route
              path="/prompts/:id/permissions"
              element={<PromptPermissions />}
            />
            <Route path="/prompts/:id" element={<PromptDetail />} />
            <Route path="/prompts" element={<PromptMarket />} />

            {/* 创意工坊路由 */}
            <Route
              path="/workshop/:categoryId"
              element={<WorkshopGeneratorPage />}
            />
            <Route path="/workshop" element={<CreativeWorkshopPage />} />

            {/* 一键成书相关路由 */}
            <Route
              path="/book-creation/help"
              element={<BookCreationHelpPage />}
            />
            <Route path="/book-creation/new" element={<NewTaskPage />} />
            <Route
              path="/book-creation/prompt-groups/new"
              element={<PromptGroupEditor />}
            />
            <Route
              path="/book-creation/prompt-groups/:id/edit"
              element={<PromptGroupEditor />}
            />
            <Route
              path="/book-creation/prompt-groups/:id/permissions"
              element={<PromptGroupPermissions />}
            />
            <Route
              path="/book-creation/prompt-groups"
              element={<PromptGroupsPage />}
            />
            <Route path="/book-creation/:taskId" element={<TaskDetailPage />} />
            <Route path="/book-creation" element={<BookCreationPage />} />

            {/* 工具箱相关路由 */}
            <Route path="/tools/novel-search" element={<NovelSearchTool />} />
            <Route path="/tools" element={<ToolsHome />} />
          </Routes>
        </main>
      </div>

      {/* 邮箱验证弹窗 - 不能关闭 */}
      {showEmailVerification && user && (
        <EmailVerificationModal
          email={user.email}
          onClose={() => {}} // 空函数，不允许关闭
          onVerified={() => {
            setShowEmailVerification(false);
            // 刷新用户信息
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
