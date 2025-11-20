import { IsString, IsInt, IsNumber, IsBoolean, IsOptional, Min, Max, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 创建会员套餐 DTO
 */
export class CreateMembershipPlanDto {
  @ApiProperty({ description: '套餐名称', example: '专业版' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ 
    description: '套餐类型标识', 
    example: 'monthly',
    default: 'basic' 
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: '会员等级', example: 2 })
  @IsInt()
  @Min(1)
  level: number;

  @ApiProperty({ description: '价格（元）', example: 99.00 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: '有效期（天数），0表示永久', example: 30 })
  @IsInt()
  @Min(0)
  duration: number;

  @ApiProperty({ description: '赠送字数（tokens）', example: 1000000 })
  @IsInt()
  @Min(0)
  tokenQuota: number;

  @ApiPropertyOptional({ description: '每日字数上限，0表示无限制', example: 50000 })
  @IsInt()
  @Min(0)
  @IsOptional()
  dailyTokenLimit?: number;

  @ApiPropertyOptional({ description: '最大并发对话数', example: 5 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxConcurrentChats?: number;

  @ApiPropertyOptional({ description: '是否可使用高级模型', example: true })
  @IsBoolean()
  @IsOptional()
  canUseAdvancedModels?: boolean;

  @ApiPropertyOptional({ description: '队列优先级（1-10）', example: 7 })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ description: '其他权益', example: { apiAccess: true, customService: true } })
  @IsObject()
  @IsOptional()
  features?: Record<string, any>;

  @ApiPropertyOptional({ description: '排序', example: 1 })
  @IsInt()
  @Min(0)
  @IsOptional()
  sort?: number;

  @ApiPropertyOptional({ description: '套餐描述', example: '适合专业用户使用' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    description: '购买地址',
    example: 'https://example.com/buy/plan-1' 
  })
  @IsString()
  @IsOptional()
  purchaseUrl?: string;

  @ApiPropertyOptional({ 
    description: '每次请求免费输入字符数（会员特权）',
    default: 0,
    example: 5000 
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  freeInputCharsPerRequest?: number;

  @ApiPropertyOptional({ 
    description: '输出是否完全免费（会员特权）',
    default: false 
  })
  @IsBoolean()
  @IsOptional()
  outputFree?: boolean;
}
