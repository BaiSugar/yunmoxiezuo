import { useState, useEffect } from 'react';
import { Package, Crown, Check, Loader2 } from 'lucide-react';
import { getTokenPackages, type TokenPackage } from '../../services/token-packages.api';
import { getMembershipPlanList, type MembershipPlan } from '../../services/memberships.api';

type TabType = 'tokens' | 'membership';

/**
 * 购买页面组件 - 字数包和会员购买
 */
export default function PurchaseSection() {
  const [activeTab, setActiveTab] = useState<TabType>('tokens');
  const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tokens') {
        const packages = await getTokenPackages(true); // 只获取上架的
        setTokenPackages(packages);
      } else {
        const response = await getMembershipPlanList({ isActive: true });
        setMembershipPlans(response.data);
      }
    } catch (error: any) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 格式化数字（添加千分位）
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // 格式化字数显示
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    }
    if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return formatNumber(tokens);
  };

  // 处理购买（脱敏：仅显示提示）
  const handlePurchase = (type: 'token' | 'membership', id: number) => {
    alert(`购买功能开发中...\n类型: ${type === 'token' ? '字数包' : '会员'}\nID: ${id}`);
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">购买中心</h2>
        <p className="text-gray-600">选择适合你的套餐，享受更好的创作体验</p>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-xl">
        <button
          onClick={() => setActiveTab('tokens')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'tokens'
              ? 'bg-white text-blue-600 shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>字数包</span>
        </button>
        <button
          onClick={() => setActiveTab('membership')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'membership'
              ? 'bg-white text-purple-600 shadow-md'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Crown className="w-5 h-5" />
          <span>会员套餐</span>
        </button>
      </div>

      {/* 内容区域 */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'tokens' ? (
            // 字数包卡片
            tokenPackages.length > 0 ? (
              tokenPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  {/* 标题 */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-sm text-gray-600">{pkg.description}</p>
                    )}
                  </div>

                  {/* 字数信息 */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold text-blue-600">
                        {formatTokens(pkg.tokenAmount)}
                      </span>
                      <span className="text-gray-600">字</span>
                    </div>
                    {pkg.bonusTokens > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-orange-500">🎁</span>
                        <span className="text-gray-700">
                          额外赠送 {formatTokens(pkg.bonusTokens)} 字
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 价格 */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-gray-600">¥</span>
                      <span className="text-3xl font-bold text-gray-900">
                        {typeof pkg.price === 'string' ? parseFloat(pkg.price).toFixed(2) : pkg.price.toFixed(2)}
                      </span>
                    </div>
                    {pkg.validDays > 0 && (
                      <p className="text-xs text-gray-500 mt-1">有效期：{pkg.validDays} 天</p>
                    )}
                  </div>

                  {/* 购买按钮 */}
                  <button
                    onClick={() => handlePurchase('token', pkg.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors duration-200"
                  >
                    立即购买
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">暂无可用的字数包</p>
              </div>
            )
          ) : (
            // 会员套餐卡片
            membershipPlans.length > 0 ? (
              membershipPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-100 rounded-xl p-6 hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  {/* 标题 */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">
                        Lv.{plan.level}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    )}
                  </div>

                  {/* 会员特权 */}
                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500" />
                      <span>{formatTokens(plan.tokenQuota)} 字数额度</span>
                    </div>
                    {plan.dailyTokenLimit > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>每日 {formatTokens(plan.dailyTokenLimit)} 字</span>
                      </div>
                    )}
                    {plan.canUseAdvancedModels && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>高级AI模型</span>
                      </div>
                    )}
                    {plan.freeInputCharsPerRequest > 0 && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>每次免费输入 {formatNumber(plan.freeInputCharsPerRequest)} 字符</span>
                      </div>
                    )}
                    {plan.outputFree && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>输出完全免费</span>
                      </div>
                    )}
                  </div>

                  {/* 价格 */}
                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-gray-600">¥</span>
                      <span className="text-3xl font-bold text-gray-900">
                        {typeof plan.price === 'string' ? parseFloat(plan.price).toFixed(2) : plan.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {plan.duration === 0 ? '永久有效' : `${plan.duration} 天`}
                    </p>
                  </div>

                  {/* 购买按钮 */}
                  <button
                    onClick={() => handlePurchase('membership', plan.id)}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-3 rounded-lg transition-all duration-200"
                  >
                    立即开通
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Crown className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">暂无可用的会员套餐</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
