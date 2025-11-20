import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { VerificationType } from '../entities/email-verification.entity';

export class SendVerificationCodeDto {
  @ApiProperty({
    description: '邮箱地址',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiProperty({
    description: '验证类型',
    enum: VerificationType,
    example: VerificationType.REGISTER,
  })
  @IsEnum(VerificationType, { message: '无效的验证类型' })
  type: VerificationType;
}

