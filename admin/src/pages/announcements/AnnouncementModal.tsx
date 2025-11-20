import { useState, useEffect } from "react";
import {
  createAnnouncement,
  updateAnnouncement,
  publishAndPushAnnouncement,
} from "../../api/announcements";
import { getRoleList } from "../../api/roles";
import { getMembershipPlans } from "../../api/memberships";
import type {
  Announcement,
  CreateAnnouncementDto,
  AnnouncementType,
  AnnouncementLevel,
  LinkTarget,
  LinkPosition,
  TargetType,
} from "../../types/announcement";
import { showToast } from "../../components/common/ToastContainer";

interface AnnouncementModalProps {
  announcement: Announcement | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AnnouncementModal({
  announcement,
  onClose,
  onSuccess,
}: AnnouncementModalProps) {
  const isEdit = !!announcement;

  const [formData, setFormData] = useState<CreateAnnouncementDto>({
    title: "",
    content: "",
    summary: "",
    type: "system" as AnnouncementType,
    priority: 5,
    level: "info" as AnnouncementLevel,
    hasLink: false,
    linkUrl: "",
    linkText: "",
    linkTarget: "_blank" as LinkTarget,
    linkPosition: "button" as LinkPosition,
    isActive: true,
    isTop: false,
    isPush: true, // 默认开启推送
    isPopup: false, // 默认右上角小窗，勾选为全屏弹窗
    needRead: false,
    startTime: new Date().toISOString().slice(0, 16),
    endTime: "",
    targetType: "all" as TargetType,
    targetIds: [],
  });

  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // 加载选项数据
  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [roleData, planData] = await Promise.all([
          getRoleList().catch(() => []),
          getMembershipPlans().catch(() => []),
        ]);
        setRoles(roleData);
        setPlans(planData);
      } catch (error) {
        console.error("加载选项失败:", error);
      } finally {
        setLoadingOptions(false);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        content: announcement.content,
        summary: announcement.summary || "",
        type: announcement.type,
        priority: announcement.priority,
        level: announcement.level,
        hasLink: announcement.hasLink,
        linkUrl: announcement.linkUrl || "",
        linkText: announcement.linkText || "",
        linkTarget: announcement.linkTarget,
        linkPosition: announcement.linkPosition,
        isActive: announcement.isActive,
        isTop: announcement.isTop,
        isPush: announcement.isPush,
        isPopup: announcement.isPopup,
        needRead: announcement.needRead,
        startTime: announcement.startTime.slice(0, 16),
        endTime: announcement.endTime ? announcement.endTime.slice(0, 16) : "",
        targetType: announcement.targetType,
        targetIds: announcement.targetIds || [],
      });
    }
  }, [announcement]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const submitData = {
        ...formData,
        startTime: formData.startTime
          ? new Date(formData.startTime).toISOString()
          : undefined,
        endTime: formData.endTime
          ? new Date(formData.endTime).toISOString()
          : undefined,
      };

      if (isEdit) {
        await updateAnnouncement(announcement.id, submitData);
        showToast("更新成功", "success");
      } else {
        await createAnnouncement(submitData);
        showToast("创建成功", "success");
      }
      onSuccess();
    } catch (error: any) {
      showToast(error.message || (isEdit ? "更新失败" : "创建失败"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEdit ? "编辑公告" : "创建公告"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]"
        >
          <div className="space-y-6">
            {/* 基础信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                基础信息
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标题 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入公告标题"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    摘要
                  </label>
                  <input
                    type="text"
                    value={formData.summary}
                    onChange={(e) =>
                      setFormData({ ...formData, summary: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入简短摘要"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    required
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入公告内容（支持HTML）"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      类型
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as AnnouncementType,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="system">系统公告</option>
                      <option value="activity">活动公告</option>
                      <option value="maintenance">维护公告</option>
                      <option value="feature">新功能公告</option>
                      <option value="notice">通知公告</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      级别
                    </label>
                    <select
                      value={formData.level}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          level: e.target.value as AnnouncementLevel,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="info">信息</option>
                      <option value="warning">警告</option>
                      <option value="error">错误</option>
                      <option value="success">成功</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      优先级
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 链接配置 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                链接配置
              </h3>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.hasLink}
                    onChange={(e) =>
                      setFormData({ ...formData, hasLink: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    启用链接跳转
                  </span>
                </label>

                {formData.hasLink && (
                  <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        链接地址
                      </label>
                      <input
                        type="text"
                        value={formData.linkUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, linkUrl: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="/activity/spring-2025"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        链接文本
                      </label>
                      <input
                        type="text"
                        value={formData.linkText}
                        onChange={(e) =>
                          setFormData({ ...formData, linkText: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="了解详情"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          打开方式
                        </label>
                        <select
                          value={formData.linkTarget}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              linkTarget: e.target.value as LinkTarget,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="_blank">新窗口</option>
                          <option value="_self">当前窗口</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          链接位置{" "}
                          <span className="text-xs text-gray-500">
                            (跳转链接在内容中的显示位置)
                          </span>
                        </label>
                        <select
                          value={formData.linkPosition}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              linkPosition: e.target.value as LinkPosition,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="content">
                            内容中（在正文HTML内容中显示链接）
                          </option>
                          <option value="button">
                            底部按钮（在内容下方显示独立按钮）
                          </option>
                          <option value="both">
                            两者都有（正文链接 + 底部按钮）
                          </option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 显示控制 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                显示控制
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">启用</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isTop}
                    onChange={(e) =>
                      setFormData({ ...formData, isTop: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">置顶</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPush}
                    onChange={(e) =>
                      setFormData({ ...formData, isPush: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">实时推送</span>
                </label>

                {/* 
                  isPopup 选项说明：
                  - true: 全屏弹窗显示完整公告内容（居中Modal）
                  - false: 右上角小窗Toast，仅显示标题和摘要（不含完整content）
                 */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPopup}
                    onChange={(e) =>
                      setFormData({ ...formData, isPopup: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    全屏弹窗显示
                  </span>
                  <span className="ml-2 text-xs text-gray-500">
                    (不勾选则显示右上角小窗，仅显示标题+摘要)
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.needRead}
                    onChange={(e) =>
                      setFormData({ ...formData, needRead: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">需确认已读</span>
                </label>
              </div>
            </div>

            {/* 时间范围 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                时间范围
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 目标受众 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                目标受众
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  受众类型
                </label>
                <select
                  value={formData.targetType}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      targetType: e.target.value as TargetType,
                      targetIds: [], // 切换类型时清空选择
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">所有用户</option>
                  <option value="role">特定角色</option>
                  <option value="user">特定用户</option>
                  <option value="membership">特定会员等级</option>
                </select>
              </div>

              {/* 角色选择器 */}
              {formData.targetType === "role" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择角色 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                    {loadingOptions ? (
                      <p className="text-sm text-gray-500">加载中...</p>
                    ) : roles.length === 0 ? (
                      <p className="text-sm text-gray-500">暂无角色</p>
                    ) : (
                      roles.map((role) => (
                        <label
                          key={role.id}
                          className="flex items-center hover:bg-white p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.targetIds || []).includes(
                              role.id
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  targetIds: [
                                    ...(formData.targetIds || []),
                                    role.id,
                                  ],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  targetIds: (formData.targetIds || []).filter(
                                    (id) => id !== role.id
                                  ),
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-900">
                            {role.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    已选择 {(formData.targetIds || []).length} 个角色
                  </p>
                </div>
              )}

              {/* 会员等级选择器 */}
              {formData.targetType === "membership" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择会员等级 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50">
                    {loadingOptions ? (
                      <p className="text-sm text-gray-500">加载中...</p>
                    ) : plans.length === 0 ? (
                      <p className="text-sm text-gray-500">暂无会员套餐</p>
                    ) : (
                      plans.map((plan) => (
                        <label
                          key={plan.id}
                          className="flex items-center hover:bg-white p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={(formData.targetIds || []).includes(
                              plan.id
                            )}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  targetIds: [
                                    ...(formData.targetIds || []),
                                    plan.id,
                                  ],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  targetIds: (formData.targetIds || []).filter(
                                    (id) => id !== plan.id
                                  ),
                                });
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-900">
                            {plan.name} (Level {plan.level})
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    已选择 {(formData.targetIds || []).length} 个会员等级
                  </p>
                </div>
              )}

              {/* 用户ID输入 */}
              {formData.targetType === "user" && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    输入用户ID（逗号分隔）{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={(formData.targetIds || []).join(",")}
                    onChange={(e) => {
                      const ids = e.target.value
                        .split(",")
                        .map((id) => parseInt(id.trim()))
                        .filter((id) => !isNaN(id));
                      setFormData({ ...formData, targetIds: ids });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：1,2,3"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    已输入 {(formData.targetIds || []).length} 个用户ID
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {submitting ? "保存中..." : "保存草稿"}
            </button>
            <button
              type="button"
              onClick={async () => {
                // 发布并推送
                setSubmitting(true);
                try {
                  const submitData = {
                    ...formData,
                    isActive: true, // 确保发布状态
                    isPush: true, // 确保推送
                    startTime: formData.startTime
                      ? new Date(formData.startTime).toISOString()
                      : undefined,
                    endTime: formData.endTime
                      ? new Date(formData.endTime).toISOString()
                      : undefined,
                  };

                  if (isEdit) {
                    await updateAnnouncement(announcement.id, submitData);
                    await publishAndPushAnnouncement(announcement.id);
                  } else {
                    const created = await createAnnouncement(submitData);
                    await publishAndPushAnnouncement(created.id);
                  }
                  showToast("发布并推送成功", "success");
                  onSuccess();
                } catch (error: any) {
                  showToast(error.message || "操作失败", "error");
                } finally {
                  setSubmitting(false);
                }
              }}
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {submitting ? "处理中..." : "发布并推送"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
