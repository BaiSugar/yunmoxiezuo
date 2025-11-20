import { IsEnum, IsInt, IsString, IsOptional, IsDate, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CodeType } from '../enums/code-type.enum';

export class CreateRedemptionCodeDto {
  @ApiProperty({ description: '卡密类型', enum: CodeType })
  @IsEnum(CodeType)
  type: CodeType;

  @ApiPropertyOptional({ description: '会员套餐ID' })
  @IsInt()
  @IsOptional()
  membershipPlanId?: number;

  @ApiPropertyOptional({ description: '赠送字数' })
  @IsInt()
  @Min(0)
  @IsOptional()
  tokenAmount?: number;

  @ApiPropertyOptional({ description: '批次号' })
  @IsString()
  @IsOptional()
  batchId?: string;

  @ApiPropertyOptional({ description: '最大使用次数' })
  @IsInt()
  @IsOptional()
  maxUseCount?: number;

  @ApiPropertyOptional({ description: '生效时间' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  validFrom?: Date;

  @ApiPropertyOptional({ description: '过期时间' })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  validTo?: Date;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
