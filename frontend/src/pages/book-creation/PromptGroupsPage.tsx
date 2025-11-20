import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Eye,
  Users,
  Heart,
  TrendingUp,
  Settings,
  Trash2,
  Edit,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import promptGroupApi from "../../services/prompt-groups.api";
import type { PromptGroup } from "../../types/prompt-group";

/**
 * 提示词组管理页面
 */
const PromptGroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const [groups, setGroups] = useState<PromptGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "my" | "public">("my");

  useEffect(() => {
    loadGroups();
  }, [filter]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: 1,
        pageSize: 50,
        sortBy: "createdAt",
        sortOrder: "DESC",
      };

      if (filter === "my") {
        // 加载我的提示词组 - 需要从API获取当前用户ID
        // params.userId = currentUserId;
      } else if (filter === "public") {
        params.isPublic = true;
        params.status = "published";
      }

      const response = await promptGroupApi.getAll(params);
      setGroups(response.data);
    } catch (err: any) {
      error("加载失败", err.response?.data?.message || "加载提示词组失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这个提示词组吗？")) {
      return;
    }

    try {
      await promptGroupApi.delete(id);
      success("删除成功", "提示词组已删除");
      loadGroups();
    } catch (err: any) {
      error("删除失败", err.response?.data?.message || "删除提示词组失败");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate("/dashboard/book-creation")}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          返回一键成书
        </button>

        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">提示词组管理</h1>
            <p className="text-gray-600 mt-1">创建和管理你的提示词套装</p>
          </div>
          <button
            onClick={() =>
              navigate("/dashboard/book-creation/prompt-groups/new")
            }
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            创建提示词组
          </button>
        </div>

        {/* 筛选器 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-gray-100 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("my")}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === "my"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              我的提示词组
            </button>
            <button
              onClick={() => setFilter("public")}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === "public"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              公开的提示词组
            </button>
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg transition-all ${
                filter === "all"
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              全部
            </button>
          </div>
        </div>

        {/* 列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-gray-500 mt-4">加载中...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-12 shadow-lg border border-gray-100 text-center">
            <p className="text-gray-500 text-lg mb-4">还没有提示词组</p>
            <button
              onClick={() =>
                navigate("/dashboard/book-creation/prompt-groups/new")
              }
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
            >
              <Plus className="w-5 h-5" />
              创建第一个提示词组
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all cursor-pointer"
                onClick={() =>
                  navigate(`/dashboard/book-creation/prompt-groups/${group.id}`)
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900 flex-1">
                    {group.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-lg ${
                      group.status === "published"
                        ? "bg-green-100 text-green-700"
                        : group.status === "draft"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {group.status === "published"
                      ? "已发布"
                      : group.status === "draft"
                      ? "草稿"
                      : "已归档"}
                  </span>
                </div>

                {group.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {group.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {group.viewCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {group.useCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {group.likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {group.hotValue}
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  包含 {group.items?.length || 0} 个提示词
                </div>

                {/* 操作按钮 */}
                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      navigate(
                        `/dashboard/book-creation/prompt-groups/${group.id}/edit`
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={() =>
                      navigate(
                        `/dashboard/book-creation/prompt-groups/${group.id}/permissions`
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    权限
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptGroupsPage;
