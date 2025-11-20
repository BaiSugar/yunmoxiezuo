import { IsInt, IsOptional, IsString, IsBoolean, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PromptStatus } from '../entities/prompt.entity';

export class QueryPromptDto {
  @ApiPropertyOptional({ description: '页码', example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量', example: 20, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: '分类ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ description: '是否公开', example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: '作者ID', example: 1 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  authorId?: number;

  @ApiPropertyOptional({ description: '关键词搜索', example: '小说' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '状态', enum: PromptStatus })
  @IsEnum(PromptStatus)
  @IsOptional()
  status?: PromptStatus;

  @ApiPropertyOptional({ description: '排序方式', example: 'hotValue', enum: ['hotValue', 'createdAt', 'viewCount', 'useCount', 'likeCount'] })
  @IsString()
  @IsOptional()
  sortBy?: string = 'hotValue';

  @ApiPropertyOptional({ description: '排序方向', example: 'DESC', enum: ['ASC', 'DESC'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
