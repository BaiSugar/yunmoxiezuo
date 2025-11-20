import { IsEnum, IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '../entities/prompt-application.entity';

export class ReviewApplicationDto {
  @ApiProperty({ description: '审核状态', enum: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED], example: ApplicationStatus.APPROVED })
  @IsEnum([ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
  status: ApplicationStatus.APPROVED | ApplicationStatus.REJECTED;

  @ApiPropertyOptional({ description: '审核备注', example: '已通过审核，欢迎使用', maxLength: 500 })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reviewNote?: string;
}
