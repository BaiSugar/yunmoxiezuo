import { IsBoolean, IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 创建通知DTO
 */
export class CreateNotificationDto {
  @ApiProperty({ description: '接收用户ID' })
  @IsInt()
  userId: number;

  @ApiProperty({ description: '通知标题' })
  @IsString()
  title: string;

  @ApiProperty({ description: '通知内容' })
  @IsString()
  content: string;

  @ApiProperty({ description: '通知分类' })
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: '通知级别', enum: ['info', 'success', 'warning', 'error'] })
  @IsEnum(['info', 'success', 'warning', 'error'])
  @IsOptional()
  level?: 'info' | 'success' | 'warning' | 'error';

  @ApiPropertyOptional({ description: '操作按钮' })
  @IsObject()
  @IsOptional()
  action?: {
    text: string;
    url: string;
  };

  @ApiPropertyOptional({ description: '额外数据' })
  @IsObject()
  @IsOptional()
  extra?: Record<string, any>;
}

/**
 * 查询通知DTO
 */
export class QueryNotificationDto {
  @ApiPropertyOptional({ description: '是否已读' })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional({ description: '通知分类' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsInt()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsInt()
  @IsOptional()
  limit?: number = 20;
}

