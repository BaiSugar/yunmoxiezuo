import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 优化阶段DTO
 */
export class OptimizeStageDto {
  @ApiProperty({
    description: '用户的反馈意见',
    example: '脑洞太简单了，希望增加更多悬念和复杂的世界观设定',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty({ message: '用户反馈不能为空' })
  @MaxLength(1000, { message: '反馈内容不能超过1000字' })
  userFeedback: string;

  @ApiPropertyOptional({
    description: '指定要优化的数据（JSON格式）',
    example: null,
  })
  @IsOptional()
  targetData?: Record<string, any>;
}

