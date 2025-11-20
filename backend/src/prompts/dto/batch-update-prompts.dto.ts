import { IsArray, IsBoolean, IsOptional, ArrayMinSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BatchUpdatePromptsDto {
  @ApiProperty({
    description: '要批量更新的提示词ID列表',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  promptIds: number[];

  @ApiPropertyOptional({
    description: '是否公开',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: '内容是否公开',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isContentPublic?: boolean;

  @ApiPropertyOptional({
    description: '是否需要申请',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  requireApplication?: boolean;

  @ApiPropertyOptional({
    description: '是否被封禁（仅管理员可用）',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;
}

