import { IsString, IsOptional, IsObject, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChatMetadata } from '../interfaces';

/**
 * 创建聊天DTO
 */
export class CreateChatDto {
  @ApiPropertyOptional({ description: '聊天名称' })
  @IsOptional()
  @IsString()
  chatName?: string;

  @ApiPropertyOptional({ description: '小说ID（AI写作场景）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  novelId?: number;

  @ApiPropertyOptional({ description: '角色卡ID（角色扮演场景）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  characterCardId?: number;

  @ApiPropertyOptional({ description: '提示词分类ID（创意工坊场景）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ description: '角色名称' })
  @IsOptional()
  @IsString()
  characterName?: string;

  @ApiPropertyOptional({ description: '用户人设名称' })
  @IsOptional()
  @IsString()
  userPersonaName?: string;

  @ApiPropertyOptional({ description: '聊天元数据' })
  @IsOptional()
  @IsObject()
  chatMetadata?: ChatMetadata;
}
