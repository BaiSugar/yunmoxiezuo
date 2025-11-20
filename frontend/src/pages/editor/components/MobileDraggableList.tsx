import React, { useState, useRef } from 'react';

interface DragItem {
  type: 'chapter' | 'volume';
  id: number;
  element: HTMLElement;
  startY: number;
  offsetY: number;
}

interface MobileDraggableListProps {
  children: React.ReactNode;
  onDragEnd?: () => void;
}

/**
 * 移动端触摸拖拽包装器
 * 为ChapterList添加触摸拖拽支持
 */
export const MobileDraggableList: React.FC<MobileDraggableListProps> = ({
  children,
  onDragEnd,
}) => {
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    // 查找最近的可拖拽元素
    const draggableElement = target.closest('[data-draggable="true"]') as HTMLElement;
    
    if (draggableElement) {
      const touch = e.touches[0];
      const rect = draggableElement.getBoundingClientRect();
      
      setDragItem({
        type: draggableElement.dataset.dragType as 'chapter' | 'volume',
        id: Number(draggableElement.dataset.dragId),
        element: draggableElement,
        startY: touch.clientY,
        offsetY: touch.clientY - rect.top,
      });
      
      // 添加拖拽样式
      draggableElement.style.opacity = '0.5';
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragItem) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    // 更新元素位置
    dragItem.element.style.transform = `translateY(${touch.clientY - dragItem.startY}px)`;
  };

  const handleTouchEnd = () => {
    if (!dragItem) return;
    
    // 恢复样式
    dragItem.element.style.opacity = '';
    dragItem.element.style.transform = '';
    
    setDragItem(null);
    onDragEnd?.();
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="touch-none" // 防止默认触摸行为
    >
      {children}
    </div>
  );
};
