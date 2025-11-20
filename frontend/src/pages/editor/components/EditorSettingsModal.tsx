import React, { useState, useEffect } from "react";
import { X, Type, Save, RotateCcw, Loader2 } from "lucide-react";
import { editorSettingsApi } from "../../../services/editor-settings.api";
import { fontsApi } from "../../../services/fonts.api";
import { useToast } from "../../../contexts/ToastContext";
import { FontLoader } from "../../../utils/fontLoader";
import { FontSelect } from "./FontSelect";
import type {
  UpdateEditorSettingsDto,
  EditorSettings,
} from "../../../types/editor-settings";
import type { Font } from "../../../types/font";

// 主题功能已被背景颜色功能取代，不再需要单独的主题设置

interface EditorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: (settings: EditorSettings) => void;
}

/**
 * 编辑器设置模态框
 */
export const EditorSettingsModal: React.FC<EditorSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated,
}) => {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 本地编辑状态
  const [formData, setFormData] = useState<UpdateEditorSettingsDto>({});

  // 服务器字体列表
  const [serverFonts, setServerFonts] = useState<Font[]>([]);
  const [fontsLoading, setFontsLoading] = useState(false);

  // 用户上传字体
  const [isUploadTab, setIsUploadTab] = useState(false);
  const [myFonts, setMyFonts] = useState<Font[]>([]);
  const [uploading, setUploading] = useState(false);

  // 上传表单
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fontName, setFontName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");

  // 背景设置
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettingsAndFonts();
    }
  }, [isOpen]);

  // 加载设置和字体（顺序执行，确保正确判断tab）
  const loadSettingsAndFonts = async () => {
    setLoading(true);
    setFontsLoading(true);

    try {
      // 1. 先加载字体列表（系统字体 + 用户字体）
      const fonts = await fontsApi.getEnabledFonts();
      // 去重：根据id去重
      const uniqueFonts = Array.from(
        new Map(fonts.map((f) => [f.id, f])).values()
      );
      setServerFonts(uniqueFonts);
      await FontLoader.loadFonts(uniqueFonts);

      // 2. 从字体列表中提取用户自己上传的字体
      const userFonts = uniqueFonts.filter((f) => f.userId);
      setMyFonts(userFonts);

      // 3. 加载用户设置
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
        backgroundColor: data.backgroundColor,
        backgroundImage: data.backgroundImage,
      });

      // 4. 判断当前字体是否在服务器字体列表中
      const currentFontFamily = data.fontFamily;
      const isServerFont = fonts.some(
        (f) =>
          FontLoader.getFontFamily(f) === currentFontFamily ||
          f.name === currentFontFamily ||
          currentFontFamily.includes(f.name)
      );

      // 5. 设置正确的tab（预设字体 or 上传字体）
      setIsUploadTab(!isServerFont);

      setHasChanges(false);
    } catch (err: any) {
      console.error("加载编辑器设置失败:", err);
      showError(
        "加载失败",
        err.response?.data?.message || "无法加载编辑器设置或字体列表"
      );
    } finally {
      setLoading(false);
      setFontsLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await editorSettingsApi.updateSettings(formData);
      // 重新获取完整的设置数据
      const updatedSettings = await editorSettingsApi.getSettings();
      setHasChanges(false);
      success("保存成功", "编辑器设置已保存并应用");

      // 通知父组件更新设置
      if (onSettingsUpdated) {
        onSettingsUpdated(updatedSettings);
      }

      onClose();
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

      // 通知父组件更新设置
      if (onSettingsUpdated) {
        onSettingsUpdated(defaultSettings);
      }
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

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件格式
    const validFormats = [".woff2", ".woff", ".ttf", ".otf"];
    const fileExt = file.name
      .substring(file.name.lastIndexOf("."))
      .toLowerCase();
    if (!validFormats.includes(fileExt)) {
      showError("文件格式错误", "仅支持 .woff2, .woff, .ttf, .otf 格式");
      return;
    }

    // 验证文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showError("文件过大", "字体文件不能超过 10MB");
      return;
    }

    setUploadFile(file);

    // 自动从文件名提取字体名称
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    if (!fontName) setFontName(baseName);
    if (!displayName) setDisplayName(baseName);
  };

  // 上传字体
  const handleUploadFont = async () => {
    if (!uploadFile || !fontName || !displayName) {
      showError("信息不完整", "请选择文件并填写字体名称和显示名称");
      return;
    }

    setUploading(true);
    try {
      const newFont = await fontsApi.userUploadFont(
        uploadFile,
        fontName,
        displayName,
        description
      );

      success("上传成功", `字体 "${displayName}" 已上传到服务器`);

      // 清空表单
      setUploadFile(null);
      setFontName("");
      setDisplayName("");
      setDescription("");

      // 重新加载字体列表
      await loadSettingsAndFonts();

      // 自动选择新上传的字体
      updateField("fontFamily", FontLoader.getFontFamily(newFont));

      // 切换到预设字体tab
      setIsUploadTab(false);
    } catch (err: any) {
      console.error("上传字体失败:", err);
      showError("上传失败", err.response?.data?.message || "无法上传字体文件");
    } finally {
      setUploading(false);
    }
  };

  // 删除字体
  const handleDeleteFont = async (fontId: number, fontName: string) => {
    if (!confirm(`确定要删除字体"${fontName}"吗？删除后无法恢复。`)) {
      return;
    }

    try {
      await fontsApi.deleteMyFont(fontId);
      success("删除成功", `字体 "${fontName}" 已删除`);

      // 重新加载字体列表
      await loadSettingsAndFonts();
    } catch (err: any) {
      console.error("删除字体失败:", err);
      showError("删除失败", err.response?.data?.message || "无法删除字体");
    }
  };

  // 预设背景颜色
  const PRESET_COLORS = [
    { name: "默认白色", value: "#FFFFFF" },
    { name: "护眼黄", value: "#F5F3E8" },
    { name: "淡绿色", value: "#E8F5E8" },
    { name: "淡蓝色", value: "#E8F0F5" },
    { name: "羊皮纸", value: "#FFF8DC" },
    { name: "浅灰色", value: "#F5F5F5" },
  ];

  // 选择背景颜色
  const handleColorSelect = (color: string) => {
    updateField("backgroundColor", color);
    // 如果有背景图，清除背景图
    if (formData.backgroundImage) {
      updateField("backgroundImage", null);
    }
  };

  // 选择背景图文件
  const handleBackgroundFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showError("文件格式错误", "仅支持 JPG、PNG、WebP 格式");
      return;
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showError("文件过大", "背景图不能超过 5MB");
      return;
    }

    setBackgroundFile(file);
  };

  // 上传背景图
  const handleUploadBackground = async () => {
    if (!backgroundFile) return;

    setUploadingBg(true);
    try {
      const result = await editorSettingsApi.uploadBackground(backgroundFile);

      success("上传成功", "背景图已上传并应用");

      // 更新设置
      updateField("backgroundImage", result.backgroundImage);
      updateField("backgroundColor", null);

      // 清空文件选择
      setBackgroundFile(null);

      // 重新加载设置
      await loadSettingsAndFonts();

      // 立即通知父组件更新设置（实时应用背景图）
      if (onSettingsUpdated) {
        const updatedSettings = await editorSettingsApi.getSettings();
        onSettingsUpdated(updatedSettings);
      }
    } catch (err: any) {
      console.error("上传背景图失败:", err);
      showError("上传失败", err.response?.data?.message || "无法上传背景图");
    } finally {
      setUploadingBg(false);
    }
  };

  // 删除背景图
  const handleDeleteBackground = async () => {
    if (!confirm("确定要删除背景图吗？")) return;

    try {
      await editorSettingsApi.deleteBackground();
      success("删除成功", "背景图已删除");

      updateField("backgroundImage", null);
      await loadSettingsAndFonts();

      // 立即通知父组件更新设置（实时移除背景图）
      if (onSettingsUpdated) {
        const updatedSettings = await editorSettingsApi.getSettings();
        onSettingsUpdated(updatedSettings);
      }
    } catch (err: any) {
      console.error("删除背景图失败:", err);
      showError("删除失败", err.response?.data?.message || "无法删除背景图");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Type className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">
                编辑器设置
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
                个性化定制您的写作环境
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* 字体设置 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3 flex items-center gap-2">
                  <Type className="w-3 h-3 sm:w-4 sm:h-4" />
                  字体设置
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      字体
                    </label>

                    {/* 预设字体 / 上传字体切换 */}
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsUploadTab(false);
                          // 如果当前字体不在服务器列表中，选择第一个字体
                          if (serverFonts.length > 0) {
                            const currentFontInServer = serverFonts.some(
                              (f) =>
                                FontLoader.getFontFamily(f) ===
                                  formData.fontFamily ||
                                f.name === formData.fontFamily
                            );
                            if (!currentFontInServer) {
                              const defaultFont =
                                serverFonts.find((f) => f.isDefault) ||
                                serverFonts[0];
                              updateField(
                                "fontFamily",
                                FontLoader.getFontFamily(defaultFont)
                              );
                            }
                          }
                        }}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          !isUploadTab
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        预设字体
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsUploadTab(true)}
                        className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          isUploadTab
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        上传字体
                      </button>
                    </div>

                    {isUploadTab ? (
                      /* 上传字体功能 */
                      <div className="space-y-4">
                        {/* 上传提示 */}
                        <div className="flex items-start gap-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                          <span className="mt-0.5">✨</span>
                          <div>
                            <strong>上传字体到服务器</strong>
                            <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                              上传后，您可以在任何设备（电脑、手机、平板）上使用该字体，无需重复安装！
                            </p>
                          </div>
                        </div>

                        {/* 上传表单 */}
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              选择字体文件 *
                            </label>
                            <input
                              type="file"
                              accept=".woff2,.woff,.ttf,.otf"
                              onChange={handleFileSelect}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-lg file:border-0
                                file:text-sm file:font-medium
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100
                                dark:file:bg-blue-900/20 dark:file:text-blue-400"
                            />
                            {uploadFile && (
                              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                ✓ 已选择: {uploadFile.name} (
                                {(uploadFile.size / 1024 / 1024).toFixed(2)}MB)
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              字体名称（CSS font-family）*
                            </label>
                            <input
                              type="text"
                              value={fontName}
                              onChange={(e) => setFontName(e.target.value)}
                              placeholder="例如: MyCustomFont"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              显示名称 *
                            </label>
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              placeholder="例如: 我的自定义字体"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              字体描述（可选）
                            </label>
                            <input
                              type="text"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="例如: 适合正文阅读的宋体"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <button
                            onClick={handleUploadFont}
                            disabled={
                              uploading ||
                              !uploadFile ||
                              !fontName ||
                              !displayName
                            }
                            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                上传中...
                              </>
                            ) : (
                              <>上传字体</>
                            )}
                          </button>
                        </div>

                        {/* 使用说明 */}
                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <p>
                            📌 <strong>限制说明：</strong>
                          </p>
                          <ul className="list-disc list-inside ml-2 space-y-0.5">
                            <li>支持格式：.woff2, .woff, .ttf, .otf</li>
                            <li>单个文件最大 10MB</li>
                            <li>最多上传 5 个字体</li>
                          </ul>
                        </div>

                        {/* 已上传的字体列表 */}
                        {myFonts.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                              我的字体 ({myFonts.length}/5)
                            </h4>
                            <div className="space-y-2">
                              {myFonts.map((font) => (
                                <div
                                  key={font.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                      {font.displayName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {font.name} •{" "}
                                      {(font.fileSize / 1024 / 1024).toFixed(2)}
                                      MB
                                    </p>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleDeleteFont(
                                        font.id,
                                        font.displayName
                                      )
                                    }
                                    className="px-3 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                  >
                                    删除
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* 服务器字体选择 */
                      <div>
                        {fontsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                            <span className="text-sm text-gray-500">
                              加载字体列表...
                            </span>
                          </div>
                        ) : serverFonts.length > 0 ? (
                          <>
                            <FontSelect
                              fonts={serverFonts}
                              value={formData.fontFamily || ""}
                              onChange={(fontFamily) =>
                                updateField("fontFamily", fontFamily)
                              }
                              loading={fontsLoading}
                            />
                            <div className="flex items-start gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded mt-2">
                              <span className="mt-0.5">✅</span>
                              <div>
                                <strong>预设字体（推荐）：</strong>
                                <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                                  这些字体由服务器提供或使用系统通用字体，确保所有用户都能看到相同的显示效果，无需额外安装。
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500 py-4 text-center">
                            暂无可用字体，请使用自定义字体或联系管理员上传字体
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        字体大小
                      </label>
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
                        className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
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
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>12px</span>
                      <span>32px</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        行距
                      </label>
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
                        className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
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
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>1.0</span>
                      <span>3.0</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 段落设置 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  段落格式
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
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
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>无缩进</span>
                      <span>10个空格</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
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
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>无空行</span>
                      <span>5行</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 编辑器功能 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  编辑器功能
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        自动保存
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        定期自动保存您的编辑内容
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.autoSave}
                        onChange={(e) =>
                          updateField("autoSave", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {formData.autoSave && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        自动保存间隔：{formData.autoSaveInterval} 秒
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="300"
                        step="10"
                        value={formData.autoSaveInterval}
                        onChange={(e) =>
                          updateField(
                            "autoSaveInterval",
                            Number(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>10秒</span>
                        <span>300秒</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        显示字数统计
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
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

              {/* 背景设置 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                  背景设置
                </h3>
                <div className="space-y-4">
                  {/* 背景颜色选择 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      背景颜色
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => handleColorSelect(color.value)}
                          className={`flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                            formData.backgroundColor === color.value &&
                            !formData.backgroundImage
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-300 dark:border-gray-600 hover:border-blue-300"
                          }`}
                        >
                          <div
                            className="w-12 h-12 rounded-lg border border-gray-300 mb-1"
                            style={{ backgroundColor: color.value }}
                          />
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {color.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 背景图上传 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                      编辑器背景图片（优先于背景颜色）
                    </label>

                    {formData.backgroundImage ? (
                      /* 已有背景图 */
                      <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
                        <div className="relative h-32 rounded-lg overflow-hidden">
                          <img
                            src={`/uploads/${formData.backgroundImage}`}
                            alt="背景预览"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          onClick={handleDeleteBackground}
                          className="w-full px-3 py-1.5 text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded transition-all"
                        >
                          删除背景图
                        </button>
                      </div>
                    ) : (
                      /* 上传背景图 */
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleBackgroundFileSelect}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-1.5 file:px-3
                            file:rounded-lg file:border-0
                            file:text-xs file:font-medium
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100
                            dark:file:bg-blue-900/20 dark:file:text-blue-400"
                        />
                        {backgroundFile && (
                          <div className="space-y-2">
                            <p className="text-xs text-green-600 dark:text-green-400">
                              ✓ 已选择: {backgroundFile.name} (
                              {(backgroundFile.size / 1024 / 1024).toFixed(2)}
                              MB)
                            </p>
                            <button
                              onClick={handleUploadBackground}
                              disabled={uploadingBg}
                              className="w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                            >
                              {uploadingBg ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  上传中...
                                </>
                              ) : (
                                <>上传背景图</>
                              )}
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-gray-400">
                          💡 支持 JPG、PNG、WebP，最大 5MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving || loading}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base transition-all ${
              !hasChanges || saving || loading
                ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">保存中...</span>
                <span className="sm:hidden">保存中</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">保存设置</span>
                <span className="sm:hidden">保存</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={resetting || loading}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium text-sm sm:text-base flex items-center gap-1 sm:gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">重置中...</span>
                <span className="sm:hidden">重置</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">恢复默认</span>
                <span className="sm:hidden">恢复</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
