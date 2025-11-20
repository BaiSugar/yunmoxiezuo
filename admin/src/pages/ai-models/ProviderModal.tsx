import { useState, useRef, useEffect } from 'react';
import { createProvider, updateProvider } from '../../api/ai-models';
import type {
  AiProvider,
  CreateProviderDto,
  UpdateProviderDto,
} from '../../types/ai-model';
import {
  ChatCompletionSource,
  ProviderStatus,
  RotationStrategy,
  ProviderAuthType,
} from '../../types/ai-model';
import { showToast } from '../../components/common/ToastContainer';

// 提供商来源中文映射
const SOURCE_LABELS: Record<ChatCompletionSource, string> = {
  [ChatCompletionSource.OPENAI]: 'OpenAI',
  [ChatCompletionSource.CLAUDE]: 'Claude',
  [ChatCompletionSource.OPENROUTER]: 'OpenRouter',
  [ChatCompletionSource.MAKERSUITE]: 'MakerSuite',
  [ChatCompletionSource.VERTEXAI]: 'VertexAI',
  [ChatCompletionSource.AI21]: 'AI21',
  [ChatCompletionSource.MISTRALAI]: 'MistralAI',
  [ChatCompletionSource.CUSTOM]: '自定义',
  [ChatCompletionSource.COHERE]: 'Cohere',
  [ChatCompletionSource.PERPLEXITY]: 'Perplexity',
  [ChatCompletionSource.GROQ]: 'Groq',
  [ChatCompletionSource.ELECTRONHUB]: 'ElectronHub',
  [ChatCompletionSource.NANOGPT]: 'NanoGPT',
  [ChatCompletionSource.DEEPSEEK]: 'DeepSeek',
  [ChatCompletionSource.AIMLAPI]: 'AIMLAPI',
  [ChatCompletionSource.XAI]: 'xAI',
  [ChatCompletionSource.POLLINATIONS]: 'Pollinations',
  [ChatCompletionSource.MOONSHOT]: 'Moonshot (月之暗面)',
  [ChatCompletionSource.FIREWORKS]: 'Fireworks',
  [ChatCompletionSource.COMETAPI]: 'CometAPI',
  [ChatCompletionSource.AZURE_OPENAI]: 'Azure OpenAI',
};

// 提供商状态中文映射
const STATUS_LABELS: Record<ProviderStatus, string> = {
  [ProviderStatus.ACTIVE]: '激活',
  [ProviderStatus.INACTIVE]: '未激活',
  [ProviderStatus.ERROR]: '错误',
};

// 轮询策略中文映射
const ROTATION_STRATEGY_LABELS: Record<RotationStrategy, { label: string; description: string }> = {
  [RotationStrategy.ROUND_ROBIN]: { label: '轮询', description: '按顺序依次使用' },
  [RotationStrategy.RANDOM]: { label: '随机', description: '随机选择可用的 Key' },
  [RotationStrategy.WEIGHTED]: { label: '加权轮询', description: '根据权重分配使用频率' },
  [RotationStrategy.PRIORITY]: { label: '优先级', description: '优先使用高优先级的 Key' },
  [RotationStrategy.LEAST_USED]: { label: '最少使用', description: '选择使用次数最少的 Key' },
};

