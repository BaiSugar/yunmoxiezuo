import { IsOptional, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 更新提示词配置DTO
 * 允许在任务执行过程中更新单个提示词（不支持更新提示词组）
 */
export class UpdatePromptConfigDto {
  @ApiPropertyOptional({ description: '脑洞生成提示词ID' })
  @IsOptional()
  @IsNumber()
  ideaPromptId?: number;

  @ApiPropertyOptional({ description: '脑洞优化提示词ID' })
  @IsOptional()
  @IsNumber()
  ideaOptimizePromptId?: number;

  @ApiPropertyOptional({ description: '书名简介生成提示词ID' })
  @IsOptional()
  @IsNumber()
  titlePromptId?: number;

  @ApiPropertyOptional({ description: '主大纲生成提示词ID' })
  @IsOptional()
  @IsNumber()
  mainOutlinePromptId?: number;

  @ApiPropertyOptional({ description: '大纲优化提示词ID' })
  @IsOptional()
  @IsNumber()
  mainOutlineOptimizePromptId?: number;

  @ApiPropertyOptional({ description: '卷纲生成提示词ID' })
  @IsOptional()
  @IsNumber()
  volumeOutlinePromptId?: number;

  @ApiPropertyOptional({ description: '卷纲优化提示词ID' })
  @IsOptional()
  @IsNumber()
  volumeOutlineOptimizePromptId?: number;

  @ApiPropertyOptional({ description: '细纲生成提示词ID' })
  @IsOptional()
  @IsNumber()
  chapterOutlinePromptId?: number;

  @ApiPropertyOptional({ description: '细纲优化提示词ID' })
  @IsOptional()
  @IsNumber()
  chapterOutlineOptimizePromptId?: number;

  @ApiPropertyOptional({ description: '章节正文生成提示词ID' })
  @IsOptional()
  @IsNumber()
  contentPromptId?: number;

  @ApiPropertyOptional({ description: '章节审稿提示词ID' })
  @IsOptional()
  @IsNumber()
  reviewPromptId?: number;

  @ApiPropertyOptional({ description: '章节梗概生成提示词ID' })
  @IsOptional()
  @IsNumber()
  summaryPromptId?: number;
}

