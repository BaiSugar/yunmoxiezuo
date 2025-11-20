import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * 导入角色卡 DTO
 * 支持从 PNG 文件或 JSON 导入
 */
export class ImportCharacterCardDto {
  @ApiPropertyOptional({
    description: 'PNG 格式的角色卡数据（Base64 编码，包含 tEXt 元数据）',
  })
  @IsString()
  @IsOptional()
  pngData?: string;

  @ApiPropertyOptional({ description: 'JSON 格式的角色卡数据（字符串）' })
  @IsString()
  @IsOptional()
  jsonData?: string;

  @ApiPropertyOptional({ description: '是否公开', default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = true;

  @ApiPropertyOptional({ description: '自定义标签（逗号分隔）' })
  @IsString()
  @IsOptional()
  tags?: string;

  @ApiPropertyOptional({ description: '自定义分类' })
  @IsString()
  @IsOptional()
  category?: string;
}
