import { PartialType } from '@nestjs/swagger';
import { CreateTokenPackageDto } from './create-token-package.dto';

export class UpdateTokenPackageDto extends PartialType(CreateTokenPackageDto) {}
