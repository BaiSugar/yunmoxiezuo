import React from 'react';
import { Check } from 'lucide-react';
import type { Volume } from './types';

interface ChangeVolumeSheetProps {
  volumes: Volume[];
  currentVolumeId: number | null;
  onSelect: (volumeId: number | null) => void;
}

/**
 * 修改章节所属分卷的选择界面
 */
export const ChangeVolumeSheet: React.FC<ChangeVolumeSheetProps> = ({
  volumes,
  currentVolumeId,
  onSelect,
}) => {
  return (
    <div className="p-4 space-y-2">
      {/* 独立章节选项 */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
          currentVolumeId === null
            ? 'bg-blue-50 text-blue-700'
            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
        }`}
      >
        <span className="font-medium">独立章节</span>
        {currentVolumeId === null && <Check className="w-5 h-5" />}
      </button>

      {/* 分卷列表 */}
      {volumes.map(volume => (
        <button
          key={volume.id}
          onClick={() => onSelect(volume.id)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
            currentVolumeId === volume.id
              ? 'bg-blue-50 text-blue-700'
              : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
          }`}
        >
          <span className="font-medium">{volume.name}</span>
          {currentVolumeId === volume.id && <Check className="w-5 h-5" />}
        </button>
      ))}
    </div>
  );
};
