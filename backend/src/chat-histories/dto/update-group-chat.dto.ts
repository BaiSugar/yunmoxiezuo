import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateGroupChatDto } from './create-group-chat.dto';

/**
 * 更新群聊DTO
 */
export class UpdateGroupChatDto extends PartialType(
  OmitType(CreateGroupChatDto, ['members'] as const),
) {}
