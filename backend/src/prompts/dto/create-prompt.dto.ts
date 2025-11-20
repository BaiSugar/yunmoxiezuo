import { IsString, IsBoolean, IsInt, IsOptional, IsEnum, IsArray, ValidateNested, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromptStatus } from '../entities/prompt.entity';
import { PromptContentDto } from './prompt-content.dto';

export class CreatePromptDto {
  @ApiProperty({ description: '提示词名称', example: '小说情节生成助手', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '提示词描述', example: '帮助生成小说情节大纲' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '是否公开', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiProperty({ description: '内容是否公开', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isContentPublic?: boolean;

  @ApiProperty({ description: '是否需要申请才能使用', example: false, default: false })
  @IsBoolean()
  @IsOptional()
  requireApplication?: boolean;

  @ApiProperty({ description: '分类ID', example: 1 })
  @IsInt()
  categoryId: number;

  @ApiProperty({ description: '状态', enum: PromptStatus, example: PromptStatus.DRAFT, default: PromptStatus.DRAFT })
  @IsEnum(PromptStatus)
  @IsOptional()
  status?: PromptStatus;

  @ApiProperty({ description: '提示词内容列表', type: [PromptContentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromptContentDto)
  contents: PromptContentDto[];
}
