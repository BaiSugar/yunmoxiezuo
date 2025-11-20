import { IsArray, ValidateNested, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ChapterUpdateItem {
  @ApiProperty({ description: '章节ID' })
  @IsInt()
  id: number;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: '全局排序顺序' })
  @IsOptional()
  @IsInt()
  globalOrder?: number | null;

  @ApiPropertyOptional({ description: '分卷ID' })
  @IsOptional()
  @IsInt()
  volumeId?: number | null;
}

export class BatchUpdateChaptersDto {
  @ApiProperty({ description: '章节更新列表', type: [ChapterUpdateItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChapterUpdateItem)
  chapters: ChapterUpdateItem[];
}
