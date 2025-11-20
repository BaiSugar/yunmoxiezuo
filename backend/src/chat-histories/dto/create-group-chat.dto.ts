import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 群聊成员DTO
 */
export class GroupMemberDto {
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

/**
 * 创建群聊DTO
 */
export class CreateGroupChatDto {
  @ApiProperty({ description: '群聊名称', example: '冒险小队' })
  @IsString()
  groupName: string;

  @ApiPropertyOptional({ description: '群聊描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '群聊头像URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ description: '群聊成员列表', type: [GroupMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupMemberDto)
  members: GroupMemberDto[];

  @ApiPropertyOptional({ description: '群聊元数据' })
  @IsOptional()
  groupMetadata?: Record<string, any>;
}
