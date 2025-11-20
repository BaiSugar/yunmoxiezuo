import { PartialType } from '@nestjs/swagger';
import { CreateEditorSettingDto } from './create-editor-setting.dto';

export class UpdateEditorSettingDto extends PartialType(CreateEditorSettingDto) {}

