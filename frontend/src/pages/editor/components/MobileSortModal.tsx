import React, { useState, useMemo } from 'react';
import { X, ArrowUp, ArrowDown } from 'lucide-react';
import type { Chapter, Volume } from './types';

interface MobileSortModalProps {
  isOpen: boolean;
  onClose: () => void;
  volumes: Volume[];
  standaloneChapters: Chapter[];
  onSort: (updates: SortUpdate[]) => Promise<void>;
}

export interface SortUpdate {
  type: 'chapter' | 'volume';
  id: number;
  globalOrder?: number;
  volumeId?: number | null;
  order?: number;
}

interface SortItem {
  type: 'chapter' | 'volume';
  id: number;
  title: string;
  volumeId?: number | null;
  globalOrder?: number;
  order?: number;
  isVolumeHeader?: boolean;
}

/**
 * 手机端章节排序模态窗
 */
export const MobileSortModal: React.FC<MobileSortModalProps> = ({
  isOpen,
  onClose,
  volumes,
  standaloneChapters,
  onSort,
}) => {
  const [selectedItem, setSelectedItem] = useState<SortItem | null>(null);
  const [sorting, setSorting] = useState(false);

  // 构建排序列表（应用待处理的更新）
  const sortItems = useMemo(() => {
    const items: SortItem[] = [];
    
    // 添加独立章节和分卷（按 globalOrder 排序）
    const mixed: (Chapter | Volume)[] = [
      ...standaloneChapters.map(ch => ({ ...ch, _type: 'chapter' as const })),
      ...volumes.map(vol => ({ ...vol, _type: 'volume' as const }))
    ].sort((a, b) => {
      const aOrder = 'globalOrder' in a ? (a.globalOrder || 0) : a.order;
      const bOrder = 'globalOrder' in b ? (b.globalOrder || 0) : b.order;
      return aOrder - bOrder;
    });

    mixed.forEach(item => {
      if ('_type' in item && item._type === 'volume') {
        const vol = item as Volume & { _type: 'volume' };
        // 添加分卷标题
        items.push({
          type: 'volume',
          id: vol.id,
          title: vol.name,
          globalOrder: vol.globalOrder,
          isVolumeHeader: true,
        });
        
        // 添加分卷内的章节
        vol.chapters
          .sort((a, b) => a.order - b.order)
          .forEach(ch => {
            items.push({
              type: 'chapter',
              id: ch.id,
              title: ch.title,
              volumeId: ch.volumeId,
              order: ch.order,
            });
          });
      } else if ('_type' in item && item._type === 'chapter') {
        const ch = item as Chapter & { _type: 'chapter' };
        // 独立章节
        items.push({
          type: 'chapter',
          id: ch.id,
          title: ch.title,
          volumeId: null,
          globalOrder: ch.globalOrder,
        });
      }
    });

    return items;
  }, [volumes, standaloneChapters]);

  // 处理项目点击
  const handleItemClick = async (item: SortItem) => {
    if (sorting) return;

    if (!selectedItem) {
      // 第一次点击，选中项目
      setSelectedItem(item);
    } else if (selectedItem.id === item.id && selectedItem.type === item.type) {
      // 点击同一项，取消选择
      setSelectedItem(null);
    } else {
      // 第二次点击，立即执行交换
      setSorting(true);
      try {
        await swapItems(selectedItem, item);
        setSelectedItem(null);
      } finally {
        setSorting(false);
      }
    }
  };

  // 交换两个项目
  const swapItems = async (item1: SortItem, item2: SortItem) => {
    const updates: SortUpdate[] = [];

    // 情况1: 两个都是独立章节
    if (item1.type === 'chapter' && item1.volumeId === null && 
        item2.type === 'chapter' && item2.volumeId === null) {
      updates.push({
        type: 'chapter',
        id: item1.id,
        globalOrder: item2.globalOrder,
      });
      updates.push({
        type: 'chapter',
        id: item2.id,
        globalOrder: item1.globalOrder,
      });
    }
    // 情况2: 独立章节 ↔ 分卷标题（交换 globalOrder）
    else if (item1.type === 'chapter' && item1.volumeId === null && 
             item2.type === 'volume') {
      updates.push({
        type: 'chapter',
        id: item1.id,
        globalOrder: item2.globalOrder,
      });
      updates.push({
        type: 'volume',
        id: item2.id,
        globalOrder: item1.globalOrder,
      });
    }
    else if (item1.type === 'volume' && 
             item2.type === 'chapter' && item2.volumeId === null) {
      updates.push({
        type: 'volume',
        id: item1.id,
        globalOrder: item2.globalOrder,
      });
      updates.push({
        type: 'chapter',
        id: item2.id,
        globalOrder: item1.globalOrder,
      });
    }
    // 情况3: 两个分卷标题
    else if (item1.type === 'volume' && item2.type === 'volume') {
      updates.push({
        type: 'volume',
        id: item1.id,
        globalOrder: item2.globalOrder,
      });
      updates.push({
        type: 'volume',
        id: item2.id,
        globalOrder: item1.globalOrder,
      });
    }
    // 情况4: 分卷内章节 ↔ 独立章节（转换身份）
    else if (item1.type === 'chapter' && item1.volumeId !== null && 
             item2.type === 'chapter' && item2.volumeId === null) {
      // item1 变成独立章节
      updates.push({
        type: 'chapter',
        id: item1.id,
        volumeId: null,
        globalOrder: item2.globalOrder,
      });
      // item2 加入 item1 原来的分卷
      updates.push({
        type: 'chapter',
        id: item2.id,
        volumeId: item1.volumeId,
        order: item1.order,
      });
    }
    else if (item1.type === 'chapter' && item1.volumeId === null && 
             item2.type === 'chapter' && item2.volumeId !== null) {
      // item1 加入 item2 的分卷
      updates.push({
        type: 'chapter',
        id: item1.id,
        volumeId: item2.volumeId,
        order: item2.order,
      });
      // item2 变成独立章节
      updates.push({
        type: 'chapter',
        id: item2.id,
        volumeId: null,
        globalOrder: item1.globalOrder,
      });
    }
    // 情况5: 同一分卷内的两个章节
    else if (item1.type === 'chapter' && item2.type === 'chapter' && 
             item1.volumeId === item2.volumeId && item1.volumeId !== null) {
      updates.push({
        type: 'chapter',
        id: item1.id,
        volumeId: item1.volumeId, // 保持分卷不变
        order: item2.order,
      });
      updates.push({
        type: 'chapter',
        id: item2.id,
        volumeId: item2.volumeId, // 保持分卷不变
        order: item1.order,
      });
    }
    // 情况6: 不同分卷的章节（交换所属分卷）
    else if (item1.type === 'chapter' && item2.type === 'chapter' && 
             item1.volumeId !== item2.volumeId && 
             item1.volumeId !== null && item2.volumeId !== null) {
      updates.push({
        type: 'chapter',
        id: item1.id,
        volumeId: item2.volumeId,
        order: item2.order,
      });
      updates.push({
        type: 'chapter',
        id: item2.id,
        volumeId: item1.volumeId,
        order: item1.order,
      });
    }

    if (updates.length > 0) {
      await onSort(updates);
    }
  };

  // 智能排序：提取标题中的数字
  const extractNumber = (title: string): number => {
    // 中文数字映射
    const chineseNumbers: { [key: string]: string } = {
      '零': '0', '一': '1', '二': '2', '三': '3', '四': '4',
      '五': '5', '六': '6', '七': '7', '八': '8', '九': '9',
      '十': '10', '百': '100', '千': '1000', '万': '10000',
    };

    // 匹配模式：第X卷、第X章、X章、一章、二节等
    const patterns = [
      /第(\d+)[卷章节]/,
      /第([一二三四五六七八九十百千万]+)[卷章节]/,
      /(\d+)[卷章节]/,
      /([一二三四五六七八九十百千万]+)[卷章节]/,
      /卷?章?节?(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        let numStr = match[1];
        
        // 转换中文数字
        if (chineseNumbers[numStr]) {
          return parseInt(chineseNumbers[numStr]);
        }
        
        // 处理复杂中文数字（如：十一、二十三）
        if (/[一二三四五六七八九十百千万]/.test(numStr)) {
          return parseChineseNumber(numStr);
        }
        
        // 阿拉伯数字
        const num = parseInt(numStr);
        if (!isNaN(num)) {
          return num;
        }
      }
    }
    
    return 0;
  };

  // 解析中文数字
  const parseChineseNumber = (str: string): number => {
    const map: { [key: string]: number } = {
      '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
      '五': 5, '六': 6, '七': 7, '八': 8, '九': 9,
    };
    
    let result = 0;
    let temp = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      
      if (char === '十') {
        temp = temp === 0 ? 10 : temp * 10;
      } else if (char === '百') {
        temp *= 100;
      } else if (char === '千') {
        temp *= 1000;
      } else if (char === '万') {
        temp *= 10000;
      } else if (map[char] !== undefined) {
        temp += map[char];
      }
    }
    
    result += temp;
    return result || 0;
  };

  // 智能排序（正序/倒序）
  const handleSmartSort = async (order: 'asc' | 'desc') => {
    setSorting(true);
    try {
      const updates: SortUpdate[] = [];
    
    // 分别对独立章节和分卷排序
    const sortedStandalone = [...standaloneChapters]
      .map(ch => ({ ...ch, extractedNum: extractNumber(ch.title) }))
      .sort((a, b) => {
        const diff = a.extractedNum - b.extractedNum;
        return order === 'asc' ? diff : -diff;
      });

    const sortedVolumes = [...volumes]
      .map(vol => ({ ...vol, extractedNum: extractNumber(vol.name) }))
      .sort((a, b) => {
        const diff = a.extractedNum - b.extractedNum;
        return order === 'asc' ? diff : -diff;
      });

    // 独立章节在前，分卷在后
    let globalOrder = 1;

    // 更新独立章节的 globalOrder
    sortedStandalone.forEach(ch => {
      updates.push({
        type: 'chapter',
        id: ch.id,
        globalOrder: globalOrder++,
      });
    });

    // 更新分卷的 globalOrder，并排序分卷内的章节
    sortedVolumes.forEach(vol => {
      updates.push({
        type: 'volume',
        id: vol.id,
        globalOrder: globalOrder++,
      });

      // 排序该分卷内的章节
      const sortedChaptersInVolume = [...vol.chapters]
        .map(ch => ({ ...ch, extractedNum: extractNumber(ch.title) }))
        .sort((a, b) => {
          const diff = a.extractedNum - b.extractedNum;
          return order === 'asc' ? diff : -diff;
        });

      // 更新分卷内章节的 order
      sortedChaptersInVolume.forEach((ch, index) => {
        updates.push({
          type: 'chapter',
          id: ch.id,
          volumeId: vol.id,
          order: index + 1, // order 从 1 开始
        });
      });
    });

      await onSort(updates);
    } finally {
      setSorting(false);
    }
  };

  // 阻止背景滚动
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setSelectedItem(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 模态窗内容 */}
      <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col" style={{ overflow: 'hidden' }}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">章节排序</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 操作提示 */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <p className="text-xs text-blue-700">
            {selectedItem 
              ? '👉 再点击一个项目立即交换' 
              : '💡 点击选择第一个项目'}
          </p>
        </div>

        {/* 快捷操作按钮 */}
        <div className="flex gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => handleSmartSort('asc')}
            disabled={sorting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ArrowUp className="w-4 h-4" />
            正序排列
          </button>
          <button
            onClick={() => handleSmartSort('desc')}
            disabled={sorting}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <ArrowDown className="w-4 h-4" />
            倒序排列
          </button>
        </div>

        {/* 章节列表 - 修复滚动 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ minHeight: 0, height: 0 }}>
          {sortItems.map((item, index) => {
            const isSelected = selectedItem?.id === item.id && selectedItem?.type === item.type;
            const isVolumeHeader = item.isVolumeHeader;
            const isInVolume = item.type === 'chapter' && item.volumeId !== null;

            return (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => handleItemClick(item)}
                disabled={sorting}
                className={`
                  w-full text-left px-4 py-3 border-b border-gray-100 transition-colors
                  ${isSelected ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-50'}
                  ${isVolumeHeader ? 'font-semibold text-gray-900' : 'text-gray-700'}
                  ${isInVolume ? 'pl-8 text-sm' : ''}
                  disabled:opacity-50
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {isSelected && (
                      <span className="text-blue-600">✓</span>
                    )}
                    {isVolumeHeader && (
                      <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">卷</span>
                    )}
                    {!isVolumeHeader && item.volumeId === null && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">独立</span>
                    )}
                    <span className="flex-1">{item.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 ml-2">
                    {index + 1}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 底部操作 */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
