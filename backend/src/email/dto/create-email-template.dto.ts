import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailTemplateType } from '../entities/email-template.entity';

export class CreateEmailTemplateDto {
  @ApiProperty({ enum: EmailTemplateType, description: '模板类型' })
  @IsEnum(EmailTemplateType)
  type: EmailTemplateType;

  @ApiProperty({ description: '邮件主题' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'HTML模板内容（支持变量：{{code}}, {{expireText}}）' })
  @IsString()
  htmlTemplate: string;

  @ApiPropertyOptional({ description: '模板名称' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: '模板描述' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '可用变量说明（JSON格式）' })
  @IsString()
  @IsOptional()
  variables?: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

