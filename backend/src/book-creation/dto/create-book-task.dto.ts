import { IsBoolean, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TaskConfigDto } from './task-config.dto';

/**
 * 创建成书任务DTO
 */
export class CreateBookTaskDto {
  @ApiPropertyOptional({
    description: '提示词组ID（可选，一旦设置不可更改。如不设置，需在任务执行过程中配置单个提示词）',
  })
  @IsOptional()
  promptGroupId?: number;

  @ApiPropertyOptional({
    description: '是否立即执行第一阶段',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  autoExecute?: boolean;

  @ApiPropertyOptional({
    description: '任务配置',
    type: TaskConfigDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => TaskConfigDto)
  taskConfig?: TaskConfigDto;

  @ApiPropertyOptional({
    description: '提示词组参数（用户填写的参数值，如故事类型、主角设定等）',
    example: { '故事类型': '修仙', '主角设定': '穿越者' },
  })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'AI模型ID（用于任务执行时使用的AI模型）',
  })
  @IsOptional()
  modelId?: number;
}
