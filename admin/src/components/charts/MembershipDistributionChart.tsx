/**
 * 会员类型分布饼图
 */
interface MembershipDistributionChartProps {
  data?: Record<string, number>;
}

export default function MembershipDistributionChart({
  data,
}: MembershipDistributionChartProps) {
  const defaultData = {
    basic: 10,
    premium: 15,
    professional: 8,
    enterprise: 3,
  };

  const chartData = data || defaultData;
  const total = Object.values(chartData).reduce((sum, val) => sum + val, 0);

  const colors: Record<string, { bg: string; light: string }> = {
    basic: { bg: "#3B82F6", light: "#DBEAFE" },
    premium: { bg: "#10B981", light: "#D1FAE5" },
    professional: { bg: "#8B5CF6", light: "#EDE9FE" },
    enterprise: { bg: "#F59E0B", light: "#FEF3C7" },
  };

  const labels: Record<string, string> = {
    basic: "基础会员",
    premium: "高级会员",
    professional: "专业会员",
    enterprise: "企业会员",
  };

  // 默认颜色（用于未定义的会员类型）
  const defaultColor = { bg: "#6B7280", light: "#F3F4F6" };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">会员类型分布</h3>

      {total === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          暂无会员数据
        </div>
      ) : (
        <div className="space-y-4">
          {/* 饼图（简化版CSS实现） */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {Object.entries(chartData).map(([key, value], index) => {
                  const percentage = (value / total) * 100;
                  const color = colors[key] || defaultColor;

                  return (
                    <div
                      key={key}
                      className="absolute inset-0"
                      style={{
                        background: `conic-gradient(${color.bg} 0% ${percentage}%, transparent ${percentage}%)`,
                        transform: `rotate(${Object.entries(chartData)
                          .slice(0, index)
                          .reduce(
                            (sum, [, val]) => sum + (val / total) * 360,
                            0
                          )}deg)`,
                      }}
                    />
                  );
                })}
              </div>
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {total}
                  </div>
                  <div className="text-xs text-gray-500">总会员</div>
                </div>
              </div>
            </div>
          </div>

          {/* 图例 */}
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(chartData).map(([key, value]) => {
              const color = colors[key] || defaultColor;
              const label = labels[key] || key;
              const percentage =
                total > 0 ? ((value / total) * 100).toFixed(1) : "0";

              return (
                <div
                  key={key}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color.bg }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {value} ({percentage}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
