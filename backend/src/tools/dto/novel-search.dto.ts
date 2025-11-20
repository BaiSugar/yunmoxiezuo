import { IsString, IsEnum, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SearchType } from '../enums/search-type.enum';

export class NovelSearchDto {
  @ApiProperty({ description: '搜索类型', enum: SearchType })
  @IsEnum(SearchType)
  @IsNotEmpty()
  searchType: SearchType;

  @ApiProperty({ description: '搜索内容' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  query: string;

  @ApiPropertyOptional({ description: '平台名称（可选）' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  platform?: string;
}
