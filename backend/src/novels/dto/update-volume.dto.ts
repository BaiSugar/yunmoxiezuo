import { PartialType } from '@nestjs/swagger';
import { CreateVolumeDto } from './create-volume.dto';

export class UpdateVolumeDto extends PartialType(CreateVolumeDto) {}
