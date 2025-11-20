import { IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 查询会员套餐 DTO
 */
export class QueryMembershipPlanDto {
  @ApiPropertyOptional({ description: '是否上架', example: true })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;

  @ApiPropertyOptional({ description: '最低等级', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  minLevel?: number;

  @ApiPropertyOptional({ description: '最高等级', example: 5 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  maxLevel?: number;

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
