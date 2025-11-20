import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateMessageDto } from './create-message.dto';

/**
 * 更新消息DTO
 */
export class UpdateMessageDto extends PartialType(
  OmitType(CreateMessageDto, ['chatId'] as const),
) {}
