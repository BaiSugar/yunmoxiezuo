import { IsString, IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTokenPackageDto {
  @ApiProperty({ description: '套餐名称', example: '大包50万字' })
  @IsString()
  name: string;

  @ApiProperty({ description: '字数数量（tokens）', example: 500000 })
  @IsInt()
  @Min(0)
  tokenAmount: number;

  @ApiPropertyOptional({ description: '赠送字数', example: 50000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  bonusTokens?: number;

  @ApiProperty({ description: '价格（元）', example: 49.9 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: '有效期（天数）', example: 365 })
  @IsInt()
  @Min(0)
  @IsOptional()
  validDays?: number;

  @ApiPropertyOptional({ description: '最低会员等级要求', example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  minMemberLevel?: number;

  @ApiPropertyOptional({ description: '折扣', example: 0.8 })
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ description: '排序', example: 1 })
  @IsInt()
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: '描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    description: '购买地址',
    example: 'https://example.com/buy/package-1' 
  })
  @IsString()
  @IsOptional()
  purchaseUrl?: string;
}
