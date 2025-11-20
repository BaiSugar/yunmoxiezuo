import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

/**
 * 申请使用提示词组DTO
 */
export class ApplyPromptGroupDto {
  @ApiPropertyOptional({
    description: '申请理由',
    example: '我正在创作一部玄幻小说，这个提示词组非常适合我',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '申请理由不能超过500字' })
  reason?: string;
}

