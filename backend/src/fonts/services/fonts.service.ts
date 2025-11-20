import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Font } from '../entities/font.entity';
import { UploadFontDto, UpdateFontDto } from '../dto/upload-font.dto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 字体管理服务
 */
@Injectable()
export class FontsService {
  private readonly logger = new Logger(FontsService.name);
  private readonly fontsDir = path.join(process.cwd(), 'uploads', 'fonts');

  constructor(
    @InjectRepository(Font)
    private readonly fontRepository: Repository<Font>,
  ) {
    // 确保字体目录存在
    if (!fs.existsSync(this.fontsDir)) {
      fs.mkdirSync(this.fontsDir, { recursive: true });
    }
  }

  /**
   * 获取所有启用的字体（供前端使用）
   * 包括：系统字体（userId=null） + 用户自己的字体
   */
  async findAllEnabled(userId?: number): Promise<Font[]> {
    if (!userId) {
      // 未登录，只返回系统字体（userId 为 NULL 的字体）
      const fonts = await this.fontRepository.find({
        where: { 
          isEnabled: true, 
          userId: IsNull(), // ✅ 使用 IsNull() 正确查询 NULL 值
        },
        order: { sortOrder: 'ASC', id: 'ASC' },
      });
      
      this.logger.debug(`[字体查询] 未登录用户，返回 ${fonts.length} 个系统字体`);
      return fonts;
    }

    // 已登录：返回系统字体 + 用户自己的字体
    const systemFonts = await this.fontRepository.find({
      where: { 
        isEnabled: true, 
        userId: IsNull(), // ✅ 使用 IsNull() 正确查询 NULL 值
      },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    // ✅ 只查询当前用户的字体（确保用户隔离）
    const userFonts = await this.fontRepository.find({
      where: { 
        userId, // ✅ 精确匹配当前用户ID
        isEnabled: true 
      },
      order: { id: 'DESC' }, // 用户字体按上传时间倒序
    });

    // 调试日志：验证查询结果
    this.logger.debug(
      `[字体查询] 用户ID: ${userId}, 系统字体: ${systemFonts.length} 个, 用户字体: ${userFonts.length} 个`
    );
    
    // 验证：确保用户字体都属于当前用户
    const wrongFonts = userFonts.filter(f => f.userId !== userId);
    if (wrongFonts.length > 0) {
      this.logger.error(
        `[字体查询] ⚠️ 错误：查询到不属于用户 ${userId} 的字体:`,
        wrongFonts.map(f => ({ id: f.id, name: f.name, userId: f.userId }))
      );
    }

    // 合并并去重（虽然理论上系统字体和用户字体ID不会重复，但保留去重逻辑更安全）
    const allFonts = [...systemFonts, ...userFonts];
    const uniqueFonts = Array.from(
      new Map(allFonts.map(f => [f.id, f])).values()
    );
    
    return uniqueFonts;
  }

  /**
   * 获取所有字体（管理员）
   */
  async findAll(): Promise<Font[]> {
    return await this.fontRepository.find({
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  /**
   * 获取字体详情
   */
  async findOne(id: number): Promise<Font> {
    const font = await this.fontRepository.findOne({ where: { id } });
    if (!font) {
      throw new NotFoundException(`字体 ID ${id} 不存在`);
    }
    return font;
  }

  /**
   * 上传字体文件（管理员或用户）
   */
  async uploadFont(
    file: any,
    dto: UploadFontDto,
    userId?: number, // 有userId表示用户上传，无userId表示管理员上传
  ): Promise<Font> {
    // 验证文件格式
    const allowedFormats = ['ttf', 'otf', 'woff', 'woff2'];
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    
    if (!allowedFormats.includes(ext)) {
      throw new BadRequestException(
        `不支持的字体格式。支持的格式: ${allowedFormats.join(', ')}`,
      );
    }

    // 文件大小限制（用户上传限制10MB，管理员不限制）
    const maxSize = userId ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `文件大小超过限制（${maxSize / 1024 / 1024}MB）`,
      );
    }

    // 检查字体名称是否重复（同一用户或系统）
    const existing = await this.fontRepository.findOne({
      where: { 
        name: dto.name, 
        userId: userId ? userId : IsNull(), // ✅ 使用 IsNull() 正确查询 NULL 值
      },
    });
    if (existing) {
      throw new BadRequestException(
        userId 
          ? `您已经上传过名为 "${dto.name}" 的字体`
          : `字体名称 "${dto.name}" 已存在`
      );
    }

    // 用户上传限制（最多5个字体）
    if (userId) {
      const userFontCount = await this.fontRepository.count({ where: { userId } });
      if (userFontCount >= 5) {
        throw new BadRequestException('您最多只能上传5个字体文件');
      }
    }

    // 生成唯一文件名
    const filename = `${Date.now()}-${file.originalname}`;
    const relativePath = `fonts/${filename}`;
    const fullPath = path.join(this.fontsDir, filename);

    // 保存文件
    fs.writeFileSync(fullPath, file.buffer);

    // 创建字体记录
    const font = this.fontRepository.create({
      ...dto,
      userId: userId || null,
      filePath: relativePath,
      format: ext,
      fileSize: file.size,
      category: dto.category || (userId ? '我的字体' : undefined), // 用户字体统一分类，管理员上传必须有category
      isEnabled: true, // 用户字体默认启用
    });

    return await this.fontRepository.save(font);
  }

  /**
   * 更新字体信息
   */
  async update(id: number, dto: UpdateFontDto): Promise<Font> {
    const font = await this.findOne(id);
    
    Object.assign(font, dto);
    
    return await this.fontRepository.save(font);
  }

  /**
   * 设置为默认字体
   */
  async setDefault(id: number): Promise<Font> {
    // 取消所有默认字体
    await this.fontRepository.update({ isDefault: true }, { isDefault: false });

    // 设置新的默认字体
    const font = await this.findOne(id);
    font.isDefault = true;
    return await this.fontRepository.save(font);
  }

  /**
   * 删除字体（管理员或用户删除自己的）
   */
  async remove(id: number, userId?: number): Promise<void> {
    const font = await this.findOne(id);

    // 用户只能删除自己的字体
    if (userId && font.userId !== userId) {
      throw new BadRequestException('您只能删除自己上传的字体');
    }

    // 系统字体不能删除
    if (!font.userId && userId) {
      throw new BadRequestException('系统字体不能删除');
    }

    // 如果是上传的字体文件，删除物理文件
    if (font.filePath && font.format !== 'system') {
      const fullPath = path.join(process.cwd(), 'uploads', font.filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await this.fontRepository.remove(font);
  }

  /**
   * 获取用户的字体列表
   */
  async findByUser(userId: number): Promise<Font[]> {
    return await this.fontRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取字体文件的完整 URL
   * @param font 字体对象
   * @param baseUrl 基础URL（可选，不传则返回相对路径）
   */
  getFontUrl(font: Font, baseUrl?: string): string {
    if (font.format === 'system') {
      return ''; // 系统字体无需 URL
    }
    if (baseUrl) {
      return `${baseUrl}/uploads/${font.filePath}`;
    }
    return `/uploads/${font.filePath}`;
  }
}

