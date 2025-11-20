import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  AlertCircle,
  Settings,
  Mail,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import { showToast } from "../../components/common/ToastContainer";
import {
  getSystemSettings,
  batchUpdateSystemSettings,
  type SystemSetting,
} from "../../api/system-settings";
import { uploadFooterImage } from "../../api/upload";

type SettingsByCategory = {
  [category: string]: SystemSetting[];
};

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SettingsByCategory>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [editedValues, setEditedValues] = useState<Record<number, string>>({});
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // Tab配置 - 动态生成+自定义配置
  const getCategoryConfig = (category: string) => {
    const categoryConfigs: Record<string, { label: string; icon: any }> = {
      email: { label: "邮件配置", icon: Mail },
      system: { label: "系统配置", icon: Settings },
      footer: { label: "页脚配置", icon: Settings },
      registration: { label: "注册配置", icon: Settings },
    };

    return (
      categoryConfigs[category] || {
        label: category.charAt(0).toUpperCase() + category.slice(1),
        icon: Settings,
      }
    );
  };

  // 根据实际数据库中的category动态生成tabs
  const tabs = Object.keys(settings).map((category) => ({
    key: category,
    ...getCategoryConfig(category),
  }));

  // 加载配置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getSystemSettings();
      const groupedSettings = data.reduce(
        (acc: SettingsByCategory, setting: SystemSetting) => {
          if (!acc[setting.category]) {
            acc[setting.category] = [];
          }
          acc[setting.category].push(setting);
          return acc;
        },
        {}
      );
      setSettings(groupedSettings);

      // 设置默认激活的tab
      const firstCategory = Object.keys(groupedSettings)[0];
      if (firstCategory && !activeTab) {
        setActiveTab(firstCategory);
      }
    } catch (error: any) {
      showToast(error.message || "加载配置失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (id: number, value: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleFileSelect = async (id: number, file: File) => {
    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      showToast("只支持 JPG、PNG、WebP 格式的图片", "error");
      return;
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      showToast("图片大小不能超过 2MB", "error");
      return;
    }

    setUploading((prev) => ({ ...prev, [id]: true }));

    try {
      const imageUrl = await uploadFooterImage(file);
      handleValueChange(id, imageUrl);
      showToast("图片上传成功", "success");
    } catch (error: any) {
      showToast(error.message || "图片上传失败", "error");
    } finally {
      setUploading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const triggerFileInput = (id: number) => {
    fileInputRefs.current[id]?.click();
  };

  const handleSave = async () => {
    const updates = Object.entries(editedValues).map(([id, value]) => ({
      id: Number(id),
      value,
    }));

    if (updates.length === 0) {
      showToast("没有需要保存的更改", "info");
      return;
    }

    setSaving(true);
    try {
      await batchUpdateSystemSettings({ settings: updates });
      showToast("保存成功", "success");
      setEditedValues({});
      loadSettings();
    } catch (error: any) {
      showToast(error.message || "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (setting: SystemSetting) => {
    const value = editedValues[setting.id] ?? setting.value ?? "";
    const isEdited = setting.id in editedValues;
    const isImageField = setting.key.includes("_image");
    const isUploading = uploading[setting.id];

    switch (setting.type) {
      case "boolean":
        return (
          <select
            value={value}
            onChange={(e) => handleValueChange(setting.id, e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              isEdited ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          >
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        );

      case "number":
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(setting.id, e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              isEdited ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          />
        );

      case "json":
        return (
          <textarea
            value={value}
            onChange={(e) => handleValueChange(setting.id, e.target.value)}
            rows={4}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm ${
              isEdited ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          />
        );

      default:
        // 图片字段特殊处理
        if (isImageField) {
          return (
            <div className="space-y-3">
              {/* 隐藏的文件输入 */}
              <input
                type="file"
                ref={(el) => {
                  fileInputRefs.current[setting.id] = el;
                }}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(setting.id, file);
                  }
                }}
                className="hidden"
              />

              {/* 上传按钮 */}
              <button
                type="button"
                onClick={() => triggerFileInput(setting.id)}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>上传中...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>选择图片</span>
                  </>
                )}
              </button>

              {/* 当前图片URL */}
              <input
                type="text"
                value={value}
                onChange={(e) => handleValueChange(setting.id, e.target.value)}
                placeholder="或手动输入图片URL"
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  isEdited ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
              />

              {/* 图片预览 */}
              {value && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    预览：
                  </p>
                  <img
                    src={value}
                    alt="预览"
                    className="w-32 h-32 object-contain border border-gray-200 rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12"%3E加载失败%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              )}
            </div>
          );
        }

        // 普通文本字段
        return (
          <input
            type={setting.isEncrypted ? "password" : "text"}
            value={value}
            onChange={(e) => handleValueChange(setting.id, e.target.value)}
            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
              isEdited ? "border-blue-500 bg-blue-50" : "border-gray-300"
            }`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const currentSettings = settings[activeTab] || [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">系统配置</h1>
        <p className="text-gray-600">管理系统全局配置参数</p>
      </div>

      {/* Tab导航 */}
      <div className="bg-white rounded-2xl shadow-sm mb-6 p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 配置表单 */}
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="space-y-6">
          {currentSettings.map((setting) => (
            <div
              key={setting.id}
              className="border-b border-gray-100 pb-6 last:border-0"
            >
              <label className="block mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {setting.label}
                  </span>
                  {setting.isEncrypted && (
                    <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      加密存储
                    </span>
                  )}
                </div>
                {setting.description && (
                  <p className="text-sm text-gray-500 mb-3">
                    {setting.description}
                  </p>
                )}
                {renderInput(setting)}
              </label>
            </div>
          ))}

          {currentSettings.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">该分类下暂无配置项</p>
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        {currentSettings.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {Object.keys(editedValues).length > 0 && (
                  <>
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span>
                      有 {Object.keys(editedValues).length} 项未保存的更改
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={handleSave}
                disabled={saving || Object.keys(editedValues).length === 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>保存配置</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;
