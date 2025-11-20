import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  Length,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({
    description: '验证码',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: '验证码为6位数字' })
  verificationCode: string;

  @ApiProperty({
    description: '新密码',
    example: 'NewPassword123',
  })
  @IsString()
  @MinLength(8, { message: '密码至少8个字符' })
  @MaxLength(32, { message: '密码最多32个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: '密码必须包含大小写字母和数字',
  })
  newPassword: string;
}

