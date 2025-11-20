import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../../novels/entities/character.entity';
import { WorldSetting } from '../../novels/entities/world-setting.entity';
import { OutlineNode } from '../entities/outline-node.entity';
import { BookCreationTask } from '../entities/book-creation-task.entity';

/**
 * 人物卡数据格式（新格式）
 */
interface CharacterData {
  name: string;
  category?: string;
  fields?: Record<string, any>;
}

/**
 * 世界观数据格式（新格式）
 */
interface WorldviewData {
  name: string;
  category?: string;
  fields?: Record<string, any>;
}

/**
 * 章节大纲数据格式
 */
interface ChapterOutlineData {
  title: string;
  summary: string;
  characters?: (string | CharacterData)[]; // 支持新旧两种格式
  worldviews?: WorldviewData[];
  mainScene?: string;
  plotPoints?: string[];
}

/**
 * 人物卡和世界观自动提取服务
 * 从大纲中提取角色和世界观信息并创建对应实体
 */
@Injectable()
export class CharacterWorldviewExtractorService {
  private readonly logger = new Logger(CharacterWorldviewExtractorService.name);

  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(WorldSetting)
    private worldSettingRepository: Repository<WorldSetting>,
    @InjectRepository(OutlineNode)
    private outlineNodeRepository: Repository<OutlineNode>,
  ) {}

  /**
   * 从大纲中提取人物卡和世界观
   * @param task 一键成书任务
   * @returns 创建的人物卡和世界观数量
   */
  async extractFromOutline(task: BookCreationTask): Promise<{
    charactersCreated: number;
    worldSettingsCreated: number;
  }> {
    this.logger.log(`开始从大纲提取人物卡和世界观，任务ID: ${task.id}`);

    // 1. 获取所有章节大纲节点（level 3）
    const chapterNodes = await this.outlineNodeRepository.find({
      where: {
        taskId: task.id,
        level: 3,
      },
      order: { order: 'ASC' },
    });

    this.logger.debug(`找到 ${chapterNodes.length} 个章节大纲节点`);

    // 2. 收集所有人物卡和世界观数据（去重）
    const characterMap = new Map<string, CharacterData>();
    const worldviewMap = new Map<string, WorldviewData>();

    for (const node of chapterNodes) {
      try {
        const chapterData: ChapterOutlineData = JSON.parse(node.content);

        // 处理人物卡（支持新旧两种格式）
        if (Array.isArray(chapterData.characters)) {
          chapterData.characters.forEach((char) => {
            if (typeof char === 'string') {
              // 旧格式：字符串 "主角：林渊" 或 "林渊"
              const name = char.includes('：') 
                ? char.split('：')[1].trim() 
                : char.trim();
              if (name && !characterMap.has(name)) {
                characterMap.set(name, {
                  name,
                  category: '未分类',
                  fields: { 来源: '从大纲自动提取' },
                });
                this.logger.debug(`提取人物卡（旧格式）: ${name}`);
              }
            } else if (char && typeof char === 'object' && char.name) {
              // 新格式：完整对象
              if (!characterMap.has(char.name)) {
                characterMap.set(char.name, {
                  name: char.name,
                  category: char.category || '未分类',
                  fields: char.fields || {},
                });
                this.logger.debug(`提取人物卡（新格式）: ${char.name}`);
              }
            }
          });
        }

        // 处理世界观（新格式）
        if (Array.isArray(chapterData.worldviews)) {
          chapterData.worldviews.forEach((worldview) => {
            if (worldview && worldview.name && !worldviewMap.has(worldview.name)) {
              worldviewMap.set(worldview.name, {
                name: worldview.name,
                category: worldview.category || '未分类',
                fields: worldview.fields || {},
              });
              this.logger.debug(`提取世界观: ${worldview.name}`);
            }
          });
        }
      } catch (e) {
        this.logger.warn(
          `解析章节大纲节点失败 (nodeId: ${node.id}): ${e.message}`,
        );
      }
    }

    this.logger.log(`收集到 ${characterMap.size} 个唯一人物，${worldviewMap.size} 个唯一世界观`);

    // 3. 创建人物卡实体
    let charactersCreated = 0;
    let characterOrder = 0;

    for (const [name, charData] of characterMap) {
      try {
        // 检查是否已存在同名人物卡
        const existing = await this.characterRepository.findOne({
          where: {
            novelId: task.novelId,
            name,
          },
        });

        if (!existing) {
          const character = this.characterRepository.create({
            novelId: task.novelId,
            name: charData.name,
            category: charData.category,
            fields: charData.fields, // 直接使用 fields（符合实体格式）
            order: characterOrder++,
          });
          await this.characterRepository.save(character);
          charactersCreated++;
          this.logger.log(`✓ 创建人物卡: ${name} (作品ID: ${task.novelId})`);
        } else {
          this.logger.debug(`跳过已存在的人物卡: ${name}`);
        }
      } catch (error) {
        this.logger.error(`创建人物卡失败 (${name}): ${error.message}`);
      }
    }

    // 4. 创建世界观实体
    let worldSettingsCreated = 0;
    let worldviewOrder = 0;

    for (const [name, worldviewData] of worldviewMap) {
      try {
        // 检查是否已存在同名世界观
        const existing = await this.worldSettingRepository.findOne({
          where: {
            novelId: task.novelId,
            name,
          },
        });

        if (!existing) {
          const worldSetting = this.worldSettingRepository.create({
            novelId: task.novelId,
            name: worldviewData.name,
            category: worldviewData.category,
            fields: worldviewData.fields, // 直接使用 fields（符合实体格式）
            order: worldviewOrder++,
          });
          await this.worldSettingRepository.save(worldSetting);
          worldSettingsCreated++;
          this.logger.log(`✓ 创建世界观: ${name} (作品ID: ${task.novelId})`);
        } else {
          this.logger.debug(`跳过已存在的世界观: ${name}`);
        }
      } catch (error) {
        this.logger.error(`创建世界观失败 (${name}): ${error.message}`);
      }
    }

    this.logger.log(
      `提取完成: 创建 ${charactersCreated} 个人物卡, ${worldSettingsCreated} 个世界观`,
    );

    return {
      charactersCreated,
      worldSettingsCreated,
    };
  }
}

