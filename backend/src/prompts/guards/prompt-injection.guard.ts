import { Injectable, Logger } from '@nestjs/common';
import { InjectionDetectorService } from './injection-detector.service';
import { InputSanitizerService } from './input-sanitizer.service';
import {
  ProtectedInput,
  ProtectionOptions,
  RiskLevel,
} from './injection-detection.types';

/**
 * 提示词注入防护主服务
 * 
 * 协调检测和清洗服务，提供完整的防护功能
 */
@Injectable()
export class PromptInjectionGuard {
  private readonly logger = new Logger(PromptInjectionGuard.name);

  constructor(
    private readonly detector: InjectionDetectorService,
    private readonly sanitizer: InputSanitizerService,
  ) {}

  /**
   * 保护用户输入
   * 
   * @param input 原始输入
   * @param options 保护选项
   * @returns 保护后的输入信息
   */
  async protectUserInput(
    input: string,
    options: ProtectionOptions = {},
  ): Promise<ProtectedInput> {
    // 默认选项
    const opts: ProtectionOptions = {
      markBoundaries: true,
      sanitizeHighRisk: true,
      ...options,
    };

    // 1. 检测风险
    const risk = this.detector.assess(input);

    // 2. 清洗输入
    let protectedInput = input;

    // 检查是否为创作内容（降低误报）
    const isCreative = this.detector.isCreativeContent(input);
    if (isCreative && risk.level <= RiskLevel.MEDIUM) {
      // 创作内容且风险不高，只添加标记
      this.logger.debug('检测到创作内容，降低处理等级');
    } else if (opts.sanitizeHighRisk && risk.level >= RiskLevel.MEDIUM) {
      // 高风险且非创作内容，进行清洗
      protectedInput = this.sanitizer.sanitize(input, risk);
    }

    // 3. 添加警告标记（中风险以上）
    if (risk.level >= RiskLevel.MEDIUM) {
      protectedInput = this.sanitizer.addWarning(protectedInput, risk);
    }

    // 4. 添加边界标记
    if (opts.markBoundaries) {
      protectedInput = this.sanitizer.markBoundaries(protectedInput, 'input');
    }

    const result: ProtectedInput = {
      original: input,
      protected: protectedInput,
      risk,
      modified: protectedInput !== input,
    };

    // 记录高风险检测
    if (risk.level >= RiskLevel.HIGH) {
      const levelName = this.getRiskLevelName(risk.level);
      this.logger.warn(
        `高风险输入 - 等级=${levelName}, 评分=${risk.score}, 模式=${risk.detectedPatterns.map((p) => p.category).join(',')}`,
      );
    }

    return result;
  }

  /**
   * 批量保护参数
   * 
   * @param params 参数对象
   * @returns 保护后的参数对象
   */
  async protectParameters(
    params: Record<string, string>,
  ): Promise<Record<string, string>> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(params)) {
      // 参数注入风险较高，都进行检测
      const protectedResult = await this.protectUserInput(value, {
        markBoundaries: false, // 参数不需要边界标记（会破坏替换）
        sanitizeHighRisk: true,
      });

      result[key] = protectedResult.protected;

      // 如果参数被修改，记录日志
      if (protectedResult.modified) {
        this.logger.warn(
          `参数 "${key}" 被清洗 - 原值长度=${value.length}, 新值长度=${protectedResult.protected.length}`,
        );
      }
    }

    return result;
  }

  /**
   * 检查输入是否安全
   * 快速检查，不进行清洗
   * 
   * @param input 输入内容
   * @returns 是否安全
   */
  isSafe(input: string): boolean {
    const risk = this.detector.assess(input);
    return risk.level === RiskLevel.SAFE || risk.level === RiskLevel.LOW;
  }

  /**
   * 获取输入的风险等级
   * 
   * @param input 输入内容
   * @returns 风险等级
   */
  getRiskLevel(input: string): RiskLevel {
    const risk = this.detector.assess(input);
    return risk.level;
  }

  /**
   * 获取风险等级的友好名称
   * 
   * @param level 风险等级枚举值
   * @returns 友好名称
   */
  private getRiskLevelName(level: RiskLevel): string {
    switch (level) {
      case RiskLevel.SAFE:
        return 'safe（安全）';
      case RiskLevel.LOW:
        return 'low（低风险）';
      case RiskLevel.MEDIUM:
        return 'medium（中风险）';
      case RiskLevel.HIGH:
        return 'high（高风险）';
      case RiskLevel.CRITICAL:
        return 'critical（极高风险）';
      default:
        return `unknown（${level})`;
    }
  }
}

