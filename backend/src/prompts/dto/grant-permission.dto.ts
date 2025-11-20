import { IsInt, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PermissionType } from '../entities/prompt-permission.entity';

export class GrantPermissionDto {
  @ApiProperty({ description: '用户ID', example: 1 })
  @IsInt()
  userId: number;

  @ApiProperty({ description: '权限类型', enum: PermissionType, example: PermissionType.USE })
  @IsEnum(PermissionType)
  permission: PermissionType;
}
