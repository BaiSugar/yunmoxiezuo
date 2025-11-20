import { MessageExtra } from './message-extra.interface';

/**
 * Swipe元数据接口
 */
export interface SwipeInfo {
  /** 发送时间 */
  send_date: number;
  /** 生成开始时间 */
  gen_started?: number;
  /** 生成结束时间 */
  gen_finished?: number;
  /** 生成ID */
  gen_id?: string;
  /** 扩展信息 */
  extra?: MessageExtra;
}
