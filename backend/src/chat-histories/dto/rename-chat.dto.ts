import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 重命名聊天DTO
 */
export class RenameChatDto {
  @ApiProperty({ description: '新的聊天名称', example: '魔法学习' })
  @IsString()
  chatName: string;
}
