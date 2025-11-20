import { Injectable, Logger } from '@nestjs/common';
import { PromptComponent } from '../interfaces/prompt-component.interface';
import { PromptPosition } from '../enums/position.enum';
import { PromptRole, PromptContent } from '../entities/prompt-content.entity';

/**
 * 组件收集服务
 * 负责从各个来源收集提示词组件（阶段1）
 */
@Injectable()
export class ComponentCollectorService {
  private readonly logger = new Logger(ComponentCollectorService.name);

  /**
   * 从提示词内容数组收集组件
   * @param contents 提示词内容数组
   * @returns 组件数组
   */
  collectFromPromptContents(contents: PromptContent[]): PromptComponent[] {
    const components: PromptComponent[] = [];

    // 只处理启用的内容
    const enabledContents = contents.filter((c) => c.isEnabled);

    for (const content of enabledContents) {
      const component: PromptComponent = {
        identifier: `prompt_content_${content.id}`,
        content: content.content || '',
        role: content.role,
        position: this.mapContentTypeToPosition(content),
        order: content.order || 100,
        required: true, // 提示词的核心内容是必需的
      };

      components.push(component);
    }

    this.logger.debug(
      `收集到 ${components.length} 个提示词内容组件`,
    );

    return components;
  }

  /**
   * 收集系统提示组件
   * @param systemPrompt 系统提示文本
   * @param order 排序权重
   * @returns 系统提示组件
   */
  collectSystemPrompt(
    systemPrompt: string,
    order: number = 0,
  ): PromptComponent {
    return {
      identifier: 'system_prompt',
      content: systemPrompt,
      role: PromptRole.SYSTEM,
      position: PromptPosition.SYSTEM,
      order,
      required: true,
    };
  }

  /**
   * 收集角色定义组件
   * @param characterData 角色数据
   * @returns 角色定义组件数组
   */
  collectCharacterDef(characterData: {
    description?: string;
    personality?: string;
    scenario?: string;
  }): PromptComponent[] {
    const components: PromptComponent[] = [];

    if (characterData.description) {
      components.push({
        identifier: 'char_description',
        content: characterData.description,
        role: PromptRole.SYSTEM,
        position: PromptPosition.CHAR_DEF,
        order: 10,
        required: true,
      });
    }

    if (characterData.personality) {
      components.push({
        identifier: 'char_personality',
        content: characterData.personality,
        role: PromptRole.SYSTEM,
        position: PromptPosition.CHAR_DEF,
        order: 20,
        required: true,
      });
    }

    if (characterData.scenario) {
      components.push({
        identifier: 'char_scenario',
        content: characterData.scenario,
        role: PromptRole.SYSTEM,
        position: PromptPosition.CHAR_DEF,
        order: 30,
        required: true,
      });
    }

    this.logger.debug(`收集到 ${components.length} 个角色定义组件`);

    return components;
  }

  /**
   * 收集示例消息组件
   * @param examples 示例消息数组
   * @returns 示例消息组件数组
   */
  collectExamples(
    examples: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): PromptComponent[] {
    const components: PromptComponent[] = [];

    for (let i = 0; i < examples.length; i++) {
      const example = examples[i];
      components.push({
        identifier: `example_${i}`,
        content: example.content,
        role: example.role === 'user' ? PromptRole.USER : PromptRole.ASSISTANT,
        position: PromptPosition.EXAMPLES,
        order: i, // 保持示例顺序
        required: false,
      });
    }

    this.logger.debug(`收集到 ${components.length} 个示例消息组件`);

    return components;
  }

  /**
   * 收集对话历史组件
   * @param history 历史消息数组
   * @returns 历史消息组件数组
   */
  collectHistory(
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): PromptComponent[] {
    const components: PromptComponent[] = [];

    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      components.push({
        identifier: `history_${i}`,
        content: msg.content,
        role: msg.role === 'user' ? PromptRole.USER : PromptRole.ASSISTANT,
        position: PromptPosition.HISTORY,
        order: i, // 保持历史顺序
        required: false,
      });
    }

