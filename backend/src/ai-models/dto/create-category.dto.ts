import { IsString, IsInt, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建模型分类 DTO
 */
export class CreateModelCategoryDto {
  @ApiProperty({ description: '分类名称', example: '文本生成', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: '图标', example: '🤖', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ description: '分类描述', example: '用于文本生成类模型', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '排序顺序', example: 0, default: 0 })
  @IsInt()
  @IsOptional()
  order?: number = 0;
}

