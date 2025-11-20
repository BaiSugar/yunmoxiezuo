import { IsInt, IsOptional, Min, Max, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 任务配置DTO
 * 用于自定义成书任务的各项参数
 */
export class TaskConfigDto {
  @ApiPropertyOptional({
    description: '是否启用审稿优化（阶段5）',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  enableReview?: boolean = true;

  @ApiPropertyOptional({
    description: '章节生成并发数',
    default: 5,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1, { message: '并发数至少1' })
  @Max(10, { message: '并发数不能超过10' })
  @IsOptional()
  concurrencyLimit?: number = 5;

  @ApiPropertyOptional({
    description: 'AI温度参数（控制随机性和创造性）',
    default: 0.7,
    minimum: 0,
    maximum: 2,
  })
  @IsNumber()
  @Min(0)
  @Max(2)
  @IsOptional()
  temperature?: number = 0.7;

  @ApiPropertyOptional({
    description: '历史消息数量限制（保留的最近对话轮数）',
    default: 10,
    minimum: 0,
    maximum: 20,
  })
  @IsInt()
  @Min(0)
  @Max(20)
  @IsOptional()
  historyMessageLimit?: number = 10;
}

