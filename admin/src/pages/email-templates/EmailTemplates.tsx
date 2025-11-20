import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  AlertCircle,
  Mail,
  Eye,
  Code,
  Save,
  X,
} from "lucide-react";
import { showToast } from "../../components/common/ToastContainer";
import {
  getEmailTemplates,
  updateEmailTemplate,
  createEmailTemplate,
  deleteEmailTemplate,
  type EmailTemplate,
} from "../../api/email-templates";

const EmailTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch (error: any) {
      showToast(error.message || "加载失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate({ ...template });
    setIsModalOpen(true);
    setPreviewMode(false);
  };

  const handleSave = async () => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      if (editingTemplate.id) {
        // 更新时只传递可编辑的字段
        const updateData = {
          subject: editingTemplate.subject,
          htmlTemplate: editingTemplate.htmlTemplate,
          name: editingTemplate.name,
          description: editingTemplate.description,
          variables: editingTemplate.variables,
          isActive: editingTemplate.isActive,
        };
        await updateEmailTemplate(editingTemplate.id, updateData);
        showToast("更新成功", "success");
      } else {
        await createEmailTemplate(editingTemplate);
        showToast("创建成功", "success");
      }
      setIsModalOpen(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error: any) {
      showToast(error.message || "保存失败", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除此邮件模板吗？")) return;

    try {
      await deleteEmailTemplate(id);
      showToast("删除成功", "success");
      loadTemplates();
    } catch (error: any) {
      showToast(error.message || "删除失败", "error");
    }
  };

  const renderPreview = () => {
    if (!editingTemplate) return null;

    const variables = {
      code: "123456",
      expireText: "5分钟",
      year: new Date().getFullYear(),
    };

    let html = editingTemplate.htmlTemplate;
    Object.entries(variables).forEach(([key, value]) => {
      html = html.replace(new RegExp(`{{${key}}}`, "g"), String(value));
    });

    return (
      <div className="border border-gray-300 rounded-xl p-4 bg-gray-50 overflow-auto max-h-96">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    );
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">邮件模板</h1>
          <p className="text-gray-600">管理系统邮件模板</p>
        </div>
      </div>

      {/* 模板列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500">{template.type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 font-semibold mb-1">主题：</p>
              <p className="text-sm text-gray-600">{template.subject}</p>
            </div>

            {template.description && (
              <p className="text-sm text-gray-600 mb-4">
                {template.description}
              </p>
            )}

            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  template.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {template.isActive ? "启用" : "禁用"}
              </span>
            </div>
          </div>
        ))}

        {templates.length === 0 && (
          <div className="col-span-2 text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无邮件模板</p>
          </div>
        )}
      </div>

      {/* 编辑模态框 */}
      {isModalOpen && editingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* 模态框头部 */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingTemplate.id ? "编辑" : "新建"}邮件模板
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Tab切换 */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setPreviewMode(false)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${
                  !previewMode
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Code className="w-4 h-4" />
                <span>编辑</span>
              </button>
              <button
                onClick={() => setPreviewMode(true)}
                className={`flex items-center gap-2 px-4 py-3 font-semibold transition-colors ${
                  previewMode
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>预览</span>
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              {!previewMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      模板名称 *
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.name}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      邮件主题 *
                    </label>
                    <input
                      type="text"
                      value={editingTemplate.subject}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          subject: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      HTML模板 *
                    </label>
                    <textarea
                      value={editingTemplate.htmlTemplate}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          htmlTemplate: e.target.value,
                        })
                      }
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                    <p className="mt-2 text-xs text-gray-500">
                      可用变量: {"{{code}}, {{expireText}}, {{year}}"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      描述
                    </label>
                    <textarea
                      value={editingTemplate.description || ""}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editingTemplate.isActive}
                      onChange={(e) =>
                        setEditingTemplate({
                          ...editingTemplate,
                          isActive: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-sm font-semibold text-gray-700"
                    >
                      启用模板
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    邮件预览
                  </h3>
                  {renderPreview()}
                </div>
              )}
            </div>

            {/* 模态框底部 */}
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-3 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>保存中...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>保存</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;
