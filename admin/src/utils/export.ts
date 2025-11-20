/**
 * 数据导出工具
 */

/**
 * 将数据导出为 CSV 文件
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[]
) {
  if (data.length === 0) {
    alert('没有数据可导出');
    return;
  }

  // 生成 CSV 头部
  const headers = columns.map((col) => col.label).join(',');

  // 生成 CSV 数据行
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = item[col.key];
        // 处理包含逗号、换行符或引号的值
        const stringValue = String(value ?? '');
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );

  // 合并头部和数据
  const csv = [headers, ...rows].join('\n');

  // 创建 Blob 并触发下载
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); // \ufeff 是 BOM，确保中文正确显示
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${getDateTimeString()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 将数据导出为 JSON 文件
 */
export function exportToJSON<T>(data: T[], filename: string) {
  if (data.length === 0) {
    alert('没有数据可导出');
    return;
  }

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${getDateTimeString()}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 将数据导出为 Excel（实际是 CSV，但扩展名为 xlsx）
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns: { key: keyof T; label: string }[]
) {
  // 对于简单导出，我们使用 CSV 格式但命名为 .xlsx
  // 如果需要真正的 Excel 格式，需要使用 xlsx 库
  exportToCSV(data, filename, columns);
}

/**
 * 获取格式化的日期时间字符串（用于文件名）
 */
function getDateTimeString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

