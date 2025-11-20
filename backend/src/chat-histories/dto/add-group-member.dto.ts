import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 添加群聊成员DTO
 */
export class AddGroupMemberDto {
  @ApiProperty({ description: '角色卡ID' })
  @IsNumber()
  characterCardId: number;

  @ApiProperty({ description: '角色名称' })
  @IsString()
  characterName: string;

  @ApiPropertyOptional({ description: '角色头像URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: '显示顺序', default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
