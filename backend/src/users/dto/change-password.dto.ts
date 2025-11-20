import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: '当前密码' })
  @IsString()
  oldPassword: string;

  @ApiProperty({
    description: '新密码',
    minLength: 6,
    maxLength: 50,
    example: 'NewPassword123',
  })
  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  @MaxLength(50, { message: '密码最多50个字符' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/, {
    message: '密码必须包含字母和数字',
  })
  newPassword: string;
}

