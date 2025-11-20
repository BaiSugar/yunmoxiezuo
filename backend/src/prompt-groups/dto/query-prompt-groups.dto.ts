import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PromptGroupStatus } from '../entities/prompt-group.entity';

/**
 * 查询提示词组DTO
 */
export class QueryPromptGroupsDto {
  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: '分类ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: '关键词搜索', example: '玄幻' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '是否公开', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '创建者ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: '状态',
    enum: PromptGroupStatus,
    example: PromptGroupStatus.PUBLISHED,
  })
  @IsOptional()
  @IsEnum(PromptGroupStatus)
  status?: PromptGroupStatus;

  @ApiPropertyOptional({
    description: '排序字段',
    enum: ['hotValue', 'createdAt', 'viewCount', 'useCount', 'likeCount'],
    example: 'hotValue',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'hotValue' | 'createdAt' | 'viewCount' | 'useCount' | 'likeCount' = 'hotValue';

  @ApiPropertyOptional({ description: '排序方向', enum: ['ASC', 'DESC'], example: 'DESC' })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

