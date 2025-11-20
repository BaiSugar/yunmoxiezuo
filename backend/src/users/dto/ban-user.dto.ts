import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BanUserDto {
  @ApiPropertyOptional({ description: '封禁原因', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class AssignRolesDto {
  @ApiProperty({ description: '角色ID数组', type: [Number], example: [1, 2] })
  @IsOptional()
  roleIds: number[];
}

