import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, X, Home } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * 侧边栏组件
 * 包含导航菜单和权限控制
 */
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const location = useLocation();

  const menuItems = [
    {
      id: "dashboard",
      label: "首页",
      icon: <Home className="w-5 h-5" />,
      href: "/dashboard",
      permission: "dashboard.view",
    },
    {
      id: "works",
      label: "作品管理",
      icon: <FileText className="w-5 h-5" />,
      href: "/works",
      permission: "works.view",
    },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      {/* 移动端遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* 侧边栏 */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-white/20 z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">AI写作</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors
                  ${
                    isActive(item.href)
                      ? "bg-blue-100/50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100/50"
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
