import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportReason } from '../entities/prompt-report.entity';

export class CreateReportDto {
  @ApiProperty({
    description: '举报原因类型',
    enum: ReportReason,
    example: ReportReason.INAPPROPRIATE,
  })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({
    description: '详细描述',
    example: '该提示词包含不当内容...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

