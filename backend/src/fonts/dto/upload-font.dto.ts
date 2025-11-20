import { IsString, IsEnum, IsOptional, MaxLength, IsInt, Min, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum FontCategory {
  RECOMMENDED = '推荐',
  CHINESE = '中文',
  ENGLISH = '英文',
  SPECIAL = '特殊',
}

export class UploadFontDto {
  @ApiProperty({ description: '字体名称（用于 font-family）', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '字体显示名称', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  displayName: string;

  @ApiPropertyOptional({ description: '字体分类', enum: FontCategory })
  @IsOptional()
  @ValidateIf((o) => o.category !== undefined && o.category !== null && o.category !== '')
  @IsEnum(FontCategory)
  category?: FontCategory;

  @ApiPropertyOptional({ description: '字体描述', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateFontDto {
  @ApiPropertyOptional({ description: '字体显示名称', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({ description: '字体分类', enum: FontCategory })
  @IsOptional()
  @IsEnum(FontCategory)
  category?: FontCategory;

  @ApiPropertyOptional({ description: '字体描述', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

