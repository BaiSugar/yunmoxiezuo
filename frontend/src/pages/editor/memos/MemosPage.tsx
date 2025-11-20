import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, X, Trash2, StickyNote, Pin, ArrowLeft } from 'lucide-react';
import { memosApi } from '../../../services/characters.api';
import { useToast } from '../../../contexts/ToastContext';
import type { Memo, CreateMemoDto } from '../../../types/character';

interface MemosPageProps {
  onClose?: () => void;
}

/**
 * 备忘录管理页面
 */
export const MemosPage: React.FC<MemosPageProps> = ({ onClose }) => {
  const { novelId } = useParams<{ novelId: string }>();
  const { success, error: showError } = useToast();
  
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showMobileEdit, setShowMobileEdit] = useState(false); // 移动端是否显示编辑页
  
  // 编辑表单状态
  const [editForm, setEditForm] = useState<CreateMemoDto>({
    title: '',
    content: '',
    color: '#3B82F6',
    isPinned: false,
  });
  
  // 删除确认
  const [memoToDelete, setMemoToDelete] = useState<Memo | null>(null);
  
  // 自动保存定时器
  const saveTimerRef = useRef<number | null>(null);

  // 加载备忘录列表
  useEffect(() => {
    if (novelId) {
      loadMemos();
    }
  }, [novelId]);

  const loadMemos = async () => {
    if (!novelId) return;
    
    setLoading(true);
    try {
      const data = await memosApi.getMemos(Number(novelId));
      // 按置顶和更新时间排序
      const sorted = data.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setMemos(sorted);
      
      // 如果有选中的备忘录，更新它
      if (selectedMemo) {
        const updated = sorted.find(m => m.id === selectedMemo.id);
        if (updated) {
          setSelectedMemo(updated);
        }
      }
    } catch (err: any) {
      console.error('加载备忘录失败:', err);
      showError('加载失败', err.response?.data?.message || '无法加载备忘录列表');
    } finally {
      setLoading(false);
    }
  };

  // 过滤备忘录
  const filteredMemos = memos.filter(memo =>
    memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    memo.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 开始创建新备忘录
  const handleCreate = () => {
    setIsCreating(true);
    setSelectedMemo(null);
    setShowMobileEdit(true); // 移动端显示编辑页
    setEditForm({
      title: '',
      content: '',
      color: '#3B82F6',
      isPinned: false,
    });
  };

  // 选择备忘录 - 直接进入编辑模式
  const handleSelectMemo = (memo: Memo) => {
    setSelectedMemo(memo);
    setIsCreating(false);
    setShowMobileEdit(true); // 移动端显示编辑页
    setEditForm({
      title: memo.title,
      content: memo.content,
      color: memo.color || '#3B82F6',
      isPinned: memo.isPinned,
    });
  };


  // 取消编辑/返回列表
  const handleCancelEdit = () => {
    setIsCreating(false);
    setSelectedMemo(null);
    setShowMobileEdit(false);
  };
  
  // 切换置顶状态 - 乐观更新
  const handleTogglePin = async () => {
    const newPinned = !editForm.isPinned;
    
    // 保存旧状态用于回滚
    const oldPinned = editForm.isPinned;
    const oldMemos = memos;
    const oldSelectedMemo = selectedMemo;
    
    // 立即更新UI（乐观更新）
    setEditForm({ ...editForm, isPinned: newPinned });
    
    // 如果是编辑现有备忘录，立即更新列表
    if (selectedMemo && !isCreating) {
      const updatedTime = new Date().toISOString();
      
      // 立即更新列表显示
      setMemos(prev => prev.map(memo => 
        memo.id === selectedMemo.id 
          ? { ...memo, isPinned: newPinned, updatedAt: updatedTime }
          : memo
      ));
      
      // 立即更新当前选中的备忘录
      setSelectedMemo(prev => prev ? { ...prev, isPinned: newPinned, updatedAt: updatedTime } : null);
      
      // 后台发送API请求
      try {
        await memosApi.updateMemo(selectedMemo.id, { ...editForm, isPinned: newPinned });
      } catch (err: any) {
        console.error('更新置顶状态失败:', err);
        showError('操作失败', '无法更新置顶状态');
        
        // 失败则回滚
        setEditForm({ ...editForm, isPinned: oldPinned });
        setMemos(oldMemos);
        setSelectedMemo(oldSelectedMemo);
      }
    }
  };
  

  // 自动保存备忘录
  const autoSave = useCallback(async () => {
    if (!novelId || !editForm.title.trim()) return;
    
    try {
      if (isCreating) {
        // 创建新备忘录
        const newMemo = await memosApi.createMemo(Number(novelId), editForm);
        setSelectedMemo(newMemo);
        setIsCreating(false);
        // 创建后添加到列表顶部
        setMemos(prev => [newMemo, ...prev]);
      } else if (selectedMemo) {
        // 更新现有备忘录
        await memosApi.updateMemo(selectedMemo.id, editForm);
        // 只更新列表中对应的备忘录，不重新加载
        setMemos(prev => prev.map(memo => 
          memo.id === selectedMemo.id 
            ? { ...memo, ...editForm, updatedAt: new Date().toISOString() }
            : memo
        ));
        // 更新当前选中的备忘录
        setSelectedMemo(prev => prev ? { ...prev, ...editForm, updatedAt: new Date().toISOString() } : null);
      }
    } catch (err: any) {
      console.error('自动保存失败:', err);
    }
  }, [novelId, editForm, isCreating, selectedMemo]);
  
  // 监听表单变化，触发自动保存
  useEffect(() => {
    // 清除之前的定时器
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }
    
    // 如果标题或内容不为空，设置新的定时器
    if (editForm.title.trim() || editForm.content.trim()) {
      saveTimerRef.current = window.setTimeout(() => {
        autoSave();
      }, 1000); // 1秒防抖
    }
    
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [editForm, autoSave]);

  // 删除备忘录
  const handleDelete = (memo: Memo) => {
    setMemoToDelete(memo);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!memoToDelete) return;

    try {
      await memosApi.deleteMemo(memoToDelete.id);
      success('删除成功', '备忘录已删除');
      
      // 从列表中移除
      setMemos(prev => prev.filter(m => m.id !== memoToDelete.id));
      
      if (selectedMemo?.id === memoToDelete.id) {
        setSelectedMemo(null);
      }
      
      setMemoToDelete(null);
    } catch (err: any) {
      console.error('删除备忘录失败:', err);
      showError('删除失败', err.response?.data?.message || '无法删除备忘录');
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* PC端头部 */}
      <div className="hidden lg:flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
            <StickyNote className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">备忘录</h1>
            <p className="text-xs text-gray-500">记录创作灵感和想法</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {/* 移动端头部 */}
      <div className="lg:hidden flex-shrink-0 bg-white border-b">
        <div className="px-4 py-3">
          {/* 标题栏 */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">备忘录</h1>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          
          {/* 搜索框和新建按钮 - 仅在列表视图显示 */}
          {!showMobileEdit && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索备忘录..."
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
          )}
        </div>
      </div>

      {/* PC端主要内容区域 */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* PC端左侧：备忘录列表 */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
          {/* 工具栏 */}
          <div className="p-4 space-y-3 bg-white border-b border-gray-200">
            <button
              onClick={handleCreate}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>新建备忘录</span>
            </button>
            
            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索备忘录..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* 备忘录列表 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-400">加载中...</div>
              </div>
            ) : filteredMemos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <StickyNote className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? '没有找到相关备忘录' : '还没有备忘录'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleCreate}
                    className="mt-4 text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    创建第一个备忘录
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredMemos.map((memo) => (
                  <div
                    key={memo.id}
                    className={`group w-full p-3 rounded-lg transition-all ${
                      selectedMemo?.id === memo.id
                        ? 'bg-white shadow-sm ring-2 ring-blue-500/20'
                        : 'hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-1 h-10 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: memo.color || '#3B82F6' }}
                      />
                      <button
                        onClick={() => handleSelectMemo(memo)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {memo.title}
                          </h3>
                          {memo.isPinned && (
                            <Pin className="w-3.5 h-3.5 text-blue-500 fill-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatDate(memo.updatedAt)}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(memo);
                        }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded transition-all"
                        title="删除"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PC端右侧：备忘录详情 */}
        <div className="flex-1 flex flex-col bg-white">
          {!selectedMemo && !isCreating ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white">
              <StickyNote className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1.5} />
              <h3 className="text-lg font-medium text-gray-700 mb-2">选择一个备忘录</h3>
              <p className="text-sm text-gray-500 text-center">
                点击左侧备忘录进行编辑，或创建新的备忘录
              </p>
            </div>
          ) : (
            <>
              {/* 编辑头部 */}
              <div className="p-4 border-b border-gray-200">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    placeholder="输入标题..."
                    className="w-full text-lg font-bold text-gray-900 border-b border-gray-200 focus:border-blue-500 outline-none pb-2 transition-colors placeholder:text-gray-300"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTogglePin}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                        editForm.isPinned
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Pin className={`w-3 h-3 ${editForm.isPinned ? 'fill-blue-700' : ''}`} />
                      <span>{editForm.isPinned ? '已置顶' : '置顶'}</span>
                    </button>
                    <label className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors cursor-pointer text-xs font-medium text-gray-600">
                      <div
                        className="w-3 h-3 rounded border border-gray-300"
                        style={{ backgroundColor: editForm.color }}
                      />
                      <span>颜色</span>
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-0 h-0 opacity-0 absolute"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 编辑内容 */}
              <div className="flex-1 p-6">
                <textarea
                  value={editForm.content}
                  onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                  placeholder="输入内容..."
                  className="w-full h-full text-gray-700 leading-relaxed resize-none outline-none border border-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
                />
              </div>

              {/* 底部信息栏 */}
              {!isCreating && selectedMemo && (
                <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="text-xs text-gray-400">
                    创建: {formatDate(selectedMemo.createdAt)} | 更新: {formatDate(selectedMemo.updatedAt)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 移动端主要内容区域 */}
      <div className="lg:hidden flex-1 flex flex-col overflow-hidden">
        {!showMobileEdit ? (
          /* 移动端列表视图 */
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-400">加载中...</div>
              </div>
            ) : filteredMemos.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <StickyNote className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">
                  {searchQuery ? '没有找到相关备忘录' : '还没有备忘录'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={handleCreate}
                    className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    创建第一个备忘录
                  </button>
                )}
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredMemos.map((memo) => (
                  <div
                    key={memo.id}
                    className="group bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-1 h-12 rounded-full flex-shrink-0"
                        style={{ backgroundColor: memo.color || '#3B82F6' }}
                      />
                      <button
                        onClick={() => handleSelectMemo(memo)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {memo.title}
                          </h3>
                          {memo.isPinned && (
                            <Pin className="w-4 h-4 text-blue-500 fill-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400">
                          {formatDate(memo.updatedAt)}
                        </p>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(memo);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* 移动端编辑视图 */
          <div className="flex-1 flex flex-col bg-white">
            {/* 移动端编辑头部 */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex-1 text-sm font-medium text-gray-900">
                  {isCreating ? '新建备忘录' : '编辑备忘录'}
                </div>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  placeholder="输入标题..."
                  className="w-full text-lg font-bold text-gray-900 border-b border-gray-200 focus:border-blue-500 outline-none pb-2 transition-colors placeholder:text-gray-300"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePin}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      editForm.isPinned
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Pin className={`w-3 h-3 ${editForm.isPinned ? 'fill-blue-700' : ''}`} />
                    <span>{editForm.isPinned ? '已置顶' : '置顶'}</span>
                  </button>
                  <label className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg transition-colors cursor-pointer text-xs font-medium text-gray-600">
                    <div
                      className="w-3 h-3 rounded border border-gray-300"
                      style={{ backgroundColor: editForm.color }}
                    />
                    <span>颜色</span>
                    <input
                      type="color"
                      value={editForm.color}
                      onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                      className="w-0 h-0 opacity-0 absolute"
                    />
                  </label>
                  {!isCreating && (
                    <button
                      onClick={() => selectedMemo && handleDelete(selectedMemo)}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>删除</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 移动端编辑内容 */}
            <div className="flex-1 p-4">
              <textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                placeholder="输入内容..."
                className="w-full h-full text-base text-gray-700 leading-relaxed resize-none outline-none border border-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-400"
              />
            </div>
            
            {/* 移动端底部信息栏 */}
            {!isCreating && selectedMemo && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-400">
                  创建: {formatDate(selectedMemo.createdAt)} | 更新: {formatDate(selectedMemo.updatedAt)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 删除确认对话框 */}
      {memoToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">确认删除</h3>
            <p className="text-gray-600 mb-6">
              确定要删除备忘录 <span className="font-medium">"{memoToDelete.title}"</span> 吗？
              <br />
              此操作无法撤销。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMemoToDelete(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
