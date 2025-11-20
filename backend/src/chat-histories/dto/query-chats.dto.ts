import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 查询聊天列表DTO
 */
export class QueryChatsDto {
  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: '小说ID（筛选AI写作场景的对话）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  novelId?: number;

  @ApiPropertyOptional({ description: '角色卡ID（筛选角色扮演场景的对话）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  characterCardId?: number;

  @ApiPropertyOptional({ description: '提示词分类ID（筛选创意工坊场景的对话）' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;
}
