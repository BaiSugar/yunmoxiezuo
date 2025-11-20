import React, { useState, useEffect } from 'react';
import { X, Clock, RotateCcw, Eye, Loader2 } from 'lucide-react';
import { novelsApi } from '../../../services/novels.api';

interface ChapterVersion {
  id: number;
  chapterId: number;
  version: number;
  title: string;
  content: string;
  wordCount: number;
  note: string;
  createdAt: string;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: number;
  chapterTitle: string;
  onRestore?: () => void; // 恢复后的回调
}

/**
 * 格式化时间显示
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 历史版本模态窗组件
 */
export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
  onRestore,
}) => {
  const [versions, setVersions] = useState<ChapterVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<ChapterVersion | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'detail'>('list'); // 移动端标签页状态
  const [showRules, setShowRules] = useState(false); // 移动端保存规则显示状态
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false); // 恢复确认对话框
  const [versionToRestore, setVersionToRestore] = useState<ChapterVersion | null>(null); // 待恢复的版本

  // 加载历史版本列表
  useEffect(() => {
    if (isOpen && chapterId) {
      loadVersions();
    }
  }, [isOpen, chapterId]);

  // 关闭时清空所有状态
  useEffect(() => {
    if (!isOpen) {
      setSelectedVersion(null);
      setMobileTab('list');
      setShowRules(false);
      setError(null);
      setShowRestoreConfirm(false);
      setVersionToRestore(null);
      setRestoring(false); // 重置恢复状态
    }
  }, [isOpen]);

  const loadVersions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await novelsApi.getChapterVersions(chapterId);
      setVersions(data);
    } catch (err: any) {
      console.error('加载历史版本失败:', err);
      setError(err.response?.data?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看版本详情
  const handleViewVersion = async (version: ChapterVersion) => {
    if (selectedVersion?.id === version.id) {
      setSelectedVersion(null);
      setMobileTab('list'); // 移动端返回列表
    } else {
      setSelectedVersion(version);
      setMobileTab('detail'); // 移动端切换到详情
    }
  };

  // 点击恢复按钮，显示确认对话框
  const handleRestoreClick = (version: ChapterVersion) => {
    setVersionToRestore(version);
    setShowRestoreConfirm(true);
  };

  // 确认恢复到指定版本
  const handleConfirmRestore = async () => {
    if (!versionToRestore) return;

    setRestoring(true);
    setShowRestoreConfirm(false);
    
    try {
      // 1. 调用后端API恢复版本
      await novelsApi.restoreChapterVersion(chapterId, versionToRestore.version);
      
      // 2. 只有成功后才通知父组件刷新
      await onRestore?.(); // 等待父组件完成刷新
      
      // 3. 成功后重置状态
      setRestoring(false);
      setVersionToRestore(null);
      
      // 4. 关闭窗口
      onClose();
    } catch (err: any) {
      console.error('恢复版本失败:', err);
      // 失败时显示错误，不关闭窗口，允许用户重试
      setError(err.response?.data?.message || '恢复失败，请重试');
      setRestoring(false);
      setVersionToRestore(null);
      throw err; // 抛出错误，让父组件知道失败了
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      {/* 恢复中的全局加载遮罩 */}
      {restoring && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900">正在恢复版本</p>
              <p className="text-sm text-gray-500 mt-1">请稍候，正在加载恢复后的内容...</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full md:max-w-5xl h-full md:h-auto md:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        {/* 头部 - 移动端适配 */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0 md:rounded-t-2xl">
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base md:text-lg font-semibold text-gray-900">历史版本</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-0.5 truncate">{chapterTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/80 rounded-lg transition-all duration-200 flex-shrink-0"
            title="关闭"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 移动端：保存规则按钮 */}
        <div className="md:hidden px-4 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-900">版本保存规则</span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${showRules ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* 保存逻辑说明 - PC端固定显示，移动端可折叠 */}
        <div className={`px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100 flex-shrink-0 ${
          showRules ? 'block' : 'hidden md:block'
        }`}>
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/30">
              <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-1.5 md:mb-2 flex items-center gap-2 flex-wrap">
                版本保存规则
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">智能管理</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
                <div className="flex items-start gap-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-0.5">自动保存</p>
                    <p className="text-xs text-gray-600">每隔 1 分钟自动创建版本</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="w-6 h-6 bg-green-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-0.5">版本上限</p>
                    <p className="text-xs text-gray-600">保留最近 10 个版本</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900 mb-0.5">恢复功能</p>
                    <p className="text-xs text-gray-600">一键恢复任意版本</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 移动端标签栏 */}
        <div className="md:hidden border-b border-gray-200 bg-white flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => setMobileTab('list')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mobileTab === 'list'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
            >
              版本列表 {versions.length > 0 && `(${versions.length})`}
            </button>
            <button
              onClick={() => setMobileTab('detail')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mobileTab === 'detail'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
              disabled={!selectedVersion}
            >
              版本详情
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row bg-gray-50" style={{ minHeight: 0 }}>
          {/* 左侧：版本列表 - 移动端适配 */}
          <div className={`bg-white md:border-r border-gray-200 flex-shrink-0 overflow-hidden ${
            mobileTab === 'list' 
              ? 'flex flex-col flex-1 w-full' 
              : 'hidden md:flex md:flex-col md:w-96'
          }`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-gray-500">加载中...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-red-600 mb-4 text-sm">{error}</p>
                <button
                  onClick={loadVersions}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  重新加载
                </button>
              </div>
            ) : versions.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">暂无历史版本</p>
                <p className="text-xs text-gray-400 mt-2">编辑章节时会自动创建版本</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10 flex-shrink-0">
                  <p className="text-xs text-gray-500">
                    共 <span className="font-semibold text-gray-900">{versions.length}</span> 个版本
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-gray-100" style={{ minHeight: 0 }}>
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={`p-4 transition-all duration-200 cursor-pointer ${
                        selectedVersion?.id === version.id 
                          ? 'bg-blue-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50 border-l-4 border-transparent'
                      }`}
                      onClick={() => handleViewVersion(version)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedVersion?.id === version.id 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <span className="text-xs font-bold">V{version.version}</span>
                          </div>
                          <div>
                            <p className={`font-medium ${
                              selectedVersion?.id === version.id ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              版本 {version.version}
                            </p>
                            {index === 0 && (
                              <span className="text-xs text-blue-600 font-medium">最新</span>
                            )}
                          </div>
                        </div>
                        {version.version === 1 && (
                          <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-md font-medium">
                            初始版本
                          </span>
                        )}
                      </div>
                      <div className="ml-10 space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDateTime(version.createdAt)}
                        </p>
                        {version.note && (
                          <p className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded truncate">
                            💬 {version.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          📝 {version.wordCount.toLocaleString()} 字
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：版本详情 - 移动端适配 */}
          <div className={`bg-gray-50 overflow-y-auto ${
            mobileTab === 'detail' 
              ? 'flex flex-col flex-1 w-full min-h-0' 
              : 'hidden md:flex md:flex-col md:flex-1 md:min-h-0'
          }`}>
            {!selectedVersion ? (
              <div className="min-h-full flex items-center justify-center">
                <div className="text-center max-w-sm">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-10 h-10 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">选择版本查看详情</h3>
                  <p className="text-sm text-gray-500">点击左侧的版本列表查看历史内容</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full space-y-4 md:space-y-5 p-4 md:p-6">
                {/* 版本信息卡片 - 移动端适配 */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 md:p-5 border border-blue-100 flex-shrink-0">
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:justify-between mb-4">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm md:text-base">V{selectedVersion.version}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-base md:text-lg">
                          版本 {selectedVersion.version}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" />
                          {formatDateTime(selectedVersion.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestoreClick(selectedVersion)}
                      disabled={restoring}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 font-medium text-sm md:text-base"
                    >
                      {restoring ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>恢复中...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span className="hidden sm:inline">恢复到此版本</span>
                          <span className="sm:hidden">恢复</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-white/60 backdrop-blur-sm rounded-lg px-4 py-3">
                      <p className="text-xs text-gray-600 mb-1">字数统计</p>
                      <p className={`text-lg font-semibold ${
                        selectedVersion.wordCount === 0 ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {selectedVersion.wordCount.toLocaleString()} <span className="text-sm font-normal text-gray-600">字</span>
                        {selectedVersion.wordCount === 0 && (
                          <span className="ml-2 text-xs text-orange-500">空内容</span>
                        )}
                      </p>
                    </div>
                    {selectedVersion.note && (
                      <div className="bg-white/60 backdrop-blur-sm rounded-lg px-4 py-3">
                        <p className="text-xs text-gray-600 mb-1">版本备注</p>
                        <p className="text-sm text-gray-900 truncate">{selectedVersion.note}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 标题卡片 - 移动端适配 */}
                <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200 shadow-sm flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-bold text-xs md:text-sm">T</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">章节标题</h4>
                  </div>
                  <p className="text-gray-900 text-base md:text-lg font-medium pl-0 md:pl-10">
                    {selectedVersion.title || <span className="text-gray-400 italic">未命名章节</span>}
                  </p>
                </div>

                {/* 内容预览卡片 - 移动端适配 */}
                <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-200 shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-3 md:mb-4 flex-shrink-0">
                    <div className="w-7 h-7 md:w-8 md:h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-bold text-xs md:text-sm">C</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm md:text-base">章节内容</h4>
                  </div>
                  {!selectedVersion.content || selectedVersion.content.trim() === '' || selectedVersion.content === '<p></p>' ? (
                    <div className="bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-100 flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-500">该版本暂无内容</p>
                        <p className="text-xs text-gray-400 mt-1">章节内容为空</p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-100 flex-1"
                      style={{ 
                        fontSize: '14px',
                        lineHeight: '1.7',
                        color: '#374151'
                      }}
                      dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 恢复确认对话框 */}
      {showRestoreConfirm && versionToRestore && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
            {/* 头部 */}
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">确认恢复版本</h3>
            </div>
            
            {/* 内容 */}
            <div className="px-6 py-4">
              <div className="space-y-3">
                <p className="text-gray-700">
                  确定要恢复到 <span className="font-semibold text-blue-600">版本 {versionToRestore.version}</span> 吗？
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">注意</p>
                      <p className="text-xs text-amber-700 mt-1">
                        恢复操作会将当前章节内容替换为该版本的内容，当前内容会被保存为新版本
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• 创建时间：{formatDateTime(versionToRestore.createdAt)}</p>
                  <p>• 字数：{versionToRestore.wordCount.toLocaleString()} 字</p>
                  {versionToRestore.note && (
                    <p>• 备注：{versionToRestore.note}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* 底部按钮 */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex gap-3">
              <button
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setVersionToRestore(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirmRestore}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium shadow-lg shadow-blue-500/30"
              >
                确认恢复
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
