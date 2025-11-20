import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  IsInt,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  MaxLength,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ModelStatus } from '../entities';
import type { IModelPricing, IModelLimits } from '../entities';

/**
 * 创建 AI 模型 DTO
 */
export class CreateModelDto {
  @ApiProperty({ description: '模型标识符', example: 'gpt-4-turbo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  modelId: string;

  @ApiProperty({ description: '模型显示名称', example: 'GPT-4 Turbo' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  displayName: string;

  @ApiPropertyOptional({ description: '模型描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '模型状态',
    enum: ModelStatus,
    default: ModelStatus.ACTIVE,
  })
  @IsEnum(ModelStatus)
  @IsOptional()
  status?: ModelStatus;

  @ApiProperty({ description: '所属提供商ID', example: 1 })
  @IsInt()
  @Min(1)
  providerId: number;

  @ApiPropertyOptional({ description: '模型版本', example: '2024-01' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  version?: string;

  @ApiPropertyOptional({ description: '上下文窗口大小', example: 128000 })
  @IsInt()
  @IsOptional()
  @Min(1)
  contextWindow?: number;

  @ApiPropertyOptional({ description: '最大输出tokens', example: 4096 })
  @IsInt()
  @IsOptional()
  @Min(1)
  maxOutputTokens?: number;

  @ApiPropertyOptional({
    description: '模型定价',
    example: {
      inputTokenPrice: 0.01,
      outputTokenPrice: 0.03,
      currency: 'USD',
    },
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  pricing?: IModelPricing;

  @ApiPropertyOptional({
    description: '模型限制',
    example: {
      maxInputTokens: 128000,
      maxOutputTokens: 4096,
      rateLimit: {
        requestsPerMinute: 500,
        tokensPerMinute: 150000,
      },
    },
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  limits?: IModelLimits;

  @ApiPropertyOptional({
    description: '支持的功能标签',
    example: ['chat', 'reasoning', 'vision'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ description: '是否支持流式输出', default: true })
  @IsBoolean()
  @IsOptional()
  supportsStreaming?: boolean;

  @ApiPropertyOptional({ description: '是否支持工具调用', default: false })
  @IsBoolean()
  @IsOptional()
  supportsTools?: boolean;

  @ApiPropertyOptional({ description: '是否支持视觉输入', default: false })
  @IsBoolean()
  @IsOptional()
  supportsVision?: boolean;

  @ApiPropertyOptional({ description: '是否为默认模型', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: '排序顺序', default: 0 })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: '输入倍率', default: 1.0, example: 4.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  inputRatio?: number;

  @ApiPropertyOptional({ description: '输出倍率', default: 1.0, example: 1.0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  outputRatio?: number;

  @ApiPropertyOptional({ description: '是否为免费模型', default: false })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiPropertyOptional({ description: '最小消耗输入字符数', default: 10000 })
  @IsInt()
  @IsOptional()
  @Min(0)
  minInputChars?: number;

  @ApiPropertyOptional({ description: '所属分类ID', example: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ description: 'API Base URL', example: 'https://api.openai.com/v1' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  baseUrl?: string;

  @ApiPropertyOptional({ description: 'API Key', example: 'sk-xxx' })
  @IsString()
  @IsOptional()
  apiKey?: string;
}
