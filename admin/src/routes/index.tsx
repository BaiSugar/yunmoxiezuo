import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../pages/auth/Login";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Users from "../pages/users/Users";
import Roles from "../pages/roles/Roles";
import Permissions from "../pages/permissions/Permissions";
import PromptCategories from "../pages/prompts/PromptCategories";
import PromptReview from "../pages/prompts/PromptReview";
import AiModels from "../pages/ai-models/AiModels";
import Announcements from "../pages/announcements/Announcements";
import MembershipPlans from "../pages/memberships/MembershipPlans";
import TokenPackages from "../pages/token-packages/TokenPackages";
import RedemptionCodes from "../pages/redemption-codes/RedemptionCodes";
import TokenManagement from "../pages/token-management/TokenManagement";
import MembershipManagement from "../pages/membership-management/MembershipManagement";
import ToolsManagement from "../pages/tools/ToolsManagement";
import SystemSettings from "../pages/system-settings/SystemSettings";
import EmailTemplates from "../pages/email-templates/EmailTemplates";
import { FontManagement } from "../pages/fonts/FontManagement";
import { PromptManagement } from "../pages/PromptManagement";
import { ReportManagement } from "../pages/ReportManagement";
import { ProtectedRoute } from "../components/common/ProtectedRoute";
import { PERMISSIONS } from "../utils/permission";

// 私有路由保护组件（基础认证检查）
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = !!localStorage.getItem("accessToken");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <PrivateRoute>
        <MainLayout />
      </PrivateRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: (
          <ProtectedRoute permission={PERMISSIONS.DASHBOARD.VIEW}>
            <Dashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "users",
        element: (
          <ProtectedRoute permission={PERMISSIONS.USER.VIEW}>
            <Users />
          </ProtectedRoute>
        ),
      },
      {
        path: "roles",
        element: (
          <ProtectedRoute permission={PERMISSIONS.ROLE.VIEW}>
            <Roles />
          </ProtectedRoute>
        ),
      },
      {
        path: "permissions",
        element: (
          <ProtectedRoute permission={PERMISSIONS.PERMISSION.VIEW}>
            <Permissions />
          </ProtectedRoute>
        ),
      },
      {
        path: "prompt-categories",
        element: (
          <ProtectedRoute permission={PERMISSIONS.PROMPT.CATEGORY_VIEW}>
            <PromptCategories />
          </ProtectedRoute>
        ),
      },
      {
        path: "prompt-review",
        element: (
          <ProtectedRoute permission={PERMISSIONS.PROMPT.MANAGE_ALL}>
            <PromptReview />
          </ProtectedRoute>
        ),
      },
      {
        path: "ai-models",
        element: (
          <ProtectedRoute permission={PERMISSIONS.AI_MODEL.PROVIDER_READ}>
            <AiModels />
          </ProtectedRoute>
        ),
      },
      {
        path: "announcements",
        element: (
          <ProtectedRoute permission={PERMISSIONS.ANNOUNCEMENT.VIEW}>
            <Announcements />
          </ProtectedRoute>
        ),
      },
      {
        path: "membership-plans",
        element: (
          <ProtectedRoute permission={PERMISSIONS.MEMBERSHIP.PLAN_VIEW}>
            <MembershipPlans />
          </ProtectedRoute>
        ),
      },
      {
        path: "token-packages",
        element: (
          <ProtectedRoute permission={PERMISSIONS.TOKEN_PACKAGE.VIEW}>
            <TokenPackages />
          </ProtectedRoute>
        ),
      },
      {
        path: "redemption-codes",
        element: (
          <ProtectedRoute permission={PERMISSIONS.REDEMPTION_CODE.VIEW}>
            <RedemptionCodes />
          </ProtectedRoute>
        ),
      },
      {
        path: "token-management",
        element: (
          <ProtectedRoute
            permission={PERMISSIONS.TOKEN_CONSUMPTION.VIEW_RECORDS}
          >
            <TokenManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "membership-management",
        element: (
          <ProtectedRoute permission={PERMISSIONS.MEMBERSHIP.USER_VIEW}>
            <MembershipManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "tools",
        element: (
          <ProtectedRoute permission={PERMISSIONS.TOOL.VIEW}>
            <ToolsManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "system-settings",
        element: (
          <ProtectedRoute permission={PERMISSIONS.SYSTEM_SETTINGS.VIEW}>
            <SystemSettings />
          </ProtectedRoute>
        ),
      },
      {
        path: "email-templates",
        element: (
          <ProtectedRoute permission={PERMISSIONS.EMAIL_TEMPLATE.VIEW}>
            <EmailTemplates />
          </ProtectedRoute>
        ),
      },
      {
        path: "fonts",
        element: (
          <ProtectedRoute permission={PERMISSIONS.FONT?.VIEW || "font:view"}>
            <FontManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "prompts",
        element: (
          <ProtectedRoute permission={PERMISSIONS.PROMPT.MANAGE_ALL}>
            <PromptManagement />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute permission={PERMISSIONS.PROMPT.MANAGE_ALL}>
            <ReportManagement />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
