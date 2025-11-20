import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemCodeDto {
  @ApiProperty({ description: '卡密码', example: 'ABCD-1234-EFGH-5678' })
  @IsString()
  code: string;
}
