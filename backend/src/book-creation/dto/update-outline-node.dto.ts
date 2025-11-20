import { IsString, IsOptional, MaxLength, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OutlineNodeStatus } from '../enums';

/**
 * 更新大纲节点DTO
 */
export class UpdateOutlineNodeDto {
  @ApiPropertyOptional({
    description: '节点标题',
    example: '第一章 日常任务',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200, { message: '标题不能超过200字' })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: '节点内容',
    example: '林渊接到一个看似普通的修复任务...',
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({
    description: '节点状态',
    enum: OutlineNodeStatus,
  })
  @IsEnum(OutlineNodeStatus, { message: '状态值无效' })
  @IsOptional()
  status?: OutlineNodeStatus;
}

