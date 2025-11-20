import { IsOptional, IsString, MaxLength, IsEmail, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称', maxLength: 100, example: '小明' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @ApiPropertyOptional({ description: '邮箱', example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email?: string;

  @ApiPropertyOptional({ description: '邮箱验证码（修改邮箱时必填）', example: '123456' })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: '验证码为6位数字' })
  emailVerificationCode?: string;

  @ApiPropertyOptional({ description: '头像URL', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar?: string;

  @ApiPropertyOptional({ description: '个人简介', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

