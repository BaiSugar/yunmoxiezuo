import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PromptGroupStatus } from '../entities/prompt-group.entity';

/**
 * 提示词组项DTO
 */
export class PromptGroupItemDto {
  @ApiProperty({ description: '提示词ID', example: 1 })
  @IsNumber()
  @IsNotEmpty({ message: '提示词ID不能为空' })
  promptId: number;

  @ApiProperty({
    description: '阶段类型',
    example: 'ideaPromptId',
    enum: [
      'ideaPromptId',
      'ideaOptimizePromptId',
      'titlePromptId',
      'mainOutlinePromptId',
      'volumeOutlinePromptId',
      'chapterOutlinePromptId',
      'contentPromptId',
      'reviewPromptId',
      'summaryPromptId',
      'optimizePromptId',
    ],
  })
  @IsString()
  @IsNotEmpty({ message: '阶段类型不能为空' })
  stageType: string;

  @ApiPropertyOptional({ description: '阶段显示名称', example: '脑洞生成提示词' })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: '阶段显示名称不能超过100字' })
  stageLabel?: string;

  @ApiPropertyOptional({ description: '顺序', example: 0 })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: '是否必需', example: true })
  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;
}

/**
 * 创建提示词组DTO
 */
export class CreatePromptGroupDto {
  @ApiProperty({ description: '提示词组名称', example: '玄幻小说创作套装' })
  @IsString()
  @IsNotEmpty({ message: '提示词组名称不能为空' })
  @MaxLength(100, { message: '提示词组名称不能超过100字' })
  name: string;

  @ApiPropertyOptional({
    description: '描述（支持Markdown）',
    example: '这是一套专为玄幻小说创作优化的提示词组，包含...',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '是否公开到广场', example: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '是否需要申请', example: false })
  @IsBoolean()
  @IsOptional()
  requireApplication?: boolean;

  @ApiPropertyOptional({ description: '分类ID', example: 1 })
  @IsNumber()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: PromptGroupStatus,
    example: PromptGroupStatus.DRAFT,
  })
  @IsEnum(PromptGroupStatus)
  @IsOptional()
  status?: PromptGroupStatus;

  @ApiProperty({
    description: '提示词组项列表',
    type: [PromptGroupItemDto],
    example: [
      {
        promptId: 1,
        stageType: 'ideaPromptId',
        stageLabel: '脑洞生成提示词',
        order: 0,
        isRequired: true,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromptGroupItemDto)
  items: PromptGroupItemDto[];
}

