import { PartialType } from '@nestjs/swagger';
import { CreateChatDto } from './create-chat.dto';

/**
 * 更新聊天DTO
 */
export class UpdateChatDto extends PartialType(CreateChatDto) {}
