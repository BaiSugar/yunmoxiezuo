import { IsOptional, IsString, IsInt, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CharacterCardStatus } from '../entities/character-card.entity';

/**
 * 查询角色卡 DTO
 */
export class QueryCharacterCardDto {
  @ApiPropertyOptional({ description: '关键词搜索（名称、描述）' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '标签筛选（逗号分隔）' })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ description: '角色类型' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '作者ID' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  authorId?: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: CharacterCardStatus,
  })
  @IsEnum(CharacterCardStatus)
  @IsOptional()
  status?: CharacterCardStatus;

  @ApiPropertyOptional({ description: '是否仅查看公开的', default: false })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  publicOnly?: boolean = false;

  @ApiPropertyOptional({ description: '排序字段', default: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'], default: 'DESC' })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: '页码', default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', default: 20, minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 20;
}
