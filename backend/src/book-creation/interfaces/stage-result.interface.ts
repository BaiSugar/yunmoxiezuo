/**
 * 阶段执行结果接口
 */
export interface StageResult {
  /** 是否成功 */
  success: boolean;

  /** 阶段类型 */
  stage: string;

  /** 产出数据 */
  data: Record<string, any>;

  /** 消耗字数 */
  charactersConsumed?: number;

  /** 消息 */
  message?: string;

  /** 错误信息 */
  error?: string;
}

