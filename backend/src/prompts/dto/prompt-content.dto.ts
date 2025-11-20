import { IsEnum, IsString, IsOptional, IsBoolean, IsInt, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PromptRole, PromptContentType } from '../entities/prompt-content.entity';

export class PromptParameterDto {
  @ApiProperty({ description: '参数名称', example: '主角名字' })
  @IsString()
  name: string;

  @ApiProperty({ description: '是否必填', example: true })
  @IsBoolean()
  required: boolean;

  @ApiPropertyOptional({ description: '参数描述', example: '请输入主角的名字' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class PromptContentDto {
  @ApiProperty({ description: '内容名称', example: '系统提示' })
  @IsString()
  name: string;

  @ApiProperty({ description: '角色类型', enum: PromptRole, example: PromptRole.SYSTEM })
  @IsEnum(PromptRole)
  role: PromptRole;

  @ApiPropertyOptional({ description: '内容文本（可包含{{参数名}}占位符）', example: '你是一个专业的小说写作助手。主角名字是{{主角名字}}' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ description: '排序顺序', example: 0 })
  @IsInt()
  order: number;

  @ApiProperty({ description: '内容类型', enum: PromptContentType, example: PromptContentType.TEXT })
  @IsEnum(PromptContentType)
  type: PromptContentType;

  @ApiPropertyOptional({ description: '引用ID（人物卡或世界观，可选）', example: null })
  @IsInt()
  @IsOptional()
  referenceId?: number;

  @ApiProperty({ description: '是否启用', example: true })
  @IsBoolean()
  isEnabled: boolean;

  @ApiPropertyOptional({ description: '参数配置', type: [PromptParameterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromptParameterDto)
  @IsOptional()
  parameters?: PromptParameterDto[];
}
