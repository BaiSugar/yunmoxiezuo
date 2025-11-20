import { PartialType } from '@nestjs/swagger';
import { CreateModelCategoryDto } from './create-category.dto';

/**
 * 更新模型分类 DTO
 */
export class UpdateModelCategoryDto extends PartialType(CreateModelCategoryDto) {}

