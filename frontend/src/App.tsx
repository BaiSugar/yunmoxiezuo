import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider, useToast } from "./contexts/ToastContext";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import ToastContainer from "./components/common/ToastContainer";
import AuthGuard from "./components/common/AuthGuard";
import NotificationToast from "./components/notifications/NotificationToast";
import AnnouncementToast from "./components/announcements/AnnouncementToast";
import MembershipExpiryListener from "./components/membership/MembershipExpiryListener";
import PromptBanNotificationListener from "./components/prompts/PromptBanNotificationListener";

// 页面组件
import Home from "./pages/home/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import Dashboard from "./pages/dashboard/Dashboard";
import NovelEditor from "./pages/editor/NovelEditor";
import Terms from "./pages/legal/Terms";
import Privacy from "./pages/legal/Privacy";

// 内部应用组件，使用ToastProvider
const AppContent = () => {
  const { toasts, removeToast } = useToast();

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 公开路由 - 已登录用户自动跳转到仪表板 */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <Home />
              </AuthGuard>
            }
          />
          <Route
            path="/login"
            element={
              <AuthGuard>
                <Login />
              </AuthGuard>
            }
          />
          <Route
            path="/register"
            element={
              <AuthGuard>
                <Register />
              </AuthGuard>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthGuard>
                <ForgotPassword />
              </AuthGuard>
            }
          />

          {/* 法律文档页面 - 公开访问 */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />

          {/* 受保护的路由 - 需要登录 */}
          <Route
            path="/dashboard/*"
            element={
              <AuthGuard requireAuth={true}>
                <Dashboard />
              </AuthGuard>
            }
          />

          {/* 作品编辑器路由 */}
          <Route
            path="/editor/:novelId"
            element={
              <AuthGuard requireAuth={true}>
                <NovelEditor />
              </AuthGuard>
            }
          />

          {/* 默认重定向 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Toast容器 */}
        <ToastContainer toasts={toasts} onRemove={removeToast} />

        {/* 系统通知和公告Toast - 仅登录用户可见 */}
        <AuthenticatedComponents />
      </div>
    </Router>
  );
};

// 仅登录用户可见的组件
const AuthenticatedComponents = () => {
  const { user } = useAuth();

  // 只有登录用户才显示通知和公告
  if (!user) {
    return null;
  }

  return (
    <>
      {/* 系统通知Toast（提示词审核等） */}
      <NotificationToast />

      {/* 公告Toast（WebSocket实时推送） */}
      <AnnouncementToast />

      {/* 会员过期监听器 */}
      <MembershipExpiryListener />

      {/* 提示词封禁通知监听器 */}
      <PromptBanNotificationListener />
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
