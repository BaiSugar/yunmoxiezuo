import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: '用户名',
    example: 'johndoe',
    minLength: 3,
    maxLength: 20,
  })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名至少需要3个字符' })
  @MaxLength(20, { message: '用户名不能超过20个字符' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '用户名只能包含字母、数字和下划线',
  })
  username: string;

  @ApiProperty({
    description: '邮箱地址',
    example: 'john@example.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({
    description: '密码',
    example: 'Password123!',
    minLength: 8,
    maxLength: 32,
  })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码至少需要8个字符' })
  @MaxLength(32, { message: '密码不能超过32个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '密码必须包含大小写字母和数字',
  })
  password: string;

  @ApiProperty({
    description: '确认密码（必须与密码一致）',
    example: 'Password123!',
    minLength: 8,
    maxLength: 32,
  })
  @IsString({ message: '确认密码必须是字符串' })
  @MinLength(8, { message: '确认密码至少需要8个字符' })
  @MaxLength(32, { message: '确认密码不能超过32个字符' })
  confirmPassword: string;

  @ApiPropertyOptional({
    description: '昵称（可选）',
    example: '小明',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: '昵称必须是字符串' })
  @MaxLength(50, { message: '昵称不能超过50个字符' })
  nickname?: string;

  @ApiPropertyOptional({
    description: '邀请码（可选）',
    example: 'INVITE2024',
  })
  @IsOptional()
  @IsString({ message: '邀请码必须是字符串' })
  inviteCode?: string;

  @ApiProperty({
    description: '邮箱验证码',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString({ message: '验证码必须是字符串' })
  @MinLength(6, { message: '验证码必须是6位数字' })
  @MaxLength(6, { message: '验证码必须是6位数字' })
  @Matches(/^\d{6}$/, { message: '验证码必须是6位数字' })
  verificationCode: string;
}

