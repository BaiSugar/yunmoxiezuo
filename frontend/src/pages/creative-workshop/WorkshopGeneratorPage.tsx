import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GeneratorInterface } from "../../pages/editor/components/ai-assistant/GeneratorInterface";
import type { GeneratorInterfaceRef } from "../../pages/editor/components/ai-assistant/GeneratorInterface";
import { ChatHistoryModal } from "../../pages/editor/components/ai-assistant/ChatHistoryModal";
import { promptCategoriesApi } from "../../services/prompts.api";
import { novelsApi } from "../../services/novels.api";
import { useToast } from "../../contexts/ToastContext";
import type { PromptCategory } from "../../types/prompt";
import ApplyToWorkModal from "./components/ApplyToWorkModal";
import WorkSelectorModal from "./components/WorkSelectorModal";

/**
 * 工坊生成器页面 - 独立全屏页面（Dashboard使用）
 */
const WorkshopGeneratorPage: React.FC = () => {
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const { error: showError } = useToast();
  const generatorRef = useRef<GeneratorInterfaceRef>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showWorkSelector, setShowWorkSelector] = useState(false);
  const [showWorkTip, setShowWorkTip] = useState(false); // 显示关联作品提示
  const [pendingContent, setPendingContent] = useState("");
  const [selectedNovelId, setSelectedNovelId] = useState<number | undefined>(
    undefined
  );
  const [selectedNovelName, setSelectedNovelName] = useState<string>("");
  const [chapters, setChapters] = useState<any[]>([]);
  const [volumes, setVolumes] = useState<any[]>([]);
  const [category, setCategory] = useState<PromptCategory | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载分类信息
  useEffect(() => {
    const loadCategory = async () => {
      if (!categoryId) {
        navigate("/dashboard/workshop");
        return;
      }

      setLoading(true);
      try {
        const data = await promptCategoriesApi.getCategory(Number(categoryId));
        setCategory(data);
      } catch (error) {
        console.error("加载分类失败:", error);
        showError("加载分类失败");
        navigate("/dashboard/workshop");
      } finally {
        setLoading(false);
      }
    };

    loadCategory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]); // 只依赖 categoryId，避免 showError/navigate 变化导致重复加载

  // 加载章节和分卷数据（当选择作品后）
  useEffect(() => {
    const loadNovelData = async () => {
      if (!selectedNovelId) {
        setChapters([]);
        setVolumes([]);
        return;
      }

      try {
        // 加载章节列表
        const chaptersData = await novelsApi.getChapters(selectedNovelId);
        setChapters(chaptersData || []);

        // 加载分卷列表
        try {
          const volumesData = await novelsApi.getVolumes(selectedNovelId);
          setVolumes(volumesData || []);
        } catch (err) {
          // 没有分卷是正常情况
          setVolumes([]);
        }
      } catch (error) {
        console.error("加载作品数据失败:", error);
      }
    };

    loadNovelData();
  }, [selectedNovelId]);

  const handleApplyToEditor = (content: string) => {
    // Dashboard模式：打开模态窗选择作品和章节
    setPendingContent(content);
    setShowApplyModal(true);
  };

  // 当用户尝试使用@功能但未关联作品时
  const handleRequestNovel = () => {
    // 显示提示动画，引导用户点击关联作品按钮
    setShowWorkTip(true);
    // 3秒后自动隐藏
    setTimeout(() => setShowWorkTip(false), 3000);
  };

  // 选择作品后的回调
  const handleWorkSelected = (workId: number, workName: string) => {
    if (workId === 0) {
      // 取消关联
      setSelectedNovelId(undefined);
      setSelectedNovelName("");
    } else {
      setSelectedNovelId(workId);
      setSelectedNovelName(workName);
    }
    setShowWorkTip(false); // 关闭提示
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* 内容区 - GeneratorInterface（包含面板模式和对话模式） */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {category && (
          <GeneratorInterface
            ref={generatorRef}
            key={`workshop-generator-${category.id}`}
            category={category}
            novelId={selectedNovelId}
            chapters={chapters}
            volumes={volumes}
            onApplyToEditor={handleApplyToEditor}
            onBack={() => navigate("/dashboard/workshop")}
            onShowHistory={() => setShowHistoryModal(true)}
            onRequestNovel={handleRequestNovel}
            selectedNovelName={selectedNovelName}
            showWorkTip={showWorkTip}
            onWorkSelectorOpen={() => setShowWorkSelector(true)}
          />
        )}
      </div>

      {/* 作品选择器 */}
      <WorkSelectorModal
        isOpen={showWorkSelector}
        selectedWorkId={selectedNovelId}
        onSelect={handleWorkSelected}
        onClose={() => setShowWorkSelector(false)}
      />

      {/* 历史记录模态框 */}
      <ChatHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onSelect={(historyId) => {
          if (generatorRef.current) {
            generatorRef.current.loadHistory(historyId);
          }
        }}
        onDelete={(historyId) => {
          if (generatorRef.current) {
            generatorRef.current.handleDeleteHistory(historyId);
          }
        }}
        novelId={selectedNovelId}
        categoryId={category?.id}
        categoryName={category?.name}
      />

      {/* 应用到作品模态框 */}
      <ApplyToWorkModal
        isOpen={showApplyModal}
        content={pendingContent}
        title={`${category?.name || "AI"}生成内容`}
        onClose={() => {
          setShowApplyModal(false);
          setPendingContent("");
        }}
      />
    </div>
  );
};

export default WorkshopGeneratorPage;
