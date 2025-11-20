/**
 * 提示词注入检测相关类型定义
 */

/**
 * 风险等级（数字枚举，支持大小比较）
 */
export enum RiskLevel {
  SAFE = 0,      // 安全
  LOW = 1,       // 低风险
  MEDIUM = 2,    // 中风险
  HIGH = 3,      // 高风险
  CRITICAL = 4,  // 极高风险
}

/**
 * 检测到的模式
 */
export interface DetectedPattern {
  /** 模式分类 */
  category: string;
  /** 正则表达式源码 */
  pattern: string;
  /** 匹配到的文本 */
  match: string;
  /** 匹配位置 */
  position?: number;
}

/**
 * 风险评估结果
 */
export interface RiskAssessment {
  /** 风险等级 */
  level: RiskLevel;
  /** 风险评分 (0-100) */
  score: number;
  /** 检测到的模式列表 */
  detectedPatterns: DetectedPattern[];
  /** 建议措施 */
  suggestions: string[];
}

/**
 * 保护后的输入
 */
export interface ProtectedInput {
  /** 原始输入 */
  original: string;
  /** 保护后的输入 */
  protected: string;
  /** 风险评估 */
  risk: RiskAssessment;
  /** 是否被修改 */
  modified: boolean;
}

/**
 * 防护选项
 */
export interface ProtectionOptions {
  /** 是否添加边界标记 */
  markBoundaries?: boolean;
  /** 是否清洗高风险内容 */
  sanitizeHighRisk?: boolean;
  /** 自定义风险阈值 */
  riskThresholds?: {
    sanitize?: number; // 开始清洗的阈值
    warn?: number; // 开始警告的阈值
  };
}

/**
 * 检测配置
 */
export interface DetectionConfig {
  /** 是否启用检测 */
  enabled: boolean;
  /** 检测严格程度 */
  strictness: 'strict' | 'normal' | 'loose';
  /** 是否记录日志 */
  logDetections: boolean;
}

