import { IsUrl, IsOptional, IsString, MaxLength } from 'class-validator';

export class ClickLinkDto {
  @IsUrl()
  @MaxLength(500)
  linkUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  referrer?: string;
}
