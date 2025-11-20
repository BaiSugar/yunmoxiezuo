import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BanPromptDto {
  @ApiPropertyOptional({
    description: '封禁原因',
    example: '违反社区规范',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

