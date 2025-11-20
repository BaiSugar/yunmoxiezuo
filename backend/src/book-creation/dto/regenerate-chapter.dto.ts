import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 重新生成章节DTO
 */
export class RegenerateChapterDto {
  @ApiPropertyOptional({
    description: '用户反馈（用于指导重新生成）',
    example: '希望增加更多动作场景描写',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500, { message: '反馈内容不能超过500字' })
  @IsOptional()
  userFeedback?: string;
}

