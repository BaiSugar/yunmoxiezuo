import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 更新书名和简介DTO
 */
export class UpdateTitleSynopsisDto {
  @ApiProperty({
    description: '书名',
    example: '时间旅行者的困境',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({
    description: '简介',
    example: '一个关于时间旅行者的科幻故事...',
  })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  synopsis?: string;
}

