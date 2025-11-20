import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ApplyPromptDto {
  @ApiPropertyOptional({ description: '申请理由', example: '我正在创作一部悬疑小说，需要使用这个提示词', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
}
