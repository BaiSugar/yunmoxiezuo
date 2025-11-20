import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting, SettingType } from '../entities/system-setting.entity';
import { UpdateSettingDto, BatchUpdateDto } from '../dto/update-setting.dto';
import * as crypto from 'crypto';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepository: Repository<SystemSetting>,
  ) {
    // 使用环境变量或固定密钥（生产环境应使用环境变量）
    this.encryptionKey =
      process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!!';
  }

  /**
   * 获取所有配置（仅限管理员）
   */
  async findAll(includeEncrypted = false): Promise<SystemSetting[]> {
    const settings = await this.settingRepository.find({
      order: { category: 'ASC', sortOrder: 'ASC' },
    });

    // 解密加密字段
    return settings.map((setting) => {
      if (setting.isEncrypted && setting.value) {
        setting.value = includeEncrypted
          ? this.decrypt(setting.value)
          : '******'; // 不返回明文
      }
      return setting;
    });
  }

  /**
   * 按分类获取配置
   */
  async findByCategory(category: string): Promise<SystemSetting[]> {
    const settings = await this.settingRepository.find({
      where: { category },
      order: { sortOrder: 'ASC' },
    });

    return settings.map((setting) => {
      if (setting.isEncrypted && setting.value) {
        setting.value = '******'; // 隐藏加密值
      }
      return setting;
    });
  }

  /**
   * 获取公开配置（前端可访问）
   */
  async findPublicSettings(): Promise<Record<string, any>> {
    const settings = await this.settingRepository.find({
      where: { isPublic: true },
      order: { category: 'ASC', sortOrder: 'ASC' },
    });

    const result: Record<string, any> = {};
    for (const setting of settings) {
      if (!result[setting.category]) {
        result[setting.category] = {};
      }
      result[setting.category][setting.key] = this.parseValue(
        setting.value,
        setting.type,
      );
    }

    return result;
  }

  /**
   * 根据ID获取配置
   */
  async findOne(id: number): Promise<SystemSetting> {
    const setting = await this.settingRepository.findOne({ where: { id } });
    if (!setting) {
      throw new NotFoundException(`配置项ID ${id} 不存在`);
    }

    // 解密加密字段
    if (setting.isEncrypted && setting.value) {
      setting.value = this.decrypt(setting.value);
    }

    return setting;
  }

  /**
   * 根据category和key获取配置值
   */
  async getValue(category: string, key: string): Promise<any> {
    const setting = await this.settingRepository.findOne({
      where: { category, key },
    });

    if (!setting) {
      return null;
    }

    let value = setting.value;

    // 解密
    if (setting.isEncrypted && value) {
      value = this.decrypt(value);
    }

    // 类型转换
    return this.parseValue(value, setting.type);
  }

  /**
   * 更新配置
   */
  async update(id: number, updateDto: UpdateSettingDto): Promise<SystemSetting> {
    const setting = await this.findOne(id);

    let value = updateDto.value;

    // 验证值类型
    this.validateValue(value, setting.type);

    // 加密
    if (setting.isEncrypted && value) {
      value = this.encrypt(value);
    }

    setting.value = value;
    await this.settingRepository.save(setting);

    this.logger.log(
      `配置已更新: ${setting.category}.${setting.key} (ID: ${id})`,
    );

    return setting;
  }

  /**
   * 批量更新配置
   */
  async batchUpdate(batchDto: BatchUpdateDto): Promise<SystemSetting[]> {
    const results: SystemSetting[] = [];

    for (const item of batchDto.settings) {
      try {
        const updated = await this.update(item.id, { value: item.value });
        results.push(updated);
      } catch (error) {
        this.logger.error(
          `批量更新失败 - ID: ${item.id}, 错误: ${error.message}`,
        );
        throw error;
      }
    }

    this.logger.log(`批量更新完成，共更新 ${results.length} 项配置`);
    return results;
  }

  /**
   * 解析值类型
   */
  private parseValue(value: string, type: SettingType): any {
    if (!value) return null;

    try {
      switch (type) {
        case SettingType.NUMBER:
          return Number(value);
        case SettingType.BOOLEAN:
          return value === 'true' || value === '1';
        case SettingType.JSON:
          return JSON.parse(value);
        case SettingType.STRING:
        default:
          return value;
      }
    } catch (error) {
      this.logger.warn(
        `解析配置值失败: ${value}, 类型: ${type}, 错误: ${error.message}`,
      );
      return value;
    }
  }

  /**
   * 验证值类型
   */
  private validateValue(value: string, type: SettingType): void {
    try {
      switch (type) {
        case SettingType.NUMBER:
          if (isNaN(Number(value))) {
            throw new BadRequestException(`值 "${value}" 不是有效的数字`);
          }
          break;
        case SettingType.BOOLEAN:
          if (!['true', 'false', '0', '1'].includes(value.toLowerCase())) {
            throw new BadRequestException(`值 "${value}" 不是有效的布尔值`);
          }
          break;
        case SettingType.JSON:
          JSON.parse(value);
          break;
        default:
          break;
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `值 "${value}" 不符合类型 ${type} 的要求: ${error.message}`,
      );
    }
  }

  /**
   * 加密值
   */
  private encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto
        .createHash('sha256')
        .update(this.encryptionKey)
        .digest();
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.logger.error(`加密失败: ${error.message}`);
      throw new BadRequestException('加密失败');
    }
  }

  /**
   * 解密值
   */
  private decrypt(text: string): string {
    try {
      const parts = text.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted format');
      }
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedText = parts[1];
      const key = crypto
        .createHash('sha256')
        .update(this.encryptionKey)
        .digest();
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error(`解密失败: ${error.message}`);
      return text; // 解密失败时返回原值
    }
  }
}
