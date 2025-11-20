import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingDto {
  @ApiProperty({ description: '配置值', required: true })
  @IsNotEmpty({ message: '配置值不能为空' })
  @IsString({ message: '配置值必须是字符串' })
  value: string;
}

export class BatchUpdateSettingDto {
  @ApiProperty({ description: '配置项ID', required: true })
  @IsNotEmpty({ message: '配置项ID不能为空' })
  id: number;

  @ApiProperty({ description: '配置值', required: true })
  @IsNotEmpty({ message: '配置值不能为空' })
  @IsString({ message: '配置值必须是字符串' })
  value: string;
}

export class BatchUpdateDto {
  @ApiProperty({
    description: '批量更新配置项列表',
    type: [BatchUpdateSettingDto],
    required: true,
  })
  @IsNotEmpty({ message: '更新列表不能为空' })
  settings: BatchUpdateSettingDto[];
}
