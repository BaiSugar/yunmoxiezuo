import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../entities/character.entity';
import { Novel } from '../entities/novel.entity';
import { CreateCharacterDto } from '../dto/create-character.dto';
import { UpdateCharacterDto } from '../dto/update-character.dto';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    @InjectRepository(Novel)
    private readonly novelRepository: Repository<Novel>,
  ) {}

  private async checkNovelAccess(novelId: number, userId: number): Promise<void> {
    const novel = await this.novelRepository.findOne({ where: { id: novelId } });
    if (!novel) throw new NotFoundException('作品不存在');
    if (novel.userId !== userId) throw new ForbiddenException('无权访问此作品');
  }

  async create(novelId: number, userId: number, dto: CreateCharacterDto): Promise<Character> {
    await this.checkNovelAccess(novelId, userId);
    const character = this.characterRepository.create({ ...dto, novelId });
    return await this.characterRepository.save(character);
  }

  async findAllByNovel(novelId: number, userId: number): Promise<Character[]> {
    await this.checkNovelAccess(novelId, userId);
    return await this.characterRepository.find({
      where: { novelId },
      order: { category: 'ASC', order: 'ASC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Character> {
    const character = await this.characterRepository.findOne({
      where: { id },
      relations: ['novel'],
    });
    if (!character) throw new NotFoundException('人物卡不存在');
    if (character.novel.userId !== userId) throw new ForbiddenException('无权访问');
    return character;
  }

  async update(id: number, userId: number, dto: UpdateCharacterDto): Promise<Character> {
    const character = await this.findOne(id, userId);
    Object.assign(character, dto);
    return await this.characterRepository.save(character);
  }

  async remove(id: number, userId: number): Promise<void> {
    const character = await this.findOne(id, userId);
    await this.characterRepository.softRemove(character);
  }
}
