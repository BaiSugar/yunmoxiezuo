import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsObject,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../enums';
import type { MessageExtra } from '../interfaces';

/**
 * 创建消息DTO
 */
export class CreateMessageDto {
  @ApiProperty({ description: '聊天ID' })
  @IsInt()
  @Min(1)
  chatId: number;

  @ApiProperty({ description: '发送者名称' })
  @IsString()
  name: string;

  @ApiProperty({ description: '是否为用户消息' })
  @IsBoolean()
  isUser: boolean;

  @ApiProperty({ description: '消息内容' })
  @IsString()
  mes: string;

  @ApiPropertyOptional({ description: '发送时间（时间戳）' })
  @IsOptional()
  @IsNumber()
  sendDate?: number;

  @ApiPropertyOptional({ enum: MessageType, description: '消息类型' })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiPropertyOptional({ description: '是否为系统消息' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean;

  @ApiPropertyOptional({ description: '是否为名称标签' })
  @IsOptional()
  @IsBoolean()
  isName?: boolean;

  @ApiPropertyOptional({ description: '强制使用的头像URL' })
  @IsOptional()
  @IsString()
  forceAvatar?: string;

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

  @ApiPropertyOptional({ description: '使用的API' })
  @IsOptional()
  @IsString()
  api?: string;

  @ApiPropertyOptional({ description: '使用的模型' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ description: '扩展信息' })
  @IsOptional()
  @IsObject()
  extra?: MessageExtra;
}