    this.logger.debug(`收集到 ${components.length} 个历史消息组件`);

    return components;
  }

  /**
   * 收集世界书组件
   * @param worldBookEntries 世界书条目数组
   * @returns 世界书组件数组
   */
  collectWorldBook(
    worldBookEntries: Array<{
      content: string;
      position: string;
      order: number;
      constant?: boolean;
      depth?: number;
    }>,
  ): PromptComponent[] {
    const components: PromptComponent[] = [];

    for (let i = 0; i < worldBookEntries.length; i++) {
      const entry = worldBookEntries[i];
      components.push({
        identifier: `worldbook_${i}`,
        content: entry.content,
        role: PromptRole.SYSTEM,
        position: this.parsePosition(entry.position),
        order: entry.order || 100,
        depth: entry.depth,
        constant: entry.constant || false,
        required: false,
      });
    }

    this.logger.debug(`收集到 ${components.length} 个世界书组件`);

    return components;
  }

  /**
   * 收集 Author's Note 组件
   * @param note Author's Note 文本
   * @param position 位置（top或bottom）
   * @param order 排序权重
   * @returns Author's Note 组件
   */
  collectAuthorNote(
    note: string,
    position: 'top' | 'bottom' = 'bottom',
    order: number = 0,
  ): PromptComponent {
    return {
      identifier: `author_note_${position}`,
      content: note,
      role: PromptRole.SYSTEM,
      position:
        position === 'top' ? PromptPosition.AN_TOP : PromptPosition.AN_BOTTOM,
      order,
      required: false,
    };
  }

  /**
   * 收集用户最新输入组件
   * @param userInput 用户输入文本
   * @returns 用户输入组件
   */
  collectUserInput(userInput: string): PromptComponent {
    return {
      identifier: 'user_latest_input',
      content: userInput,
      role: PromptRole.USER,
      position: PromptPosition.LATEST_INPUT,
      order: 0,
      required: true,
    };
  }

  /**
   * 将内容类型映射到位置
   * @param content 提示词内容
   * @returns 位置枚举
   */
  private mapContentTypeToPosition(content: PromptContent): PromptPosition {
    // 根据内容的名称或类型判断位置
    // 这里可以根据实际业务逻辑调整
    const name = content.name.toLowerCase();

    if (name.includes('system') || name.includes('系统')) {
      return PromptPosition.SYSTEM;
    }

    if (
      name.includes('character') ||
      name.includes('角色') ||
      name.includes('人物')
    ) {
      return PromptPosition.CHAR_DEF;
    }

    if (
      name.includes('world') ||
      name.includes('世界') ||
      name.includes('背景')
    ) {
      return PromptPosition.BEFORE_CHAR;
    }

    if (name.includes('example') || name.includes('示例')) {
      return PromptPosition.EXAMPLES;
    }

    // 默认放在角色定义之后
    return PromptPosition.AFTER_CHAR;
  }

  /**
   * 解析位置字符串为枚举
   * @param position 位置字符串
   * @returns 位置枚举
   */
  private parsePosition(position: string): PromptPosition {
    const positionMap: Record<string, PromptPosition> = {
      system: PromptPosition.SYSTEM,
      before: PromptPosition.BEFORE_CHAR,
      after: PromptPosition.AFTER_CHAR,
      charDef: PromptPosition.CHAR_DEF,
      exampleTop: PromptPosition.EXAMPLE_TOP,
      examples: PromptPosition.EXAMPLES,
      exampleBottom: PromptPosition.EXAMPLE_BOTTOM,
      history: PromptPosition.HISTORY,
      atDepth: PromptPosition.AT_DEPTH,
      anTop: PromptPosition.AN_TOP,
      anBottom: PromptPosition.AN_BOTTOM,
      latestInput: PromptPosition.LATEST_INPUT,
    };

    return positionMap[position] || PromptPosition.AFTER_CHAR;
  }
}
