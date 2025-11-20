import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Lock, AlertCircle } from 'lucide-react';
import { getEnabledTools } from '../../services/tools.api';
import type { Tool } from '../../types/tool';
import { useAuth } from '../../contexts/AuthContext';
import { membershipsApi } from '../../services/memberships.api';
import PurchaseModal from '../../components/purchase/PurchaseModal';

const ToolsHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembershipPrompt, setShowMembershipPrompt] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [hasMembership, setHasMembership] = useState(false);

  useEffect(() => {
    loadTools();
    checkMembership();
  }, []);

  const checkMembership = async () => {
    if (!user) {
      setHasMembership(false);
      return;
    }
    try {
      const membership = await membershipsApi.getMyActiveMembership();
      setHasMembership(membership !== null && membership.isActive);
    } catch (error) {
      console.log('用户无活跃会员');
      setHasMembership(false);
    }
  };

  const loadTools = async () => {
    try {
      const response = await getEnabledTools();
      console.log('🔧 工具列表响应:', response);
      console.log('🔧 工具数据:', response.data);
      
      if (response.code === 'success' && Array.isArray(response.data)) {
        console.log('✅ 加载了', response.data.length, '个工具');
        setTools(response.data);
      } else {
        console.error('❌ 响应格式不正确:', response);
      }
    } catch (error) {
      console.error('❌ 加载工具列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToolClick = (tool: Tool) => {
    if (!tool.isEnabled) {
      // 工具禁用提示
      return;
    }

    // 检查会员状态
    if (tool.requiresMembership && !hasMembership) {
      setShowMembershipPrompt(true);
      return;
    }

    // 跳转到工具页面
    // 如果route已经包含/dashboard，直接跳转；否则添加/dashboard前缀
    const targetRoute = tool.route.startsWith('/dashboard') 
      ? tool.route 
      : `/dashboard${tool.route}`;
    navigate(targetRoute);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Search':
        return Search;
      default:
        return Search;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">工具箱</h1>
        <p className="text-gray-600">实用工具助你提升效率</p>
      </div>

      {tools.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">暂无可用工具</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const IconComponent = getIcon(tool.icon);
            const isLocked = tool.requiresMembership && !hasMembership;
            const isDisabled = !Boolean(tool.isEnabled); // 将数字转换为boolean

            return (
              <div
                key={tool.id}
                onClick={() => handleToolClick(tool)}
                className={`
                  relative bg-white rounded-xl shadow-md p-6 cursor-pointer 
                  transition-all duration-300 hover:shadow-lg
                  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-1'}
                `}
              >
                {/* 会员标识 */}
                {tool.requiresMembership && (
                  <div className="absolute top-4 right-4">
                    <div className={`
                      px-2 py-1 rounded text-xs font-medium flex items-center gap-1
                      ${isLocked ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}
                    `}>
                      <Lock className="w-3 h-3" />
                      {isLocked ? '此功能需要会员' : '可使用'}
                    </div>
                  </div>
                )}

                {/* 维护中标识 */}
                {isDisabled && (
                  <div className="absolute top-4 right-4">
                    <div className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      维护中
                    </div>
                  </div>
                )}

                {/* 工具图标 */}
                <div className="mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>

                {/* 工具信息 */}
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {tool.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {tool.description}
                </p>

                {/* 使用次数 */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    已使用 {tool.usageCount.toLocaleString()} 次
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 会员提示确认窗口 */}
      {showMembershipPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
              <Lock className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">需要开通会员</h3>
            <p className="text-gray-600 text-center mb-6">
              此功能仅限会员使用，开通会员后即可享受更多专属特权。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowMembershipPrompt(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                稍后再说
              </button>
              <button
                onClick={() => {
                  setShowMembershipPrompt(false);
                  setShowPurchaseModal(true);
                }}
                className="flex-1 px-4 py-2.5 text-white bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg hover:opacity-90 transition-opacity font-medium shadow-lg"
              >
                立即开通
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 购买会员模态框 */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        defaultTab="membership"
      />
    </div>
  );
};

export default ToolsHome;
