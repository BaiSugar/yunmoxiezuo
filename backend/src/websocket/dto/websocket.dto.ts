import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

/**
 * WebSocket 消息 DTO
 */
export class WsMessageDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsObject()
  data?: any;
}

/**
 * 心跳消息 DTO
 */
export class WsPingDto {
  @IsOptional()
  timestamp?: number;
}

