import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 模型基本信息 DTO（不包含敏感信息，用于前端选择器）
 */
export class ModelBasicDto {
  @ApiProperty({ description: '模型ID（数据库）' })
  id: number;

  @ApiProperty({ description: '显示名称', example: 'GPT-4o' })
  displayName: string;

  @ApiPropertyOptional({ description: '描述' })
  description?: string;

  @ApiProperty({ description: '是否为默认模型' })
  isDefault: boolean;

  @ApiProperty({ description: '所属提供商ID' })
  providerId: number;

  @ApiProperty({ description: '提供商名称' })
  providerName: string;

  @ApiPropertyOptional({ description: '模型分类ID' })
  categoryId?: number;

  @ApiPropertyOptional({ description: '模型分类名称' })
  categoryName?: string;

  @ApiPropertyOptional({ description: '模型分类图标' })
  categoryIcon?: string;

  @ApiPropertyOptional({ description: '模型分类描述' })
  categoryDescription?: string;

  @ApiPropertyOptional({ description: '分类排序值，越小越靠前' })
  categoryOrder?: number;

  @ApiPropertyOptional({ description: '是否为免费模型', default: false })
  isFree?: boolean;

  @ApiPropertyOptional({ description: '输入倍率', default: 1.0 })
  inputRatio?: number;

  @ApiPropertyOptional({ description: '输出倍率', default: 1.0 })
  outputRatio?: number;
}
