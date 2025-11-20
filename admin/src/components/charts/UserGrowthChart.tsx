/**
 * 用户增长趋势图
 * 暂时使用模拟数据，等待后端 API 支持
 */
export default function UserGrowthChart() {
  // TODO: 从后端获取真实数据
  const mockData = [
    { date: "01-01", users: 10 },
    { date: "01-02", users: 15 },
    { date: "01-03", users: 23 },
    { date: "01-04", users: 28 },
    { date: "01-05", users: 35 },
    { date: "01-06", users: 42 },
    { date: "01-07", users: 50 },
  ];

  const maxValue = Math.max(...mockData.map((d) => d.users));

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        用户增长趋势（最近7天）
      </h3>
      <div className="h-64 flex items-end space-x-2">
        {mockData.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all hover:from-blue-600 hover:to-blue-500"
              style={{
                height: `${(item.users / maxValue) * 100}%`,
                minHeight: "4px",
              }}
              title={`${item.date}: ${item.users} 用户`}
            />
            <div className="text-xs text-gray-500 mt-2">{item.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
