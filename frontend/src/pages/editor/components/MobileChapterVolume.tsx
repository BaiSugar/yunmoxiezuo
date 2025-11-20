import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { Volume } from './types';

interface MobileChapterVolumeProps {
  currentVolume: Volume | null;
  onClick: () => void;
}

/**
 * 移动端章节所属分卷显示
 */
export const MobileChapterVolume: React.FC<MobileChapterVolumeProps> = ({
  currentVolume,
  onClick,
}) => {
  return (
    <div className="lg:hidden px-6 pb-2">
      <button
        onClick={onClick}
        className="inline-flex items-center text-xs text-gray-500 hover:text-blue-600 transition-colors"
      >
        <ChevronRight className="w-3 h-3 mr-0.5" />
        <span>
          {currentVolume ? currentVolume.name : '独立章节'}
        </span>
      </button>
    </div>
  );
};
