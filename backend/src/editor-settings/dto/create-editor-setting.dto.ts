import {
  IsString,
  IsInt,
  IsEnum,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  IsNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EditorTheme } from '../entities/editor-setting.entity';

export class CreateEditorSettingDto {
  @ApiPropertyOptional({
    description: '字体',
    default: 'Microsoft YaHei, PingFang SC, SimSun, sans-serif',
    example: 'Microsoft YaHei, sans-serif',
  })
  @IsOptional()
  @IsString()
  fontFamily?: string;

  @ApiPropertyOptional({
    description: '字体大小（像素）',
    minimum: 12,
    maximum: 32,
    default: 16,
  })
  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(32)
  fontSize?: number;

  @ApiPropertyOptional({
    description: '行距（倍数）',
    minimum: 1.0,
    maximum: 3.0,
    default: 1.8,
  })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(3.0)
  lineHeight?: number;

  @ApiPropertyOptional({
    description: '编辑器主题',
    enum: EditorTheme,
    default: EditorTheme.AUTO,
  })
  @IsOptional()
  @IsEnum(EditorTheme)
  theme?: EditorTheme;

  @ApiPropertyOptional({
    description: '段首空格数（全角空格）',
    minimum: 0,
    maximum: 10,
    default: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  paragraphIndent?: number;

  @ApiPropertyOptional({
    description: '段间空行数',
    minimum: 0,
    maximum: 5,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  paragraphSpacing?: number;

  @ApiPropertyOptional({
    description: '是否启用自动保存',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoSave?: boolean;

  @ApiPropertyOptional({
    description: '自动保存间隔（秒）',
    minimum: 10,
    maximum: 300,
    default: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(300)
  autoSaveInterval?: number;

  @ApiPropertyOptional({
    description: '是否显示字数统计',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  showWordCount?: boolean;

  @ApiPropertyOptional({
    description: '背景颜色（CSS颜色值，如: #F5F3E8 护眼黄）',
    example: '#F5F3E8',
  })
  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @ApiPropertyOptional({
    description: '背景图片路径（优先于背景颜色）',
    example: 'editor-backgrounds/bg.jpg',
  })
  @IsOptional()
  @IsString()
  backgroundImage?: string;
}

