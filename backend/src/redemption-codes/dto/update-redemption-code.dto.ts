import { PartialType } from '@nestjs/swagger';
import { CreateRedemptionCodeDto } from './create-redemption-code.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRedemptionCodeDto extends PartialType(CreateRedemptionCodeDto) {
  @ApiPropertyOptional({ description: '是否启用' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
