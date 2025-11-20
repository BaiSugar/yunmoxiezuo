/**
 * 卡密类型
 */
export enum CodeType {
  /** 会员卡密 */
  MEMBERSHIP = 'membership',
  /** 字数卡密 */
  TOKEN = 'token',
  /** 混合卡密（会员+字数） */
  MIXED = 'mixed',
}
