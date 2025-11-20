import {
  IsInt,
  IsOptional,
  IsString,
  IsObject,
  IsArray,
  IsEnum,
  IsBoolean,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiFormat } from '../enums/api-format.enum';

/**
 * Token预算DTO
 */
export class TokenBudgetDto {
  @ApiProperty({ description: '总Token预算', example: 4096 })
  @IsNumber()
  @Min(100)
  total: number;

  @ApiPropertyOptional({ description: '系统提示预算', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  systemPrompts?: number;

  @ApiPropertyOptional({ description: '角色定义预算', example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  characterDef?: number;

  @ApiPropertyOptional({ description: '示例消息预算', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  examples?: number;

  @ApiPropertyOptional({
    description: '世界书预算比例（0-1之间）',
    example: 0.25,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  worldBookRatio?: number;

  @ApiPropertyOptional({
    description: '保护的最近历史消息数量',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  protectedHistoryCount?: number;
}

/**
 * 历史消息DTO
 */
export class HistoryMessageDto {
  @ApiProperty({
    description: '消息角色',
    enum: ['user', 'assistant'],
    example: 'user',
  })
  @IsString()
  role: 'user' | 'assistant';

  @ApiProperty({ description: '消息内容', example: '你好' })
  @IsString()
  content: string;
}

/**
 * 构建选项DTO
 */
export class BuildOptionsDto {
  @ApiPropertyOptional({
    description: '目标API格式',
    enum: ApiFormat,
    example: ApiFormat.OPENAI,
  })
  @IsOptional()
  @IsEnum(ApiFormat)
  apiFormat?: ApiFormat;

  @ApiPropertyOptional({ description: 'Token预算配置', type: TokenBudgetDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TokenBudgetDto)
  tokenBudget?: TokenBudgetDto;

  @ApiPropertyOptional({ description: '是否启用世界书激活', example: false })
  @IsOptional()
  @IsBoolean()
  enableWorldBook?: boolean;

  @ApiPropertyOptional({
    description: '世界书扫描深度（最近N条消息）',
    example: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  worldBookScanDepth?: number;

  @ApiPropertyOptional({
    description: '世界书递归扫描最大轮数',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  worldBookMaxRecursion?: number;

  @ApiPropertyOptional({ description: '是否启用调试模式', example: false })
  @IsOptional()
  @IsBoolean()
  debug?: boolean;
}

/**
 * 构建提示词请求DTO
 */
export class BuildPromptDto {
  @ApiProperty({ description: '提示词ID', example: 1 })
  @IsInt()
  promptId: number;

  @ApiPropertyOptional({
    description: '用户输入',
    example: '请帮我写一个故事',
  })
  @IsOptional()
  @IsString()
  userInput?: string;

  @ApiPropertyOptional({
    description: '对话历史',
    type: [HistoryMessageDto],
    example: [
      { role: 'user', content: '你好' },
      { role: 'assistant', content: '你好！有什么可以帮助你的吗？' },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HistoryMessageDto)
  history?: HistoryMessageDto[];

  @ApiPropertyOptional({
    description: '构建选项',
    type: BuildOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BuildOptionsDto)
  options?: BuildOptionsDto;
}

/**
 * 简化构建请求DTO
 */
export class BuildSimpleDto {
  @ApiProperty({ description: '提示词ID', example: 1 })
  @IsInt()
  promptId: number;

  @ApiPropertyOptional({
    description: '参数替换映射',
    example: { name: '张三', age: '25' },
  })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, string>;

  @ApiPropertyOptional({
    description: '构建选项',
    type: BuildOptionsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BuildOptionsDto)
  options?: BuildOptionsDto;
}
