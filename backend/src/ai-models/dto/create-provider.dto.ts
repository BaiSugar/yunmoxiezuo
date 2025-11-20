import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import * as types from '../types';

/**
 * 提供商配置 DTO
 */
export class ProviderConfigDto implements types.IProviderConfig {
  @ApiProperty({ description: 'API 基础 URL', example: 'https://api.openai.com/v1' })
  @IsString()
  @IsNotEmpty()
  baseUrl: string;

  @ApiProperty({ 
    description: '认证类型', 
    enum: types.ProviderAuthType,
    example: types.ProviderAuthType.BEARER 
  })
  @IsEnum(types.ProviderAuthType)
  authType: types.ProviderAuthType;

  @ApiPropertyOptional({ description: '自定义请求头' })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @ApiPropertyOptional({ description: '请求超时时间（毫秒）', default: 30000 })
  @IsNumber()
  @IsOptional()
  timeout?: number;

  @ApiPropertyOptional({ description: '最大重试次数', default: 3 })
  @IsNumber()
  @IsOptional()
  maxRetries?: number;

  @ApiPropertyOptional({ description: '速率限制配置' })
  @IsObject()
  @IsOptional()
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

/**
 * 提供商能力 DTO
 */
export class ProviderCapabilitiesDto implements types.IProviderCapabilities {
  @ApiPropertyOptional({ 
    description: '支持的参数列表', 
    example: ['temperature', 'max_tokens', 'top_p'],
    default: []
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  supportedParameters?: string[];

  @ApiPropertyOptional({ description: '最大 Token 数' })
  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @ApiProperty({ description: '是否支持流式输出', default: true })
  @IsBoolean()
  supportsStreaming: boolean;

  @ApiProperty({ description: '是否支持工具调用', default: false })
  @IsBoolean()
  supportsTools: boolean;

  @ApiProperty({ description: '是否支持 JSON Schema', default: false })
  @IsBoolean()
  supportsJsonSchema: boolean;

  @ApiProperty({ description: '是否支持视觉', default: false })
  @IsBoolean()
  supportsVision: boolean;

  @ApiProperty({ description: '是否支持网页搜索', default: false })
  @IsBoolean()
  supportsWebSearch: boolean;

  @ApiProperty({ description: '是否支持思考模式', default: false })
  @IsBoolean()
  supportsThinking: boolean;
}

/**
 * 创建 AI 提供商 DTO
 */
export class CreateProviderDto {
  @ApiProperty({ description: '提供商名称（唯一）', example: 'openai-main' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: '提供商类型',
    enum: types.ChatCompletionSource,
    example: types.ChatCompletionSource.OPENAI,
  })
  @IsEnum(types.ChatCompletionSource)
  source: types.ChatCompletionSource;

  @ApiProperty({ description: '显示名称', example: 'OpenAI 主账号' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  displayName: string;

  @ApiPropertyOptional({ description: '提供商描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: '提供商状态',
    enum: types.ProviderStatus,
    default: types.ProviderStatus.ACTIVE,
  })
  @IsEnum(types.ProviderStatus)
  @IsOptional()
  status?: types.ProviderStatus;

  @ApiProperty({ description: '提供商配置', type: ProviderConfigDto })
  @ValidateNested()
  @Type(() => ProviderConfigDto)
  config: ProviderConfigDto;

  @ApiProperty({ description: '提供商能力', type: ProviderCapabilitiesDto })
  @ValidateNested()
  @Type(() => ProviderCapabilitiesDto)
  capabilities: ProviderCapabilitiesDto;

  @ApiPropertyOptional({ description: 'API 密钥' })
  @IsString()
  @IsOptional()
  apiKey?: string;

  @ApiPropertyOptional({ description: '额外认证信息' })
  @IsObject()
  @IsOptional()
  authCredentials?: Record<string, any>;

  @ApiPropertyOptional({ description: '是否为默认提供商', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: '排序顺序', default: 0 })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({
    description: '密钥轮询策略',
    enum: types.RotationStrategy,
    default: types.RotationStrategy.ROUND_ROBIN,
  })
  @IsEnum(types.RotationStrategy)
  @IsOptional()
  rotationStrategy?: types.RotationStrategy;
}
