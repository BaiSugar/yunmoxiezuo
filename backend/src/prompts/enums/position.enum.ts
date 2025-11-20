/**
 * 提示词组件位置枚举
 * 定义了组件在最终提示词中的插入位置
 */
export enum PromptPosition {
  /** 系统提示（最前面） */
  SYSTEM = 'system',

  /** 角色定义之前 */
  BEFORE_CHAR = 'before',

  /** 角色定义本身 */
  CHAR_DEF = 'charDef',

  /** 角色定义之后 */
  AFTER_CHAR = 'after',

  /** 示例消息之前 */
  EXAMPLE_TOP = 'exampleTop',

  /** 示例消息 */
  EXAMPLES = 'examples',

  /** 示例消息之后 */
  EXAMPLE_BOTTOM = 'exampleBottom',

  /** 对话历史 */
  HISTORY = 'history',

  /** 深度注入（特殊处理，插入到历史消息的指定深度） */
  AT_DEPTH = 'atDepth',

  /** Author's Note 顶部 */
  AN_TOP = 'anTop',

  /** Author's Note 底部 */
  AN_BOTTOM = 'anBottom',

  /** 用户最新输入 */
  LATEST_INPUT = 'latestInput',
}
