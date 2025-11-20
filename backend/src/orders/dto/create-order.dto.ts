import { IsEnum, IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderType } from '../enums/order-type.enum';

export class CreateOrderDto {
  @ApiProperty({ description: '订单类型', enum: OrderType })
  @IsEnum(OrderType)
  type: OrderType;

  @ApiProperty({ description: '产品ID', example: 1 })
  @IsInt()
  productId: number;

  @ApiPropertyOptional({ description: '支付方式', example: 'alipay' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsString()
  @IsOptional()
  remark?: string;
}
