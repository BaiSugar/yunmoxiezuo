import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PermissionType {
  MENU = 'menu',
  API = 'api',
  BUTTON = 'button',
}

export class CreatePermissionDto {
  @ApiPropertyOptional({ description: '父权限ID' })
  @IsOptional()
  @IsInt()
  parentId?: number;

  @ApiProperty({ description: '权限名称', example: '用户管理' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '权限代码', example: 'user:list' })
  @IsString()
  @MaxLength(100)
  code: string;

  @ApiProperty({
    description: '权限类型',
    enum: PermissionType,
    example: PermissionType.API,
  })
  @IsEnum(PermissionType)
  type: PermissionType;

  @ApiPropertyOptional({ description: '资源路径', example: '/api/v1/users' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  resource?: string;

  @ApiPropertyOptional({
    description: 'HTTP 方法',
    example: 'GET',
  })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  method?: string;

  @ApiPropertyOptional({ description: '权限描述', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}

