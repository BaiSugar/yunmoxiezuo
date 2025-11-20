import { useState, useEffect } from 'react';
import {
  getCategoryList,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../api/prompt-categories';
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../../types/prompt-category';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { showToast } from '../../components/common/ToastContainer';
import { useAppSelector } from '../../store/hooks';
import { hasButtonPermission, PERMISSIONS } from '../../utils/permission';

export default function PromptCategories() {
  const { user } = useAppSelector((state) => state.auth);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // 模态框状态
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    data: Category | null;
  }>({ isOpen: false, mode: 'create', data: null });

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // 加载分类列表
  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategoryList();
      setCategories(data);
    } catch (error) {
      console.error('加载分类列表失败:', error);
      showToast('加载失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // 删除分类
  const handleDeleteCategory = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: '删除分类',
      message: `确定要删除分类 “${name}” 吗？此操作无法撤销。`,
      onConfirm: async () => {
        try {
          await deleteCategory(id);
          showToast('删除成功', 'success');
          loadCategories();
        } catch (error: any) {
          showToast(error.message || '删除失败', 'error');
        }
      },
    });
  };

  // 检查权限
  const canCreate = hasButtonPermission(user, PERMISSIONS.PROMPT.CATEGORY_CREATE);
  const canUpdate = hasButtonPermission(user, PERMISSIONS.PROMPT.CATEGORY_UPDATE);
  const canDelete = hasButtonPermission(user, PERMISSIONS.PROMPT.CATEGORY_DELETE);

  return (
    <div className="p-4 sm:p-6">
      {/* 页头 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              提示词分类管理
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              管理提示词的分类（AI写作/角色扮演）
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() =>
                setCategoryModal({ isOpen: true, mode: 'create', data: null })
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              + 新增分类
            </button>
          )}
        </div>
      </div>

      {/* 分类列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            加载中...
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            暂无数据
          </div>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              {/* 分类头部 */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{category.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-gray-500 mt-1">
                          {category.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>排序: {category.order}</span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {category.usageType === 'writing' ? 'AI写作' : '角色扮演'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {canUpdate && (
                      <button
                        onClick={() =>
                          setCategoryModal({
                            isOpen: true,
                            mode: 'edit',
                            data: category,
                          })
                        }
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                      >
                        编辑
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() =>
                          handleDeleteCategory(category.id, category.name)
                        }
                        className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        删除
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 分类模态框 */}
      {categoryModal.isOpen && (
        <CategoryModal
          mode={categoryModal.mode}
          data={categoryModal.data}
          onClose={() =>
            setCategoryModal({ isOpen: false, mode: 'create', data: null })
          }
          onSuccess={() => {
            loadCategories();
            setCategoryModal({ isOpen: false, mode: 'create', data: null });
          }}
        />
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmColor="red"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}

// 分类模态框组件
function CategoryModal({
  mode,
  data,
  onClose,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  data: Category | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<CreateCategoryDto | UpdateCategoryDto>({
    name: data?.name || '',
    icon: data?.icon || '',
    description: data?.description || '',
    order: data?.order || 0,
    usageType: data?.usageType || 'writing',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'create') {
        await createCategory(formData as CreateCategoryDto);
        showToast('创建成功', 'success');
      } else {
        await updateCategory(data!.id, formData as UpdateCategoryDto);
        showToast('更新成功', 'success');
      }
      onSuccess();
    } catch (error: any) {
      showToast(error.message || '操作失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? '新增分类' : '编辑分类'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分类名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="如：AI写作"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              图标 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="如：✍️"
            />
            <p className="text-xs text-gray-500 mt-1">
              可以使用 Emoji 图标
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="分类描述"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              使用场景 <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.usageType}
              onChange={(e) =>
                setFormData({ ...formData, usageType: e.target.value as 'writing' | 'roleplay' })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="writing">AI写作</option>
              <option value="roleplay">角色扮演</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              确定该分类下的提示词用于AI写作还是角色扮演
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              排序
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: parseInt(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? '提交中...' : '确定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
