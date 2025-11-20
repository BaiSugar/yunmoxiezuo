import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModelCategory } from '../entities/model-category.entity';
import { CreateModelCategoryDto } from '../dto/create-category.dto';
import { UpdateModelCategoryDto } from '../dto/update-category.dto';

/**
 * 模型分类服务
 */
@Injectable()
export class ModelCategoriesService {
  constructor(
    @InjectRepository(ModelCategory)
    private readonly categoryRepository: Repository<ModelCategory>,
  ) {}

  /**
   * 创建分类
   */
  async create(createCategoryDto: CreateModelCategoryDto): Promise<ModelCategory> {
    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  /**
   * 更新分类
   */
  async update(id: number, updateCategoryDto: UpdateModelCategoryDto): Promise<ModelCategory> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  /**
   * 删除分类
   */
  async delete(id: number): Promise<void> {
    // 检查是否有模型使用此分类
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['models'],
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    if (category.models && category.models.length > 0) {
      throw new BadRequestException('该分类下还有模型，无法删除');
    }

    await this.categoryRepository.delete(id);
  }

  /**
   * 查询所有分类
   */
  async findAll(): Promise<ModelCategory[]> {
    return await this.categoryRepository.find({
      relations: ['models'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  /**
   * 根据ID查询分类
   */
  async findOne(id: number): Promise<ModelCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['models'],
    });
    if (!category) {
      throw new NotFoundException('分类不存在');
    }
    return category;
  }
}

