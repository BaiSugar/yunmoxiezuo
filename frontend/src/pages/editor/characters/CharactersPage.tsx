import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, Folder, User, X, Trash2, Edit2 } from 'lucide-react';
import { charactersApi } from '../../../services/characters.api';
import { useToast } from '../../../contexts/ToastContext';
import type { Character } from '../../../types/character';
import { CharacterModal, CharacterCard } from './components';

interface CharactersPageProps {
  onClose?: () => void;
}

/**
 * 人物卡管理页面
 */
export const CharactersPage: React.FC<CharactersPageProps> = ({ onClose }) => {
  const { novelId } = useParams<{ novelId: string }>();
  const { success, error: showError } = useToast();
  
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);
  const [categoryToRename, setCategoryToRename] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  // 加载人物卡列表
  useEffect(() => {
    if (novelId) {
      loadCharacters();
    }
  }, [novelId]);

  const loadCharacters = async () => {
    if (!novelId) return;
    
    setLoading(true);
    try {
      const data = await charactersApi.getCharacters(Number(novelId));
      setCharacters(data);
    } catch (err: any) {
      console.error('加载人物卡失败:', err);
      showError('加载失败', err.response?.data?.message || '无法加载人物卡列表');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有分类
  const categories = Array.from(new Set(characters.map(c => c.category).filter(Boolean))) as string[];

  // 过滤人物卡
  const filteredCharacters = characters.filter(character => {
    const matchesSearch = character.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || character.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 按分类分组
  const groupedCharacters = filteredCharacters.reduce((acc, character) => {
    const category = character.category || '未分类';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(character);
    return acc;
  }, {} as Record<string, Character[]>);

  // 打开创建对话框
  const handleCreate = () => {
    setEditingCharacter(null);
    setShowModal(true);
  };

  // 打开编辑对话框
  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setShowModal(true);
  };

  // 删除人物卡
  const handleDelete = (character: Character) => {
    setCharacterToDelete(character);
  };

  // 确认删除人物卡
  const confirmDeleteCharacter = async () => {
    if (!characterToDelete) return;

    try {
      await charactersApi.deleteCharacter(characterToDelete.id);
      success('删除成功', '人物卡已删除');
      setCharacterToDelete(null);
      loadCharacters();
    } catch (err: any) {
      console.error('删除人物卡失败:', err);
      showError('删除失败', err.response?.data?.message || '无法删除人物卡');
    }
  };

  // 保存人物卡（创建或更新）
  const handleSave = async () => {
    await loadCharacters();
    setShowModal(false);
  };

  // 重命名分类
  const handleRenameCategory = async () => {
    if (!categoryToRename || !newCategoryName.trim()) return;
    
    // 检查新名称是否已存在
    if (categories.includes(newCategoryName.trim()) && newCategoryName.trim() !== categoryToRename) {
      showError('重命名失败', '该分类名称已存在');
      return;
    }

    try {
      const charactersInCategory = characters.filter(c => c.category === categoryToRename);
      
      // 批量更新该分类下的所有人物，修改分类名称
      await Promise.all(
        charactersInCategory.map(character =>
          charactersApi.updateCharacter(character.id, { category: newCategoryName.trim() })
        )
      );
      
      success('重命名成功', `分类已重命名为"${newCategoryName.trim()}"`);
      setCategoryToRename(null);
      setNewCategoryName('');
      if (selectedCategory === categoryToRename) {
        setSelectedCategory(newCategoryName.trim());
      }
      loadCharacters();
    } catch (error: any) {
      console.error('重命名分类失败:', error);
      showError('重命名失败', error.response?.data?.message || '无法重命名分类');
    }
  };

  // 删除分类（将该分类下的人物移至"未分类"）
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    setDeletingCategory(true);
    try {
      const charactersInCategory = characters.filter(c => c.category === categoryToDelete);
      
      // 批量更新该分类下的所有人物，将分类改为"未分类"
      await Promise.all(
        charactersInCategory.map(character =>
          charactersApi.updateCharacter(character.id, { category: '未分类' })
        )
      );
      
      success('删除成功', `分类"${categoryToDelete}"已删除，${charactersInCategory.length}个人物移至"未分类"`);
      setCategoryToDelete(null);
      setSelectedCategory(null); // 取消选中
      loadCharacters();
    } catch (error: any) {
      console.error('删除分类失败:', error);
      showError('删除失败', error.response?.data?.message || '无法删除分类');
    } finally {
      setDeletingCategory(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* PC端头部 */}
      <div className="hidden lg:block flex-shrink-0 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm rounded-t-2xl">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">人物卡</h1>
                <p className="text-sm text-gray-500">管理小说中的人物角色</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>新建人物卡</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                  title="关闭"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* PC端搜索框 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索人物名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
            />
          </div>
          
          {/* PC端分类筛选标签 */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <span className="text-sm font-medium text-gray-600 flex-shrink-0">分类：</span>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                  selectedCategory === null
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部 ({characters.length})
              </button>
              {categories.map(category => (
                <div key={category} className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    {category} ({characters.filter(c => c.category === category).length})
                  </button>
                  {selectedCategory === category && category !== '未分类' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryToRename(category);
                          setNewCategoryName(category);
                        }}
                        className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors group"
                        title={`重命名分类 "${category}"`}
                      >
                        <Edit2 className="w-3 h-3 text-gray-400 group-hover:text-blue-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCategoryToDelete(category);
                        }}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-colors group"
                        title={`删除分类 "${category}"`}
                      >
                        <Trash2 className="w-3 h-3 text-gray-400 group-hover:text-red-500" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 移动端头部 */}
      <div className="lg:hidden flex-shrink-0 bg-white border-b">
        <div className="px-4 py-3">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">人物卡</h1>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="关闭"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          
          {/* 搜索框和新建按钮 */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索人物..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>新建</span>
            </button>
          </div>
          
          {/* 分类标签 - 横向滚动 */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                  selectedCategory === null
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                全部 {characters.length}
              </button>
              {categories.map(category => (
                <div key={category} className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {category} {characters.filter(c => c.category === category).length}
                  </button>
                  {selectedCategory === category && category !== '未分类' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setCategoryToRename(category);
                          setNewCategoryName(category);
                        }}
                        className="p-1 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
                        title="重命名分类"
                      >
                        <Edit2 className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={() => setCategoryToDelete(category)}
                        className="p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                        title="删除分类"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">加载中...</p>
            </div>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                {searchQuery ? '没有找到匹配的人物卡' : '还没有创建任何人物卡'}
              </p>
              <button
                onClick={handleCreate}
                className="text-blue-500 hover:text-blue-600 text-sm"
              >
                点击创建第一个人物卡
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedCharacters).map(([category, chars]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <Folder className="w-5 h-5 text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
                  <span className="text-sm text-gray-500">({chars.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {chars.map(character => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 创建/编辑对话框 */}
      {showModal && (
        <CharacterModal
          novelId={Number(novelId)}
          character={editingCharacter}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          existingCategories={categories}
        />
      )}

      {/* 删除分类确认对话框 */}
      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">删除分类</h3>
            <p className="text-gray-600 mb-2">
              确定要删除分类 <span className="font-semibold text-gray-900">"{categoryToDelete}"</span> 吗？
            </p>
            <p className="text-sm text-gray-500 mb-6">
              该分类下的 <span className="font-semibold text-gray-900">{characters.filter(c => c.category === categoryToDelete).length}</span> 个人物卡将移至 <span className="font-semibold text-blue-600">"未分类"</span> 分类。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCategoryToDelete(null)}
                disabled={deletingCategory}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={deletingCategory}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingCategory && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{deletingCategory ? '删除中...' : '确认删除'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除卡片确认对话框 */}
      {characterToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">删除人物卡</h3>
            <p className="text-gray-600 mb-6">
              确定要删除人物卡 <span className="font-semibold text-gray-900">"{characterToDelete.name}"</span> 吗？
              <br />
              <span className="text-sm text-gray-500">此操作不可撤销。</span>
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCharacterToDelete(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteCharacter}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名分类对话框 */}
      {categoryToRename && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">重命名分类</h3>
            <p className="text-gray-600 mb-4">
              为分类 <span className="font-semibold text-gray-900">"{categoryToRename}"</span> 输入新名称：
            </p>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameCategory();
                if (e.key === 'Escape') {
                  setCategoryToRename(null);
                  setNewCategoryName('');
                }
              }}
              placeholder="输入新分类名称"
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setCategoryToRename(null);
                  setNewCategoryName('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRenameCategory}
                disabled={!newCategoryName.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
