import { PartialType } from '@nestjs/swagger';
import { CreateWorldSettingDto } from './create-world-setting.dto';

export class UpdateWorldSettingDto extends PartialType(CreateWorldSettingDto) {}
