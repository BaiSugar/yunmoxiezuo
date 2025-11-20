import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

/**
 * 测试模型连接 DTO
 */
export class TestModelConnectionDto {
  @ApiProperty({ description: '所属提供商ID' })
  @IsInt()
  @Min(1)
  providerId: number;

  @ApiProperty({
    description: '模型标识符（如 gpt-4o-mini）',
    example: 'gpt-4o-mini',
  })
  @IsString()
  @IsNotEmpty()
  modelId: string;

  @ApiPropertyOptional({
    description: '自定义的 API Base URL（可选）',
    example: 'https://api.openai.com/v1',
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({
    description: '自定义 API Key（可选，不会被保存）',
    example: 'sk-xxx',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;
}


