import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, Key, ChevronDown } from "lucide-react";
import { useAppSelector } from "../../store/hooks";
import { getUserRoleName } from "../../utils/user";

interface AdminUserMenuProps {
  onLogout: () => void;
  onOpenProfile: () => void;
  onOpenPassword: () => void;
}

export function AdminUserMenu({
  onLogout,
  onOpenProfile,
  onOpenPassword,
}: AdminUserMenuProps) {
  const { user } = useAppSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Email脱敏处理
  const maskEmail = (email?: string): string => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (!domain) return email;

    if (localPart.length <= 2) {
      return `${localPart}***@${domain}`;
    }
    const maskedLocal = localPart.substring(0, 2) + "***";
    return `${maskedLocal}@${domain}`;
  };

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuClick = (callback: () => void) => {
    setIsOpen(false);
    callback();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 用户信息按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 sm:space-x-2 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100/80 transition-all"
        aria-label="用户菜单"
      >
        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
          <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
        </div>
        <div className="hidden lg:block text-left">
          <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
            {user?.nickname || user?.username}
          </div>
          <div className="text-xs text-gray-500 truncate max-w-[120px]">
            {getUserRoleName(user)}
          </div>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 transition-transform hidden sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 下拉菜单 - 毛玻璃效果 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 sm:w-64 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* 用户信息 */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200/50">
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <User className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {user?.nickname || user?.username}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {maskEmail(user?.email)}
                </div>
                <div className="inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                  {getUserRoleName(user)}
                </div>
              </div>
            </div>
          </div>

          {/* 菜单项 */}
          <div className="py-1.5 sm:py-2">
            <button
              onClick={() => handleMenuClick(onOpenProfile)}
              className="w-full flex items-center space-x-2.5 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 hover:bg-gray-100/80 transition-all group"
            >
              <Settings className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
              <span className="group-hover:text-blue-600 transition-colors">
                个人资料
              </span>
            </button>

            <button
              onClick={() => handleMenuClick(onOpenPassword)}
              className="w-full flex items-center space-x-2.5 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-gray-700 hover:bg-gray-100/80 transition-all group"
            >
              <Key className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
              <span className="group-hover:text-blue-600 transition-colors">
                修改密码
              </span>
            </button>
          </div>

          <div className="border-t border-gray-200/50 pt-1.5 sm:pt-2">
            <button
              onClick={() => handleMenuClick(onLogout)}
              className="w-full flex items-center space-x-2.5 sm:space-x-3 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-red-600 hover:bg-red-50/80 transition-all group"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-medium">退出登录</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
