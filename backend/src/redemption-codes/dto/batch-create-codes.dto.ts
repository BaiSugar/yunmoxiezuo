import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateRedemptionCodeDto } from './create-redemption-code.dto';

export class BatchCreateCodesDto extends CreateRedemptionCodeDto {
  @ApiProperty({ description: '生成数量', example: 100 })
  @IsInt()
  @Min(1)
  @Max(10000)
  count: number;
}
