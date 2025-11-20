import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StageType } from '../enums';

/**
 * 执行阶段DTO
 */
export class ExecuteStageDto {
  @ApiPropertyOptional({
    description: '指定执行的阶段类型，不传则执行下一阶段',
    enum: StageType,
    example: StageType.STAGE_1_IDEA,
  })
  @IsEnum(StageType, { message: '阶段类型无效' })
  @IsOptional()
  stageType?: StageType;
}

