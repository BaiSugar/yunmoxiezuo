import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { editorSettingsApi } from "../services/editor-settings.api";
import type { EditorSettings } from "../types/editor-settings";
import { DEFAULT_EDITOR_SETTINGS } from "../types/editor-settings";
import { useAuth } from "./AuthContext";

interface EditorSettingsContextType {
  settings: EditorSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (updates: Partial<EditorSettings>) => Promise<void>;
}

const EditorSettingsContext = createContext<
  EditorSettingsContextType | undefined
>(undefined);

/**
 * 编辑器设置上下文提供者
 * 用于在整个应用中共享用户的编辑器设置
 * 注意：设置是每个用户独立的，当用户切换时会自动刷新
 */
export const EditorSettingsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [settings, setSettings] = useState<EditorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();

  const refreshSettings = async () => {
    // 如果用户未登录，清空设置
    if (!isAuthenticated || !user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await editorSettingsApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error("加载编辑器设置失败:", error);
      // 使用默认设置
      setSettings({
        id: 0,
        userId: user.id,
        ...DEFAULT_EDITOR_SETTINGS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as EditorSettings);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<EditorSettings>) => {
    try {
      const updated = await editorSettingsApi.updateSettings(updates);
      setSettings(updated);
    } catch (error) {
      console.error("更新编辑器设置失败:", error);
      throw error;
    }
  };

  // 监听用户变化，自动刷新设置
  useEffect(() => {
    refreshSettings();
  }, [user?.id, isAuthenticated]); // 当用户ID或登录状态变化时刷新

  return (
    <EditorSettingsContext.Provider
      value={{ settings, loading, refreshSettings, updateSettings }}
    >
      {children}
    </EditorSettingsContext.Provider>
  );
};

/**
 * 使用编辑器设置的 Hook
 */
export const useEditorSettings = () => {
  const context = useContext(EditorSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useEditorSettings must be used within EditorSettingsProvider"
    );
  }
  return context;
};
