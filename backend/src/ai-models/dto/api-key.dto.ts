import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiKeyStatus } from '../entities/api-key.entity';

/**
 * 创建 API Key DTO
 */
export class CreateApiKeyDto {
  @ApiProperty({ description: '所属提供商ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  providerId: number;

  @ApiProperty({ description: 'Key 名称', example: 'Primary Key' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'API 密钥', example: 'sk-...' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiPropertyOptional({
    description: '权重（用于加权轮询）',
    example: 1,
    default: 1,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({
    description: '优先级（数字越小优先级越高）',
    example: 0,
    default: 0,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({
    description: '每分钟请求数限制',
    example: 500,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  requestsPerMinute?: number;

  @ApiPropertyOptional({
    description: '每分钟 Token 数限制',
    example: 150000,
  })
  @IsInt()
  @IsOptional()
  @Min(1)
  tokensPerMinute?: number;

  @ApiPropertyOptional({
    description: '备注',
    example: '主要使用的密钥',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * 更新 API Key DTO
 */
export class UpdateApiKeyDto {
  @ApiPropertyOptional({ description: 'Key 名称' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'API 密钥' })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiPropertyOptional({
    description: 'Key 状态',
    enum: ApiKeyStatus,
  })
  @IsEnum(ApiKeyStatus)
  @IsOptional()
  status?: ApiKeyStatus;

  @ApiPropertyOptional({ description: '权重' })
  @IsInt()
  @IsOptional()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: '优先级' })
  @IsInt()
  @IsOptional()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({ description: '每分钟请求数限制' })
  @IsInt()
  @IsOptional()
  @Min(1)
  requestsPerMinute?: number;

  @ApiPropertyOptional({ description: '每分钟 Token 数限制' })
  @IsInt()
  @IsOptional()
  @Min(1)
  tokensPerMinute?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * 批量创建 API Keys DTO
 */
export class BulkCreateApiKeysDto {
  @ApiProperty({ description: '所属提供商ID', example: 1 })
  @IsInt()
  @IsNotEmpty()
  providerId: number;

  @ApiProperty({
    description: 'Keys 列表',
    type: [CreateApiKeyDto],
    example: [
      { name: 'Key 1', key: 'sk-...', weight: 2 },
      { name: 'Key 2', key: 'sk-...', weight: 1 },
    ],
  })
  keys: Array<{
    name: string;
    key: string;
    weight?: number;
    priority?: number;
  }>;
}
