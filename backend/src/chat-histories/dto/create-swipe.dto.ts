import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MessageExtra } from '../interfaces';

/**
 * 创建Swipe DTO
 */
export class CreateSwipeDto {
  @ApiProperty({ description: 'Swipe内容' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '发送时间（时间戳）' })
  @IsOptional()
  @IsNumber()
  sendDate?: number;

  @ApiPropertyOptional({ description: '生成开始时间' })
  @IsOptional()
  @IsNumber()
  genStarted?: number;

  @ApiPropertyOptional({ description: '生成结束时间' })
  @IsOptional()
  @IsNumber()
  genFinished?: number;

  @ApiPropertyOptional({ description: '生成ID' })
  @IsOptional()
  @IsString()
  genId?: string;

  @ApiPropertyOptional({ description: '扩展信息' })
  @IsOptional()
  @IsObject()
  extra?: MessageExtra;
}
