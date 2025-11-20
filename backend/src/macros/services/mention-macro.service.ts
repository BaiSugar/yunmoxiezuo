import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MacroProcessor, MacroContext } from '../interfaces/macro-context.interface';
import { Character } from '../../novels/entities/character.entity';
import { WorldSetting } from '../../novels/entities/world-setting.entity';
import { Memo } from '../../novels/entities/memo.entity';
import { Chapter } from '../../novels/entities/chapter.entity';

/**
 * @ 引用宏处理服务
 * 
 * 支持的格式（统一用ID，避免重名）：
 * - {{@::人物卡::ID}} - 引用人物卡的完整内容
 * - {{@::世界观::ID}} - 引用世界观的完整内容
 * - {{@::备忘录::ID}} - 引用备忘录的内容
 * - {{@::章节::ID::full}} - 引用章节的完整内容
 * - {{@::章节::ID::summary}} - 引用章节的梗概
 */
@Injectable()
export class MentionMacroService implements MacroProcessor {
  private readonly logger = new Logger(MentionMacroService.name);

  constructor(
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    @InjectRepository(WorldSetting)
    private readonly worldSettingRepository: Repository<WorldSetting>,
    @InjectRepository(Memo)
    private readonly memoRepository: Repository<Memo>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
  ) {}

  /**
   * 清理HTML标签并转换换行
   */
  private cleanHtmlContent(html: string): string {
    if (!html) return '';
    
    let text = html;
    
    // 先处理HTML换行标记（在移除标签之前）
    // 处理块级元素的结束标签
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<\/div>/gi, '\n');
    text = text.replace(/<\/h[1-6]>/gi, '\n');
    text = text.replace(/<\/li>/gi, '\n');
    
    // 处理br标签（行内换行）
    text = text.replace(/<br\s*\/?>/gi, '\n');
    
    // 移除所有HTML标签
    text = text.replace(/<[^>]*>/g, '');
    
    // 解码HTML实体
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&ldquo;/g, '"')
      .replace(/&rdquo;/g, '"');
    
    // 统一多个连续换行为单个换行，但保留段落间的空行
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text.trim();
  }

  /**
   * 处理@引用宏
   */
  async processAsync(text: string, context: MacroContext): Promise<string> {
    let result = text;

    // 匹配新格式: {{@::类型::ID}} 或 {{@::章节::ID::full/summary}}
    const newFormatRegex = /\{\{@::(人物卡|世界观|备忘录|章节)::(\d+)(?:::(full|summary))?\}\}/g;
    const newFormatMatches = Array.from(text.matchAll(newFormatRegex));

    if (newFormatMatches.length === 0) {
      return result;
    }

    // 必须有有效的 novelId 才能查询
    const novelId = Number(context.novelId);
    if (!context.novelId || isNaN(novelId) || !isFinite(novelId) || novelId <= 0) {
      // 在成书流程的早期阶段（如阶段1）还没有 novelId 是正常的，使用 debug 级别
      this.logger.debug(`@引用宏需要有效的 novelId，当前值: ${context.novelId}，跳过引用解析`);
      return result;
    }

    this.logger.debug(`开始处理@引用宏，共 ${newFormatMatches.length} 个引用，novelId: ${novelId}`);

    // 收集所有需要加载的内容
    const replacements = new Map<string, string>();

    // 处理新格式: {{@::类型::ID}} 或 {{@::章节::ID::type}}
    for (const match of newFormatMatches) {
      const [fullMatch, type, id, chapterType] = match;
      const numericId = parseInt(id, 10);

      
      try {
        let content = '';

        if (type === '人物卡') {
          const character = await this.characterRepository.findOne({
            where: { 
              id: numericId,
              novelId: novelId,
            },
          });

          if (character && character.fields) {
            const fieldsText = Object.entries(character.fields)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');
            content = `【人物卡: ${character.name}】\n${fieldsText}`;
          } else if (character) {
            content = `【人物卡: ${character.name}】`;
          } else {
            this.logger.warn(`未找到人物卡ID: ${numericId}`);
            content = `[人物卡ID"${numericId}"不存在]`;
          }
        } else if (type === '世界观') {
          const worldSetting = await this.worldSettingRepository.findOne({
            where: { 
              id: numericId,
              novelId: novelId,
            },
          });

          if (worldSetting && worldSetting.fields) {
            const fieldsText = Object.entries(worldSetting.fields)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');
            content = `【世界观: ${worldSetting.name}】\n${fieldsText}`;
          } else if (worldSetting) {
            content = `【世界观: ${worldSetting.name}】`;
          } else {
            this.logger.warn(`未找到世界观ID: ${numericId}`);
            content = `[世界观ID"${numericId}"不存在]`;
          }
        } else if (type === '备忘录') {
          const memo = await this.memoRepository.findOne({
            where: { 
              id: numericId,
              novelId: novelId,
            },
          });

          if (memo) {
            content = `【备忘录: ${memo.title}】\n${memo.content || ''}`;
          } else {
            this.logger.warn(`未找到备忘录ID: ${numericId}`);
            content = `[备忘录ID"${numericId}"不存在]`;
          }
        } else if (type === '章节') {
          const chapter = await this.chapterRepository.findOne({
            where: { 
              id: numericId,
              novelId: novelId,
            },
          });

          if (chapter) {
            const useSummary = chapterType === 'summary';
            
            if (useSummary) {
              if (chapter.summary && chapter.summary.trim()) {
                const cleanSummary = this.cleanHtmlContent(chapter.summary);
                content = `【章节梗概: ${chapter.title}】\n${cleanSummary}`;
              } else {
                this.logger.warn(`章节"${chapter.title}"无梗概，使用全文前500字`);
                const contentPreview = chapter.content 
                  ? (chapter.content.length > 500 
                      ? chapter.content.substring(0, 500) + '...'
                      : chapter.content)
                  : '';
                const cleanPreview = this.cleanHtmlContent(contentPreview);
                content = `【章节梗概: ${chapter.title}（无梗概，使用前500字）】\n${cleanPreview}`;
              }
            } else {
              const cleanContent = this.cleanHtmlContent(chapter.content || '');
              content = `【章节: ${chapter.title}】\n${cleanContent}`;
            }
          } else {
            this.logger.warn(`未找到章节ID: ${numericId}`);
            content = `[章节ID"${numericId}"不存在]`;
          }
        }

        replacements.set(fullMatch, content);
      } catch (error) {
        this.logger.error(`处理${type}ID引用失败: ${fullMatch}`, error);
        replacements.set(fullMatch, `[加载${type}ID"${numericId}"失败]`);
      }
    }

    // 执行替换（使用字符串替换而非正则，避免特殊字符问题）
    for (const [match, content] of replacements) {
      // 使用简单的字符串替换（replaceAll）
      result = result.split(match).join(content);
    }

    this.logger.debug(`@引用宏替换完成，原始: ${text.substring(0, 100)}...`);
    this.logger.debug(`替换后: ${result.substring(0, 200)}...`);

    return result;
  }

  /**
   * 同步处理（不支持@引用）
   */
  process(text: string, context: MacroContext): string {
    // @引用需要异步加载数据库，同步方法不处理
    return text;
  }

  /**
   * 获取支持的宏列表
   */
  getSupportedMacros(): string[] {
    return ['mention:character', 'mention:world', 'mention:memo', 'mention:chapter', 'mention:chapter-summary'];
  }
}

