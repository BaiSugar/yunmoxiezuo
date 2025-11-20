import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';
import { PromptGroupApplicationStatus } from '../entities/prompt-group-application.entity';

/**
 * 审核提示词组申请DTO
 */
export class ReviewPromptGroupApplicationDto {
  @ApiProperty({
    description: '审核状态',
    enum: [PromptGroupApplicationStatus.APPROVED, PromptGroupApplicationStatus.REJECTED],
    example: PromptGroupApplicationStatus.APPROVED,
  })
  @IsEnum([PromptGroupApplicationStatus.APPROVED, PromptGroupApplicationStatus.REJECTED])
  @IsNotEmpty({ message: '审核状态不能为空' })
  status: PromptGroupApplicationStatus;

  @ApiPropertyOptional({ description: '审核备注', example: '已通过审核，欢迎使用' })
  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '审核备注不能超过500字' })
  reviewNote?: string;
}

