import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '邮箱或用户名',
    example: 'john@example.com',
  })
  @IsString({ message: '邮箱或用户名必须是字符串' })
  @MinLength(3, { message: '邮箱或用户名至少需要3个字符' })
  credential: string;

  @ApiProperty({
    description: '密码',
    example: 'Password123!',
  })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码至少需要8个字符' })
  password: string;
}

