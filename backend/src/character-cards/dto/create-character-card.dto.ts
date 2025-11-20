import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsArray,
  MaxLength,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CharacterCardSpec, CharacterCardSpecVersion } from '../enums';

/**
 * 创建角色卡 DTO
 */
export class CreateCharacterCardDto {
  @ApiProperty({ description: '角色名称', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '角色描述（简短介绍）' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '角色卡规范版本',
    enum: CharacterCardSpec,
    default: CharacterCardSpec.V2,
  })
  @IsEnum(CharacterCardSpec)
  @IsOptional()
  spec?: CharacterCardSpec = CharacterCardSpec.V2;

  @ApiProperty({
    description: '规范版本号',
    enum: CharacterCardSpecVersion,
    default: CharacterCardSpecVersion.V2,
  })
  @IsEnum(CharacterCardSpecVersion)
  @IsOptional()
  specVersion?: CharacterCardSpecVersion = CharacterCardSpecVersion.V2;

  @ApiProperty({ description: '角色卡完整数据（JSON 格式）' })
  @IsObject()
  @IsNotEmpty()
  data: object;

  @ApiPropertyOptional({ description: '角色立绘 URL' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'PNG 格式的完整角色卡数据（Base64）' })
  @IsString()
  @IsOptional()
  pngData?: string;

  @ApiPropertyOptional({ description: '是否公开', default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean = true;

  @ApiPropertyOptional({ description: '标签列表', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: '角色类型', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  category?: string;
}
