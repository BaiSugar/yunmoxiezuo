import React from "react";
import { X, MessageSquare, Wand2, History, Info } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AI助手使用帮助模态框
 */
export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            AI助手使用说明
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 核心功能 */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-600" />
              核心功能
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• <strong>智能对话生成</strong>：实时流式输出，支持多轮对话</p>
              <p>• <strong>提示词系统</strong>：使用预设提示词，获得专业写作风格</p>
              <p>• <strong>对话管理</strong>：自动保存历史，随时新建或查看</p>
            </div>
          </section>

          {/* 提示词功能 */}
          <section className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🎨 提示词功能
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-900 mb-1">什么是提示词？</p>
                <p>提示词是预先设定的指令模板，让AI按特定风格和要求生成内容。例如"科幻小说助手"会让AI用科幻风格写作，"古风文学大师"会创作古典诗词。</p>
              </div>
              
              <div>
                <p className="font-medium text-gray-900 mb-1">如何使用？</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>点击顶部<strong>提示词</strong>按钮选择模板</li>
                  <li>对话中可随时切换或取消提示词</li>
                  <li>切换提示词时，历史对话会保留</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 场景分类 */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              📖 使用场景详解
            </h3>
            <div className="space-y-3">
              {/* 场景1 */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">场景1</span>
                  <p className="font-medium text-gray-900">纯对话（无提示词）</p>
                </div>
                <p className="text-xs text-gray-700 mb-2">
                  <strong>描述：</strong>用户不选择任何提示词，直接与AI对话。
                </p>
                <p className="text-xs text-gray-600 mb-1"><strong>示例：</strong></p>
                <div className="bg-white p-2 rounded text-xs space-y-1">
                  <p>用户："你好"</p>
                  <p className="text-blue-600">AI："你好！有什么可以帮你的？"</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>适用场景：</strong>临时咨询、简单对话、测试AI响应
                </p>
              </div>

              {/* 场景2 */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">场景2</span>
                  <p className="font-medium text-gray-900">使用提示词对话</p>
                </div>
                <p className="text-xs text-gray-700 mb-2">
                  <strong>描述：</strong>用户选择了提示词，AI按照特定风格回复。
                </p>
                <p className="text-xs text-gray-600 mb-1"><strong>示例：</strong></p>
                <div className="bg-white p-2 rounded text-xs space-y-1">
                  <p className="text-purple-600">[选择提示词：科幻小说助手]</p>
                  <p>用户："帮我写个开头"</p>
                  <p className="text-blue-600">AI："在2157年的深空站，李明收到了一条神秘信号..."</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>适用场景：</strong>专业创作、风格化写作、需要特定效果
                </p>
              </div>

              {/* 场景3 */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded">场景3</span>
                  <p className="font-medium text-gray-900">无提示词 → 添加提示词</p>
                </div>
                <p className="text-xs text-gray-700 mb-2">
                  <strong>描述：</strong>之前没用提示词，现在添加了提示词。
                </p>
                <p className="text-xs text-gray-600 mb-1"><strong>示例：</strong></p>
                <div className="bg-white p-2 rounded text-xs space-y-1">
                  <p>用户："你好"（无提示词）</p>
                  <p className="text-blue-600">AI："你好！我是AI助手"</p>
                  <p className="text-purple-600 mt-1">[添加提示词：古风文学大师]</p>
                  <p>用户："写首诗"</p>
                  <p className="text-blue-600">AI："桃花依旧笑春风，燕子归来识旧家..."</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>效果：</strong>AI按新风格回复，之前的对话作为上下文保留
                </p>
              </div>

              {/* 场景4 */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <span className="bg-purple-100 text-purple-700 text-xs font-semibold px-2 py-1 rounded">场景4</span>
                  <p className="font-medium text-gray-900">提示词A → 提示词B</p>
                </div>
                <p className="text-xs text-gray-700 mb-2">
                  <strong>描述：</strong>从一个提示词切换到另一个提示词。
                </p>
                <p className="text-xs text-gray-600 mb-1"><strong>示例：</strong></p>
                <div className="bg-white p-2 rounded text-xs space-y-1">
                  <p className="text-purple-600">[使用提示词：科幻小说助手]</p>
                  <p>用户："写一个故事"</p>
                  <p className="text-blue-600">AI："在遥远的星系中..."</p>
                  <p className="text-purple-600 mt-1">[切换到：古风文学大师]</p>
                  <p>用户："换个风格写"</p>
                  <p className="text-blue-600">AI："话说江南烟雨，有一书生..."</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>效果：</strong>AI按新风格改写，历史内容作为参考
                </p>
              </div>

              {/* 场景5 */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded">场景5</span>
                  <p className="font-medium text-gray-900">提示词A → 无提示词</p>
                </div>
                <p className="text-xs text-gray-700 mb-2">
                  <strong>描述：</strong>之前用了提示词，现在取消提示词。
                </p>
                <p className="text-xs text-gray-600 mb-1"><strong>示例：</strong></p>
                <div className="bg-white p-2 rounded text-xs space-y-1">
                  <p className="text-purple-600">[使用提示词：科幻小说助手]</p>
                  <p>用户："写一个科幻开头"</p>
                  <p className="text-blue-600">AI："在2157年的火星基地..."</p>
                  <p className="text-purple-600 mt-1">[取消提示词]</p>
                  <p>用户："总结一下"</p>
                  <p className="text-blue-600">AI："您刚才提到了一个科幻故事的开头，主要讲述了..."</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>效果：</strong>AI回到默认对话模式，历史对话保留
                </p>
              </div>

              {/* 场景6 */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-2 mb-2">
                  <span className="bg-pink-100 text-pink-700 text-xs font-semibold px-2 py-1 rounded">场景6</span>
                  <p className="font-medium text-gray-900">多次切换提示词</p>
                </div>
                <p className="text-xs text-gray-700 mb-2">
                  <strong>描述：</strong>在对话中多次切换不同提示词。
                </p>
                <p className="text-xs text-gray-600 mb-1"><strong>示例：</strong></p>
                <div className="bg-white p-2 rounded text-xs space-y-1">
                  <p>第1轮（无提示词）："你好" → AI回复</p>
                  <p className="text-purple-600">第2轮（科幻风格）："写科幻故事" → AI用科幻风格</p>
                  <p className="text-purple-600">第3轮（古风风格）："换成古风" → AI用古风风格</p>
                  <p className="text-purple-600">第4轮（取消提示词）："总结" → AI总结回顾</p>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>效果：</strong>每次切换只影响新回复，历史保持原样
                </p>
              </div>
            </div>
          </section>

          {/* 对话管理 */}
          <section className="bg-green-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              新建对话
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>何时使用：</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>开始新的创作主题</li>
                <li>需要全新的上下文</li>
              </ul>
              <p className="mt-2"><strong>注意：</strong>当前对话会自动保存到历史记录</p>
            </div>
          </section>

          <section className="bg-amber-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600" />
              历史记录
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>功能：</strong></p>
              <ul className="list-disc list-inside ml-2 space-y-1">
                <li>查看所有历史对话（按时间排序）</li>
                <li>点击任意对话继续创作</li>
                <li>删除不需要的对话</li>
              </ul>
              <p className="mt-2"><strong>注意：</strong>加载历史前，当前对话会自动保存</p>
            </div>
          </section>

          {/* 使用技巧 */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              💡 使用技巧
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <div>
                  <p className="font-medium">明确表达需求</p>
                  <p className="text-gray-600 text-xs">详细描述背景、角色、风格等</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <div>
                  <p className="font-medium">分步骤进行</p>
                  <p className="text-gray-600 text-xs">先构思大纲，再详细展开</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <div>
                  <p className="font-medium">利用历史对话</p>
                  <p className="text-gray-600 text-xs">AI会记住对话内容，可直接说"继续写"</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <div>
                  <p className="font-medium">合理使用提示词</p>
                  <p className="text-gray-600 text-xs">保持风格一致，需要时再切换</p>
                </div>
              </div>
            </div>
          </section>

          {/* 注意事项 */}
          <section className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ⚠️ 注意事项
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div>
                <p className="font-medium text-gray-900">AI能记住：</p>
                <ul className="list-disc list-inside ml-2 text-xs">
                  <li>当前对话中的所有消息</li>
                  <li>您选择的提示词和参数</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900">AI不会记住：</p>
                <ul className="list-disc list-inside ml-2 text-xs">
                  <li>其他对话中的内容</li>
                  <li>编辑器中的文本（除非您复制到对话中）</li>
                  <li>新建对话后之前的内容</li>
                </ul>
              </div>
              <div className="mt-3">
                <p className="font-medium text-gray-900">提示词切换效果：</p>
                <p className="text-xs">新提示词只影响新消息，历史消息保持原样，AI会结合新提示词和历史上下文。</p>
              </div>
            </div>
          </section>

          {/* 快捷操作 */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              ⌨️ 快捷操作
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded p-2">
                <p className="font-medium text-gray-900">Enter</p>
                <p className="text-xs text-gray-600">发送消息</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="font-medium text-gray-900">Shift + Enter</p>
                <p className="text-xs text-gray-600">换行</p>
              </div>
            </div>
          </section>
        </div>

        {/* 底部 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
          >
            开始使用
          </button>
        </div>
      </div>
    </div>
  );
};
