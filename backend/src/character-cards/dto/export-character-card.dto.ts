import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CharacterCardSpec } from '../enums';

/**
 * 导出角色卡 DTO
 */
export class ExportCharacterCardDto {
  @ApiPropertyOptional({
    description: '导出格式',
    enum: ['json', 'png'],
    default: 'json',
  })
  @IsEnum(['json', 'png'])
  @IsOptional()
  format?: 'json' | 'png' = 'json';

  @ApiPropertyOptional({
    description: '目标规范版本',
    enum: CharacterCardSpec,
  })
  @IsEnum(CharacterCardSpec)
  @IsOptional()
  targetSpec?: CharacterCardSpec;

  @ApiPropertyOptional({
    description: '是否包含世界书',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  includeWorldBook?: boolean = true;
}
