import { PartialType } from '@nestjs/swagger';
import { CreateProviderDto } from './create-provider.dto';

/**
 * 更新 AI 提供商 DTO
 */
export class UpdateProviderDto extends PartialType(CreateProviderDto) {}
