import { IsString, IsEnum, IsBoolean, IsOptional, IsInt, IsUrl, Min, Max, IsArray, IsDateString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import {
  AnnouncementType,
  AnnouncementLevel,
  LinkTarget,
  LinkPosition,
  TargetType,
} from '../enums';

export class CreateAnnouncementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string;

  @IsEnum(AnnouncementType)
  type: AnnouncementType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  priority?: number;

  @IsEnum(AnnouncementLevel)
  level: AnnouncementLevel;

  // 链接跳转
  @IsOptional()
  @IsBoolean()
  hasLink?: boolean;

  @ValidateIf((o) => o.hasLink && o.linkUrl && o.linkUrl.trim() !== '')
  @IsUrl(
    {
      protocols: ['http', 'https'],
      require_protocol: true,
    },
    {
      message: '链接地址格式不正确，必须是 http:// 或 https:// 开头的完整网址',
    },
  )
  @MaxLength(500)
  @IsOptional()
  linkUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  linkText?: string;

  @IsOptional()
  @IsEnum(LinkTarget)
  linkTarget?: LinkTarget;

  @IsOptional()
  @IsEnum(LinkPosition)
  linkPosition?: LinkPosition;

  // 显示控制
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isTop?: boolean;

  @IsOptional()
  @IsBoolean()
  isPush?: boolean;

  @IsOptional()
  @IsBoolean()
  isPopup?: boolean;

  @IsOptional()
  @IsBoolean()
  needRead?: boolean;

  // 时间控制
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  // 目标受众
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  targetIds?: number[];

  // 附件与样式
  @IsOptional()
  attachments?: any;

  @IsOptional()
  styleConfig?: any;
}
