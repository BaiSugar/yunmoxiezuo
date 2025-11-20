/**
 * 提示词注入攻击检测模式库
 * 
 * 包含各类注入攻击的正则表达式模式
 */

export const INJECTION_PATTERNS = {
  // 直接覆盖指令
  OVERRIDE_COMMANDS: [
    /忽略.*(?:之前|以上|所有).*(?:指令|提示|规则|设定)/i,
    /ignore\s+(?:all|previous|above)\s+(?:instructions?|prompts?|rules?)/i,
    /forget\s+(?:everything|all)\s+(?:above|before)/i,
    /disregard.*(?:previous|prior|above).*(?:instructions?|prompts?)/i,
  ],

  // 角色转换
  ROLE_SWITCHING: [
    /(?:现在|从现在开始|接下来).*你(?:是|变成|扮演)/i,
    /(?:---.*作废.*---|===.*结束.*===)/i,
    /new\s+(?:role|character|persona):/i,
    /你.*(?:不再是|改为|变成)/i,
    /from\s+now\s+on.*you\s+(?:are|will\s+be)/i,
  ],

  // 系统标签伪造
  TAG_INJECTION: [
    /<\/?(?:system|user|assistant|role)>/i,
    /\[(?:SYSTEM|USER|ASSISTANT)\]/i,
    /<\|(?:im_start|im_end)\|>/i, // ChatML格式
  ],

  // 参数边界突破
  PARAMETER_ESCAPE: [
    /\}\}.*\{\{/, // 尝试闭合参数
    /\$\{[^}]*\}/, // shell风格注入
    /\{\{[^}]*\}\}.*\{\{/, // 连续参数注入
  ],

  // 分隔符混淆
  DELIMITER_CONFUSION: [
    /---\s*(?:系统|system|prompt)\s*---/i,
    /###\s*(?:新|new)\s*(?:指令|instruction)/i,
    /={3,}\s*(?:end|结束|over)\s*={3,}/i,
  ],

  // 提示词泄露攻击
  PROMPT_LEAKAGE: [
    /(?:请|请把|能否|能否把).*(?:完整|全部|原样).*(?:系统提示|提示词|指令|prompt|system\s*message).*(?:输出|显示|打印|给我|给我看)/i,
    /(?:重复|再说一遍|再发送).*(?:你的|一次|的).*(?:指令|系统提示|提示词)/i,
    /(?:你的|你收到).*(?:原始|最初|主要|核心).*(?:指令|提示词|prompt)/i,
    /show\s+me\s+(?:your|the)\s+(?:prompt|system\s*message|instructions?)/i,
    /(?:print|display|reveal|output).*(?:your|the).*(?:prompt|system\s*message)/i,
    /what.*(?:your|you).*(?:original|initial)\s+(?:prompt|instruction)/i,
  ],

  // 间接套取提示词
  INDIRECT_LEAKAGE: [
    /(?:假设|如果).*你.*是.*助手.*请回复.*指令/i,
    /(?:用.*话|简短|简单).*(?:总结|描述|说明).*(?:你的|你).*(?:职责|作用|工作)/i,
    /(?:你.*的主要|核心).*(?:功能|作用|目标|任务)/i,
    /what\s+(?:are\s+)?(?:your|you).*(?:instructions?|prompt|system\s*message)/i,
    /(?:summarize|describe).*(?:your|you).*(?:role|purpose|task)/i,
  ],
};

/**
 * 模式分类权重
 * 用于计算风险评分
 */
export const PATTERN_WEIGHTS = {
  OVERRIDE_COMMANDS: 25,
  ROLE_SWITCHING: 20,
  TAG_INJECTION: 30,
  PARAMETER_ESCAPE: 25,
  DELIMITER_CONFUSION: 15,
  PROMPT_LEAKAGE: 35,
  INDIRECT_LEAKAGE: 20,
};

/**
 * 风险等级阈值
 */
export const RISK_THRESHOLDS = {
  CRITICAL: 80,
  HIGH: 60,
  MEDIUM: 40,
  LOW: 20,
  SAFE: 0,
};

