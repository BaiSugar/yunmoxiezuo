import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApprovePromptDto {
  @ApiProperty({ description: '是否自动发布（如果为 false，则只是解除审核限制，作者可以自行发布）', required: false, default: false })
  @IsBoolean()
  @IsOptional()
  autoPublish?: boolean;

  @ApiProperty({ description: '审核备注', required: false })
  @IsString()
  @IsOptional()
  reviewNote?: string;
}

