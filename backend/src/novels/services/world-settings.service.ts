import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorldSetting } from '../entities/world-setting.entity';
import { Novel } from '../entities/novel.entity';
import { CreateWorldSettingDto } from '../dto/create-world-setting.dto';
import { UpdateWorldSettingDto } from '../dto/update-world-setting.dto';

@Injectable()
export class WorldSettingsService {
  constructor(
    @InjectRepository(WorldSetting)
    private readonly worldSettingRepository: Repository<WorldSetting>,
    @InjectRepository(Novel)
    private readonly novelRepository: Repository<Novel>,
  ) {}

  private async checkNovelAccess(novelId: number, userId: number): Promise<void> {
    const novel = await this.novelRepository.findOne({ where: { id: novelId } });
    if (!novel) throw new NotFoundException('作品不存在');
    if (novel.userId !== userId) throw new ForbiddenException('无权访问此作品');
  }

  async create(novelId: number, userId: number, dto: CreateWorldSettingDto): Promise<WorldSetting> {
    await this.checkNovelAccess(novelId, userId);
    const worldSetting = this.worldSettingRepository.create({ ...dto, novelId });
    return await this.worldSettingRepository.save(worldSetting);
  }

  async findAllByNovel(novelId: number, userId: number): Promise<WorldSetting[]> {
    await this.checkNovelAccess(novelId, userId);
    return await this.worldSettingRepository.find({
      where: { novelId },
      order: { category: 'ASC', order: 'ASC' },
    });
  }

  async findOne(id: number, userId: number): Promise<WorldSetting> {
    const worldSetting = await this.worldSettingRepository.findOne({
      where: { id },
      relations: ['novel'],
    });
    if (!worldSetting) throw new NotFoundException('世界观设定不存在');
    if (worldSetting.novel.userId !== userId) throw new ForbiddenException('无权访问');
    return worldSetting;
  }

  async update(id: number, userId: number, dto: UpdateWorldSettingDto): Promise<WorldSetting> {
    const worldSetting = await this.findOne(id, userId);
    Object.assign(worldSetting, dto);
    return await this.worldSettingRepository.save(worldSetting);
  }

  async remove(id: number, userId: number): Promise<void> {
    const worldSetting = await this.findOne(id, userId);
    await this.worldSettingRepository.softRemove(worldSetting);
  }
}
