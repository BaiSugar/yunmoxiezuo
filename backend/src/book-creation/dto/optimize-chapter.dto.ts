import { IsObject, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 优化章节DTO
 */
export class OptimizeChapterDto {
  @ApiPropertyOptional({
    description: '审稿报告（如果不传则先执行审稿）',
    type: Object,
  })
  @IsObject()
  @IsOptional()
  reviewReport?: {
    chapterId?: number;
    score: number;
    issues: Array<{
      type: 'logic' | 'character' | 'continuity' | 'style';
      severity: 'high' | 'medium' | 'low';
      description: string;
      location: string;
    }>;
    suggestions: string[];
    strengths: string[];
  };
}

