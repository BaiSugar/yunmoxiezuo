import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import promptGroupApi from "../../services/prompt-groups.api";
import { promptsApi } from "../../services/prompts.api";
import type {
  CreatePromptGroupDto,
  PromptGroupItemDto,
} from "../../types/prompt-group";
import type { Prompt } from "../../types/prompt";
import {
  PROMPT_GROUP_STAGE_TYPES,
  STAGE_TYPE_LABELS,
} from "../../constants/book-creation";
import PromptSelect from "../../components/common/PromptSelect";

/**
 * 提示词组编辑器页面
 */
const PromptGroupEditor: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [myPrompts, setMyPrompts] = useState<Prompt[]>([]);

  // 表单数据
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [requireApplication, setRequireApplication] = useState(false);
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    "draft"
  );
  const [items, setItems] = useState<PromptGroupItemDto[]>([]);

  // 加载我的提示词列表
  useEffect(() => {
    loadMyPrompts();
  }, []);

  // 如果是编辑模式，加载提示词组数据
  useEffect(() => {
    if (id) {
      loadPromptGroup();
    }
  }, [id]);

  const loadMyPrompts = async () => {
    try {
      setLoadingPrompts(true);
      const prompts = await promptsApi.getMyPrompts({
        page: 1,
        pageSize: 200,
      });
      setMyPrompts(prompts);
    } catch (err: any) {
      error("加载失败", err.response?.data?.message || "加载我的提示词失败");
    } finally {
      setLoadingPrompts(false);
    }
  };

  const loadPromptGroup = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const group = await promptGroupApi.getById(parseInt(id));
      setName(group.name);
      setDescription(group.description || "");
      setIsPublic(group.isPublic);
      setRequireApplication(group.requireApplication);
      setCategoryId(group.categoryId);
      setStatus(group.status);
      setItems(
        group.items.map((item) => ({
          promptId: item.promptId,
          stageType: item.stageType,
          stageLabel: item.stageLabel,
          order: item.order,
          isRequired: item.isRequired,
        }))
      );
    } catch (err: any) {
      error("加载失败", err.response?.data?.message || "加载提示词组失败");
      navigate("/dashboard/book-creation/prompt-groups");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        promptId: 0,
        stageType: PROMPT_GROUP_STAGE_TYPES.IDEA_GENERATION,
        stageLabel: "",
        order: items.length,
        isRequired: true,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof PromptGroupItemDto,
    value: any
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = async () => {
    // 验证
    if (!name.trim()) {
      error("验证失败", "请输入提示词组名称");
      return;
    }

    if (items.length === 0) {
      error("验证失败", "请至少添加一个提示词");
      return;
    }

    // 检查是否所有项都选择了提示词
    const invalidItems = items.filter(
      (item) => !item.promptId || item.promptId === 0
    );
    if (invalidItems.length > 0) {
      error("验证失败", "请为所有项选择提示词");
      return;
    }

    // 检查是否有重复的阶段类型
    const stageTypes = items.map((item) => item.stageType);
    const duplicates = stageTypes.filter(
      (type, index) => stageTypes.indexOf(type) !== index
    );
    if (duplicates.length > 0) {
      error("验证失败", `阶段类型重复：${duplicates.join(", ")}`);
      return;
    }

    try {
      setLoading(true);

      const data: CreatePromptGroupDto = {
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
        requireApplication,
        categoryId,
        status,
        items: items.map((item, index) => ({
          ...item,
          order: index,
        })),
      };

      if (id) {
        // 更新
        await promptGroupApi.update(parseInt(id), data);
        success("更新成功", "提示词组更新成功");
      } else {
        // 创建
        await promptGroupApi.create(data);
        success("创建成功", "提示词组创建成功");
      }

      navigate("/dashboard/book-creation/prompt-groups");
    } catch (err: any) {
      error(
        "操作失败",
        err.response?.data?.message || (id ? "更新失败" : "创建失败")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate("/dashboard/book-creation/prompt-groups")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回提示词组列表
        </button>

        {/* 主内容 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-lg border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {id ? "编辑提示词组" : "创建提示词组"}
          </h1>

          {/* 基本信息 */}
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                提示词组名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：玄幻小说创作套装"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                描述（支持Markdown）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述这个提示词组的用途、特点等..."
                className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5 text-purple-500 rounded"
                  />
                  <span className="text-gray-700">公开到提示词组广场</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireApplication}
                    onChange={(e) => setRequireApplication(e.target.checked)}
                    className="w-5 h-5 text-purple-500 rounded"
                  />
                  <span className="text-gray-700">需要申请才能使用</span>
                </label>
              </div>
            </div>

            {requireApplication && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-800 text-sm">
                  ⚠️ <strong>注意：</strong>
                  当设置为"需要申请"时，组内所有提示词也会自动设置为需要申请
                </p>
              </div>
            )}

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>

          {/* 提示词列表 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">提示词列表</h2>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加提示词
              </button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500">
                  还没有添加提示词，点击上方按钮添加
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-4 flex items-start gap-4"
                  >
                    {/* 拖拽手柄 */}
                    <div className="pt-3">
                      <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 阶段类型 */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          阶段类型 <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.stageType}
                          onChange={(e) =>
                            handleUpdateItem(index, "stageType", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          {Object.entries(STAGE_TYPE_LABELS).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      {/* 选择提示词 */}
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">
                          选择提示词 <span className="text-red-500">*</span>
                        </label>
                        <PromptSelect
                          value={item.promptId || 0}
                          options={myPrompts}
                          onChange={(promptId) =>
                            handleUpdateItem(index, "promptId", promptId)
                          }
                          placeholder="请选择提示词..."
                          disabled={loadingPrompts}
                          loading={loadingPrompts}
                        />
                      </div>

                      {/* 是否必需 */}
                      <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer pt-6">
                          <input
                            type="checkbox"
                            checked={item.isRequired !== false}
                            onChange={(e) =>
                              handleUpdateItem(
                                index,
                                "isRequired",
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 text-purple-500 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            必需阶段
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => handleRemoveItem(index)}
                      className="mt-2 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                <p className="text-blue-800 text-sm">
                  💡 <strong>提示：</strong>提示词按照顺序执行，可以拖动调整顺序
                </p>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={loading || !name.trim() || items.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {loading ? "保存中..." : id ? "更新提示词组" : "创建提示词组"}
            </button>
            <button
              onClick={() => navigate("/dashboard/book-creation/prompt-groups")}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptGroupEditor;
