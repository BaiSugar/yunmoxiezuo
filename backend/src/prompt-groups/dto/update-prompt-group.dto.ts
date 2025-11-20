import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreatePromptGroupDto } from './create-prompt-group.dto';

/**
 * 更新提示词组DTO
 */
export class UpdatePromptGroupDto extends PartialType(CreatePromptGroupDto) {}

