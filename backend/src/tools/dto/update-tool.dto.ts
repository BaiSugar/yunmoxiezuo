import { IsString, IsBoolean, IsArray, IsObject, IsInt, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateToolDto {
  @ApiPropertyOptional({ description: '工具标题' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @ApiPropertyOptional({ description: '工具描述' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: '图标名称' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @ApiPropertyOptional({ description: '前端路由路径' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  route?: string;

  @ApiPropertyOptional({ description: '工具分类' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({ description: '是否需要会员' })
  @IsOptional()
  @IsBoolean()
  requiresMembership?: boolean;

  @ApiPropertyOptional({ description: '允许的会员等级', type: [String] })
  @IsOptional()
  @IsArray()
  allowedMembershipLevels?: string[];

  @ApiPropertyOptional({ description: '排序序号' })
  @IsOptional()
  @IsInt()
  orderNum?: number;

  @ApiPropertyOptional({ description: '工具配置' })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}
