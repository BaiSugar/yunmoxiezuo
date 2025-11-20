/**
 * 字数使用统计图
 */
interface TokenUsageChartProps {
  totalTokens: number;
  usedTokens: number;
}

export default function TokenUsageChart({
  totalTokens,
  usedTokens,
}: TokenUsageChartProps) {
  // totalTokens 已经是当前余额（扣费后的剩余），不需要再减去 usedTokens
  const availableTokens = totalTokens;
  // 使用率 = 已使用 / (当前余额 + 已使用) = 已使用 / 充值总额
  const totalRecharged = totalTokens + usedTokens;
  const usagePercentage =
    totalRecharged > 0 ? (usedTokens / totalRecharged) * 100 : 0;

  const formatNumber = (num: number) => {
    if (num >= 100000000) {
      return (num / 100000000).toFixed(2) + "亿";
    }
    return num.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">字数使用概况</h3>

      {/* 环形进度 */}
      <div className="flex justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            {/* 背景圆 */}
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="#E5E7EB"
              strokeWidth="16"
              fill="none"
            />
            {/* 进度圆 */}
            <circle
              cx="96"
              cy="96"
              r="80"
              stroke="url(#gradient)"
              strokeWidth="16"
              fill="none"
              strokeDasharray={`${(usagePercentage / 100) * 502} 502`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>

          {/* 中心文字 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {usagePercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">使用率</div>
            </div>
          </div>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">总字数</span>
          <span className="text-lg font-bold text-blue-600">
            {formatNumber(totalTokens)}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">可用字数</span>
          <span className="text-lg font-bold text-green-600">
            {formatNumber(availableTokens)}
          </span>
        </div>
        <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">已使用</span>
          <span className="text-lg font-bold text-yellow-600">
            {formatNumber(usedTokens)}
          </span>
        </div>
      </div>
    </div>
  );
}