export function ProviderModal({
  mode,
  data,
  onClose,
  onSuccess,
}: {
  mode: 'create' | 'edit';
  data: AiProvider | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState<any>({
    name: data?.name || '',
    source: data?.source || ChatCompletionSource.OPENAI,
    displayName: data?.displayName || '',
    description: data?.description || '',
    status: data?.status || ProviderStatus.ACTIVE,
    config: data?.config || {
      baseUrl: '',
      authType: ProviderAuthType.BEARER,
      timeout: 30000,
      maxRetries: 3,
    },
    capabilities: data?.capabilities || {
      supportedParameters: [],
      supportsStreaming: true,
      supportsTools: false,
      supportsJsonSchema: false,
      supportsVision: false,
      supportsWebSearch: false,
      supportsThinking: false,
    },
    // 编辑模式下不预填充apiKey，只在用户输入新Key时才发送
    apiKey: mode === 'edit' ? '' : '',
    isDefault: data?.isDefault || false,
    order: data?.order || 0,
    rotationStrategy: data?.rotationStrategy || RotationStrategy.ROUND_ROBIN,
  });
  const [loading, setLoading] = useState(false);
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);
  const strategyDropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (strategyDropdownRef.current && !strategyDropdownRef.current.contains(event.target as Node)) {
        setIsStrategyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 准备提交数据，如果apiKey为空则不发送
      const submitData = { ...formData };
      if (!submitData.apiKey) {
        delete submitData.apiKey;
      }

      if (mode === 'create') {
        await createProvider(submitData as CreateProviderDto);
        showToast('创建成功', 'success');
      } else {
        await updateProvider(data!.id, submitData as UpdateProviderDto);
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-8 py-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'create' ? '新增提供商' : '编辑提供商'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">配置 AI 模型提供商的基本信息和连接参数</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-8 py-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                提供商名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="如: openai-main"
              />
              <p className="text-xs text-gray-500 mt-1.5">系统内部使用的唯一标识</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                显示名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="如: OpenAI 主账号"
              />
              <p className="text-xs text-gray-500 mt-1.5">用户界面显示的友好名称</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                提供商来源 <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value as ChatCompletionSource })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                {Object.values(ChatCompletionSource).map((source) => (
                  <option key={source} value={source}>{SOURCE_LABELS[source]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">状态</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProviderStatus })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              >
                {Object.values(ProviderStatus).map((status) => (
                  <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
              rows={2}
              placeholder="提供商的详细描述信息"
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">连接配置</h3>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Base URL <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required
                value={formData.config.baseUrl}
                onChange={(e) => setFormData({
                  ...formData,
                  config: { ...formData.config, baseUrl: e.target.value }
                })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                placeholder="https://api.openai.com/v1"
              />
              <p className="text-xs text-gray-500 mt-1.5">API 请求的基础地址</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
            {mode === 'edit' && data?.maskedApiKey ? (
              <div>
                <div className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 font-mono text-sm text-gray-600">
                  {data.maskedApiKey}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  当前Key已加密存储。如需修改，请输入新的Key
                </p>
                <input
                  type="password"
                  value={formData.apiKey || ''}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm mt-2"
                  placeholder="输入新Key以替换现有Key"
                />
              </div>
            ) : (
              <>
                <input
                  type="password"
                  value={formData.apiKey || ''}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
                  placeholder="sk-..."
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  可选，如果使用密钥池则不需要填写
                </p>
              </>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-base font-semibold text-gray-800 mb-4">高级选项</h3>
            <div className="grid grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">轮询策略</label>
                <div className="relative" ref={strategyDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsStrategyOpen(!isStrategyOpen)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-left flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {ROTATION_STRATEGY_LABELS[formData.rotationStrategy as RotationStrategy]?.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {ROTATION_STRATEGY_LABELS[formData.rotationStrategy as RotationStrategy]?.description}
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isStrategyOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isStrategyOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                      {Object.values(RotationStrategy).map((strategy) => {
                        const info = ROTATION_STRATEGY_LABELS[strategy];
                        const isSelected = formData.rotationStrategy === strategy;
                        return (
                          <div
                            key={strategy}
                            onClick={() => {
                              setFormData({ ...formData, rotationStrategy: strategy });
                              setIsStrategyOpen(false);
                            }}
                            className={`px-4 py-3 cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50 border-l-4 border-blue-500'
                                : 'hover:bg-gray-50 border-l-4 border-transparent'
                            }`}
                          >
                            <div className={`text-sm font-medium ${
                              isSelected ? 'text-blue-700' : 'text-gray-900'
                            }`}>
                              {info.label}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {info.description}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">排序</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1.5">数字越小优先级越高</p>
              </div>
              <div className="flex flex-col justify-between">
                <label className="block text-sm font-semibold text-gray-700 mb-2">默认设置</label>
                <label className="flex items-center cursor-pointer px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700 font-medium">设为默认</span>
                </label>
              </div>
            </div>
          </div>

          </div>

          {/* 固定在底部的按钮 */}
          <div className="px-8 py-5 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:border-gray-400 font-medium transition-all"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 font-medium shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '提交中...' : '确定'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
