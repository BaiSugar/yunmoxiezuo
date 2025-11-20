import React, { useState, useEffect } from "react";
import {
  Type,
  Moon,
  Sun,
  Monitor,
  Save,
  RotateCcw,
  Settings,
  Loader2,
} from "lucide-react";
import { editorSettingsApi } from "../../services/editor-settings.api";
import { useToast } from "../../contexts/ToastContext";
import type {
  UpdateEditorSettingsDto,
  EditorTheme,
} from "../../types/editor-settings";

/**
 * 安全的跨平台字体选项
 * 使用字体栈确保在不同操作系统上都能正常显示
 */
const FONT_OPTIONS = [
  // 中文字体 - 带完整回退方案
  {
    value:
      "PingFang SC, Microsoft YaHei, Hiragino Sans GB, WenQuanYi Micro Hei, sans-serif",
    label: "默认（系统优选）",
    category: "推荐",
    description: "根据系统自动选择最佳中文字体",
  },
  {
    value: "Microsoft YaHei, PingFang SC, Hiragino Sans GB, sans-serif",
    label: "微软雅黑",
    category: "推荐",
    description: "Windows 标配，清晰易读",
  },
  {
    value: "SimSun, NSimSun, STSong, serif",
    label: "宋体",
    category: "推荐",
    description: "传统阅读字体，适合正文",
  },
  {
    value: "KaiTi, STKaiti, BiauKai, serif",
    label: "楷体",
    category: "中文",
    description: "手写风格，适合诗歌散文",
  },
  {
    value: "SimHei, STHeiti, Heiti SC, sans-serif",
    label: "黑体",
    category: "中文",
    description: "粗壮醒目",
  },
  {
    value: "FangSong, STFangsong, serif",
    label: "仿宋",
    category: "中文",
    description: "公文常用字体",
  },

  // 英文字体 - 通用系统字体
  {
    value: "Georgia, Times New Roman, serif",
    label: "Georgia",
    category: "英文",
    description: "优雅的衬线字体",
  },
  {
    value: "Arial, Helvetica, sans-serif",
    label: "Arial",
    category: "英文",
    description: "清晰的无衬线字体",
  },
  {
    value: "Verdana, Geneva, sans-serif",
    label: "Verdana",
    category: "英文",
    description: "适合屏幕阅读",
  },
  {
    value: "Times New Roman, Times, serif",
    label: "Times New Roman",
    category: "英文",
    description: "经典衬线字体",
  },

  // 等宽字体
  {
    value: "Consolas, Monaco, Courier New, monospace",
    label: "等宽字体",
    category: "特殊",
    description: "适合代码、诗歌等需要对齐的内容",
  },
];

const THEME_OPTIONS = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "auto", label: "跟随系统", icon: Monitor },
];

/**
 * 编辑器设置页面
 */
