import { PartialType } from '@nestjs/swagger';
import { CreateCharacterCardDto } from './create-character-card.dto';

/**
 * 更新角色卡 DTO
 */
export class UpdateCharacterCardDto extends PartialType(CreateCharacterCardDto) {}
