import { IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AnnouncementType, AnnouncementLevel } from '../enums';

export class QueryAnnouncementDto {
  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @IsOptional()
  @IsEnum(AnnouncementLevel)
  level?: AnnouncementLevel;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isTop?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPush?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPopup?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}
