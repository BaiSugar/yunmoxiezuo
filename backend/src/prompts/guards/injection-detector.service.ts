import { Injectable, Logger } from '@nestjs/common';
import {
  RiskLevel,
  RiskAssessment,
  DetectedPattern,
} from './injection-detection.types';
import {
  INJECTION_PATTERNS,
  PATTERN_WEIGHTS,
  RISK_THRESHOLDS,
} from './injection-patterns.constant';

/**
 * 注入检测服务
 * 负责检测用户输入中的潜在注入攻击模式
 */
@Injectable()
export class InjectionDetectorService {
  private readonly logger = new Logger(InjectionDetectorService.name);

  /**
   * 评估输入的注入风险
   * @param input 用户输入
   * @returns 风险评估结果
   */
  assess(input: string): RiskAssessment {
    if (!input || input.trim().length === 0) {
      return this.createSafeAssessment();
    }

    // 1. 检测模式
    const patterns = this.detectPatterns(input);

    // 2. 计算评分
    const score = this.calculateScore(patterns);

    // 3. 确定风险等级
    const level = this.getRiskLevel(score);

    // 4. 生成建议
    const suggestions = this.getSuggestions(patterns, level);

    const assessment: RiskAssessment = {
      level,
      score,
      detectedPatterns: patterns,
      suggestions,
    };

    // 记录高风险检测
    if (level === RiskLevel.HIGH || level === RiskLevel.CRITICAL) {
      this.logger.warn(
        `检测到${level}风险输入: 评分=${score}, 模式数=${patterns.length}`,
      );
    }

    return assessment;
  }

  /**
   * 检测输入中的注入模式
   */
  private detectPatterns(input: string): DetectedPattern[] {
    const detected: DetectedPattern[] = [];

    for (const [category, patterns] of Object.entries(INJECTION_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = input.matchAll(new RegExp(pattern, 'gi'));
        for (const match of matches) {
          detected.push({
            category,
            pattern: pattern.source,
            match: match[0],
            position: match.index,
          });
        }
      }
    }

    return detected;
  }

  /**
   * 计算风险评分
   */
  private calculateScore(patterns: DetectedPattern[]): number {
    if (patterns.length === 0) {
      return 0;
    }

    let score = 0;
    const categoryCounts: Record<string, number> = {};

    // 按分类累加权重
    for (const pattern of patterns) {
      const weight = PATTERN_WEIGHTS[pattern.category] || 10;
      categoryCounts[pattern.category] =
        (categoryCounts[pattern.category] || 0) + 1;

      // 首次匹配获得全部权重，后续匹配递减
      const count = categoryCounts[pattern.category];
      const diminishingFactor = 1 / Math.sqrt(count);
      score += weight * diminishingFactor;
    }

    // 多种攻击模式的组合会增加风险
    const categoryCount = Object.keys(categoryCounts).length;
    if (categoryCount > 1) {
      score *= 1 + (categoryCount - 1) * 0.2; // 每多一种模式增加20%
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * 根据评分确定风险等级
   */
  private getRiskLevel(score: number): RiskLevel {
    if (score >= RISK_THRESHOLDS.CRITICAL) return RiskLevel.CRITICAL;
    if (score >= RISK_THRESHOLDS.HIGH) return RiskLevel.HIGH;
    if (score >= RISK_THRESHOLDS.MEDIUM) return RiskLevel.MEDIUM;
    if (score >= RISK_THRESHOLDS.LOW) return RiskLevel.LOW;
    return RiskLevel.SAFE;
  }

  /**
   * 根据检测结果生成建议
   */
  private getSuggestions(
    patterns: DetectedPattern[],
    level: RiskLevel,
  ): string[] {
    const suggestions: string[] = [];

    if (level === RiskLevel.SAFE) {
      return ['输入安全，无需特殊处理'];
    }

    // 根据检测到的模式类型给出建议
    const categories = new Set(patterns.map((p) => p.category));

    if (categories.has('PROMPT_LEAKAGE')) {
      suggestions.push('检测到提示词泄露尝试，建议添加防御提示');
    }

    if (categories.has('INDIRECT_LEAKAGE')) {
      suggestions.push('检测到间接套取提示词，建议标记用户输入边界');
    }

    if (categories.has('OVERRIDE_COMMANDS')) {
      suggestions.push('检测到指令覆盖尝试，建议清洗或标记');
    }

    if (categories.has('ROLE_SWITCHING')) {
      suggestions.push('检测到角色转换攻击，建议强化系统提示');
    }

    if (categories.has('TAG_INJECTION')) {
      suggestions.push('检测到标签注入，建议转义特殊字符');
    }

    if (categories.has('PARAMETER_ESCAPE')) {
      suggestions.push('检测到参数边界突破，建议转义占位符');
    }

    if (level === RiskLevel.CRITICAL) {
      suggestions.push('风险极高，建议全面防护或拦截');
    }

    return suggestions;
  }

  /**
   * 创建安全评估结果
   */
  private createSafeAssessment(): RiskAssessment {
    return {
      level: RiskLevel.SAFE,
      score: 0,
      detectedPatterns: [],
      suggestions: ['输入安全'],
    };
  }

  /**
   * 检查是否为创作内容
   * 用于降低误报率
   */
  isCreativeContent(input: string): boolean {
    // 故事性指标
    const storyIndicators = [
      /(?:小说|故事|剧本|情节|章节|角色|主角)/,
      /(?:写|创作|续写|生成).*(?:内容|文章|段落)/,
      /第[一二三四五六七八九十\d]+(?:章|节|部分)/,
      /(?:novel|story|chapter|plot|character)/i,
    ];

    // 对话格式
    const dialoguePatterns = [
      /[「『""][^"]+[」』""]/, // 引号对话
      /[^：:]+[:：]\s*[""]?[^""]+[""]?/, // 冒号对话
      /(?:说|道|问|答)[:：]/,
    ];

    return (
      storyIndicators.some((p) => p.test(input)) ||
      dialoguePatterns.some((p) => p.test(input))
    );
  }
}

