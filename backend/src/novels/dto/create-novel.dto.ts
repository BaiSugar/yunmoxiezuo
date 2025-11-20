import { IsString, IsEnum, IsOptional, IsInt, Min, MaxLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NovelGenre, NovelStatus, NovelForm } from '../entities/novel.entity';

export class CreateNovelDto {
  @ApiProperty({ description: '作品名称', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: '作品简介' })
  @IsOptional()
  @IsString()
  synopsis?: string;

  @ApiPropertyOptional({ 
    enum: NovelGenre, 
    isArray: true,
    description: '作品类型（可多选）', 
    default: [] 
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NovelGenre, { each: true })
  genres?: NovelGenre[];

  @ApiPropertyOptional({ enum: NovelForm, description: '作品形式', default: NovelForm.NOVEL })
  @IsOptional()
  @IsEnum(NovelForm)
  form?: NovelForm;

  @ApiPropertyOptional({ enum: NovelStatus, description: '作品状态', default: NovelStatus.ONGOING })
  @IsOptional()
  @IsEnum(NovelStatus)
  status?: NovelStatus;

  @ApiPropertyOptional({ description: '每章目标字数', default: 2000 })
  @IsOptional()
  @IsInt()
  @Min(500)
  targetWordsPerChapter?: number;

  @ApiPropertyOptional({ description: '封面图片URL' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverImage?: string;
}