export const EditorSettingsPage: React.FC = () => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 本地编辑状态
  const [formData, setFormData] = useState<UpdateEditorSettingsDto>({});

  // 自定义字体输入
  const [isCustomFont, setIsCustomFont] = useState(false);
  const [customFontInput, setCustomFontInput] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await editorSettingsApi.getSettings();
      setFormData({
        fontFamily: data.fontFamily,
        fontSize: data.fontSize,
        lineHeight: data.lineHeight,
        theme: data.theme,
        paragraphIndent: data.paragraphIndent,
        paragraphSpacing: data.paragraphSpacing,
        autoSave: data.autoSave,
        autoSaveInterval: data.autoSaveInterval,
        showWordCount: data.showWordCount,
      });
      setHasChanges(false);
    } catch (err: any) {
      console.error("加载编辑器设置失败:", err);
      showError(
        "加载失败",
        err.response?.data?.message || "无法加载编辑器设置"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await editorSettingsApi.updateSettings(formData);
      setHasChanges(false);
      success("保存成功", "编辑器设置已保存");
    } catch (err: any) {
      console.error("保存编辑器设置失败:", err);
      showError(
        "保存失败",
        err.response?.data?.message || "无法保存编辑器设置"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("确定要恢复默认设置吗？所有自定义配置将被重置。")) {
      return;
    }

    setResetting(true);
    try {
      const defaultSettings = await editorSettingsApi.resetSettings();
      setFormData({
        fontFamily: defaultSettings.fontFamily,
        fontSize: defaultSettings.fontSize,
        lineHeight: defaultSettings.lineHeight,
        theme: defaultSettings.theme,
        paragraphIndent: defaultSettings.paragraphIndent,
        paragraphSpacing: defaultSettings.paragraphSpacing,
        autoSave: defaultSettings.autoSave,
        autoSaveInterval: defaultSettings.autoSaveInterval,
        showWordCount: defaultSettings.showWordCount,
      });
      setHasChanges(false);
      success("重置成功", "已恢复为默认设置");
    } catch (err: any) {
      console.error("重置编辑器设置失败:", err);
      showError(
        "重置失败",
        err.response?.data?.message || "无法重置编辑器设置"
      );
    } finally {
      setResetting(false);
    }
  };

  const updateField = <K extends keyof UpdateEditorSettingsDto>(
    field: K,
    value: UpdateEditorSettingsDto[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* 头部 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            编辑器设置
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          个性化定制您的写作环境
        </p>
      </div>

      <div className="space-y-6">
        {/* 字体设置 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Type className="w-5 h-5" />
            字体设置
          </h2>

          <div className="space-y-4">
            {/* 字体系列 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                字体
              </label>

              {/* 预设字体 / 自定义字体切换 */}
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomFont(false);
                    if (
                      formData.fontFamily &&
                      !FONT_OPTIONS.some((f) => f.value === formData.fontFamily)
                    ) {
                      updateField("fontFamily", FONT_OPTIONS[0].value);
                    }
                  }}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    !isCustomFont
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  预设字体
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomFont(true)}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    isCustomFont
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                >
                  自定义字体
                </button>
              </div>

              {isCustomFont ? (
                /* 自定义字体输入 */
                <div>
                  <input
                    type="text"
                    value={customFontInput}
                    onChange={(e) => {
                      setCustomFontInput(e.target.value);
                      updateField("fontFamily", e.target.value);
                    }}
                    placeholder="例如: 思源宋体, Source Han Serif, serif"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    💡 <strong>提示：</strong>输入您系统中已安装的字体名称
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    📝 <strong>示例：</strong>
                  </p>
                  <ul className="text-xs text-gray-500 mt-1 ml-4 space-y-0.5">
                    <li>• 思源宋体, Source Han Serif, serif</li>
                    <li>• 霞鹜文楷, LXGW WenKai, KaiTi, serif</li>
                    <li>• Noto Serif SC, SimSun, serif</li>
                  </ul>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                    ⚠️ <strong>重要：</strong>
                    使用自定义字体前，请确保您的系统已安装该字体，否则将显示为默认字体
                  </p>
                </div>
              ) : (
                /* 预设字体选择 */
                <div>
                  <select
                    value={formData.fontFamily}
                    onChange={(e) => updateField("fontFamily", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {/* 按分类分组显示 */}
                    {["推荐", "中文", "英文", "特殊"].map((category) => {
                      const categoryFonts = FONT_OPTIONS.filter(
                        (f) => f.category === category
                      );
                      if (categoryFonts.length === 0) return null;
                      return (
                        <optgroup key={category} label={category}>
                          {categoryFonts.map((font) => (
                            <option
                              key={font.value}
                              value={font.value}
                              title={font.description}
                            >
                              {font.label}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    ✅ <strong>推荐字体：</strong>
                    这些字体在大多数系统上都能正常显示，使用了字体回退机制
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    📌 字体会按顺序尝试加载，如果第一个不可用会自动使用下一个
                  </p>
                </div>
              )}
            </div>

            {/* 字体大小 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  字体大小
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="12"
                    max="32"
                    value={formData.fontSize || 16}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 12 && value <= 32) {
                        updateField("fontSize", value);
                      }
                    }}
                    className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">px</span>
                </div>
              </div>
              <input
                type="range"
                min="12"
                max="32"
                value={formData.fontSize}
                onChange={(e) =>
                  updateField("fontSize", Number(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>12px</span>
                <span>32px</span>
              </div>
            </div>

            {/* 行距 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  行距
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1.0"
                    max="3.0"
                    step="0.1"
                    value={formData.lineHeight || 1.8}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      if (value >= 1.0 && value <= 3.0) {
                        updateField("lineHeight", value);
                      }
                    }}
                    className="w-20 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">倍</span>
                </div>
              </div>
              <input
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                value={formData.lineHeight}
                onChange={(e) =>
                  updateField("lineHeight", Number(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1.0</span>
                <span>3.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* 主题设置 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            主题
          </h2>

          <div className="grid grid-cols-3 gap-4">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => updateField("theme", value as EditorTheme)}
                className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all ${
                  formData.theme === value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-300"
                }`}
              >
                <Icon className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 段落设置 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            段落格式
          </h2>

          <div className="space-y-4">
            {/* 段首空格 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                段首空格数：{formData.paragraphIndent} 个全角空格
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={formData.paragraphIndent}
                onChange={(e) =>
                  updateField("paragraphIndent", Number(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>无缩进</span>
                <span>10个空格</span>
              </div>
            </div>

            {/* 段间空行 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                段间空行数：{formData.paragraphSpacing} 行
              </label>
              <input
                type="range"
                min="0"
                max="5"
                value={formData.paragraphSpacing}
                onChange={(e) =>
                  updateField("paragraphSpacing", Number(e.target.value))
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>无空行</span>
                <span>5行</span>
              </div>
            </div>
          </div>
        </div>

        {/* 编辑器功能 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
            编辑器功能
          </h2>

          <div className="space-y-4">
            {/* 自动保存 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  自动保存
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  定期自动保存您的编辑内容
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoSave}
                  onChange={(e) => updateField("autoSave", e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* 自动保存间隔 */}
            {formData.autoSave && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  自动保存间隔：{formData.autoSaveInterval} 秒
                </label>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="10"
                  value={formData.autoSaveInterval}
                  onChange={(e) =>
                    updateField("autoSaveInterval", Number(e.target.value))
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10秒</span>
                  <span>300秒</span>
                </div>
              </div>
            )}

            {/* 字数统计 */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  显示字数统计
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  在编辑器中显示字数统计信息
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showWordCount}
                  onChange={(e) =>
                    updateField("showWordCount", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              !hasChanges || saving
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                保存设置
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                重置中...
              </>
            ) : (
              <>
                <RotateCcw className="w-5 h-5" />
                恢复默认
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
