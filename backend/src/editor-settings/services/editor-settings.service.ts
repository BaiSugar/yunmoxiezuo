import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EditorSetting } from '../entities/editor-setting.entity';
import { CreateEditorSettingDto } from '../dto/create-editor-setting.dto';
import { UpdateEditorSettingDto } from '../dto/update-editor-setting.dto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 编辑器设置服务
 */
@Injectable()
export class EditorSettingsService {
  constructor(
    @InjectRepository(EditorSetting)
    private readonly editorSettingRepository: Repository<EditorSetting>,
  ) {}

  /**
   * 获取用户的编辑器设置
   * 如果用户没有设置，则返回默认设置
   */
  async getUserSettings(userId: number): Promise<EditorSetting> {
    let settings = await this.editorSettingRepository.findOne({
      where: { userId },
    });

    // 如果用户没有设置，创建默认设置
    if (!settings) {
      settings = await this.createDefaultSettings(userId);
    }

    return settings;
  }

  /**
   * 创建或更新用户的编辑器设置
   */
  async saveUserSettings(
    userId: number,
    dto: CreateEditorSettingDto | UpdateEditorSettingDto,
  ): Promise<EditorSetting> {
    // 验证设置值
    this.validateSettings(dto);

    const existingSettings = await this.editorSettingRepository.findOne({
      where: { userId },
    });

    if (existingSettings) {
      // 更新现有设置
      Object.assign(existingSettings, dto);
      return await this.editorSettingRepository.save(existingSettings);
    } else {
      // 创建新设置
      const newSettings = this.editorSettingRepository.create({
        userId,
        ...dto,
      });
      return await this.editorSettingRepository.save(newSettings);
    }
  }

  /**
   * 更新用户的编辑器设置
   */
  async updateUserSettings(
    userId: number,
    dto: UpdateEditorSettingDto,
  ): Promise<EditorSetting> {
    // 验证设置值
    this.validateSettings(dto);

    const settings = await this.editorSettingRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      throw new NotFoundException('编辑器设置不存在');
    }

    Object.assign(settings, dto);
    return await this.editorSettingRepository.save(settings);
  }

  /**
   * 重置为默认设置
   */
  async resetToDefault(userId: number): Promise<EditorSetting> {
    const settings = await this.editorSettingRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      throw new NotFoundException('编辑器设置不存在');
    }

    // 删除现有设置
    await this.editorSettingRepository.remove(settings);

    // 创建默认设置
    return await this.createDefaultSettings(userId);
  }

  /**
   * 删除用户的编辑器设置
   */
  async deleteUserSettings(userId: number): Promise<void> {
    const result = await this.editorSettingRepository.delete({ userId });

    if (result.affected === 0) {
      throw new NotFoundException('编辑器设置不存在');
    }
  }

  /**
   * 创建默认设置
   */
  private async createDefaultSettings(userId: number): Promise<EditorSetting> {
    const defaultSettings = this.editorSettingRepository.create({
      userId,
      // 其他字段使用实体中定义的默认值
    });

    return await this.editorSettingRepository.save(defaultSettings);
  }

  /**
   * 验证设置值是否有效
   */
  private validateSettings(dto: CreateEditorSettingDto | UpdateEditorSettingDto): void {
    if (dto.fontSize !== undefined && (dto.fontSize < 12 || dto.fontSize > 32)) {
      throw new BadRequestException('字体大小必须在12-32像素之间');
    }

    if (dto.lineHeight !== undefined && (dto.lineHeight < 1.0 || dto.lineHeight > 3.0)) {
      throw new BadRequestException('行距必须在1.0-3.0倍之间');
    }

    if (dto.paragraphIndent !== undefined && (dto.paragraphIndent < 0 || dto.paragraphIndent > 10)) {
      throw new BadRequestException('段首空格数必须在0-10之间');
    }

    if (dto.paragraphSpacing !== undefined && (dto.paragraphSpacing < 0 || dto.paragraphSpacing > 5)) {
      throw new BadRequestException('段间空行数必须在0-5之间');
    }

    if (dto.autoSaveInterval !== undefined && (dto.autoSaveInterval < 10 || dto.autoSaveInterval > 300)) {
      throw new BadRequestException('自动保存间隔必须在10-300秒之间');
    }
  }

  /**
   * 上传编辑器背景图
   */
  async uploadBackgroundImage(userId: number, file: any): Promise<string> {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    // 验证文件类型
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException('仅支持 JPG、PNG、WebP 格式的图片');
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('图片大小不能超过 5MB');
    }

    // 确保目录存在
    const uploadsDir = path.join(process.cwd(), 'uploads', 'editor-backgrounds');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // 生成唯一文件名
    const ext = path.extname(file.originalname);
    const filename = `${userId}-${Date.now()}${ext}`;
    const relativePath = `editor-backgrounds/${filename}`;
    const fullPath = path.join(uploadsDir, filename);

    // 删除旧的背景图
    const settings = await this.getUserSettings(userId);
    if (settings.backgroundImage) {
      const oldFilePath = path.join(process.cwd(), 'uploads', settings.backgroundImage);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // 保存新文件
    fs.writeFileSync(fullPath, file.buffer);

    // 更新设置
    await this.updateUserSettings(userId, { backgroundImage: relativePath });

    return relativePath;
  }

  /**
   * 删除编辑器背景图
   */
  async deleteBackgroundImage(userId: number): Promise<void> {
    const settings = await this.getUserSettings(userId);

    if (settings.backgroundImage) {
      // 删除文件
      const filePath = path.join(process.cwd(), 'uploads', settings.backgroundImage);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 更新设置
      await this.updateUserSettings(userId, { backgroundImage: null as any });
    }
  }
}

