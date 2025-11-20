import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, Length } from 'class-validator';
import { VerificationType } from '../entities/email-verification.entity';

export class VerifyEmailCodeDto {
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
  code: string;

  @ApiProperty({
    description: '验证类型',
    enum: VerificationType,
    example: VerificationType.VERIFY_EMAIL,
  })
  @IsEnum(VerificationType, { message: '无效的验证类型' })
  type: VerificationType;
}

