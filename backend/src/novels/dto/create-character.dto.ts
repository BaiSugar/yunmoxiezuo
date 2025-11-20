import { IsString, IsOptional, IsObject, IsInt, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCharacterDto {
  @ApiProperty({ description: '人物名称', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '分类/分组（类似文件夹）', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: '自定义字段（JSON对象）', example: { "性别": "男", "年龄": "25", "职业": "剑客" } })
  @IsOptional()
  @IsObject()
  fields?: Record<string, any>;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsOptional()
  @IsInt()
  order?: number;
}
