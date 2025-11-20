import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailTemplate, EmailTemplateType } from '../entities/email-template.entity';
import { CreateEmailTemplateDto } from '../dto/create-email-template.dto';
import { UpdateEmailTemplateDto } from '../dto/update-email-template.dto';

@Injectable()
export class EmailTemplateService {
  private readonly logger = new Logger(EmailTemplateService.name);

  constructor(
    @InjectRepository(EmailTemplate)
    private readonly templateRepository: Repository<EmailTemplate>,
  ) {}

  /**
   * 获取所有模板
   */
  async findAll(): Promise<EmailTemplate[]> {
    return this.templateRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据ID获取模板
   */
  async findOne(id: number): Promise<EmailTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`邮件模板ID ${id} 不存在`);
    }
    return template;
  }

  /**
   * 根据类型获取模板
   */
  async findByType(type: EmailTemplateType): Promise<EmailTemplate | null> {
    return this.templateRepository.findOne({
      where: { type, isActive: true },
    });
  }

  /**
   * 创建模板
   */
  async create(createDto: CreateEmailTemplateDto): Promise<EmailTemplate> {
    // 检查类型是否已存在
    const existing = await this.templateRepository.findOne({
      where: { type: createDto.type },
    });

    if (existing) {
      throw new ConflictException(`类型 ${createDto.type} 的模板已存在`);
    }

    const template = this.templateRepository.create(createDto);
    await this.templateRepository.save(template);

    this.logger.log(`邮件模板已创建: ${template.type} (ID: ${template.id})`);
    return template;
  }

  /**
   * 更新模板
   */
  async update(
    id: number,
    updateDto: UpdateEmailTemplateDto,
  ): Promise<EmailTemplate> {
    const template = await this.findOne(id);

    // 如果修改类型，检查新类型是否已被其他模板使用
    if (updateDto.type && updateDto.type !== template.type) {
      const existing = await this.templateRepository.findOne({
        where: { type: updateDto.type },
      });
      if (existing) {
        throw new ConflictException(`类型 ${updateDto.type} 的模板已存在`);
      }
    }

    Object.assign(template, updateDto);
    await this.templateRepository.save(template);

    this.logger.log(`邮件模板已更新: ${template.type} (ID: ${id})`);
    return template;
  }

  /**
   * 删除模板
   */
  async remove(id: number): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
    this.logger.log(`邮件模板已删除: ${template.type} (ID: ${id})`);
  }

  /**
   * 渲染模板（替换变量）
   */
  renderTemplate(
    htmlTemplate: string,
    variables: Record<string, any>,
  ): string {
    let rendered = htmlTemplate;
    
    // 替换所有变量 {{variableName}}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    return rendered;
  }
}

