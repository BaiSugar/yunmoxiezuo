import { PartialType } from '@nestjs/swagger';
import { CreateModelDto } from './create-model.dto';

/**
 * 更新 AI 模型 DTO
 */
export class UpdateModelDto extends PartialType(CreateModelDto) {}
