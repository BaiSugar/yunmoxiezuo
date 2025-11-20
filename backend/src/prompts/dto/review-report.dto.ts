import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '../entities/prompt-report.entity';

export class ReviewReportDto {
  @ApiProperty({
    description: '审核结果',
    enum: [ReportStatus.APPROVED, ReportStatus.REJECTED],
    example: ReportStatus.APPROVED,
  })
  @IsEnum([ReportStatus.APPROVED, ReportStatus.REJECTED])
  status: ReportStatus.APPROVED | ReportStatus.REJECTED;

  @ApiPropertyOptional({
    description: '审核备注',
    example: '确认违规，已封禁',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reviewNote?: string;
}

