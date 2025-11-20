import { IsString, IsInt, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChapterDto {
  @ApiProperty({ description: '所属作品ID' })
  @IsInt()
  novelId: number;

  @ApiPropertyOptional({ description: '分卷ID，null表示独立章节' })
  @IsOptional()
  @IsInt()
  volumeId?: number | null;

  @ApiProperty({ description: '章节标题', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: '章节内容' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '章节梗概/大纲' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: '全局排序顺序（独立章节使用）' })
  @IsOptional()
  @IsInt()
  globalOrder?: number | null;
}
