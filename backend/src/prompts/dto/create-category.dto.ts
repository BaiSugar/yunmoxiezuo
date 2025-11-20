import { IsString, IsInt, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryUsageType } from '../entities/category.entity';

export class CreateCategoryDto {
  @ApiProperty({ description: '分类名称', example: 'AI写作', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: '图标', example: '✍️', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: '分类描述', example: '用于辅助小说、文章等各类文本创作', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '排序顺序', example: 0, default: 0 })
  @IsInt()
  @IsOptional()
  order?: number = 0;

  @ApiPropertyOptional({ description: '使用场景', enum: CategoryUsageType, example: CategoryUsageType.WRITING, default: CategoryUsageType.WRITING })
  @IsEnum(CategoryUsageType)
  @IsOptional()
  usageType?: CategoryUsageType;
}
