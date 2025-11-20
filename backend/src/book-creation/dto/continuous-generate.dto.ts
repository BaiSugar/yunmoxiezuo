import { IsInt, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 生成单章DTO（步进式生成）
 * 流程：生成 → 梗概 → 审稿 → 返回报告 → 等待人工确认
 */
export class GenerateNextChapterDto {
  @ApiPropertyOptional({
    description: '指定章节序号（从1开始），不传则自动生成下一章',
    example: 5,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  chapterOrder?: number;
}

