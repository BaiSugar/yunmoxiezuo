import { IsNumber, IsNotEmpty, IsInt, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateUserModelPreferenceDto {
  @ApiProperty({ description: '模型ID' })
  @IsNumber()
  @IsNotEmpty()
  modelId: number;

  @ApiProperty({ description: '温度值', minimum: 0, maximum: 2 })
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature: number;

  @ApiPropertyOptional({
    description: '历史消息数量限制（保留最近N条消息，0或不设置表示不限制）',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  historyMessageLimit?: number;
}

export class UpdateUserModelPreferenceDto {
  @ApiProperty({ description: '温度值', minimum: 0, maximum: 2 })
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature: number;

  @ApiPropertyOptional({
    description: '历史消息数量限制（保留最近N条消息，0或不设置表示不限制）',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  historyMessageLimit?: number;
}
