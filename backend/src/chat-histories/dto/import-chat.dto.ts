import { IsString, IsEnum, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ImportSource } from '../enums';

/**
 * 导入聊天DTO
 */
export class ImportChatDto {
  @ApiProperty({ description: '聊天数据（JSONL或JSON字符串）' })
  @IsString()
  data: string;

  @ApiProperty({ enum: ImportSource, description: '导入来源平台' })
  @IsEnum(ImportSource)
  source: ImportSource;

  @ApiPropertyOptional({ description: '关联的角色卡ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  characterCardId?: number;
}
