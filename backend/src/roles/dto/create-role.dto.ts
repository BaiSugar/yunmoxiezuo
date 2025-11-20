import {
  IsString,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名称', example: '编辑' })
  @IsString()
  @MaxLength(50)
  name: string;

  @ApiProperty({ description: '角色代码', example: 'editor' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: '角色描述', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({
    description: '角色等级(数字越大权限越高)',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  level?: number;
}

