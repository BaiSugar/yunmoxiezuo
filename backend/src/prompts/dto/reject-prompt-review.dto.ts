import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectPromptReviewDto {
  @ApiProperty({ description: '拒绝原因', required: false })
  @IsString()
  @IsOptional()
  rejectReason?: string;
}

