import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsEnum, IsOptional, Min } from 'class-validator';
import { ConsumptionSource } from '../entities/token-consumption-record.entity';

/**
 * 消耗参数DTO
 */
export class ConsumptionParamsDto {
  @ApiProperty({ description: '用户ID' })
  @IsInt()
  @Min(1)
  userId: number;

  @ApiProperty({ description: '模型ID' })
  @IsInt()
  @Min(1)
  modelId: number;

  @ApiProperty({ description: '输入字符数' })
  @IsInt()
  @Min(0)
  inputChars: number;

  @ApiProperty({ description: '输出字符数' })
  @IsInt()
  @Min(0)
  outputChars: number;

  @ApiProperty({ 
    description: '来源',
    enum: ConsumptionSource,
  })
  @IsEnum(ConsumptionSource)
  source: ConsumptionSource;

  @ApiPropertyOptional({ description: '关联ID' })
  @IsInt()
  @IsOptional()
  relatedId?: number;
}

/**
 * 消耗结果DTO
 */
export class ConsumptionResultDto {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '总消耗' })
  totalCost: number;

  @ApiProperty({ description: '输入消耗' })
  inputCost: number;

  @ApiProperty({ description: '输出消耗' })
  outputCost: number;

  @ApiProperty({ description: '使用的每日免费额度' })
  usedDailyFree: number;

  @ApiProperty({ description: '使用的付费额度' })
  usedPaid: number;

  @ApiProperty({ description: '是否应用了会员特权' })
  memberBenefitApplied: boolean;

  @ApiProperty({ description: '剩余余额' })
  remainingBalance: number;

  @ApiProperty({ description: '剩余每日免费额度' })
  remainingDailyFree: number;

  @ApiPropertyOptional({ description: '失败原因' })
  reason?: string;
}

/**
 * 查询消耗记录DTO
 */
export class QueryConsumptionDto {
  @ApiPropertyOptional({ description: '来源' })
  @IsEnum(ConsumptionSource)
  @IsOptional()
  source?: ConsumptionSource;

  @ApiPropertyOptional({ description: '开始日期', example: '2025-01-01' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2025-01-31' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsInt()
  @IsOptional()
  @Min(1)
  limit?: number;
}

/**
 * 消耗统计DTO
 */
export class ConsumptionStatsDto {
  @ApiProperty({ description: '总消耗字数' })
  totalConsumed: number;

  @ApiProperty({ description: '总输入字符数' })
  totalInputChars: number;

  @ApiProperty({ description: '总输出字符数' })
  totalOutputChars: number;

  @ApiProperty({ description: '使用的每日免费额度' })
  totalDailyFreeUsed: number;

  @ApiProperty({ description: '使用的付费额度' })
  totalPaidUsed: number;

  @ApiProperty({ description: '请求次数' })
  requestCount: number;

  @ApiPropertyOptional({ description: '按来源统计' })
  bySource?: Record<ConsumptionSource, number>;
}
