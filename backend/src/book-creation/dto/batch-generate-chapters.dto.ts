import { IsArray, IsBoolean, IsOptional, ArrayMinSize, IsInt } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 批量生成章节DTO
 */
export class BatchGenerateChaptersDto {
  @ApiPropertyOptional({
    description: '指定章节ID列表',
    type: [Number],
    example: [1, 2, 3, 4, 5],
  })
  @IsArray()
  @IsInt({ each: true })
  @ArrayMinSize(1, { message: '至少需要指定一个章节' })
  @Type(() => Number)
  @IsOptional()
  chapterIds?: number[];

  @ApiPropertyOptional({
    description: '是否生成所有未生成的章节',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  generateAll?: boolean;
}

