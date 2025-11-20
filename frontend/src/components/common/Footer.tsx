import React, { useState, useEffect } from "react";
import { MessageCircle, QrCode } from "lucide-react";
import {
  getPublicSettings,
  type PublicSettings,
} from "../../services/system-settings.api";

interface FooterProps {
  /** 是否为侧边栏模式（紧凑显示） */
  isSidebar?: boolean;
  /** 自定义类名 */
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  isSidebar = false,
  className = "",
}) => {
  const [settings, setSettings] = useState<PublicSettings["footer"]>();
  const [showQQCode, setShowQQCode] = useState(false);
  const [showWechatCode, setShowWechatCode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getPublicSettings();
      setSettings(data.footer);
    } catch (error) {
      console.error("加载页脚配置失败:", error);
    }
  };

  // 如果没有配置或者两个都不显示，则不渲染
  if (!settings || (!settings.show_qq && !settings.show_wechat)) {
    return null;
  }

  // 侧边栏模式 - 紧凑显示
  if (isSidebar) {
    return (
      <div
        className={`px-4 py-3 border-t border-gray-200 bg-gray-50 ${className}`}
      >
        <div className="space-y-2">
          {settings.show_qq && settings.qq_group_image && (
            <div className="relative">
              <button
                onClick={() => setShowQQCode(!showQQCode)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <span>加入QQ群</span>
              </button>
              {showQQCode && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-200">
                  <div className="text-center">
                    <img
                      src={settings.qq_group_image}
                      alt="QQ群二维码"
                      className="w-40 h-40 object-contain mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {settings.qq_group_number && (
                      <p className="text-xs text-gray-600">
                        群号: {settings.qq_group_number}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowQQCode(false)}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}

          {settings.show_wechat && settings.wechat_image && (
            <div className="relative">
              <button
                onClick={() => setShowWechatCode(!showWechatCode)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <QrCode className="w-4 h-4 text-green-500" />
                <span>添加微信</span>
              </button>
              {showWechatCode && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl p-4 z-50 border border-gray-200">
                  <div className="text-center">
                    <img
                      src={settings.wechat_image}
                      alt="微信二维码"
                      className="w-40 h-40 object-contain mb-2"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    {settings.wechat_text && (
                      <p className="text-xs text-gray-600">
                        {settings.wechat_text}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowWechatCode(false)}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 页面底部模式 - 完整显示
  return (
    <div className={`py-8 border-t border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
          {settings.show_qq && settings.qq_group_image && (
            <div className="text-center group">
              <div className="relative inline-block">
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl shadow-md p-3 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                  <img
                    src={settings.qq_group_image}
                    alt="QQ群二维码"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-2 rounded-full shadow-lg">
                  <MessageCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-700">加入QQ群</p>
              {settings.qq_group_number && (
                <p className="mt-1 text-xs text-gray-500">
                  群号: {settings.qq_group_number}
                </p>
              )}
            </div>
          )}

          {settings.show_wechat && settings.wechat_image && (
            <div className="text-center group">
              <div className="relative inline-block">
                <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl shadow-md p-3 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                  <img
                    src={settings.wechat_image}
                    alt="微信二维码"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="14"%3E图片加载失败%3C/text%3E%3C/svg%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-2 rounded-full shadow-lg">
                  <QrCode className="w-4 h-4" />
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-gray-700">
                {settings.wechat_text || "添加微信"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Footer;
