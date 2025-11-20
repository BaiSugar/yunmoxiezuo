import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prompt } from '../entities/prompt.entity';
import { PromptContent } from '../entities/prompt-content.entity';
import { ComponentCollectorService } from './component-collector.service';
import { PositionGrouperService } from './position-grouper.service';
import { TokenManagerService } from './token-manager.service';
import { MessageAssemblerService } from './message-assembler.service';
import { FormatConverterService } from './format-converter.service';
import { BuildOptions, TokenStats } from '../interfaces/build-options.interface';
import { PromptComponent } from '../interfaces/prompt-component.interface';
import { ApiFormat } from '../enums/api-format.enum';

/**
 * 提示词构建器主服务
 * 整合所有子服务，执行完整的六阶段构建流程
 */
@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  constructor(
    @InjectRepository(Prompt)
    private readonly promptRepository: Repository<Prompt>,
    @InjectRepository(PromptContent)
    private readonly contentRepository: Repository<PromptContent>,
    private readonly collector: ComponentCollectorService,
    private readonly grouper: PositionGrouperService,
    private readonly tokenManager: TokenManagerService,
    private readonly assembler: MessageAssemblerService,
    private readonly converter: FormatConverterService,
  ) {}

  /**
   * 构建提示词
   * @param promptId 提示词ID
   * @param options 构建选项
   * @param userInput 用户输入
   * @param history 对话历史
   * @returns 构建结果
   */
  async build(
    promptId: number,
    options: BuildOptions,
    userInput?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{
    result: any;
    stats: TokenStats;
    debug?: any;
  }> {
    this.logger.log(`开始构建提示词 ID=${promptId}`);

    // 加载提示词和内容
    const prompt = await this.loadPrompt(promptId);

    // 设置默认选项
    const buildOptions = this.setDefaultOptions(options);

    // === 阶段1: 组件收集 ===
    const components = await this.collectComponents(
      prompt,
      userInput,
      history,
      buildOptions,
    );

    if (buildOptions.debug) {
      this.logger.debug(`收集到 ${components.length} 个组件`);
    }

    // === 阶段2: 位置分组 ===
    let bucket = this.grouper.groupByPosition(components);

    // === 阶段3: 优先级排序 ===
    bucket = this.grouper.sortBuckets(bucket);

    // === 阶段4: Token预算控制 ===
    const { bucket: budgetedBucket, stats } = this.tokenManager.applyBudget(
      bucket,
      buildOptions.tokenBudget!,
    );

    // === 阶段5: 消息数组构建 ===
    const messages = this.assembler.assembleMessages(budgetedBucket);

    // === 阶段6: 格式转换 ===
    const result = this.converter.convert(
      messages,
      buildOptions.apiFormat || ApiFormat.OPENAI,
    );

    this.logger.log(
      `构建完成: ${this.converter.getSummary(result, buildOptions.apiFormat!)}`,
    );

    // 返回结果
    const response: any = {
      result,
      stats,
    };

    if (buildOptions.debug) {
      response.debug = {
        components: components.length,
        bucket: this.getBucketDebugInfo(budgetedBucket),
        messages: messages.length,
      };
    }

    return response;
  }

  /**
   * 简化版构建：仅从提示词内容构建
   * @param promptId 提示词ID
   * @param parameters 参数替换映射
   * @param options 构建选项
   * @returns 构建结果
   */
  async buildSimple(
    promptId: number,
    parameters?: Record<string, string>,
    options?: BuildOptions,
  ): Promise<{
    result: any;
    stats: TokenStats;
  }> {
    this.logger.log(`简化构建提示词 ID=${promptId}`);

    const prompt = await this.loadPrompt(promptId);
    const buildOptions = this.setDefaultOptions(options || {});

    // 只收集提示词内容
    let components = this.collector.collectFromPromptContents(prompt.contents!);

    // 参数替换
    if (parameters) {
      components = this.replaceParameters(components, parameters);
    }

    // 分组、排序
    let bucket = this.grouper.groupByPosition(components);
    bucket = this.grouper.sortBuckets(bucket);

    // Token控制
    const { bucket: budgetedBucket, stats } = this.tokenManager.applyBudget(
      bucket,
      buildOptions.tokenBudget!,
    );

    // 组装和转换
    const messages = this.assembler.assembleMessages(budgetedBucket);
    const result = this.converter.convert(
      messages,
      buildOptions.apiFormat || ApiFormat.OPENAI,
    );

    return { result, stats };
  }

  /**
   * 加载提示词及其内容
   * @param promptId 提示词ID
   * @returns 提示词实体
   */
  private async loadPrompt(promptId: number): Promise<Prompt> {
    const prompt = await this.promptRepository.findOne({
      where: { id: promptId },
      relations: ['contents'],
    });

    if (!prompt) {
      throw new NotFoundException(`提示词 ID=${promptId} 不存在`);
    }

    // 检查提示词是否被封禁
    if (prompt.isBanned) {
      throw new ForbiddenException(`提示词已被封禁，无法使用 (原因: ${prompt.bannedReason || '违反社区规范'})`);
    }

    return prompt;
  }

  /**
   * 设置默认构建选项
   * @param options 用户提供的选项
   * @returns 完整的构建选项
   */
  private setDefaultOptions(options: BuildOptions): Required<BuildOptions> {
    return {
      apiFormat: options.apiFormat || ApiFormat.OPENAI,
      tokenBudget: options.tokenBudget || {
        total: 4096,
        systemPrompts: 500,
        characterDef: 1000,
        examples: 500,
        worldBookRatio: 0.25,
        protectedHistoryCount: 5,
      },
      enableWorldBook: options.enableWorldBook ?? false,
      worldBookScanDepth: options.worldBookScanDepth || 10,
      worldBookMaxRecursion: options.worldBookMaxRecursion || 3,
      debug: options.debug ?? false,
    };
  }

  /**
   * 收集所有组件
   * @param prompt 提示词实体
   * @param userInput 用户输入
   * @param history 对话历史
   * @param options 构建选项
   * @returns 组件数组
   */
  private async collectComponents(
    prompt: Prompt,
    userInput?: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: BuildOptions,
  ): Promise<PromptComponent[]> {
    const components: PromptComponent[] = [];

    // 1. 收集提示词内容
    if (prompt.contents && prompt.contents.length > 0) {
      components.push(
        ...this.collector.collectFromPromptContents(prompt.contents),
      );
    }

    // 2. 收集对话历史
    if (history && history.length > 0) {
      components.push(...this.collector.collectHistory(history));
    }

    // 3. 收集世界书（如果启用）
    if (options?.enableWorldBook && prompt.roleplayConfig) {
      // TODO: 实现世界书激活逻辑
      this.logger.debug('世界书功能待实现');
    }

    // 4. 收集用户输入
    if (userInput) {
      components.push(this.collector.collectUserInput(userInput));
    }

    return components;
  }

  /**
   * 替换组件中的参数占位符（支持 {{}} 和 ${} 两种格式）
   * @param components 组件数组
   * @param parameters 参数映射
   * @returns 替换后的组件数组
   */
  private replaceParameters(
    components: PromptComponent[],
    parameters: Record<string, string>,
  ): PromptComponent[] {
    return components.map((component) => {
      let content = component.content;

      // 替换 {{参数名}} 和 ${参数名} 格式的占位符
      for (const [key, value] of Object.entries(parameters)) {
        // 转义特殊字符以防止正则注入
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // 同时支持 {{}} 和 ${} 格式
        const doubleRegex = new RegExp(`\\{\\{\\s*${escapedKey}\\s*\\}\\}`, 'g');
        const dollarRegex = new RegExp(`\\$\\{\\s*${escapedKey}\\s*\\}`, 'g');
        
        content = content.replace(doubleRegex, value);
        content = content.replace(dollarRegex, value);
      }

      return {
        ...component,
        content,
      };
    });
  }

  /**
   * 获取桶的调试信息
   * @param bucket 位置桶
   * @returns 调试信息对象
   */
  private getBucketDebugInfo(bucket: any): any {
    const info: any = {};

    for (const [key, value] of Object.entries(bucket)) {
      if (Array.isArray(value)) {
        info[key] = {
          count: value.length,
          tokens: this.tokenManager['sumTokens'](value),
        };
      }
    }

    return info;
  }
}
