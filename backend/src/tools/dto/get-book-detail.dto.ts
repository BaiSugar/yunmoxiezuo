import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetBookDetailDto {
  @ApiProperty({ description: '书籍ID' })
  @IsString()
  @IsNotEmpty()
  bookId: string;

  @ApiProperty({ description: '平台名称' })
  @IsString()
  @IsNotEmpty()
  platform: string;
}
