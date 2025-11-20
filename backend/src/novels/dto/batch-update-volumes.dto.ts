import { IsArray, ValidateNested, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class VolumeUpdateItem {
  @ApiProperty({ description: '分卷ID' })
  @IsInt()
  id: number;

  @ApiPropertyOptional({ description: '排序顺序' })
  @IsOptional()
  @IsInt()
  order?: number;

  @ApiPropertyOptional({ description: '全局排序顺序' })
  @IsOptional()
  @IsInt()
  globalOrder?: number;
}

export class BatchUpdateVolumesDto {
  @ApiProperty({ description: '分卷更新列表', type: [VolumeUpdateItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VolumeUpdateItem)
  volumes: VolumeUpdateItem[];
}
